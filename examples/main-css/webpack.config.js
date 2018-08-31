"use strict";

module.exports = ({ mode }) => {
    const pathToMainCss = require.resolve("./app/main.css");
    const loaders = [{
        loader: "css-loader",
        options: {
            sourceMap: true
        }
    }];

    if (mode === "production") {
        loaders.unshift(
            "file-loader",
            // should be just "extract-loader" in your case
            require.resolve("../../lib/extractLoader.js"),
        );
    } else {
        loaders.unshift("style-loader");
    }

    return {
        mode,
        entry: pathToMainCss,
        module: {
            rules: [
                {
                    test: pathToMainCss,
                    loaders: loaders
                },
            ]
        }
    };
};
