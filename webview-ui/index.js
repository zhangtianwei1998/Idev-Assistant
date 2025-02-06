const vsCodeApi = acquireVsCodeApi();

let webviewData = { issueList: [], userInfo: {} };
let dataProxy = new Proxy(webviewData, {
  set(target, property, value) {
    target[property] = value;
    if (property === "issueList") {
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
    case "needLogin":
      vsCodeApi.postMessage({
        command: "login",
      });
    case "userInfo":
      dataProxy.userInfo = data.data;
      break;
    case "issueList":
      dataProxy.issueList = data.data; // Add new items
      break;
  }
});

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

function lightenDarkenColor(col, amt) {
  let usePound = false;
  if (col[0] === "#") {
    col = col.slice(1);
    usePound = true;
  }

  let num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  let b = ((num >> 8) & 0x00ff) + amt;
  let g = (num & 0x0000ff) + amt;

  r = Math.min(255, Math.max(0, r));
  b = Math.min(255, Math.max(0, b));
  g = Math.min(255, Math.max(0, g));

  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, "0");
}

function getColorsFromStr(str) {
  const baseColor = stringToColor(str);
  const backgroundColor = lightenDarkenColor(baseColor, 60); // Lighter
  const textColor = lightenDarkenColor(baseColor, -60); // Darker
  return { backgroundColor, textColor };
}

function getIconId(iconId) {
  const id = iconId ? iconId + "" : 0;
  return id ? (Number(id) < 10 ? 0 + id : id) : 0;
}

// Define the custom element
class IssueList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const container = document.createElement("div");
    webviewData.issueList.forEach((item) => {
      const issueElement = document.createElement("issue-item");
      issueElement.setAttribute("icon-id", item.iconId);
      issueElement.setAttribute("issue-key", item.key);
      issueElement.setAttribute("title", item.title);
      issueElement.setAttribute("branch-list", JSON.stringify(item.branchList));
      container.appendChild(issueElement);
    });
    this.shadowRoot.appendChild(container);
  }
}

// Define the issue-item custom element
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
    const issueKey = this.getAttribute("issue-key");
    const title = this.getAttribute("title");
    const branchList = JSON.parse(this.getAttribute("branch-list"));

    const template = document.createElement("template");
    template.innerHTML = `
              <style>
                  .header {
                      display: flex;
                      align-items: center;
                  }
                  .issue-item {
                      border: 1px solid #ccc;
                      padding: 10px;
                      margin: 10px 0;
                  }
                  .icon {
                      border-radius: 2px;
                      width: 14px;
                      height: 14px;
                      display: inline-block;
                      background-color: #eee;
                      margin-right: 5px;
                  }
                  .branches {
                      margin-top: 10px;
                  }
                  .title {
                      font-weight: bold;
                      margin-bottom: 5px;
                  }
                  .branchesContainer {
                      display: flex;
                      flex-wrap: wrap;
                  }
                  .branchItem {
                      border-radius: 5px;
                      padding: 5px;
                      margin: 0 5px 5px 0;
                  }
              </style>
              <div class="issue-item">
                  <div class="header" >
                  <img class="icon" src="${window.iconPrefix}/issueType/${getIconId(
      iconId
    )}.svg"  id="${iconId}"></object>
                  <div class="key"> ${issueKey}</div>
                  </div>
                  <div class="title">${title}</div>
                  <div class="branchesContainer">
                      ${branchList
                        .map((branch) => {
                          const { backgroundColor, textColor } = getColorsFromStr(branch);
                          return `<div class="branchItem" style="background:${backgroundColor} ; color:${textColor}">${branch}</div>`;
                        })
                        .join("")}
                  </div>
              </div>
          `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define("issue-list", IssueList);
customElements.define("issue-item", IssueItem);
