import { useState } from "react";
import { Button, TextArea } from "@plane/ui";
import { EProjectUpdateStatus, TProjectUpdate } from "@/plane-web/types";
import { StatusDropdown } from "./status-dropdown";

type TProps = {
  initialValues?: TProjectUpdate;
  handleClose: () => void;
  handleCreate: (data: Partial<TProjectUpdate>) => void;
};
export const NewUpdate = (props: TProps) => {
  const { handleClose, handleCreate, initialValues } = props;

  const [input, setInput] = useState(initialValues?.description ?? "");
  const [selectedStatus, setSelectedStatus] = useState(initialValues?.status ?? EProjectUpdateStatus.ON_TRACK);

  return (
    <div className="border border-custom-border-100 rounded-md p-4 flex flex-col gap-4 mb-4">
      {/* Type */}
      <StatusDropdown selectedStatus={selectedStatus} setStatus={setSelectedStatus} />

      {/* Textarea */}
      <TextArea
        className="border-none p-0 text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add your update."
      />

      {/* actions */}
      <div className="flex m-auto mr-0 text-sm gap-2 w-fit">
        <Button onClick={handleClose} variant="neutral-primary" size="sm">
          Cancel
        </Button>
        <Button
          onClick={() =>
            handleCreate({
              status: selectedStatus,
              description: input,
            })
          }
          size="sm"
          disabled={input === ""}
        >
          Add update
        </Button>
      </div>
    </div>
  );
};
