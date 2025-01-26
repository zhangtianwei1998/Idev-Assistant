import { vscode } from "../utilities/vscode";
import axios from "axios";

console.log("testaxios", vscode.getState());
export const request = axios.create({
  baseURL: "https://idev2-00.fat6.qa.nt.ctripcorp.com/api/",
  headers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    UserToken: vscode.getState() as string,
  },
  timeout: 10000,
});
