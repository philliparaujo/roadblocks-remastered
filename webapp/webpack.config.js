const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.tsx",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" },
      { test: /\.css?$/, use: ["style-loader", "css-loader"] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
  devServer: {
    historyApiFallback: true,
    port: 3000,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    modules: [
      path.resolve(__dirname, "src"),
      path.resolve(__dirname, "."),
      "node_modules",
    ],
    // alias: {
    //   "@roadblocks/types": path.resolve(
    //     __dirname,
    //     "node_modules/@roadblocks/types"
    //   ),
    // },
  },
};
