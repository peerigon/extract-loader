var path = require("path");

var live = process.env.NODE_ENV === "production";
var mainCss = ["css-loader", path.join(__dirname, "app", "main.css")];

if (live) {
    mainCss.unshift(
        "file-loader?name=[name].[ext]",
        path.resolve(__dirname, "..", "..", "lib", "extractLoader.js") // should be just "extract" in your case
    );
} else {
    mainCss.unshift("style-loader");
}

module.exports = {
    entry: [
        path.join(__dirname, "app", "main.js"),
        mainCss.join("!")
    ],
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js"
    }
};
