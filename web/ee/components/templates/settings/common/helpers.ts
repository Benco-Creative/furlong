export const COMMON_BUTTON_CLASS_NAME = "bg-custom-background-100 shadow-sm rounded";
export const COMMON_ERROR_CLASS_NAME = "border-[0.5px] border-red-400";

export const validateWhitespaceI18n = (value: string) => {
  if (value.trim() === "") {
    return "title_is_required";
  }
  return undefined;
};
