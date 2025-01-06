import { Node } from "@tiptap/core";
import { inputRules } from "@tiptap/pm/inputrules";
import { keymap } from "@tiptap/pm/keymap";
import {
  ListAttributes,
  IndentListOptions,
  DedentListOptions,
  createListSpec,
  listKeymap,
  listInputRules,
  createWrapInListCommand,
  createIndentListCommand,
  createDedentListCommand,
  createSplitListCommand,
  createListPlugins,
} from "./core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flatListComponent: {
      createList: (attrs: ListAttributes) => ReturnType;
      indentList: (attrs: IndentListOptions) => ReturnType;
      dedentList: (attrs: DedentListOptions) => ReturnType;
      splitList: () => ReturnType;
    };
  }
}

const { attrs, parseDOM, toDOM, content, group, definingForContent, definingAsContext } = createListSpec();
const listKeymapPlugin = keymap(listKeymap);
const listInputRulePlugin = inputRules({ rules: listInputRules });

export const FlatListExtension = Node.create({
  name: "list",
  content,
  group,
  definingForContent,
  definingAsContext,
  selectable: true,
  draggable: true,
  addAttributes() {
    return attrs;
  },
  parseHTML() {
    return parseDOM;
  },
  renderHTML({ node }) {
    return toDOM(node);
  },
  addCommands() {
    return {
      createList:
        (attrs: ListAttributes) =>
        ({ state, view }) => {
          const wrapInList = createWrapInListCommand<ListAttributes>(attrs);
          return wrapInList(state, view.dispatch);
        },
      indentList:
        (attrs: IndentListOptions) =>
        ({ state, view }) => {
          const indentList = createIndentListCommand(attrs);
          return indentList(state, view.dispatch);
        },
      dedentList:
        (attrs: DedentListOptions) =>
        ({ state, view }) => {
          const dedentList = createDedentListCommand(attrs);
          return dedentList(state, view.dispatch);
        },
      splitList:
        () =>
        ({ state, view }) => {
          const splitList = createSplitListCommand();
          return splitList(state, view.dispatch);
        },
    };
  },
  addKeyboardShortcuts(this) {
    return {
      Tab: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        if (editor.isActive(this.name)) {
          const indentList = createIndentListCommand({ from: $from.pos });
          return indentList(editor.state, editor.view.dispatch);
        }
        return false;
      },
      "Shift-Tab": ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        if (editor.isActive(this.name)) {
          const dedentList = createDedentListCommand({ from: $from.pos });
          return dedentList(editor.state, editor.view.dispatch);
        }
        return false;
      },
      Enter: ({ editor }) => {
        if (editor.isActive(this.name)) {
          const splitList = createSplitListCommand();
          const ans = splitList(editor.state, editor.view.dispatch);
          return ans;
        }
        return false;
      },
    };
  },
  addProseMirrorPlugins() {
    return [...createListPlugins({ schema: this.editor.schema }), listKeymapPlugin, listInputRulePlugin];
  },
});
