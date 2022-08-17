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
    vscode.commands.registerCommand("yac.clear", () => saveHistory(context, []))
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

export function deactivate() {}

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

interface Item {
  text: string;
  createdAt: number;
}

function getHistory(context: vscode.ExtensionContext): Item[] {
  return context.workspaceState.get<Item[]>("history", []);
}

async function saveHistory(
  context: vscode.ExtensionContext,
  history: Item[]
): Promise<void> {
  await context.workspaceState.update("history", history);
}

async function copy(context: vscode.ExtensionContext): Promise<void> {
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

async function paste(context: vscode.ExtensionContext) {
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

async function pickAndPaste(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (editor == null) {
    return;
  }
  const history = getHistory(context);

  const items = history
    .map<vscode.QuickPickItem[]>((e, i) => [
      {
        label: new Date(e.createdAt).toLocaleString(),
        kind: vscode.QuickPickItemKind.Separator,
      },
      {
        label: i.toString(),
        detail: e.text,
      },
    ])
    .flat();
  const result = await vscode.window.showQuickPick(items, {
    title: "YAC: Paste from hitory",
    matchOnDescription: true,
    matchOnDetail: true,
    placeHolder: "Filter",
  });
  if (result == null) {
    return;
  }

  await editor.edit((builder) =>
    editor.selections.forEach((sel) => builder.replace(sel, result.detail!))
  );
}
