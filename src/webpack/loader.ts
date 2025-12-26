import MagicString from 'magic-string';
import path from 'path';
import merge from 'merge-source-map';

/**
 * ez-saga Webpack Loader
 * 对应 src/vite/index.ts 的逻辑，用于 Webpack 场景
 */
export default function (this: any, source: string, inputSourceMap?: any) {
    // 简单的特征检测
    const hasDefaultExport = /export\s+default/.test(source) || /exports\.default\s*=/.test(source) || /module\.exports\s*=/.test(source);
    // name属性检查 (宽松匹配: name: "foo" 或 name = "foo")
    const hasNameProp = /(name\s*[:=])/.test(source);
    // 关键字检查 (Loose due to compilation)
    const hasModelKeywords = /(effects|reducers|state|initialState)\s*[:=]\s*\{/.test(source);

    if (hasDefaultExport && hasNameProp && hasModelKeywords) {
        const callback = this.async();
        const s = new MagicString(source);

        // Regular expressions to detect export patterns
        const esmRegex = /export\s+default/;
        const cjsDefaultRegex = /exports\.default\s*=/;
        const cjsModuleRegex = /module\.exports\s*=/;

        let match;
        const modelVarName = '__ez_saga_model_def';

        if ((match = esmRegex.exec(source)) !== null) {
            // ESM: export default { ... }
            const start = match.index;
            const end = start + match[0].length;
            s.overwrite(start, end, `const ${modelVarName} =`);
            s.append(`\nexport default ${modelVarName};\n`);
        } else if ((match = cjsDefaultRegex.exec(source)) !== null) {
            // CJS: exports.default = { ... }
            const start = match.index;
            const end = start + match[0].length;
            s.overwrite(start, end, `const ${modelVarName} =`);
            s.append(`\nexports.default = ${modelVarName};\n`);
        } else if ((match = cjsModuleRegex.exec(source)) !== null) {
            // CJS: module.exports = { ... }
            const start = match.index;
            const end = start + match[0].length;
            s.overwrite(start, end, `const ${modelVarName} =`);
            s.append(`\nmodule.exports = ${modelVarName};\n`);
        } else {
            // 匹配失败
            this.callback(null, source, inputSourceMap);
            return;
        }

        // 注入 HMR 逻辑
        const hmrCode = `
if (module.hot) {
  module.hot.accept();
  if (${modelVarName} && ${modelVarName}.name) {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('EZ_SAGA_UPDATE_' + ${modelVarName}.name, { 
            detail: ${modelVarName} 
        }));
    }
  }
}
`;
        s.append(hmrCode);

        // 生成当前的 map
        const intermediateFileName = path.basename(this.resourcePath) + ".intermediate.js";
        const currentMap = s.generateMap({
            source: intermediateFileName,
            hires: true,
            includeContent: true
        });

        // 如果有输入的 map (来自 ts-loader)，则合并
        let outputMap = currentMap;
        if (inputSourceMap) {
            try {
                // merge-source-map(oldMap, newMap)
                outputMap = merge(inputSourceMap, JSON.parse(currentMap.toString()));
            } catch (e) {
                console.warn('[ez-saga-loader] SourceMap merge failed:', e);
                outputMap = JSON.parse(currentMap.toString());
            }
        } else {
            outputMap = JSON.parse(currentMap.toString());
        }

        callback(null, s.toString(), outputMap);
        return;
    }

    this.callback(null, source, inputSourceMap);
}
