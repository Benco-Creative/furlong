import Placeholder from "@tiptap/extension-placeholder";
// plane imports
import { SlashCommand, DragAndDrop } from "@plane/editor-extensions";
import { UploadImage, ISlashCommandItem } from "@plane/editor-core";
// local
import { IssueWidgetExtension } from "src/ui/extensions/widgets/issue-embed-widget";
import { IssueSuggestions } from "src/ui/extensions/widgets/issue-embed-suggestion-list";
import { IIssueEmbedConfig } from "src/ui/extensions/widgets/issue-embed-widget/types";
// ui
import { LayersIcon } from "@plane/ui";

export const DocumentEditorExtensions = (
  uploadFile: UploadImage,
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void,
  issueEmbedConfig?: IIssueEmbedConfig
) => {
  const additionalOptions: ISlashCommandItem[] = [
    {
      key: "issue_embed",
      title: "Issue embed",
      description: "Embed an issue from the project.",
      searchTerms: ["issue", "link", "embed"],
      icon: <LayersIcon className="h-3.5 w-3.5" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(
            range,
            "<p class='text-sm bg-gray-300 w-fit pl-3 pr-3 pt-1 pb-1 rounded shadow-sm'>#issue_</p>"
          )
          .run();
      },
    },
  ];

  return [
    SlashCommand(uploadFile, additionalOptions),
    DragAndDrop(setHideDragHandle),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === "heading") {
          return `Heading ${node.attrs.level}`;
        }
        if (node.type.name === "image" || node.type.name === "table") {
          return "";
        }

        return "Press '/' for commands...";
      },
      includeChildren: true,
    }),
    IssueWidgetExtension({ issueEmbedConfig }),
    IssueSuggestions(issueEmbedConfig ? issueEmbedConfig.issues : []),
  ];
};
