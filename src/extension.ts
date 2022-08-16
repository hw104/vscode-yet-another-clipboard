import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("yac.copy", () => {
      copy(context);
      vscode.commands.executeCommand("editor.action.clipboardCopyAction");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("yac.cut", () => {
      copy(context);
      vscode.commands.executeCommand("editor.action.clipboardCutAction");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("yac.clear", () => clear(context))
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("yac.paste", () => paste(context))
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("yac.pickAndPaste", () =>
      pickAndPaste(context)
    )
  );
}

function getSelectedText(
  doc: vscode.TextDocument,
  selection: vscode.Selection
): string {
  return doc.getText(new vscode.Range(selection.start, selection.end));
}

function getLineText(
  doc: vscode.TextDocument,
  selection: vscode.Selection
): string {
  return doc.getText(doc.lineAt(selection.start.line).rangeIncludingLineBreak);
}

function copy(context: vscode.ExtensionContext) {
  console.log("copy");

  const doc = vscode.window.activeTextEditor?.document;
  const selection = vscode.window.activeTextEditor?.selection;
  if (doc == null || selection == null) {
    return;
  }

  const text = getSelectedText(doc, selection) || getLineText(doc, selection);
  if (text.length === 0) {
    return;
  }

  console.log("copyZ", text);

  const prevHitory = context.workspaceState.get<string[]>("history", []);
  const bufferSize = vscode.workspace
    .getConfiguration("yac")
    .get<number>("bufferSize", 10);
  const newHitory = [text, ...prevHitory.filter((e) => e !== text)].slice(
    0,
    bufferSize
  );
  context.workspaceState.update("history", newHitory);
}

function clear(context: vscode.ExtensionContext) {
  context.workspaceState.update("history", []);
}

async function paste(context: vscode.ExtensionContext) {
  console.log("paste");
  const history = context.workspaceState.get<string[]>("history", []);
  if (history.length === 0) {
    return;
  }

  console.log("paste", "1.5");

  const editor = vscode.window.activeTextEditor;
  if (editor == null) {
    return;
  }

  console.log("paste 2");

  const doc = editor.document;
  const selection = editor.selection;
  const selected = getSelectedText(doc, selection);
  const text =
    history[
      selected.length === 0
        ? 0
        : (history.findIndex((s) => s === selected) + 1) % history.length
    ];
  console.log("toPaste", text);

  await editor.edit((builder) =>
    editor.selections.forEach((sel) => builder.replace(sel, text))
  );
}

async function pickAndPaste(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (editor == null) {
    return;
  }
  const history = context.workspaceState.get<string[]>("history", []);

  const text = await vscode.window.showQuickPick(history, {
    title: "YAC: Paste from hitory",
  });
  if (text == null) {
    return;
  }

  await editor.edit((builder) =>
    editor.selections.forEach((sel) => builder.replace(sel, text))
  );
}

// this method is called when  extension is deactivated
export function deactivate() {}
