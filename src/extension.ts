import * as vscode from "vscode";
import { copy } from "./commands/copy";
import { list } from "./commands/list";
import { paste } from "./commands/paste";
import { saveHistory } from "./common";

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
    vscode.commands.registerCommand("yac.list", () => list(context))
  );
}

export function deactivate() {}
