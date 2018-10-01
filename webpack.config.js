const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
    entry: "./src/index.js",
    devServer: {
        contentBase: "./dist"
    },
    plugins: [
        new CleanWebpackPlugin(["dist"]),
        new HtmlWebpackPlugin({
            title: "The Game"
        })
    ],
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist")
    }
};