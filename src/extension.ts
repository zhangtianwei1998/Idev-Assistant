import { ExtensionContext } from "vscode";
import * as vscode from "vscode";

import { IdevProvider } from "./panels/IdevProvider";
import { StatusBarManager } from "./statusBar";
import { TimeTracker } from "./workload/TimeTracker";
import { GitBranchWatcher } from "./gitListener";
import { getIssueKeyFromBranch } from "./utilities/judgeBranchMatch";
import { IssueData } from "./types/frontendtype";
import { exactThreshold, fuzzyThreshold } from "./constant";
import { extractTokenFromUri } from "./utilities/extractTokenFromUri";

export function activate(context: ExtensionContext) {
  const statusBarManager = new StatusBarManager(context);
  const timeTracker = new TimeTracker(context, statusBarManager);
  const idevProvider = new IdevProvider(context, timeTracker);
  context.globalState.setKeysForSync(["workLoadData"]);

  const viewProviderDisposable = vscode.window.registerWebviewViewProvider(
    IdevProvider.viewType,
    idevProvider,
    { webviewOptions: { retainContextWhenHidden: true } }
  );

  const watcher = new GitBranchWatcher([
    (current: string) => {
      const issueKey = getIssueKeyFromBranch(
        current,
        (context.globalState.get<IssueData[]>("issueList") || []).map((item) => item.key)
      );
      if (!issueKey) {
        return;
      }
      timeTracker.startTracking(issueKey);
      vscode.window.showInformationMessage(`${issueKey} 工时统计开始`);
    },
  ]);

  const refreshCommandDisposable = vscode.commands.registerCommand("idev.refresh", () => {
    idevProvider.refresh();
  });

  const loginCallbackDisposabel = vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      if (uri.path === "/handleLoginCallback") {
        const token = extractTokenFromUri(uri);
        if (token) {
          context.globalState.update("idevToken", token);
          idevProvider.getBasicData();
        }
      }
    },
  });

  const tokenDisposable = vscode.commands.registerCommand("extension.idevLogout", () => {
    context.globalState.update("idevToken", undefined);
    timeTracker.clearWorkData();
    vscode.window.showInformationMessage("已退出登录");
    idevProvider.refresh();
  });

  const workloadDisposable = vscode.commands.registerCommand("extension.clearWorkload", () => {
    vscode.window.showInformationMessage("工作量数据已全部清除");
    timeTracker.clearWorkData();
  });

  let switchDisposable = vscode.commands.registerCommand("extension.setWorkloadMode", async () => {
    const modes = [
      { label: "精确模式", value: "exact", time: exactThreshold },
      { label: "模糊模式", value: "fuzzy", time: fuzzyThreshold },
    ];

    const selected = await vscode.window.showQuickPick(modes, {
      placeHolder: "请选择工作模式",
      ignoreFocusOut: true,
    });

    if (selected) {
      await context.globalState.update("idleThreshold", selected.time);
      vscode.window.showInformationMessage(`工时统计模式已切换至${selected.label}`);
    }
  });

  context.subscriptions.push(
    statusBarManager,
    timeTracker,
    idevProvider,
    watcher,
    viewProviderDisposable,
    refreshCommandDisposable,
    loginCallbackDisposabel,
    tokenDisposable,
    workloadDisposable,
    switchDisposable
  );
}
