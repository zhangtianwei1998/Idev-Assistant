import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useEffect, useState } from "react";
import Layout from "./Layout";

function App() {
  function handleLogin() {
    vscode.postMessage({
      command: "login",
    });
  }

  useEffect(() => {
    const messageHandler = (e: MessageEvent) => {
      const message = e.data;
      switch (message.command) {
        case "idevToken":
          vscode.setState(message.data as string);
          break;
      }
    };
    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  const token = vscode.getState;

  return (
    <main>
      {/* {!token ? (
        <>
          {" "}
          <h1>您尚未登录</h1>
          <VSCodeButton onClick={handleLogin}>点此登录</VSCodeButton>
        </>
      ) : (
        <Layout></Layout>
      )} */}
      <>
        {" "}
        <h1>您尚未登录</h1>
        <VSCodeButton onClick={handleLogin}>点此登录</VSCodeButton>
      </>
    </main>
  );
}

export default App;
