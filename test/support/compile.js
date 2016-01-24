import webpack from "webpack";
import path from "path";

export default function ({ testModule, publicPath }) {
    const testModulePath = path.resolve(__dirname, "../modules/", testModule);

    return new Promise((resolve, reject) => {
        webpack({
            entry: testModulePath,
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
                            path.resolve(__dirname, "../../lib/extractLoader.js")
                        ]
                    },
                    {
                        test: /\.html$/,
                        loaders: [
                            "file?name=[name]-dist.[ext]",
                            path.resolve(__dirname, "../../lib/extractLoader.js"),
                            "html?" + JSON.stringify({
                                attrs: ["img:src", "link:href"]
                            })
                        ]
                    },
                    {
                        test: /\.css$/,
                        loaders: [
                            "file?name=[name]-dist.[ext]",
                            path.resolve(__dirname, "../../lib/extractLoader.js"),
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
