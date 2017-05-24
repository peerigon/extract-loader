import webpack from "webpack";
import path from "path";

export default function ({ testModule, publicPath, query = "" }) {
    const testModulePath = path.resolve(__dirname, "../modules/", testModule);

    return new Promise((resolve, reject) => {
        webpack({
            entry: testModulePath,
            bail: true, // report build errors to our test
            output: {
                path: path.resolve(__dirname, "../dist"),
                filename: "bundle.js",
                publicPath
            },
            module: {
                loaders: [
                    {
                        test: /\.js$/,
                        loaders: [
                            // appending -dist so we can check if url rewriting is working
                            "file?name=[name]-dist.[ext]",
                            path.resolve(__dirname, "../../lib/extractLoader.js") + query
                        ]
                    },
                    {
                        test: /\.html$/,
                        loaders: [
                            "file?name=[name]-dist.[ext]",
                            path.resolve(__dirname, "../../lib/extractLoader.js") + query,
                            "html?" + JSON.stringify({
                                attrs: ["img:src", "link:href"],
                                interpolate: true
                            })
                        ]
                    },
                    {
                        test: /\.css$/,
                        loaders: [
                            "file?name=[name]-dist.[ext]",
                            path.resolve(__dirname, "../../lib/extractLoader.js") + query,
                            "css"
                        ]
                    },
                    {
                        test: /\.jpg$/,
                        loader: "file?name=[name]-dist.[ext]"
                    }
                ]
            }
        }, (err, stats) => {
            err ? reject(err) : resolve(stats);
        });
    });
}
