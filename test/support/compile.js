const path = require( "path");
const webpack = require( "webpack");

const pathToExtractLoader = path.resolve(
    __dirname,
    "../../src/extractLoader.js"
);

function compile({testModule, publicPath, loaderOptions}) {
    const testModulePath = path.resolve(__dirname, "../modules/", testModule);

    return new Promise((resolve, reject) => {
        webpack(
            {
                mode: "development",
                entry: testModulePath,
                output: {
                    path: path.resolve(__dirname, "../dist"),
                    filename: "bundle.js",

                    publicPath,
                },
                module: {
                    rules: [
                        {
                            test: /\.js$/,
                            use: [
                                {
                                    loader: "file-loader",
                                    options: {
                                        esModule: false,

                                        // appending -dist so we can check if url rewriting is working
                                        name: "[name]-dist.[ext]",
                                    },
                                },
                                {
                                    loader: pathToExtractLoader,
                                    options: loaderOptions,
                                },
                            ],
                        },
                        {
                            test: /\.html$/,
                            use: [
                                {
                                    loader: "file-loader",
                                    options: {
                                        esModule: false,
                                        name: "[name]-dist.[ext]",
                                    },
                                },
                                {
                                    loader: pathToExtractLoader,
                                    options: loaderOptions,
                                },
                                {
                                    loader: "html-loader",
                                    options: {
                                        sources: true, /* ["img:src", "link:href"]*/
                                        esModule: false

                                    },
                                },
                            ],
                        },
                        {
                            test: /\.css$/,
                            use: [
                                {

                                    loader: "file-loader",
                                    options: {
                                        esModule: false,

                                        name: "[name]-dist.[ext]",
                                    },
                                },
                                {
                                    loader: pathToExtractLoader,
                                    options: loaderOptions,
                                },
                                {
                                    loader: "css-loader",
                                    options: {
                                        esModule: false,
                                        sourceMap: true,
                                    },
                                },
                            ],
                        },
                        {
                            test: /\.jpg$/,
                            use: [
                                {
                                    loader: "file-loader",
                                    options: {
                                        esModule: false,

                                        name: "[name]-dist.[ext]",
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
            (err, stats) => { // eslint-disable-line promise/prefer-await-to-callbacks
                if (err || stats.hasErrors() || stats.hasWarnings()) {
                    reject(err || stats.toString("minimal"));
                } else {
                    resolve(stats);
                }
            }
        );
    });
}
module.exports = compile;
//export default compile;
