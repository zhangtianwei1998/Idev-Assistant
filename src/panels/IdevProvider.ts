import * as vscode from "vscode";
import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import axios from "axios";
import { issueParmas } from "../constant";

export class IdevProvider implements vscode.WebviewViewProvider {
  private context: vscode.ExtensionContext;
  public static readonly viewType = "idev-assistant";
  private _view?: vscode.WebviewView;
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="Content-Security-Policy" content="default-src 'none';  style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
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
  async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this._view = webviewView;
    // 配置 WebviewView 的选项
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    console.log("teestresolve");
    // 设置 WebviewView 的 HTML 内容，可以在这里指定要加载的网页内容
    webviewView.webview.html = this._getWebviewContent(
      webviewView.webview,
      this.context.extensionUri
    );

    const token = this.context.globalState.get("idevToken");

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "login") {
        // Check login status

        if (!token) {
          // Open browser for login
          vscode.env.openExternal(
            vscode.Uri.parse("http://sharklocal.ctripcorp.com:5173/vscodeExtension")
          );
        } else {
          vscode.window.showInformationMessage("Already logged in!");
        }
      }
    });
  }
  public async postdata() {
    if (!this._view) {
      return;
    }
    const idevtoken = this.context.globalState.get("idevToken");
    try {
      if (idevtoken) {
        const request = axios.create({
          baseURL: "https://idev2-00.fat6.qa.nt.ctripcorp.com/api/",
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            UserToken: idevtoken as string,
          },
          timeout: 10000, // 设置请求超时时间（可选）
        });
        const { data: userInfo } = await request.get("userinfo/userObj");
        console.log("testuserInfo", userInfo);
        this._view.webview.postMessage({ command: "userInfo", data: userInfo.data });
        issueParmas.filterParamsList[0].vobjlist.push({
          id: userInfo.id,
          desc: userInfo.name,
        });
        const { data: issueList } = await request.post("issue/query/tree", { data: issueParmas });
        this._view.webview.postMessage({ command: "issueList", data: issueList.data });
        console.log("testissueList", issueList);
      }
    } catch (e) {
      console.log("e", e);
    }
  }
}
