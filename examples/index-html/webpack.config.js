var path = require("path");

var indexHtml = path.join(__dirname, "app", "index.html");

module.exports = {
    mode: "development",
    entry: [
        path.join(__dirname, "app", "main.js"),
        indexHtml
    ],
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js"
    },
    module: {
        rules: [
            {
                test: indexHtml,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]"
                        }
                    },
                    path.resolve(__dirname, "..", "..", "lib", "extractLoader.js"),
                    {
                        loader: "html-loader",
                        options: {
                            attrs: ["img:src", "link:href"]
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [
                    "file-loader",
                    path.resolve(__dirname, "..", "..", "lib", "extractLoader.js"),
                    "css-loader"
                ]
            },
            {
                test: /\.jpg$/,
                use: "file-loader"
            }
        ]
    }
};
