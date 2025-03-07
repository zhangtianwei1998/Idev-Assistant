const vsCodeApi = acquireVsCodeApi();

let webviewData = { issueList: [], userInfo: {}, workLoad: {}, workIssue: {} };
let dataProxy = new Proxy(webviewData, {
  set(target, property, value) {
    target[property] = value;
    if (["issueList", "workLoad", "workIssue"].includes(property)) {
      const issueListElement = document.querySelector("issue-list");
      if (issueListElement) {
        issueListElement.render();
      }
    }
    if (property === "userInfo") {
      const userInfoElement = document.querySelector("user-info");
      if (userInfoElement) {
        userInfoElement.render();
      }
    }
    return true;
  },
});

window.addEventListener("message", (event) => {
  const data = event.data;
  switch (data.command) {
    case "timerUpdate":
      dataProxy.workLoad = data.workloadData;
      dataProxy.workIssue = data.workIssue;
      break;
    case "userInfo":
      dataProxy.userInfo = data.data;
      break;
    case "issueList":
      dataProxy.issueList = data.data; // Add new items
      break;
  }
});

function getIconId(iconId) {
  const id = iconId ? iconId + "" : 0;
  return id ? (Number(id) < 10 ? 0 + id : id) : 0;
}

class IssueList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = "";
    const container = document.createElement("div");
    webviewData.issueList.forEach((item) => {
      const issueElement = document.createElement("issue-item");
      issueElement.setAttribute("issueId", item.id);
      issueElement.setAttribute("icon-id", item.iconId);
      issueElement.setAttribute("issue-key", item.key);
      issueElement.setAttribute("title", item.title);
      issueElement.setAttribute("workload", webviewData.workLoad?.[item.key] || "");
      issueElement.setAttribute("isCurrentIssue", item.key === webviewData.workIssue.id);
      issueElement.setAttribute(
        "isWorking",
        item.key === webviewData.workIssue.id && webviewData.workIssue.isWorking
      );
      container.appendChild(issueElement);
    });
    this.shadowRoot.appendChild(container);
  }
}
class IssueItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const iconId = this.getAttribute("icon-id");
    const issueId = this.getAttribute("issueId");
    const issueKey = this.getAttribute("issue-key");
    const title = this.getAttribute("title");
    const workload = this.getAttribute("workload");
    const isWorking = this.getAttribute("isWorking");
    const isCurrentIssue = this.getAttribute("isCurrentIssue");
    const template = document.createElement("template");
    template.innerHTML = `
              <style>
                  .header {
                      display:flex;
                      align-items: center;
                  }
                  .middle {

                  }
                  .issue-item {
                      border: 1px solid #ccc;
                      padding: 10px;
                      margin: 10px 0;
                      display:flex;
                      justify-content:space-between;
                  }
                  .startwork {
                      width: 25px;
                      height: 25px;
                      margin-right: 5px;
                      cursor: pointer;
                  }
                  .uploadWork{
                     width: 25px;
                      height: 25px;
                      margin-right: 5px;
                      cursor: pointer;
                  }
                  .branches {
                      margin-top: 10px;
                  }
                  .title {
                      font-weight: bold;
                      margin-bottom: 5px;
                  }
                  .right{
                          display: flex;
                          flex-direction: column;
                          align-items: flex-end;
                      }
                  .greenText{
                        color:green;
                  }
              </style>
              <div class="issue-item">
               <div class="left">
                  <div class="header">
                    <img class="icon" src="${window.iconPrefix}/issueType/${getIconId(
      iconId
    )}.svg"  id="${iconId}"></img>
                    <div class="key"> ${issueKey}</div>
                  </div>
                  <div class="middle"> 
                    <div class="title">${title}</div>
                   </div>
               </div>
                <div class="right">     
                  <div class="header">
                  <img class="startwork" src="${window.iconPrefix}/operation/${
      isWorking === "true" ? "pause" : "start"
    }.svg"></img>
                    <img class="uploadWork" src="${window.iconPrefix}/operation/upload.svg"></img>
                  </div>
                  <div class="${
                    isCurrentIssue === "true" ? "greenText" : "whiteText"
                  }"">${workload}</div>
                </div>
              </div>
          `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));

    const startButton = this.shadowRoot.querySelector(".startwork");
    startButton.addEventListener("click", () => {
      if (isWorking === "true") {
        vsCodeApi.postMessage({ command: "endwork" });
      } else {
        vsCodeApi.postMessage({ command: "startwork", issueKey: issueKey });
      }
    });

    const uploadButton = this.shadowRoot.querySelector(".uploadWork");
    uploadButton.addEventListener("click", () => {
      vsCodeApi.postMessage({
        command: "uploadWorkload",
        key: issueKey,
      });
    });
  }
}

customElements.define("issue-list", IssueList);
customElements.define("issue-item", IssueItem);
