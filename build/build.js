'use strict'
require('./check-versions')()

process.env.NODE_ENV = 'production'

const rm = require('rimraf')
const path = require('path')
/* 文字着色器, 不能升级, 最后一个可用版本为4.1.2 */
const chalk = require('chalk')
const webpack = require('webpack')
const webpackConfig = require('./webpack.prod.conf')

rm(path.resolve(__dirname, '../dist'), err => {
  if (err) throw err
  webpack(webpackConfig, (err, stats) => {
    if (err) {
      console.log(chalk.red(err.message));
      return;
    }
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false, // If you are using ts-loader, setting this to true will make TypeScript errors show up during build.
      chunks: false,
      chunkModules: false
    }) + '\n\n')

    if (stats.hasErrors()) {
      console.log(chalk.red('  Build failed with errors.\n'))
      process.exit(1)
    }

    console.log(chalk.cyan('  Build complete.\n'))
    console.log(chalk.yellow(
      '  Tip: built files are meant to be served over an HTTP server.\n' +
      '  Opening index.html over file:// won\'t work.\n'
    ))
  })
})
