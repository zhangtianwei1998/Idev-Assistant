import { commands, ExtensionContext } from "vscode";
import * as vscode from "vscode";

import { IdevProvider } from "./panels/IdevProvider";
import { extractTokenFromUri } from "./utilities/extractTokenFromUri";
import { StatusBarManager } from "./statusBar";
import { TimeTracker, WorkdataType } from "./workload/TimeTracker";
import { GitBranchWatcher } from "./gitListener";
import { getIssueKeyFromBranch } from "./utilities/judgeBranchMatch";
import { IssueData } from "./types/frontendtype";

export function activate(context: ExtensionContext) {
  const statusBarManager = new StatusBarManager(context);
  const timeTracker = new TimeTracker(context, statusBarManager, 10000);

  const idevProvider = new IdevProvider(context, timeTracker);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(IdevProvider.viewType, idevProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("idev.refresh", () => {
      idevProvider.refresh();
    })
  );

  const watcher = new GitBranchWatcher();

  const disposable = watcher.onBranchChange((current) => {
    const issueKey = getIssueKeyFromBranch(
      current,
      (context.globalState.get<IssueData[]>("issueList") || []).map((item) => item.key)
    );
    if (!issueKey) {
      return;
    }
    timeTracker.startTracking(issueKey);
  });

  context.subscriptions.push(watcher, disposable);

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri(uri: vscode.Uri) {
        if (uri.path === "/handleLoginCallback") {
          const token = extractTokenFromUri(uri);
          if (token) {
            context.globalState.update("idevToken", token);
            idevProvider.getBasicData();
          }
        }
      },
    })
  );

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  let tokendisposable = vscode.commands.registerCommand("extension.idevLogout", function () {
    // 清除 idevToken
    timeTracker.clearWorkData();
    context.globalState.update("idevToken", undefined);
    vscode.window.showInformationMessage("已退出登录");
    idevProvider.refresh();
  });

  context.subscriptions.push(tokendisposable);

  let workloadDisposable = vscode.commands.registerCommand("extension.clearWorkload", function () {
    context.globalState.update("workLoadData", undefined);
    vscode.window.showInformationMessage("工作量数据已全部清除");
    timeTracker.clearWorkData();
  });

  context.subscriptions.push(workloadDisposable);
}
