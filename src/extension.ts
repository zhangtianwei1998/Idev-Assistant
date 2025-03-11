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
  const timeTracker = new TimeTracker(context, statusBarManager, 30000);
  const idevProvider = new IdevProvider(context, timeTracker);

  context.subscriptions.push(
    statusBarManager,
    timeTracker,
    idevProvider,
    vscode.window.registerWebviewViewProvider(IdevProvider.viewType, idevProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
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

  let tokendisposable = vscode.commands.registerCommand("extension.idevLogout", function () {
    // 清除 idevToken
    context.globalState.update("idevToken", undefined);
    timeTracker.clearWorkData();
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

  // let swithcDisposable = vscode.commands.registerCommand("extension.setWorkloadMode", async () => {
  //   const modes = [
  //     { label: "精确模式", value: "exact" },
  //     { label: "模糊模式", value: "fuzzy" },
  //   ];

  //   const selected = await vscode.window.showQuickPick(modes, {
  //     placeHolder: "请选择工作模式",
  //     ignoreFocusOut: true,
  //   });

  //   if (selected) {
  //     await context.globalState.update("workloadMode", selected.value);
  //     vscode.window.showInformationMessage(`工时统计模式已切换至${selected.label}`);
  //   }
  // });

  // context.subscriptions.push(swithcDisposable);
}
