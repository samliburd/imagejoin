const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.scss$/i,
        use: [
          'style-loader', // Inject styles into DOM
          'css-loader', // Turns CSS into CommonJS
          {
            loader: 'sass-loader', // Compiles Sass to CSS
            options: {
              sassOptions: {
                includePaths: ['node_modules'], // Ensures node_modules are available for imports
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i, // This rule is for CSS files
        use: [
          'style-loader', // Inject CSS into DOM
          'css-loader', // Turns CSS into CommonJS
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'img', to: 'img' },
        { from: 'css', to: 'css' },
        { from: 'js/vendor', to: 'js/vendor' },
        { from: 'icon.svg', to: 'icon.svg' },
        { from: 'favicon.ico', to: 'favicon.ico' },
        { from: 'robots.txt', to: 'robots.txt' },
        { from: 'icon.png', to: 'icon.png' },
        { from: '404.html', to: '404.html' },
        { from: 'site.webmanifest', to: 'site.webmanifest' },
      ],
    }),
  ],
});
