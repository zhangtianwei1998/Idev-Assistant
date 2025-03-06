import { commands, ExtensionContext } from "vscode";
import * as vscode from "vscode";

import { IdevProvider } from "./panels/IdevProvider";
import { extractTokenFromUri } from "./utilities/extractTokenFromUri";
import { StatusBarManager } from "./statusBar";
import { TimeTracker } from "./workload/TimeTracker";

export function activate(context: ExtensionContext) {
  const statusBarManager = new StatusBarManager(context);
  const timeTracker = new TimeTracker(context, statusBarManager, 10000);

  const provider = new IdevProvider(context, timeTracker);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(IdevProvider.viewType, provider)
  );

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri(uri: vscode.Uri) {
        if (uri.path === "/handleLoginCallback") {
          const token = extractTokenFromUri(uri);
          if (token) {
            context.globalState.update("idevToken", token);
            provider.getBasicData();
          }
        }
      },
    })
  );

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  let tokendisposable = vscode.commands.registerCommand("extension.idevLogout", function () {
    // 清除 idevToken
    context.globalState.update("idevToken", undefined);
    vscode.window.showInformationMessage("已退出登录");
  });

  context.subscriptions.push(tokendisposable);

  let workloadDisposable = vscode.commands.registerCommand("extension.clearWorkload", function () {
    // 清除 idevToken
    context.globalState.update("workLoadData", undefined);
    vscode.window.showInformationMessage("工作量数据已全部清除");
  });

  context.subscriptions.push(workloadDisposable);
}
