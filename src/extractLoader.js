import vm from "vm";
import path from "path";

/**
 * @name LoaderContext
 * @property {function} async
 * @property {string} resourcePath
 * @property {object} options
 */

/**
 * Random placeholder. Marks the location in the source code where other modules need to be interpolated.
 * @type {string}
 */
const rndPlaceholder = "__EXTRACT_LOADER_PLACEHOLDER__" + rndNumber() + rndNumber();

/**
 * Executes the given module's src and its dependencies in a fake context in order to get the resulting string.
 *
 * @this LoaderContext
 * @param {string} content the module's src
 */
function extractLoader(content) {
    const callback = this.async();
    const dependencies = [];
    const script = new vm.Script(content, {
        filename: this.resourcePath,
        displayErrors: true
    });
    const sandbox = {
        require: (resourcePath) => {
            if (/\.js$/.test(resourcePath)) {
                return require(path.resolve(path.dirname(this.resourcePath), resourcePath));
            }

            dependencies.push(resourcePath);

            return rndPlaceholder;
        },
        module: {},
        exports: {}
    };

    sandbox.module.exports = sandbox.exports;

    script.runInNewContext(sandbox);

    Promise.all(dependencies.map(loadModule, this))
        .then((sources) => {
            return sources.map(
                (src, i) => runModule(src, dependencies[i], this.options.output.publicPath)
            );
        })
        .then((results) => {
            let i = 0;

            callback(
                null,
                sandbox.module.exports.toString()
                    .replace(new RegExp(rndPlaceholder, "g"), () => {
                        return results[i++];
                    })
            );
        })
        .catch(callback);
}

/**
 * Loads the given module with webpack's internal module loader and returns the source code.
 *
 * @this LoaderContext
 * @param {string} request
 * @returns {Promise<string>}
 */
function loadModule(request) {
    const context = this;

    return new Promise((resolve, reject) => {
        context.loadModule(request, (err, src) => err ? reject(err) : resolve(src));
    });
}

/**
 * Executes the given CommonJS module in a fake context to get the exported string. The given module is expected to
 * just return a string without requiring further modules.
 *
 * @param {string} src
 * @param {string} filename
 * @param {string} [publicPath]
 * @returns {string}
 */
function runModule(src, filename, publicPath = "") {
    const script = new vm.Script(src, {
        filename,
        displayErrors: true
    });
    const sandbox = {
        module: {},
        __webpack_public_path__: publicPath // eslint-disable-line camelcase
    };

    script.runInNewContext(sandbox);

    return sandbox.module.exports.toString();
}

/**
 * @returns {string}
 */
function rndNumber() {
    return Math.random().toString().slice(2);
}

// For CommonJS interoperability
module.exports = extractLoader;
export default extractLoader;
