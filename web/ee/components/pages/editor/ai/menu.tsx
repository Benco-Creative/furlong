"use client";

import React, { RefObject, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronRight, CornerDownRight, LucideIcon, PencilLine, RefreshCcw, Sparkles } from "lucide-react";
// plane editor
import { EditorRefApi } from "@plane/editor";
// plane ui
import { Tooltip } from "@plane/ui";
// components
import { RichTextReadOnlyEditor } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web constants
import { AI_EDITOR_TASKS } from "@/plane-web/constants/ai";
// services
import { AIService, TTaskPayload } from "@/services/ai.service";
const aiService = new AIService();

type Props = {
  editorRef: RefObject<EditorRefApi>;
  isOpen: boolean;
  onClose: () => void;
};

const MENU_ITEMS: {
  icon: LucideIcon;
  key: AI_EDITOR_TASKS;
  label: string;
}[] = [
  {
    key: AI_EDITOR_TASKS.PARAPHRASE,
    icon: PencilLine,
    label: "Paraphrase",
  },
  {
    key: AI_EDITOR_TASKS.SIMPLIFY,
    icon: PencilLine,
    label: "Simplify",
  },
  {
    key: AI_EDITOR_TASKS.ELABORATE,
    icon: PencilLine,
    label: "Elaborate",
  },
  {
    key: AI_EDITOR_TASKS.SUMMARIZE,
    icon: PencilLine,
    label: "Summarize",
  },
  {
    key: AI_EDITOR_TASKS.GET_TITLE,
    icon: PencilLine,
    label: "Get title",
  },
  // {
  //   key: AI_EDITOR_TASKS.TONE,
  //   icon: PencilLine,
  //   label: "Tone adjustment",
  // },
];

const LOADING_TEXTS: {
  [key in AI_EDITOR_TASKS]: string;
} = {
  [AI_EDITOR_TASKS.PARAPHRASE]: "Pi is paraphrasing",
  [AI_EDITOR_TASKS.SIMPLIFY]: "Pi is simplifying",
  [AI_EDITOR_TASKS.ELABORATE]: "Pi is elaborating",
  [AI_EDITOR_TASKS.SUMMARIZE]: "Pi is summarizing",
  [AI_EDITOR_TASKS.GET_TITLE]: "Pi is getting title",
  [AI_EDITOR_TASKS.TONE]: "Pi is adjusting tone",
};

const TONES_LIST = [
  {
    key: "default",
    label: "Default",
    casual_score: 5,
    formal_score: 5,
  },
  {
    key: "professional",
    label: "💼 Professional",
    casual_score: 0,
    formal_score: 10,
  },
  {
    key: "casual",
    label: "😃 Casual",
    casual_score: 10,
    formal_score: 0,
  },
];

