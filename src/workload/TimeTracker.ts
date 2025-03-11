import * as vscode from "vscode";
import * as dayjs from "dayjs";
import * as lodash from "lodash";
import { getDurationString } from "../utilities/getduration";
import { StatusBarManager } from "../statusBar";

const { throttle } = lodash;

type TrackingState = {
  startTimestamp: dayjs.Dayjs;
  totalDuration: number;
  lastActivity: dayjs.Dayjs;
};

export type WorkdataType = Record<string, TrackingState>;

export type WorkingIssueData = {
  id: string;
  isWorking: boolean;
};

const getInitWorkLoad = () => ({
  startTimestamp: dayjs(),
  totalDuration: 0,
  lastActivity: dayjs(),
});

export class TimeTracker {
  private workingIssue: WorkingIssueData = { id: "", isWorking: false };
  private workLoadData: WorkdataType = {};
  private statusBarManager: StatusBarManager;
  private readonly idleThreshold: number;
  private activityTimer?: NodeJS.Timeout;
  private context: vscode.ExtensionContext;
  private disposables: vscode.Disposable[] = [];
  private fallback?: () => void;

  constructor(
    context: vscode.ExtensionContext,
    statusBarManager: StatusBarManager,
    idleThreshold?: number
  ) {
    this.context = context;
    this.idleThreshold = idleThreshold ?? 300000;
    this.statusBarManager = statusBarManager;
    this.workingIssue = context.globalState.get<WorkingIssueData | undefined>("workingIssue") || {
      id: "",
      isWorking: false,
    };
    this.workLoadData = context.globalState.get<WorkdataType>("workLoadData") || {};
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(throttle(() => this.recordActivity(), 300)),
      vscode.window.onDidChangeTextEditorSelection(throttle(() => this.recordActivity(), 300)),
      vscode.window.onDidChangeWindowState((e) => {
        if (e.focused) {
          this.recordActivity();
        }
      })
    );
  }

  public addFallback(fallback: () => void) {
    this.fallback = fallback;
  }

  private updateWorkingIssue({ id, isWorking }: { id?: string; isWorking?: boolean }) {
    this.workingIssue = {
      id: id === undefined ? this.workingIssue.id : id,
      isWorking: isWorking === undefined ? this.workingIssue.isWorking : isWorking,
    };

    this.statusBarManager.updateStatusBar(this.workingIssue);
  }

  // 开始追踪某个issue
  public startTracking(issueId: string) {
    //分支匹配上正在工作的issue，相当与激活一次
    if (issueId === this.workingIssue.id && this.workLoadData[this.workingIssue.id]) {
      this.recordActivity();
      return;
    }
    this.updateWorkingIssue({ id: issueId, isWorking: true });

    this.workLoadData[this.workingIssue.id] = this.workLoadData[this.workingIssue.id]
      ? { ...this.workLoadData[this.workingIssue.id], lastActivity: dayjs() }
      : getInitWorkLoad();
    this.stopInternalTracking();
    this.startInternalTracking();
    this.saveState();
    if (this.fallback) {
      this.fallback();
    }
  }

  public stopTracking() {
    this.updateWorkingIssue({ isWorking: false });
    this.stopInternalTracking();
    this.saveState();
    if (this.fallback) {
      this.fallback();
    }
  }

  private updateduration() {
    const curIssue = this.workLoadData[this.workingIssue.id];
    const idleTime = dayjs().diff(curIssue.lastActivity);
    if (idleTime < this.idleThreshold) {
      curIssue.totalDuration += 1000;
    } else {
      this.stopTracking();
    }
    // this.saveState();
  }

  private startInternalTracking() {
    if (!this.activityTimer) {
      this.activityTimer = setInterval(() => {
        this.updateduration();
      }, 1000);

      this.disposables.push({
        dispose: () => {
          this.stopInternalTracking();
        },
      });
    }
  }

  private stopInternalTracking() {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = undefined;
    }
  }

  private recordActivity() {
    if (!this.workingIssue.id) {
      return;
    }
    //上报完直接再激活
    if (!this.workLoadData[this.workingIssue.id]) {
      this.workLoadData[this.workingIssue.id] = getInitWorkLoad();
    }
    this.updateWorkingIssue({ isWorking: true });
    const curIssue = this.workLoadData[this.workingIssue.id];
    curIssue.lastActivity = dayjs();
    if (!this.activityTimer) {
      this.activityTimer = setInterval(() => {
        this.updateduration();
      }, 1000);
    }
    this.saveState();
    if (this.fallback) {
      this.fallback();
    }
  }

  private saveState() {
    this.context.globalState.update("workLoadData", this.workLoadData);
    this.context.globalState.update("workingIssue", this.workingIssue);
  }

  public getworkdata(): WorkdataType {
    return this.workLoadData;
  }

  public getworkingIssue(): WorkingIssueData {
    return this.workingIssue;
  }

  public getDurationData(): Record<string, string> {
    const data: Record<string, string> = {};
    for (const key in this.workLoadData) {
      data[key] = getDurationString(this.workLoadData[key].totalDuration);
    }
    return data;
  }

  public clearWorkData(issueKey?: string) {
    if (issueKey) {
      delete this.workLoadData[issueKey];
    } else {
      this.workingIssue = { id: "", isWorking: false };
      this.workLoadData = {};
    }
    this.saveState();
    this.statusBarManager.updateStatusBar(this.workingIssue);
  }

  public dispose() {
    this.stopInternalTracking();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
