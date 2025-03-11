import React, { FC, useState, useMemo, useCallback } from "react";
import { IssueData, TrackingState, WorkingIssueData } from "../../type";
import SvgIcon from "../SvgIcon";
import IssueTypeIcon from "../IssueTypeIcon";
import { vscode } from "../../utilities/vscode";
import { VSCodeBadge, VSCodeButton, VSCodeTag } from "@vscode/webview-ui-toolkit/react";
import "./index.css";

type Props = {
  issueData: IssueData;
  workingIssue?: WorkingIssueData;
  workdata?: string;
};

function showPause(key: string, workingIssue?: WorkingIssueData) {
  return !workingIssue ? false : workingIssue.id === key && workingIssue.isWorking;
}

const IssueItem: FC<Props> = (props) => {
  const { issueData, workingIssue, workdata } = props;

  function handleChange() {
    if (showPause(issueData.key, workingIssue)) {
      vscode.postMessage({ command: "endwork", issueKey: issueData.key });
    } else {
      vscode.postMessage({ command: "startwork", issueKey: issueData.key });
    }
  }

  function handleUpload() {
    vscode.postMessage({
      command: "uploadWorkload",
      key: issueData.key,
    });
  }

  return (
    <div className={`issueRoot ${workingIssue?.id === issueData.key ? "activateIssue" : ""}`}>
      <div className="issueheader">
        <div className="headerleft">
          <IssueTypeIcon iconId={issueData.iconId} />
          &nbsp;
          {issueData.key}
        </div>
        <div className="headerRight">
          {showPause(issueData.key, workingIssue) ? (
            <VSCodeButton onClick={handleChange} className="opButton">
              <div className="opiconWrap">
                <SvgIcon iconName={`operation/pause`}></SvgIcon>
              </div>
            </VSCodeButton>
          ) : (
            <VSCodeButton onClick={handleChange}>
              <div className="opiconWrap">
                <SvgIcon iconName={`operation/start`}></SvgIcon>
              </div>
            </VSCodeButton>
          )}

          <VSCodeButton onClick={handleUpload} style={{ marginLeft: 8 }}>
            <div className="opiconWrap">
              <SvgIcon iconName={`operation/upload`}></SvgIcon>{" "}
            </div>
          </VSCodeButton>
        </div>
      </div>
      <div className="issueheader" style={{ marginTop: 4 }}>
        <div className="issuetitle"> {issueData.title}</div>
        {workdata ? <div className="workTag"> {workdata} </div> : null}
      </div>
    </div>
  );
};

export default React.memo(IssueItem);
