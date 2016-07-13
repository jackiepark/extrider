var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  context: path.resolve(__dirname, '..'),
  entry: {
    app: './client/app.js'
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
        loader: ExtractTextPlugin.extract('style','css!less')
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('styles/styles.css', {allChunks: true}),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      mangle: false,
      minimize: false
    })
  ]
};
