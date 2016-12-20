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
                    "file-loader?name=[name].[ext]",
                    path.resolve(__dirname, "../../src/extractLoader.js"),
                    "html-loader?" + JSON.stringify({
                        attrs: ["img:src", "link:href"]
                    })
                ]
            },
            {
                test: /\.css$/,
                loaders: [
                    "file-loader",
                    path.resolve(__dirname, "../../src/extractLoader.js"),
                    "css-loader"
                ]
            },
            {
                test: /\.jpg$/,
                loader: "file-loader"
            }
        ]
    }
};
