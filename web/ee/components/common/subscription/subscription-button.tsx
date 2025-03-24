// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { cn } from "@plane/utils";
import { getSubscriptionTextAndBackgroundColor } from "@/plane-web/helpers/subscription";

type TProps = {
  subscriptionType: EProductSubscriptionEnum;
  handleClick: () => void;
  children: React.ReactNode;
  className?: string;
};

export const SubscriptionButton = (props: TProps) => {
  const { subscriptionType, handleClick, children, className } = props;
  // derived values
  const subscriptionColor = getSubscriptionTextAndBackgroundColor(subscriptionType);

  return (
    <button
      tabIndex={-1}
      className={cn(
        "relative flex items-center gap-x-1.5 w-fit cursor-pointer rounded-2xl px-2.5 py-1 text-center text-sm font-medium outline-none hover:opacity-90",
        subscriptionColor,
        className
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
