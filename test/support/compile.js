import webpack from "webpack";
import path from "path";

const pathToExtractLoader = path.resolve(
    __dirname,
    "../../lib/extractLoader.js"
);

export default function ({ testModule, publicPath, loaderOptions }) {
    const testModulePath = path.resolve(__dirname, "../modules/", testModule);

    return new Promise((resolve, reject) => {
        webpack(
            {
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
                                        attrs: ["img:src", "link:href"],
                                        interpolate: true,
                                    },
                                },
                            ],
                        },
                        {
                            test: /\.css$/,
                            loaders: [
                                {
                                    loader: "file-loader",
                                    options: {
                                        name: "[name]-dist.[ext]",
                                    },
                                },
                                {
                                    loader: pathToExtractLoader,
                                    options: loaderOptions,
                                },
                                {
                                    loader: "css-loader",
                                },
                            ],
                        },
                        {
                            test: /\.jpg$/,
                            loaders: [
                                {
                                    loader: "file-loader",
                                    options: {
                                        name: "[name]-dist.[ext]",
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
            (err, stats) => {
                if (err || stats.hasErrors() || stats.hasWarnings()) {
                    reject(err || stats.toString("errors-only"));
                } else {
                    resolve(stats);
                }
            }
        );
    });
}
