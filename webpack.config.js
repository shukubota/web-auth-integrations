const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

// Main process configuration
const mainConfig = {
  target: 'electron-main',
  entry: './src/main/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'main.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'source-map' : false,
};

// Preload script configuration
const preloadConfig = {
  target: 'electron-preload',
  entry: './src/renderer/preload.ts',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'preload.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'source-map' : false,
};

// Renderer process configuration
const rendererConfig = {
  target: 'electron-renderer',
  entry: './src/renderer/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'renderer.js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    ...(isDevelopment ? [] : [new MiniCssExtractPlugin({
      filename: 'styles.css',
    })]),
  ],
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'source-map' : false,
};

module.exports = [mainConfig, preloadConfig, rendererConfig];