import * as vscode from "vscode";
import * as dayjs from "dayjs";
import * as duration from "dayjs/plugin/duration";
import { getDurationString } from "../utilities/getduration";
import { StatusBarManager } from "../statusBar";

type TrackingState = {
  startTimestamp: dayjs.Dayjs;
  totalDuration: number;
  lastActivity: dayjs.Dayjs;
};

type WorkdataList = Record<string, TrackingState>;

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
  private workLoadData: WorkdataList = {};
  private statusBarManager: StatusBarManager;
  private readonly idleThreshold: number;
  private activityTimer?: NodeJS.Timeout;
  private context: vscode.ExtensionContext;

  constructor(
    context: vscode.ExtensionContext,
    statusBarManager: StatusBarManager,
    idleThreshold?: number
  ) {
    this.context = context;
    this.idleThreshold = idleThreshold ?? 300000; // 默认5分钟
    this.statusBarManager = statusBarManager;
    this.workingIssue = context.globalState.get<WorkingIssueData | undefined>("workingIssue") || {
      id: "",
      isWorking: false,
    };
    this.workLoadData = context.globalState.get<WorkdataList>("workLoadData") || {};

    // 注册活动检测
    vscode.workspace.onDidChangeTextDocument(() => this.recordActivity());
    vscode.window.onDidChangeWindowState((e) => {
      if (e.focused) {
        this.recordActivity();
      }
    });
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
    this.updateWorkingIssue({ id: issueId, isWorking: true });
    this.workLoadData[this.workingIssue.id] = getInitWorkLoad();
    this.stopInternalTracking();
    this.startInternalTracking();
    this.saveState();
  }

  public stopTracking() {
    this.updateWorkingIssue({ isWorking: false });
    this.stopInternalTracking();
    this.saveState();
  }

  private updateduration() {
    const curIssue = this.workLoadData[this.workingIssue.id];
    const idleTime = dayjs().diff(curIssue.lastActivity);
    if (idleTime < this.idleThreshold) {
      curIssue.totalDuration += 1000;
    } else {
      this.stopTracking();
    }
    this.saveState();
  }

  private startInternalTracking() {
    if (!this.activityTimer) {
      this.activityTimer = setInterval(() => {
        this.updateduration();
      }, 1000);
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
    this.updateWorkingIssue({ isWorking: true });
    const curIssue = this.workLoadData[this.workingIssue.id];
    curIssue.lastActivity = dayjs();
    if (!this.activityTimer) {
      this.activityTimer = setInterval(() => {
        this.updateduration();
      }, 1000);
    }
    this.saveState();
  }

  private saveState() {
    this.context.globalState.update("workLoadData", this.workLoadData);
    this.context.globalState.update("workingIssue", this.workingIssue);
  }

  public getworkdata(): WorkdataList {
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
      this.workLoadData = {};
    }
  }
}
