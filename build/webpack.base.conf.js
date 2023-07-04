'use strict'
const webpack = require('webpack');
//const chalk = require('chalk');
const ESLintPlugin = require('eslint-webpack-plugin');
const path = require('path');
const { ProgressPlugin } = require("webpack")
const isPro = process.env.NODE_ENV === 'production';
const isProName = isPro ? 'pro' : 'dev';
console.log("当前webpack配置环境:" + isProName);
module.exports = {
  context: path.resolve(__dirname, '../'),
  /** 入口文件 */
  entry: {
    index: path.resolve(__dirname, '../', './src/index.js')
  },
  /** 编译输出配置 */
  output: {
    /** 打包后的文件存放的地方 */
    path: path.resolve(__dirname, '../dist'),
    /** 打包后输出文件的文件名 */
    filename: '[name].js',
    /** 对于按需加载(on-demand-load)或加载外部资源(external resources)（如图片、文件等）来说，
     * output.publicPath 是很重要的选项。如果指定了一个错误的值，则在加载这些资源时会收到 404 错误 */
    publicPath: '/',
    chunkFormat: 'module',
    library: {
      type: 'umd'
    }
  },
  /** 传递多个目标时使用共同的特性子集, webpack 将生成 web 平台的运行时代码，并且只使用 ES5 相关的特性 */
  target: ['web', 'es6'],
  /** 设置模块如何被解析 */
  resolve: {
    /** 尝试按顺序解析这些后缀名。如果有多个文件有相同的名字，但后缀名不同，
     * webpack 会解析列在数组首位的后缀的文件 并跳过其余的后缀
     * 能够使用户在引入模块时不带扩展 */
    extensions: [
      '.js', '.jsx', '.ts', '.tsx', 'css', '.json', '...'
    ],
    /** 创建 import 或 require 的别名，来确保模块引入变得更简单。例如，一些位于 src/ 文件夹下的常用模块 */
    alias: {
      '@': path.resolve(__dirname, '../src')
    },
    fallback: {
      dgram: false,
      fs: false,
      net: false,
      tls: false,
      child_process: false
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        loader: 'babel-loader',
        options: { cacheDirectory: true },
        exclude: /node_modules/
      },
      {
        test: /\.(tsx|ts)?$/,
        loader: "ts-loader"
      }
    ]
  },
  plugins: [
    new ESLintPlugin({
      /** 指定文件根目录，类型为字符串 */
      context: 'src',
      /** 启动自动修复特性，小心: 该选项会修改源文件 */
      fix: false,
      /** 指定需要检查的扩展名 */
      extensions: ['js', 'jsx'],
      /** 指定需要排除的文件及目录。必须是相对于 options.context 的相对路径 */
      exclude: ['node_modules']
    }),
    new webpack.AutomaticPrefetchPlugin(),
    /** 在打包构建中输出当前的进度和简述 */
    new ProgressPlugin({
      /** 默认false，显示活动模块计数和一个活动模块正在进行消息。 */
      activeModules: true,
      /** 默认true，显示正在进行的条目计数消息。 */
      entries: true,
      /** 默认true，显示正在进行的模块计数消息。 */
      modules: true,
      /** 默认5000，开始时的最小模块数。PS:modules启用属性时生效。 */
      modulesCount: 5000,
      /** 默认false，告诉ProgressPlugin为进度步骤收集配置文件数据。 */
      profile: false,
      /** 默认true，显示正在进行的依赖项计数消息。 */
      dependencies: true,
      /** 默认10000，开始时的最小依赖项计数。PS:dependencies启用属性时生效。 */
      dependenciesCount: 10000,
      /** 钩子函数 */
      // handler(percentage, message, ...args) {
      //   console.log(chalk.cyan('进度:') + chalk.green.bold(~~(percentage * 100) + '%') + ' ' 
      //   + chalk.yellow.bold('操作: ') + chalk.blue.bold(message), ...args)
      // }
    })
  ]
}
