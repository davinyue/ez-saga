import { Plugin } from 'vite';
import MagicString from 'magic-string';

/**
 * ez-saga Vite 插件
 * 
 * 自动为 ez-saga model 文件注入 HMR 代码。
 * 约定：
 * 1. Model 文件必须使用 export default 导出对象
 * 2. 导出的对象必须包含 'name' 属性 (作为 Model 的唯一标识)
 * 3. 项目中必须将 app 实例挂载到 window.app
 */

export default function ezSagaHmr(): Plugin {
    return {
        name: 'vite-plugin-ez-saga-hmr',
        apply: 'serve', // 仅在开发环境(serve)模式下应用
        transform(code, id) {
            // 过滤掉 node_modules 和非 JS/TS 文件
            if (id.includes('node_modules') || !/\.(js|ts|tsx|jsx)$/.test(id)) {
                return;
            }
            // 简单的特征检测：检查是否包含 ez-saga model 的关键属性
            // 必须包含 name 属性，且通常包含 effects 或 reducers 或 state
            // 宽容匹配:
            // 1. export default ... (可能是对象字面量，也可能是变量)
            // 2. name: ... (可能是字符串字面量，也可能是变量)
            const hasDefaultExport = /export\s+default/.test(code);
            const hasNameProp = /name\s*:/.test(code);
            const hasModelKeywords = /(effects|reducers|state|initialState)\s*:\s*\{/.test(code);

            if (hasDefaultExport && hasNameProp && hasModelKeywords) {
                // console.log('ez-saga HMR: Injecting HMR code into', id);
                // 注入 HMR 代码
                // 使用 window 事件通信，解耦 app 实例引用
                const hmrCode = `
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule && newModule.default) {
      const model = newModule.default;
      if (model.name) {
        // console.log('[ez-saga] Hot updating model:', model.name);
        if (window && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('EZ_SAGA_UPDATE_' + model.name, { 
                detail: model 
            }));
        }
      }
    }
  });
}
`;
                const s = new MagicString(code);
                s.append(hmrCode);

                return {
                    code: s.toString(),
                    map: s.generateMap({ hires: true })
                };
            }
        }
    };
}
