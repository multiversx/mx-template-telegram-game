const path = require("path");
const webpack = require("webpack");

module.exports = {
  target: "web", // Make sure it's targeting the web
  mode: "development",
  entry: {
    main: "./src/clickerLib.ts", // Your entry point
  },
  output: {
    path: path.resolve(__dirname, "../frontend/public"),
    filename: "[name]-bundle.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      buffer: require.resolve("buffer"),
      stream: require.resolve("stream-browserify"),
      fs: require.resolve("browserify-fs"),
      vm: false,
      process: require.resolve("process/browser"), // Polyfill process
      zlib: require.resolve("browserify-zlib"),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser", // Provide process globally
      Buffer: ["buffer", "Buffer"], // Provide Buffer globally
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
