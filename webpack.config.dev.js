const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

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
});
