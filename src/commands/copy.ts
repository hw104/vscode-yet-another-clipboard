import * as vscode from "vscode";
import { getHistory, getLineText, getSelectedText, Item, saveHistory } from "../common";

export async function copy(context: vscode.ExtensionContext): Promise<void> {
  const doc = vscode.window.activeTextEditor?.document;
  const selection = vscode.window.activeTextEditor?.selection;
  if (doc == null || selection == null) {
    return;
  }

  const text = getSelectedText(doc, selection) || getLineText(doc, selection);
  if (text.length === 0) {
    return;
  }

  const prevHitory = getHistory(context);
  const bufferSize = vscode.workspace
    .getConfiguration("yac")
    .get<number>("bufferSize", 10);
  const newHitory: Item[] = [
    {
      text,
      createdAt: Date.now(),
    },
    ...prevHitory.filter((e) => e.text !== text),
  ].slice(0, bufferSize);

  await saveHistory(context, newHitory);
}