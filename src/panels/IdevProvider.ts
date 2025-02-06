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
    // const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "index.js"]);
    const iconUriPrefix = getUri(webview, extensionUri, ["webview-ui", "assets"]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Cat Coding</title>
			</head>
			<body>
      <issue-list></issue-list>
      <script>window.iconPrefix ="${iconUriPrefix}" </script>
      <script type="module" nonce="${nonce}" src="${scriptUri}"></script>

			</body>
			</html>`;
  }

  async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

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

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        // Call postdata when the webview becomes visible
        this.postdata();
      }
    });

    if (webviewView.visible) {
      // Call postdata when the webview becomes visible
      this.postdata();
    }
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
        console.log("testissueList", issueList);
        const issueListData = issueList.data.records.map((item: any) => ({
          iconId: item.issueType.iconId,
          key: item.issueKey,
          title: item.title,
          branchList: ["feature/123", "feature/456"],
        }));
        this._view.webview.postMessage({ command: "issueList", data: issueListData });
        console.log("testdata", issueListData);
      }
    } catch (e) {
      console.log("e", e);
    }
  }
}
