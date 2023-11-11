export type InputFieldProps = React.HTMLAttributes<HTMLDivElement>;

export function InputField(props: InputFieldProps) {
  return <div {...props}>{props.children}</div>;
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
