/* eslint  no-underscore-dangle: "off" */
const vm = require("vm");
const path = require("path");
const resolve = require("resolve");
const btoa = require("btoa");
const babel = require("@babel/core");
const babelPlug = require("babel-plugin-add-module-exports");
const babelPreset = require("@babel/preset-env");
/**
 * @returns {string}
 */
function rndNumber() {
    return Math.random().toString().slice(2);
}

function tryResolve(filename, options) {
    try {
        return resolve.sync(filename, options);
    } catch (e) {
        // Return original.
        return filename;
    }
}

function evalDependencyGraph({
    loaderContext,
    src,
    filename,
    publicPath = "",
}) {
    const moduleCache = new Map();

    function loadModule(filenameP) {
        return new Promise((resolve2, reject) => {
            // loaderContext.loadModule automatically calls loaderContext.addDependency for all requested modules
            loaderContext.loadModule(filenameP, (error, src2) => {
                if (error) {
                    reject(error);
                } else {
                    resolve2(src2);
                }
            });
        });
    }

    function extractExports(exports) {
        const hasBtoa = "btoa" in global;
        const previousBtoa = global.btoa;

        global.btoa = btoa;

        try {
            return exports.toString();
        } finally {
            if (hasBtoa) {
                global.btoa = previousBtoa;
            } else {
                delete global.btoa;
            }
        }
    }

    function extractQueryFromPath(givenRelativePath) {
        const indexOfLastExclMark = givenRelativePath.lastIndexOf("!");
        const indexOfQuery = givenRelativePath.lastIndexOf("?");

        if (indexOfQuery !== -1 && indexOfQuery > indexOfLastExclMark) {
            return {
                relativePathWithoutQuery: givenRelativePath.slice(
                    0,
                    indexOfQuery
                ),
                query: givenRelativePath.slice(indexOfQuery),
            };
        }

        return {
            relativePathWithoutQuery: givenRelativePath,
            query: "",
        };
    }

    async function evalModule(src2, filename2) {
        const newsrc = babel.transform(
            `const __filename="${filename2}"; ${src2}`,
            {
                babelrc: false,

                presets: [
                    [
                        babelPreset,
                        {
                            modules: "commonjs",
                            targets: { node: "current" },
                        },
                    ],
                ],
                plugins: [babelPlug],
            }
        ).code;

        const script = new vm.Script(newsrc, {
            filename: filename2,

            displayErrors: true,
        });
        const newDependencies = [];
        const exports = {};
        const sandbox = {
            ...global,
            module: {
                exports,
            },
            exports,
            __webpack_public_path__: publicPath, // eslint-disable-line camelcase
            require: (givenRelativePath) => {
                const { relativePathWithoutQuery, query } =
                    extractQueryFromPath(givenRelativePath);
                const indexOfLastExclMark =
                    relativePathWithoutQuery.lastIndexOf("!");
                const loaders = givenRelativePath.slice(
                    0,
                    indexOfLastExclMark + 1
                );
                const relativePath = relativePathWithoutQuery.slice(
                    indexOfLastExclMark + 1
                );
                const absolutePath = tryResolve(relativePath, {
                    basedir: path.dirname(filename2),
                });
                const ext = path.extname(absolutePath);

                if (moduleCache.has(absolutePath)) {
                    return moduleCache.get(absolutePath);
                }

                // If the required file is a js file, we just require it with node's require.
                // If the required file should be processed by a loader we do not touch it (even if it is a .js file).
                if (
                    loaders === "" &&
                    absolutePath.indexOf("node_modules/") !== -1 &&
                    ext === ".js"
                ) {
                    // Mark the file as dependency so webpack's watcher is working for the css-loader helper.
                    // Other dependencies are automatically added by loadModule() below
                    loaderContext.addDependency(absolutePath);

                    const exports2 = require(absolutePath); // eslint-disable-line import/no-dynamic-require,global-require

                    moduleCache.set(absolutePath, exports2);

                    return exports2;
                }

                const rndPlaceholder = `__EXTRACT_LOADER_PLACEHOLDER__${rndNumber()}${rndNumber()}`;

                newDependencies.push({
                    absolutePath,
                    absoluteRequest: loaders + absolutePath + query,
                    rndPlaceholder,
                });

                return rndPlaceholder;
            },
        };

        script.runInNewContext(sandbox);

        const extractedDependencyContent = await Promise.all(
            newDependencies.map(async ({ absolutePath, absoluteRequest }) => {
                const src3 = await loadModule(absoluteRequest);

                return evalModule(src3, absolutePath);
            })
        );
        const contentWithPlaceholders = extractExports(sandbox.module.exports);
        const extractedContent = extractedDependencyContent.reduce(
            (content, dependencyContent, idx) => {
                const pattern = new RegExp(
                    newDependencies[idx].rndPlaceholder,
                    "g"
                );

                return content.replace(pattern, dependencyContent);
            },
            contentWithPlaceholders
        );

        moduleCache.set(filename, extractedContent);

        return extractedContent;
    }

    return evalModule(src, filename);
}

/**
 * @typedef {Object} LoaderContext
 * @property {function} cacheable
 * @property {function} async
 * @property {function} addDependency
 * @property {function} loadModule
 * @property {string} resourcePath
 * @property {object} options
 */

/**
 * Executes the given module's src in a fake context in order to get the resulting string.
 *
 * @this LoaderContext
 * @param {string} src
 * @throws Error
 */
async function extractLoader(src) {
    // getPublicPath() encapsulates the complexity of reading the publicPath from the current
    // webpack config. Let's keep the complexity in this function.
    /* eslint-disable complexity  */
    /**
     * Retrieves the public path from the loader options, context.options (webpack <4) or context._compilation (webpack 4+).
     * context._compilation is likely to get removed in a future release, so this whole function should be removed then.
     * See: https://github.com/peerigon/extract-loader/issues/35
     *
     * @deprecated
     * @param {Object} options - Extract-loader options
     * @param {Object} context - Webpack loader context
     * @returns {string}
     */
    function getPublicPath(options, context) {
        let publicPath = "";

        if ("publicPath" in options) {
            publicPath =
                typeof options.publicPath === "function"
                    ? options.publicPath(context)
                    : options.publicPath;
        } else if (
            context.options &&
            context.options.output &&
            "publicPath" in context.options.output
        ) {
            publicPath = context.options.output.publicPath;
        } else if (
            context._compilation &&
            context._compilation.outputOptions &&
            "publicPath" in context._compilation.outputOptions
        ) {
            publicPath = context._compilation.outputOptions.publicPath;
        }

        return publicPath === "auto" ? "" : publicPath;
    }
    /* eslint-enable complexity */

    const done = this.async();
    const options = "getOptions" in this ? this.getOptions() : {};
    const publicPath = getPublicPath(options, this);

    this.cacheable();

    try {
        done(
            null,
            await evalDependencyGraph({
                loaderContext: this,
                src,
                filename: this.resourcePath,
                publicPath,
            })
        );
    } catch (error) {
        done(error);
    }
}

// For CommonJS interoperability
module.exports = extractLoader;
// export default extractLoader;
