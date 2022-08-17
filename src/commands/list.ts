import * as vscode from "vscode";
import { getHistory, Item, saveHistory } from "../common";

export async function list(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (editor == null) {
    return;
  }
  const history = getHistory(context);
  const result = await showList(history, {
    onClearAll: () => saveHistory(context, []),
    onRemoveItem: (e) =>
      saveHistory(
        context,
        history.filter((a) => a.text !== e.text)
      ),
  });
  if (result != null) {
    await editor.edit((builder) =>
      editor.selections.forEach((sel) => builder.replace(sel, result.text))
    );
  }
}

function buildPickItems(history: Item[]): vscode.QuickPickItem[] {
  return history
    .map<vscode.QuickPickItem[]>((e, i) => [
      {
        label: new Date(e.createdAt).toLocaleString(),
        kind: vscode.QuickPickItemKind.Separator,
      },
      {
        label: i.toString(),
        detail: e.text,
        buttons: [
          {
            iconPath: new vscode.ThemeIcon("trash"),
            tooltip: "Remove",
          },
        ],
      },
    ])
    .flat();
}

function showList(
  history: Item[],
  {
    onClearAll,
    onRemoveItem,
  }: {
    onClearAll: () => void;
    onRemoveItem: (item: Item) => void;
  }
): Promise<Item | undefined> {
  const items = buildPickItems(history);
  const q = vscode.window.createQuickPick();
  const o = vscode.window.createOutputChannel("YAC: Preview");
  q.items = items;
  q.buttons = [
    {
      iconPath: new vscode.ThemeIcon("trash"),
      tooltip: "Clear all",
    },
  ];
  q.matchOnDescription = true;
  q.matchOnDetail = true;
  q.canSelectMany = false;
  q.title = "YAC: Clipboard History";
  q.placeholder = "Select to Paste. Esc to Cancel.";

  return new Promise((resolve) => {
    q.onDidChangeActive((e) => o.replace(e[0].detail ?? ""));
    q.onDidAccept(() => {
      resolve(
        q.activeItems.length === 0
          ? undefined
          : history.find((e) => e.text === q.activeItems[0].detail)
      );
      q.hide();
      q.dispose();
    });
    q.onDidHide(() => {
      resolve(undefined);
      o.hide();
      o.dispose();
    });
    q.onDidTriggerButton((b) => {
      q.hide();
      q.dispose();
      onClearAll();
    });
    q.onDidTriggerItemButton((b) => {
      const h = history.find((e) => e.text === b.item.detail);
      if (h != null) {
        q.items = q.items.filter((i) => i.detail !== b.item.detail);
        onRemoveItem(h);
      }
    });

    o.show(true);
    q.show();
  });
}
