const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

const localDevServer = "http://localhost:5000";
const productionServer = "";

module.exports = (env, argv) => {
  return {
    entry: "./src/index.tsx",
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
      clean: {
        keep: /.git/,
      },
    },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: "ts-loader" },
        {
          test: /\.css?$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                url: false,
              },
            },
          ],
        },
        { test: /\.jpg?$/, loader: "file-loader" },
      ],
    },
    devtool: "inline-source-map",
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "src/assets/background.jpg", to: "images" },
          { from: "src/assets/logo.png", to: "images" },
          { from: "src/assets/Frame 1.png", to: "images" },
          { from: "src/assets/Frame 2.png", to: "images" },
          { from: "src/assets/Frame 3.png", to: "images" },
        ],
      }),
      new webpack.DefinePlugin({
        "process.env.SERVER_URL": JSON.stringify(
          argv.mode === "development" ? localDevServer : productionServer
        ),
        "process.env.BUILD_NUMBER": JSON.stringify(
          new Date().getTime() % 10000000
        ),
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
    },
  };
};
