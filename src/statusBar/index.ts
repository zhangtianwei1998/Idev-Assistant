import * as vscode from "vscode";
import { WorkingIssueData } from "../workload/TimeTracker";

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    // 创建状态栏项（右对齐，优先级100）
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.updateStatusBar(
      context.globalState.get<WorkingIssueData | undefined>("workingIssue") || {
        id: "",
        isWorking: false,
      }
    );
    this.statusBarItem.show();
    this.disposables.push(this.statusBarItem);
  }

  public updateStatusBar({ id, isWorking }: WorkingIssueData) {
    this.statusBarItem.text = !id
      ? "尚未指定工作Issue"
      : `$(issues) Issue: ${id} | 状态: ${isWorking ? "工作中" : "空闲"}`;
    this.statusBarItem.command = "workbench.view.extension.idev-explorer";
  }

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
