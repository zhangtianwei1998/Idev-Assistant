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
            provider.postdata();
          }
        }
      },
    })
  );

  let disposable = vscode.commands.registerCommand("extension.clearIdevToken", function () {
    // 清除 idevToken
    context.globalState.update("idevToken", undefined);
    vscode.window.showInformationMessage("idevToken has been cleared.");
  });

  context.subscriptions.push(disposable);
}

function extractTokenFromUri(uri: vscode.Uri): string | null {
  const query = new URLSearchParams(uri.query);
  return query.get("token");
}
