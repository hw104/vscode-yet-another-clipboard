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

  let befores: vscode.Selection[] = [];
  await editor.edit((builder) => {
    for (const sel of editor.selections) {
      befores.push(new vscode.Selection(sel.anchor, sel.active));
      builder.replace(sel, text.text);
    }
  });
  editor.selections = befores.map(
    (b, i) => new vscode.Selection(b.start, editor.selections[i].end)
  );
}
