import { FC, useEffect, useRef } from "react";
import { observer } from "mobx-react";
// ui
import { GripVertical } from "lucide-react";
import { Sortable, Tooltip } from "@plane/ui";
import {
  IssuePropertyCreateOptionItem,
  IssuePropertyOptionItem,
} from "@/plane-web/components/issue-types/properties/attributes";
// plane web hooks
import { usePropertyOptions } from "@/plane-web/hooks/store";
// plane web types
import { TIssuePropertyOptionCreateUpdateData } from "@/plane-web/types";

type TIssuePropertyOptionsRoot = {
  issuePropertyId: string | undefined;
  error?: string;
};

export const IssuePropertyOptionsRoot: FC<TIssuePropertyOptionsRoot> = observer((props) => {
  const { issuePropertyId, error } = props;
  // store hooks
  const { propertyOptions, handlePropertyOptionsList } = usePropertyOptions();
  // derived values
  const sortedActivePropertyOptions = propertyOptions.filter((item) => item.id);
  const createListData = propertyOptions.filter((item) => !item.id && item.key);
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const secondLastElementRef = useRef<HTMLDivElement>(null);

  const scrollIntoElementView = () => {
    if (secondLastElementRef.current) {
      secondLastElementRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // get the input element and focus on it
      const inputElement = secondLastElementRef.current.querySelector("input");
      inputElement?.focus();
    }
  };

  useEffect(() => {
    scrollIntoElementView();
  }, []);

  const handleOptionsDragAndDrop = (
    data: TIssuePropertyOptionCreateUpdateData[],
    movedItem?: TIssuePropertyOptionCreateUpdateData
  ) => {
    if (!sortedActivePropertyOptions || !issuePropertyId || !movedItem) return;

    // Function to calculate new sort_order
    const calculateSortOrder = (prev: number | undefined, next: number | undefined): number => {
      if (prev === undefined) return (next ?? 10000) / 2; // First element case
      if (next === undefined) return prev + 10000; // Last element case
      return (prev + next) / 2; // Middle elements case
    };

    // get the moved item index from the new data
    const movedItemIndex = data.findIndex((item) => item.id === movedItem.id);

    // get the previous and next item from the new data
    const prevItem = data[movedItemIndex - 1];
    const nextItem = data[movedItemIndex + 1];

    if (movedItemIndex === -1 || !movedItem.id) return;

    // get the new sort order
    const newSortOrder = calculateSortOrder(prevItem?.sort_order, nextItem?.sort_order);

    handlePropertyOptionsList("update", { id: movedItem.id, sort_order: newSortOrder });
  };

  return (
    <div className="pt-3">
      <div className="text-xs font-medium text-custom-text-300 p-1">Add options</div>
      <div
        ref={containerRef}
        className="flex flex-col items-center, py-1 space-y-1.5 -mr-2 max-h-36 vertical-scrollbar scrollbar-xs"
      >
        {sortedActivePropertyOptions && sortedActivePropertyOptions?.length > 0 && (
          <Sortable
            data={sortedActivePropertyOptions}
            render={(propertyOption: TIssuePropertyOptionCreateUpdateData) => (
              <div key={propertyOption.id} className="flex w-full items-center gap-0.5">
                <Tooltip tooltipContent="Drag to rearrange">
                  <div className="rounded-sm flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-grab">
                    <GripVertical size={14} className="text-custom-text-200" />
                  </div>
                </Tooltip>
                <IssuePropertyOptionItem
                  optionId={propertyOption.id}
                  propertyOptionData={propertyOption}
                  updateOptionData={(value) => {
                    handlePropertyOptionsList("update", value);
                  }}
                />
              </div>
            )}
            containerClassName="w-full pr-1"
            onChange={(
              data: TIssuePropertyOptionCreateUpdateData[],
              movedItem?: TIssuePropertyOptionCreateUpdateData
            ) => handleOptionsDragAndDrop(data, movedItem)}
            keyExtractor={(option: TIssuePropertyOptionCreateUpdateData, index) =>
              option.id?.toString() ?? index.toString()
            }
          />
        )}
        {createListData.map((issuePropertyOption, index) => (
          <IssuePropertyCreateOptionItem
            key={issuePropertyOption.key}
            ref={index === createListData.length - 2 ? secondLastElementRef : undefined}
            propertyOptionCreateListData={issuePropertyOption}
            updateCreateListData={(value) => {
              handlePropertyOptionsList("update", value);
              setTimeout(() => {
                scrollIntoElementView();
              }, 0);
            }}
            error={index === 0 ? error : undefined}
          />
        ))}
      </div>
    </div>
  );
});
