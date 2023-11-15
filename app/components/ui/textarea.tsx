import * as React from "react";
import { cn } from "~/lib/utils";
import UnStyledAutosizeTextArea from "react-textarea-autosize";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export interface AutoSizeTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const AutoSizeTextArea = React.forwardRef<
  HTMLTextAreaElement,
  AutoSizeTextAreaProps
>(({ className, ...props }, ref) => {
  return (
    <UnStyledAutosizeTextArea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
      {...(props.readOnly
        ? { value: props.value || props.defaultValue, defaultValue: undefined }
        : {})}
      style={undefined}
    />
  );
});
AutoSizeTextArea.displayName = "AutoSizeTextArea";

export { Textarea, AutoSizeTextArea };
