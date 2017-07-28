import vm from "vm";
import path from "path";
import { getOptions } from "loader-utils";

/**
 * @name LoaderContext
 * @property {function} cacheable
 * @property {function} async
 * @property {function} addDependency
 * @property {function} loadModule
 * @property {string} resourcePath
 * @property {object} options
 */

/**
 * Random placeholder. Marks the location in the source code where the result of other modules should be inserted.
 * @type {string}
 */
const rndPlaceholder =
    "__EXTRACT_LOADER_PLACEHOLDER__" + rndNumber() + rndNumber();

/**
 * Executes the given module's src in a fake context in order to get the resulting string.
 *
 * @this LoaderContext
 * @throws Error
 * @param {string} content - the module's src
 */
function extractLoader(content) {
    const callback = this.async();
    const options = getOptions(this) || {};
    const publicPath = options.publicPath === undefined ? this.options.output.publicPath : options.publicPath;
    const dependencies = [];
    const script = new vm.Script(content, {
        filename: this.resourcePath,
        displayErrors: true,
    });
    const sandbox = {
        require: resourcePath => {
            const absPath = path
                .resolve(path.dirname(this.resourcePath), resourcePath)
                .split("?")[0];

            // Mark the file as dependency so webpack's watcher is working
            this.addDependency(absPath);

            // If the required file is the css-loader helper, we just require it with node's require.
            // If the required file should be processed by a loader we do not touch it (even if it is a .js file).
            if (/^[^!]*css-base\.js$/i.test(resourcePath)) {
                return require(absPath); // eslint-disable-line import/no-dynamic-require
            }

            dependencies.push(resourcePath);

            return rndPlaceholder;
        },
        module: {},
        exports: {},
    };

    this.cacheable();

    sandbox.module.exports = sandbox.exports;
    script.runInNewContext(sandbox);

    Promise.all(dependencies.map(loadModule, this))
        .then(sources =>
            sources.map(
                // runModule may throw an error, so it's important that our promise is rejected in this case
                (src, i) => runModule(src, dependencies[i], publicPath)
            )
        )
        .then(results =>
            sandbox.module.exports
                .toString()
                .replace(new RegExp(rndPlaceholder, "g"), () => results.shift())
        )
        .then(content => callback(null, content))
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
    return new Promise((resolve, reject) => {
        this.loadModule(
            request,
            (err, src) => (err ? reject(err) : resolve(src))
        );
    });
}

/**
 * Executes the given CommonJS module in a fake context to get the exported string. The given module is expected to
 * just return a string without requiring further modules.
 *
 * @throws Error
 * @param {string} src
 * @param {string} filename
 * @param {string} [publicPath]
 * @returns {string}
 */
function runModule(src, filename, publicPath = "") {
    // Rudimentary "transpilation" of ES 2015 modules (e.g file-loader 1.0.0+)
    // TODO: Find a better way to "execute" ES 2015 modules in node context
    // "Transpile" imports
    src = src.replace(/^import\s+(.+)\s+from\s+([^;]+);?$/, "var $1 = require($2);");
    // "Transpile" default export (other exports are not supported at the moment)
    src = src.replace(/^\s*export\s+default\s*/, "module.exports = ");

    const script = new vm.Script(src, {
        filename,
        displayErrors: true,
    });
    const sandbox = {
        module: {},
        __webpack_public_path__: publicPath, // eslint-disable-line camelcase
    };

    script.runInNewContext(sandbox);

    return sandbox.module.exports.toString();
}

/**
 * @returns {string}
 */
function rndNumber() {
    return Math.random()
        .toString()
        .slice(2);
}

// For CommonJS interoperability
module.exports = extractLoader;
export default extractLoader;
