'use strict'
const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const baseWebpackConfig = require('./webpack.base.conf');

/** 配置 */
const config = require('../config');
const webpackConfig = merge(baseWebpackConfig, {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    publicPath: config.publicPath
  },
  /** 文件大小限定通知 */
  performance: {
    /** 入口起点的最大体积(单位字节)，这个参数代表入口加载时候最大体积 */
    maxEntrypointSize: 200000,
    /** 此选项根据单个资源体积(单位字节)，控制 webpack 何时生成性能提示，自己将其改成了200kb */
    maxAssetSize: 200000,
    /** 属性允许 webpack 控制用于计算性能提示的文件，通过覆盖原有属性，将其改成只对js|css文件进行性能测试 */
    assetFilter: function (assetFilename) {
      return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
    }
  },
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
        APP_ENV: JSON.stringify(process.env.APP_ENV)
      }
    }),
    // keep module.id stable when vendor modules does not change
    new webpack.ids.HashedModuleIdsPlugin()
  ]
})

if (process.env.npm_config_report) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin({
    analyzerPort: 'auto'
  }))
}

module.exports = webpackConfig
