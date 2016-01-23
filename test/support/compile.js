import webpack from "webpack";
import path from "path";

export default function ({ testModule, loaders = [] }) {
    const testModulePath = path.resolve(__dirname, "../modules/", testModule);

    loaders.unshift(
        "file?name=[name].[ext]",
        path.resolve(__dirname, "../../lib/extractLoader.js")
    );

    return new Promise((resolve, reject) => {
        webpack({
            entry: testModulePath,
            output: {
                path: path.resolve(__dirname, "../dist"),
                filename: "bundle.js"
            },
            module: {
                loaders: [
                    {
                        test: testModulePath,
                        loaders
                    },
                    {
                        test: /\.jpg$/,
                        loader: "file?name=[name].[ext]"
                    }
                ]
            }
        }, (err, stats) => {
            err ? reject(err) : resolve(stats);
        });
    });
}
