import { commands, ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
import { IdevProvider } from "./panels/IdevProvider";

export function activate(context: ExtensionContext) {
  // Create the show hello world command
  const showHelloWorldCommand = commands.registerCommand("hello-world.showHelloWorld", () => {
    HelloWorldPanel.render(context.extensionUri);
  });

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand);

  const provider = new IdevProvider(context);

  context.subscriptions.push(vscode.window.registerWebviewViewProvider("idev-assistant", provider));

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri(uri: vscode.Uri) {
        console.log("testuri", uri);
        if (uri.path === "/handleLoginCallback") {
          const token = extractTokenFromUri(uri);
          if (token) {
            context.globalState.update("idevToken", token);
            vscode.window.showInformationMessage("Login successful!");
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
