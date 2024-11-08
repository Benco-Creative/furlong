import React from "react";
import { BriefcaseIcon, FileText } from "lucide-react";
import { ContrastIcon, DiceIcon, LayersIcon, Loader, PiChatLogo } from "@plane/ui";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { TTemplate } from "@/plane-web/types";

type TSystemPrompt = {
  userId: string | undefined;
  templates: TTemplate[] | undefined;
};
const SystemPrompts = (props: TSystemPrompt) => {
  const { userId, templates } = props;
  // store hooks
  const { startChatWithTemplate } = usePiChat();

  const getIcon = (type: string) => {
    switch (type) {
      case "pages":
        return FileText;
      case "cycles":
        return ContrastIcon;
      case "modules":
        return DiceIcon;
      case "projects":
        return BriefcaseIcon;
      case "issues":
        return LayersIcon;
      default:
        return PiChatLogo;
    }
  };
  return (
    <div className="flex gap-6 max-[755px] flex-wrap m-auto justify-center mt-6">
      {templates && userId ? (
        templates.map((prompt, index) => {
          const promptIcon = getIcon(prompt.type);

          return (
            <div
              key={index}
              className="bg-custom-background-100 rounded-lg flex flex-col w-[250px] p-4 border-none cursor-pointer"
              onClick={() => startChatWithTemplate(prompt, userId)}
            >
              <span>
                {React.createElement(promptIcon, {
                  className:
                    prompt.type === "threads"
                      ? "size-[20px] text-pi-400 fill-current mb-2"
                      : `flex-shrink-0 size-[20px] stroke-[2] text-pi-400 stroke-current mb-2`,
                })}
              </span>
              <span className="text-sm">{prompt.text}</span>
            </div>
          );
        })
      ) : (
        <Loader className="flex flex-wrap m-auto justify-center gap-6">
          <Loader.Item width="250px" height="90px" />
          <Loader.Item width="250px" height="90px" />
          <Loader.Item width="250px" height="90px" />
        </Loader>
      )}
    </div>
  );
};
export default SystemPrompts;
