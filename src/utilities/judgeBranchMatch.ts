import { WorkdataType } from "../workload/TimeTracker";

export function getIssueKeyFromBranch(
  branchName: string,
  issueKeyList: string[]
): string | undefined {
  console.log("testissueKeyList", issueKeyList);
  return issueKeyList.find((issueKey) => branchName.includes(issueKey));
}
