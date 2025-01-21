import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import "./App.css";

function App() {
  function handleLogin() {
    vscode.postMessage({
      command: "login",
    });
  }

  function handleClick() {
    console.log("testclick");
  }

  return (
    <main>
      <h1>您尚未登录</h1>
      <VSCodeButton onClick={handleClick}>测试登录</VSCodeButton>
      <VSCodeButton onClick={handleLogin}>点此登录</VSCodeButton>
    </main>
  );
}

export default App;
