"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdevProvider = void 0;
const getUri_1 = require("../utilities/getUri");
const getNonce_1 = require("../utilities/getNonce");
class IdevProvider {
    constructor(context) {
        this.context = context;
    }
    _getWebviewContent(webview, extensionUri) {
        // The CSS file from the React build output
        const stylesUri = (0, getUri_1.getUri)(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
        // The JS file from the React build output
        const scriptUri = (0, getUri_1.getUri)(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);
        const nonce = (0, getNonce_1.getNonce)();
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
            <title>Hello World</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
          </body>
        </html>
      `;
    }
    // 实现 resolveWebviewView 方法，用于处理 WebviewView 的创建和设置
    resolveWebviewView(webviewView, context, token) {
        // 配置 WebviewView 的选项
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri],
        };
        // 设置 WebviewView 的 HTML 内容，可以在这里指定要加载的网页内容
        webviewView.webview.html = this._getWebviewContent(webviewView.webview, this.context.extensionUri);
    }
}
exports.IdevProvider = IdevProvider;
//# sourceMappingURL=IdevProvider.js.map