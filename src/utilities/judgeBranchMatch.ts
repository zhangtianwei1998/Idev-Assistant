import { WorkdataType } from "../workload/TimeTracker";

export function getIssueKeyFromBranch(
  branchName: string,
  issueKeyList: string[]
): string | undefined {
  return issueKeyList.find((issueKey) => branchName.includes(issueKey));
}
