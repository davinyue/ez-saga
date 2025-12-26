// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,

  parserOptions: {
    sourceType: "module",
    allowImportExportEverywhere: false,
    ecmaFeatures: {
      globalReturn: false,
    },
    ecmaFeatures: {}
  },
  env: {
    browser: true,
    es6: true
  },
  extends: ["eslint:recommended"],
  plugins: [
    "node",
    "standard"
  ],
  settings: {},
  // "off"或0 -关闭规则; "warn" 或1 - 开启规则, 使用警告,程序不会退出; "error"或2 - 开启规则, 使用错误 程序退出
  rules: {
    // allow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    /** 语句强制分号结尾 */
    "semi": [2, "always"],
    /** 文件以单一的换行符结束 */
    "eol-last": 0,
    /** 函数定义时括号前面要不要有空格 */
    "space-before-function-paren": [0, "always"],
    /** 注释风格要不要有空格什么的 */
    "spaced-comment": 0,
    /** 关闭else if必须和上一个条件在一行 */
    "brace-style": 0,
    /** 关闭if后面必须有花括号 */
    "curly": 0,
    "comma-dangle": 0,
    "no-inner-declarations": 0,
    "no-trailing-spaces": 0,
    "no-unused-vars": "warn",
    "no-unexpected-multiline": "warn",
    "no-console": 0,
    /** 双引号警告 */
    "quotes": [1, "single"],
    "no-dupe-keys": 0,
    /** 强制驼峰法命名 */
    "camelcase": 0,
    /** 首选const */
    "prefer-const": 0
  }
}
