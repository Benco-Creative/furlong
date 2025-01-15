import { useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowUp, FileText } from "lucide-react";
import { PiChatEditor } from "@plane/editor";
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/ui";
import { cn } from "@plane/utils";
import { useUser } from "@/hooks/store";
import { IssueIdentifier } from "@/plane-web/components/issues";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";

import { IFormattedValue, IItem } from "@/plane-web/types";
import { FocusFilter } from "./focus-filter";

type TEditCommands = {
  getHTML: () => string;
  clear: () => void;
};
type TProps = {
  isFullScreen: boolean;
  className?: string;
  onSubmit?: () => void;
  activeChatId?: string;
};

export const InputBox = (props: TProps) => {
  const { isFullScreen, className, onSubmit, activeChatId } = props;
  // store hooks
  const { getAnswer, searchCallback, isPiTyping } = usePiChat();
  const { data: currentUser } = useUser();
  const { workspaceSlug } = useParams();
  // states
  const editorCommands = useRef<TEditCommands | null>(null);
  const setEditorCommands = (command: TEditCommands) => {
    editorCommands.current = command;
  };
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (!currentUser) return;
      e?.preventDefault();
      const query = editorCommands.current?.getHTML();
      if (!query) return;
      getAnswer(query, currentUser?.id);
      editorCommands.current?.clear();
      onSubmit?.();
    },
    [currentUser, editorCommands, getAnswer, onSubmit, activeChatId]
  );

  const getMentionSuggestions = async (query: string) => {
    const response = await searchCallback(workspaceSlug.toString(), query);
    return formatSearchQuery(response);
  };

  const getIcon = (type: string, item: Partial<IItem>) => {
    switch (type) {
      case "issue":
        return (
          <IssueIdentifier
            issueTypeId={item.type_id}
            projectId={item.project_id || ""}
            projectIdentifier={item.project__identifier || ""}
            issueSequenceId={item.sequence_id || ""}
            textContainerClassName="text-custom-sidebar-text-400 text-xs whitespace-nowrap"
          />
        );
      case "cycle":
        return <ContrastIcon className="w-4 h-4" />;
      case "module":
        return <DiceIcon className="w-4 h-4" />;
      case "page":
        return <FileText className="w-4 h-4" />;
      default:
        return <LayersIcon className="w-4 h-4" />;
    }
  };

  const formatSearchQuery = (data: Partial<IFormattedValue>): IFormattedValue => {
    const parsedResponse: IFormattedValue = {
      cycle: [],
      module: [],
      page: [],
      issue: [],
    };
    Object.keys(data).forEach((type) => {
      parsedResponse[type] = data[type]?.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.name,
        subTitle: type === "issue" ? `${item.project__identifier}-${item.sequence_id}` : undefined,
        icon: getIcon(type, item),
      }));
    });
    return parsedResponse;
  };

  return (
    <form className={className}>
      <div className="bg-custom-background-100 w-full rounded-[28px] p-2 flex gap-3 shadow-sm border-[4px] border-pi-100">
        {/* Focus */}
        <FocusFilter />
        {/* Input Box */}
        <PiChatEditor
          setEditorCommand={(command) => {
            setEditorCommands({ ...command });
          }}
          handleSubmit={handleSubmit}
          mentionSuggestions={(query: string) => getMentionSuggestions(query)}
        />
        {/* Submit button */}
        <button
          className={cn("p-2 my-auto mb-0 rounded-full bg-pi-700 text-white", {
            "bg-pi-700/10 cursor-not-allowed": isPiTyping,
          })}
          type="submit"
          onClick={handleSubmit}
          disabled={isPiTyping}
        >
          <ArrowUp size={20} />
        </button>
      </div>
      <div className="text-xs text-custom-text-350 mt-2 text-center">
        Pi can make mistakes, please double-check responses.
      </div>
    </form>
  );
};