export const EditorAIMenu: React.FC<Props> = (props) => {
  const { editorRef, isOpen, onClose } = props;
  // states
  const [activeTask, setActiveTask] = useState<AI_EDITOR_TASKS | null>(null);
  const [response, setResponse] = useState<string | undefined>(undefined);
  const [isRegenerating, setIsRegenerating] = useState(false);
  // refs
  const responseContainerRef = useRef<HTMLDivElement>(null);
  // params
  const { workspaceSlug } = useParams();
  const handleGenerateResponse = async (payload: TTaskPayload) => {
    if (!workspaceSlug) return;
    await aiService.performEditorTask(workspaceSlug.toString(), payload).then((res) => setResponse(res.response));
  };
  // handle task click
  const handleClick = async (key: AI_EDITOR_TASKS) => {
    const selection = editorRef.current?.getSelectedText();
    if (!selection || activeTask === key) return;
    setActiveTask(key);
    setResponse(undefined);
    setIsRegenerating(false);
    await handleGenerateResponse({
      task: key,
      text_input: selection,
    });
  };
  // handle re-generate response
  const handleRegenerate = async () => {
    const selection = editorRef.current?.getSelectedText();
    if (!selection || !activeTask) return;
    setIsRegenerating(true);
    await handleGenerateResponse({
      task: activeTask,
      text_input: selection,
    })
      .then(() =>
        responseContainerRef.current?.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      )
      .finally(() => setIsRegenerating(false));
  };
  // handle re-generate response
  const handleToneChange = async (key: string) => {
    const selectedTone = TONES_LIST.find((t) => t.key === key);
    const selection = editorRef.current?.getSelectedText();
    if (!selectedTone || !selection || !activeTask) return;
    setResponse(undefined);
    setIsRegenerating(false);
    await handleGenerateResponse({
      casual_score: selectedTone.casual_score,
      formal_score: selectedTone.formal_score,
      task: activeTask,
      text_input: selection,
    }).then(() =>
      responseContainerRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    );
  };
  // handle replace selected text with the response
  const handleInsertText = (insertOnNextLine: boolean) => {
    if (!response) return;
    editorRef.current?.insertText(response, insertOnNextLine);
    onClose();
  };

  // reset on close
  useEffect(() => {
    if (!isOpen) {
      setActiveTask(null);
      setResponse(undefined);
    }
  }, [isOpen]);

  return (
    <div
      className={cn(
        "flex max-h-72 w-[210px] rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 shadow-custom-shadow-rg transition-all overflow-hidden",
        {
          "w-[700px] divide-x divide-custom-border-200": activeTask,
        }
      )}
    >
      <div className="flex-shrink-0 w-[210px] overflow-y-auto px-2 py-2.5 transition-all">
        {MENU_ITEMS.map((item) => {
          const isActiveTask = activeTask === item.key;

          return (
            <button
              key={item.key}
              type="button"
              className={cn(
                "w-full flex items-center justify-between gap-2 truncate rounded px-1 py-1.5 text-xs text-custom-text-200 hover:bg-custom-background-80 transition-colors",
                {
                  "bg-custom-background-80": isActiveTask,
                }
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClick(item.key);
              }}
            >
              <span className="flex-shrink-0 flex items-center gap-2 truncate">
                <item.icon className="flex-shrink-0 size-3" />
                {item.label}
              </span>
              <ChevronRight
                className={cn("flex-shrink-0 size-3 opacity-0 pointer-events-none transition-opacity", {
                  "opacity-100 pointer-events-auto": isActiveTask,
                })}
              />
            </button>
          );
        })}
      </div>
      <div
        ref={responseContainerRef}
        className={cn("flex-shrink-0 w-0 overflow-hidden transition-all", {
          "w-[490px] overflow-auto vertical-scrollbar scrollbar-sm": activeTask,
        })}
      >
        <div
          className={cn("flex items-center gap-3 px-4 py-3.5", {
            "items-start": response,
          })}
        >
          <span className="flex-shrink-0 size-7 grid place-items-center text-custom-text-200 rounded-full border border-custom-border-200">
            <Sparkles className="size-3" />
          </span>
          {response ? (
            <div>
              <RichTextReadOnlyEditor
                displayConfig={{
                  fontSize: "small-font",
                }}
                id="editor-ai-response"
                initialValue={response}
                containerClassName="!p-0 border-none"
                editorClassName="!pl-0"
              />
              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  className="p-1 text-custom-text-300 text-sm font-medium rounded hover:bg-custom-background-80 outline-none"
                  onClick={() => handleInsertText(false)}
                >
                  Replace selection
                </button>
                <Tooltip tooltipContent="Add to next line">
                  <button
                    type="button"
                    className="flex-shrink-0 size-6 grid place-items-center rounded hover:bg-custom-background-80 outline-none"
                    onClick={() => handleInsertText(true)}
                  >
                    <CornerDownRight className="text-custom-text-300 size-4" />
                  </button>
                </Tooltip>
                <Tooltip tooltipContent="Re-generate response">
                  <button
                    type="button"
                    className="flex-shrink-0 size-6 grid place-items-center rounded hover:bg-custom-background-80 outline-none"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRegenerate();
                    }}
                    disabled={isRegenerating}
                  >
                    <RefreshCcw
                      className={cn("text-custom-text-300 size-4", {
                        "animate-spin": isRegenerating,
                      })}
                    />
                  </button>
                </Tooltip>
              </div>
            </div>
          ) : (
            <p className="text-sm text-custom-text-200">
              {activeTask ? LOADING_TEXTS[activeTask] : "Pi is writing"}...
            </p>
          )}
        </div>
        <div className="sticky bottom-0 w-full bg-custom-background-100 pl-[54.8px] py-2 flex items-center gap-2">
          {TONES_LIST.map((tone) => (
            <button
              key={tone.key}
              type="button"
              className={cn(
                "p-1 text-xs text-custom-text-200 font-medium bg-custom-background-80 rounded transition-colors outline-none",
                {
                  "bg-custom-primary-100/20 text-custom-primary-100": tone.key === "default",
                }
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToneChange(tone.key);
              }}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
