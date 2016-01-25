var path = require("path");

var indexHtml = path.join(__dirname, "app", "index.html");

module.exports = {
    entry: [
        path.join(__dirname, "app", "main.js"),
        indexHtml
    ],
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {
                test: indexHtml,
                loaders: [
                    "file?name=[name].[ext]",
                    path.resolve(__dirname, "../../lib/extractLoader.js"),
                    "html?" + JSON.stringify({
                        attrs: ["img:src", "link:href"]
                    })
                ]
            },
            {
                test: /\.css$/,
                loaders: [
                    "file",
                    path.resolve(__dirname, "../../lib/extractLoader.js"),
                    "css"
                ]
            },
            {
                test: /\.jpg$/,
                loader: "file"
            }
        ]
    }
};
