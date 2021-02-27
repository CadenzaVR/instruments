module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "instruments-vr.js"
  },
  devServer: {
    contentBase: "./dist/",
    port: 8000
  }
};
