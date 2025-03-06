import * as vscode from "vscode";
export function extractTokenFromUri(uri: vscode.Uri): string | null {
  const query = new URLSearchParams(uri.query);
  return query.get("token");
}
