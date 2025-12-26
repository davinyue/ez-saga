import { Compiler } from 'webpack';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 环境下模拟 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ez-saga Webpack Plugin (Webpack 5+)
 * 
 * 自动配置 ez-saga-loader，实现 Model 热更新。
 */
export default class EzSagaWebpackPlugin {
    apply(compiler: Compiler) {
        // 获取 loader 的绝对路径
        const loaderPath = path.resolve(__dirname, './loader.js');

        compiler.hooks.afterEnvironment.tap('EzSagaWebpackPlugin', () => {
            // 注入 loader规则
            compiler.options.module.rules.push({
                test: /\.(js|ts|tsx|jsx)$/,
                exclude: /node_modules/,
                enforce: 'post', // 在编译后执行，避免影响 ts-loader 输入
                use: [{
                    loader: loaderPath
                }]
            });
        });
    }
}
