import * as vscode from "vscode";
import { getHistory, getSelectedText } from "../common";

export async function paste(context: vscode.ExtensionContext) {
  const history = getHistory(context);
  if (history.length === 0) {
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (editor == null) {
    return;
  }

  const doc = editor.document;
  const selection = editor.selection;
  const selected = getSelectedText(doc, selection);
  const text =
    history[
      selected.length === 0
        ? 0
        : (history.findIndex((s) => s.text === selected) + 1) % history.length
    ];

  await editor.edit((builder) =>
    editor.selections.forEach((sel) => builder.replace(sel, text.text))
  );
}
