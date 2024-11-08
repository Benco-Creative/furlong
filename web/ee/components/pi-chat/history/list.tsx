"use-client";

import { useParams } from "next/navigation";
// ui
import { PiChatEditor } from "@plane/editor";
import { ControlLink } from "@plane/ui";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane-web
import { TUserThreads } from "@/plane-web/types";
// local-components
import { groupThreadsByDate } from "./helper";

type TProps = {
  userThreads: TUserThreads[];
  initPiChat: (chat_id?: string) => void;
};
const HistoryList = (props: TProps) => {
  const { userThreads, initPiChat } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();

  // group threads by date
  const groupedThreads: Record<string, TUserThreads[]> = groupThreadsByDate(userThreads);

  const handleThreadClick = (chat_id: string) => {
    router.push(`?chat_id=${chat_id}`);
    initPiChat(chat_id);
  };

  return (
    <div className="flex flex-col gap-4 space-y-2 overflow-hidden overflow-y-auto">
      {Object.entries(groupedThreads).map(([key, threads]) => (
        <div key={key} className="flex flex-col gap-1">
          <h2 className="text-xs text-custom-text-400 font-medium capitalize">
            {["today", "yesterday"].includes(key) ? key : renderFormattedDate(key)}
          </h2>

          <div className="flex flex-col space-y-2">
            {threads && threads.length > 0 ? (
              threads.map((thread) => (
                <ControlLink
                  key={thread.chat_id}
                  href={`/${workspaceSlug}/pi-chat?chat_id=${thread.chat_id}`}
                  onClick={() => handleThreadClick(thread.chat_id)}
                  className="p-2 rounded-lg hover:text-custom-text-200 hover:bg-custom-background-90"
                >
                  <PiChatEditor
                    editable={false}
                    content={thread.title}
                    editorClass="!font-medium !text-sm !text-custom-text-300 !text-left !truncate !pointer"
                  />
                </ControlLink>
              ))
            ) : (
              <div className="text-xs text-custom-text-400">No threads available</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
export default HistoryList;
