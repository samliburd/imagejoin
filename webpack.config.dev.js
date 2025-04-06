const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');  // <-- Ensure you have this


module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    liveReload: true,
    hot: true,
    open: true,
    static: ['./'],
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader', // Inject styles into DOM
          'css-loader', // Turns CSS into CommonJS
          {
            loader: 'sass-loader', // Compiles Sass to CSS
            options: {
              sassOptions: {
                includePaths: ['node_modules'], // Ensure node_modules are available for imports
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i, // Ensure .css files are handled
        use: [
          'style-loader', // Inject CSS into DOM
          'css-loader', // Turns CSS into CommonJS
        ],
      },
    ],
  },
  plugins: [
    // Make sure this is in your dev config to inject the script properly
    new HtmlWebpackPlugin({
      template: './index.html',  // Use your original HTML template
      filename: 'index.html',
      inject: 'body',  // This ensures script is injected at the end of the body
    }),
  ],
});
