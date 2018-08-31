"use strict";

module.exports = ({ mode }) => {
    const pathToMainJs = require.resolve("./app/main.js");
    const pathToIndexHtml = require.resolve("./app/index.html");

    return {
        mode,
        entry: [
            pathToMainJs,
            pathToIndexHtml
        ],
        module: {
            rules: [
                {
                    test: pathToIndexHtml,
                    use: [
                        "file-loader",
                        // should be just "extract-loader" in your case
                        require.resolve("../../lib/extractLoader.js"),
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
                        // should be just "extract-loader" in your case
                        require.resolve("../../lib/extractLoader.js"),
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: true
                            }
                        }
                    ]
                },
                {
                    test: /\.jpg$/,
                    use: "file-loader"
                }
            ]
        }
    };
};
