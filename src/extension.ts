import { commands, ExtensionContext } from "vscode";
import * as vscode from "vscode";

import { IdevProvider } from "./panels/IdevProvider";

export function activate(context: ExtensionContext) {
  const provider = new IdevProvider(context);

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

function extractTokenFromUri(uri: vscode.Uri): string | null {
  const query = new URLSearchParams(uri.query);
  return query.get("token");
}
