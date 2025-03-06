import * as vscode from "vscode";
import { WorkingIssueData } from "../workload/TimeTracker";

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    // 创建状态栏项（右对齐，优先级100）
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.updateStatusBar(
      context.globalState.get<WorkingIssueData | undefined>("workingIssue") || {
        id: "",
        isWorking: false,
      }
    );
    this.statusBarItem.show();
    context.subscriptions.push(this.statusBarItem);
  }

  public updateStatusBar({ id, isWorking }: WorkingIssueData) {
    this.statusBarItem.text = !id
      ? "尚未指定工作Issue"
      : `$(issues) Issue: ${id} | 状态: ${isWorking ? "工作中" : "空闲"}`;
    this.statusBarItem.command = "workbench.view.extension.idev-explorer";
  }
}
