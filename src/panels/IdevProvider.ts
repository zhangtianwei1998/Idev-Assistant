import * as vscode from "vscode";
import * as _ from "lodash";
import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";

import { getNonce } from "../utilities/getNonce";
import axios, { AxiosInstance } from "axios";
import { basicUrl, getIssueUrl, issueParmas, loginUrl } from "../constant";
import { exec } from "child_process";

import { TimeTracker } from "../workload/TimeTracker";
import { UserInfo } from "../types/backendType";

export class IdevProvider implements vscode.WebviewViewProvider {
  private context: vscode.ExtensionContext;
  private timeTracker: TimeTracker;
  public request: AxiosInstance;
  public static readonly viewType = "idev-assistant";
  private view?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];
  private throttledReportWorkTime: (key: string) => void;
  constructor(context: vscode.ExtensionContext, timeTracker: TimeTracker) {
    this.context = context;
    this.timeTracker = timeTracker;
    this.request = axios.create({
      baseURL: basicUrl,
      timeout: 10000,
    });
    this.request.interceptors.request.use((config) => {
      const token = this.context.globalState.get("idevToken");
      if (token) {
        config.headers = config.headers || {};
        config.headers.userToken = token;
      }
      return config;
    });
    this.request.interceptors.response.use((response) => {
      if (response.status === 200 && response.data.code === 401) {
        // vscode.window.showErrorMessage("登录已过期，请重新登录");
        this.context.globalState.update("idevToken", undefined);
        this.context.globalState.update("userInfo", undefined);
        this.context.globalState.update("issueList", undefined);
        vscode.env.openExternal(vscode.Uri.parse(loginUrl));
        return Promise.reject(response);
      }
      return response;
    });
    this.throttledReportWorkTime = _.throttle(this.reportWorkTime.bind(this), 3000, {
      trailing: false,
    });
  }

  private getWebviewContent(webview: Webview, extensionUri: Uri) {
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

  public refresh() {
    if (this.view) {
      this.view.webview.html = this.getWebviewContent(this.view.webview, this.context.extensionUri);
      this.getBasicData();
      this.view.webview.onDidReceiveMessage(this.handleMessage.bind(this));
    }
  }

  private async handleMessage(message: any) {
    switch (message.command) {
      // case "linkBranch": {
      //   const workspaceFolders = vscode.workspace.workspaceFolders;
      //   if (workspaceFolders === undefined) {
      //     vscode.window.showErrorMessage("Failed to get branch name.");
      //     return;
      //   }
      //   const workspacePath = workspaceFolders[0].uri.fsPath;
      //   exec("git rev-parse --abbrev-ref HEAD", { cwd: workspacePath }, (err, stdout, stderr) => {
      //     if (err) {
      //       vscode.window.showErrorMessage("Failed to get branch name.");
      //       console.error(stderr);
      //       return;
      //     }
      //     const branchName = stdout.trim();
      //     vscode.window.showInformationMessage(`${branchName} link success`);
      //   });
      // }
      case "openIssue": {
        vscode.env.openExternal(vscode.Uri.parse(getIssueUrl(message.key)));
        break;
      }
      case "startwork": {
        this.timeTracker.startTracking(message.issueKey);
        this.updateFrontendWorkLoad();
        vscode.window.showInformationMessage(`${message.issueKey} 工时统计开始`);
        break;
      }
      case "endwork": {
        this.timeTracker.stopTracking();
        this.updateFrontendWorkLoad();
        vscode.window.showInformationMessage(`${message.issueKey} 工时统计暂停`);
        break;
      }

      case "uploadWorkload": {
        this.throttledReportWorkTime(message.key);
        break;
        // this.timeTracker.stopTracking();
        // this.updateFrontendWorkLoad();
        // vscode.window.showInformationMessage("工作时间统计已结束");
      }
    }
  }

  public async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    this.refresh();
    // webviewView.webview.html = this.getWebviewContent(
    //   webviewView.webview,
    //   this.context.extensionUri
    // );
    this.updateFrontendWorkLoad();

    this.timeTracker.addFallback(() => this.updateFrontendWorkLoad());

    // const pushWorkloadtimer = setInterval(() => {
    //   this.updateFrontendWorkLoad();
    // }, 10000);

    // this.disposables.push({
    //   dispose: () => {
    //     clearInterval(pushWorkloadtimer);
    //   },
    // });

    // webviewView.webview.onDidReceiveMessage(this.handleMessage.bind(this));

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        const token = this.context.globalState.get("idevToken");
        if (!token) {
          this.refresh();
        }
      }
    });
  }

  public async getBasicData() {
    if (!this.view) {
      return;
    }
    try {
      const { data: userInfo } = await this.request.get("userinfo/userObj");
      const { data: issueList } = await this.request.post("issuefilter/view", issueParmas);

      const issueListData = issueList.data.records.map((item: any) => ({
        iconId: item.issueType.iconId,
        key: item.issueKey,
        title: item.title,
        id: item.issueId,
      }));

      this.context.globalState.update("userInfo", userInfo.data);
      this.context.globalState.update("issueList", issueListData);
      this.view.webview.postMessage({ command: "userInfo", data: userInfo.data });
      this.view.webview.postMessage({ command: "issueList", data: issueListData });
    } catch (error) {
      console.error("获取数据失败", error);
    }
  }

  private async reportWorkTime(key: string) {
    try {
      const selectIssue = this.timeTracker.getworkdata()?.[key];
      if (!selectIssue) {
        vscode.window.showInformationMessage(`Issue ${key} 上未登记工时`);
        return;
      }
      if (selectIssue?.totalDuration && selectIssue?.totalDuration / (24 * 3600 * 1000) < 0.001) {
        vscode.window.showInformationMessage(`Issue ${key} 上登记工时小于0.001人天  无法登记`);
        return;
      }
      const curworkIssue = this.timeTracker.getworkingIssue();
      if (curworkIssue.id === key && curworkIssue.isWorking) {
        this.timeTracker.stopTracking();
      }
      const { startTimestamp, totalDuration, lastActivity } = selectIssue;
      const userId = (this.context.globalState.get("userInfo") as UserInfo).id;

      const response = await this.request.post("/issuePoint/add", {
        issueKey: key,
        point: (totalDuration / (24 * 3600 * 1000)).toFixed(3),
        userId: userId,
        fromTime: startTimestamp.valueOf(),
        toTime: lastActivity.valueOf(),
        type: 1,
        containRest: 0,
      });
      if (response.status === 200 && response.data.code === 200) {
        this.timeTracker.clearWorkData(key);
        this.updateFrontendWorkLoad();
        vscode.window.showInformationMessage(`Issue ${key} 工时上报成功`);
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`上报失败: ${error.message}`);
    }
  }

  public updateFrontendWorkLoad() {
    if (!this.view) {
      return;
    }
    this.view.webview.postMessage({
      command: "timerUpdate",
      workloadData: this.timeTracker.getDurationData(),
      workIssue: this.timeTracker.getworkingIssue(),
    });
  }
  public dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
