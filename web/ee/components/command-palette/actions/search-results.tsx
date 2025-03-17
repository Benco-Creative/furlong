"use client";

import { Command } from "cmdk";
import { useParams, useRouter } from "next/navigation";
// plane web helpers
import { pagesAppCommandGroups } from "@/plane-web/components/command-palette";
// plane web types
import { IAppSearchResults } from "@/plane-web/types";

type Props = {
  closePalette: () => void;
  results: IAppSearchResults;
};

export const PagesAppCommandPaletteSearchResults: React.FC<Props> = (props) => {
  const { closePalette, results } = props;
  const { projectId } = useParams();
  const router = useRouter();

  return (
    <>
      {Object.keys(results.results).map((key) => {
        const section = (results.results as any)[key];
        const currentSection = pagesAppCommandGroups[key];

        if (section.length > 0) {
          return (
            <Command.Group key={key} heading={`${currentSection.title} search`}>
              {section.map((item: any) => (
                <Command.Item
                  key={item.id}
                  onSelect={() => {
                    closePalette();
                    router.push(currentSection.path(item, projectId.toString()));
                  }}
                  value={`${key}-${item?.id}-${item.name}-${item.project__identifier ?? ""}-${item.sequence_id ?? ""}`}
                  className="focus:outline-none"
                >
                  <div className="flex items-center gap-2 overflow-hidden text-custom-text-200">
                    {currentSection.icon}
                    <p className="block flex-1 truncate">{currentSection.itemName(item)}</p>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          );
        }
      })}
    </>
  );
};
