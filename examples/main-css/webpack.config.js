var path = require("path");

module.exports = {
    entry: [
        path.join(__dirname, "app", "main.css"),
        path.join(__dirname, "app", "main.js")
    ],
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loaders: [
                    "file?name=[name].[ext]",
                    // should be just "extract" in your case
                    path.resolve(__dirname, "../../lib/extractLoader.js"),
                    "css"
                ]
            }
        ]
    }
};
