import * as vscode from "vscode";
import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import axios from "axios";
import { issueParmas } from "../constant";
import { exec } from "child_process";

export class IdevProvider implements vscode.WebviewViewProvider {
  private context: vscode.ExtensionContext;
  public static readonly viewType = "idev-assistant";
  private _view?: vscode.WebviewView;
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "index.js"]);
    const iconUriPrefix = getUri(webview, extensionUri, ["webview-ui", "assets"]);

    const nonce = getNonce();

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
      switch (message.command) {
        case "login": {
          if (!token) {
            // Open browser for login
            vscode.env.openExternal(
              vscode.Uri.parse("http://sharklocal.ctripcorp.com:5173/vscodeExtension")
            );
          } else {
            vscode.window.showInformationMessage("Already logged in!");
          }
        }
        case "linkBranch": {
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (workspaceFolders === undefined) {
            vscode.window.showErrorMessage("Failed to get branch name.");
            return;
          }
          const workspacePath = workspaceFolders[0].uri.fsPath;
          exec("git rev-parse --abbrev-ref HEAD", { cwd: workspacePath }, (err, stdout, stderr) => {
            if (err) {
              vscode.window.showErrorMessage("Failed to get branch name.");
              console.error(stderr);
              return;
            }

            const branchName = stdout.trim();
            vscode.window.showInformationMessage(`${branchName} link success`);
          });
        }
      }
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.postdata();
      }
    });

    if (webviewView.visible) {
      this.postdata();
    }
  }

  public async postdata() {
    if (!this._view) {
      return;
    }
    const idevtoken = this.context.globalState.get("idevToken");
    const userInfo = this.context.globalState.get("userInfo");
    const issueList = this.context.globalState.get("issueList");
    try {
      if (idevtoken && userInfo && issueList) {
        this._view.webview.postMessage({ command: "userInfo", data: userInfo });
        this._view.webview.postMessage({ command: "issueList", data: issueList });
      } else {
        if (idevtoken) {
          const request = axios.create({
            baseURL: "https://idev2-00.fat6.qa.nt.ctripcorp.com/api/",
            headers: {
              userToken: idevtoken as string,
            },
            timeout: 10000, // 设置请求超时时间（可选）
          });

          const [{ data: userInfo }, { data: issueList }] = await Promise.all([
            request.get("userinfo/userObj"),
            request.post("issuefilter/view", issueParmas),
          ]);
          const issueListData = issueList.data.records.map((item: any) => ({
            iconId: item.issueType.iconId,
            key: item.issueKey,
            title: item.title,
            branchList: ["feature/123", "feature/456"],
          }));

          this.context.globalState.update("userInfo", userInfo.data);
          this.context.globalState.update("issueList", issueListData);
          this._view.webview.postMessage({ command: "userInfo", data: userInfo.data });
          this._view.webview.postMessage({ command: "issueList", data: issueListData });
        } else {
          this.context.globalState.update("userInfo", undefined);
          this.context.globalState.update("issueList", undefined);
          this._view.webview.postMessage({ command: "needLogin" });
        }
      }
    } catch (e) {
      console.log("e", e);
    }
  }
}
