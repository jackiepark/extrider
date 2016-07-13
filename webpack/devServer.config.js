var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'inline-source-map',
  context: path.resolve(__dirname, '..'),
  entry: {
    app: [
      'webpack-hot-middleware/client',
      './client/app.js'
    ]
  },
  output: {
    path: path.join(__dirname, '..', 'dist'),
    filename: 'scripts/[name].js',
    publicPath: '/'
  },
  externals: {
    jquery: '$'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
      {
        test: /\.(css|less)/,
        loader: 'style!css!less'
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ]
};
