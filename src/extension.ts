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

  vscode.window.registerWebviewViewProvider("idev-assistant", new IdevProvider(context));
}
