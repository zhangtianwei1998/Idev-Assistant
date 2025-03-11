import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useEffect, useState } from "react";
import { IssueData, UserInfo, WorkingIssueData } from "./type";
import IssueItem from "./components/IssueItem";

function App() {
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [issueList, setIssueList] = useState<IssueData[]>();
  const [workload, setWorkload] = useState<Record<string, string>>({});
  const [workIssue, setWorkIssue] = useState<WorkingIssueData>();

  // const [issueList, setIssueList] = useState<IssueData[]>([
  //   {
  //     iconId: "11",
  //     key: "NFKT-1492",
  //     title: "清空筛选，导致再次筛选失效",
  //     id: 5418576,
  //   },
  //   {
  //     iconId: "1",
  //     key: "ZTWC-8",
  //     title: "测试vscode插件登记工时",
  //     id: 5415132,
  //   },
  //   {
  //     iconId: "2",
  //     key: "NFKT-1487",
  //     title: "多选下拉组件点击下拉时，光标自动定位到搜索框654654654654654564",
  //     id: 5411313,
  //   },
  //   {
  //     iconId: "1",
  //     key: "NFKT-1465",
  //     title: "自动统计编码时间上报工时vscode插件",
  //     id: 5391055,
  //   },
  //   {
  //     iconId: "2",
  //     key: "NFKT-1357",
  //     title: "支持复制并创建Issue【非clone】",
  //     id: 5324808,
  //   },
  //   {
  //     iconId: "4",
  //     key: "NFKT-1281",
  //     title: "前端-资源工时——资源模块",
  //     id: 5267195,
  //   },
  //   {
  //     iconId: "2",
  //     key: "NFKT-1275",
  //     title: "迭代筛选器兼容小屏幕",
  //     id: 5263079,
  //   },
  //   {
  //     iconId: "4",
  //     key: "NFKT-1270",
  //     title: "前端——Issue人员字段展示离职人员标识",
  //     id: 5257664,
  //   },
  //   {
  //     iconId: "1",
  //     key: "NFKT-1117",
  //     title: "时间参数改为时间戳",
  //     id: 5189117,
  //   },
  //   {
  //     iconId: "2",
  //     key: "NFKT-1103",
  //     title: "字段-需求评审结果支持在列表中展示",
  //     id: 5187692,
  //   },
  // ]);
  // const [workload, setWorkload] = useState<Record<string, string>>({
  //   "NFKT-1281": "00:00",
  //   "NFKT-1465": "02:01",
  // });
  // const [workIssue, setWorkIssue] = useState<WorkingIssueData>({
  //   id: "NFKT-1465",
  //   isWorking: true,
  // });

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const data = event.data;
      switch (data.command) {
        case "timerUpdate":
          setWorkload(data.workloadData);
          setWorkIssue(data.workIssue);
          break;
        case "userInfo":
          setUserInfo(data.data);
          break;
        case "issueList":
          setIssueList(data.data);
          break;
      }
    };
    window.addEventListener("message", messageHandler);
  }, []);

  console.log("testlist", { issueList, workload, workIssue });

  return (
    <main>
      {issueList
        ? issueList.map((item) => (
            <IssueItem
              issueData={item}
              workingIssue={workIssue}
              workdata={workload ? workload?.[item.key] : ""}></IssueItem>
          ))
        : null}
    </main>
  );
}

export default App;
