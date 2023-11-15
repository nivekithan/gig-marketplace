import { cn } from "~/lib/utils";

export type InputFieldProps = React.HTMLAttributes<HTMLDivElement>;

export function InputField(props: InputFieldProps) {
  return (
    <div {...props} className={cn("flex flex-col gap-y-1", props.className)}>
      {props.children}
    </div>
  );
}

export type InputErrosProps = {
  errors: Array<string> | undefined;
};
export function InputErrors({ errors }: InputErrosProps) {
  return errors ? (
    <div className="mt-2">
      {errors.map((error) => {
        return (
          <p className="text-sm text-destructive" id={error}>
            {error}
          </p>
        );
      })}
    </div>
  ) : null;
}
