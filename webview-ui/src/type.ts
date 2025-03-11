import { Dayjs } from "dayjs";

export interface IssueData {
  iconId: number;
  key: string;
  title: string;
  id: number;
}

export interface UserInfo {
  memberId: string;
  memberName: string;
}

export type WorkingIssueData = {
  id: string;
  isWorking: boolean;
};

export type TrackingState = {
  startTimestamp: Dayjs;
  totalDuration: number;
  lastActivity: Dayjs;
};

export type WorkdataType = Record<string, TrackingState>;
