import {
  type InputChangeEventDetails,
  Input as InputPrimitive,
} from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = Omit<React.ComponentProps<"input">, "onChange"> & {
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onValueChange?: (
    value: string,
    eventDetails: InputChangeEventDetails,
  ) => void;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { className, type, onChange, onValueChange, ...props },
    forwardedRef,
  ) {
    const handleValueChange = React.useCallback(
      (value: string, eventDetails: InputChangeEventDetails) => {
        onValueChange?.(value, eventDetails);

        if (!onChange) {
          return;
        }

        const currentTarget = { value } as HTMLInputElement;

        onChange({
          target: currentTarget,
          currentTarget,
          nativeEvent: eventDetails.event,
          preventDefault: eventDetails.event.preventDefault.bind(
            eventDetails.event,
          ),
          stopPropagation: eventDetails.event.stopPropagation.bind(
            eventDetails.event,
          ),
        } as React.ChangeEvent<HTMLInputElement>);
      },
      [onChange, onValueChange],
    );

    return (
      <InputPrimitive
        ref={forwardedRef as unknown as React.Ref<HTMLElement>}
        type={type}
        data-slot="input"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className,
        )}
        onValueChange={handleValueChange}
        {...props}
      />
    );
  },
);
