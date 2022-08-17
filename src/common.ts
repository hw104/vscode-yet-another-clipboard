import * as vscode from "vscode";

export function getSelectedText(
  doc: vscode.TextDocument,
  selection: vscode.Selection
): string {
  return doc.getText(new vscode.Range(selection.start, selection.end));
}

export function getLineText(
  doc: vscode.TextDocument,
  selection: vscode.Selection
): string {
  return doc.getText(doc.lineAt(selection.start.line).rangeIncludingLineBreak);
}

export interface Item {
  text: string;
  createdAt: number;
}

export function getHistory(context: vscode.ExtensionContext): Item[] {
  return context.workspaceState.get<Item[]>("history", []);
}

export async function saveHistory(
  context: vscode.ExtensionContext,
  history: Item[]
): Promise<void> {
  await context.workspaceState.update("history", history);
}
