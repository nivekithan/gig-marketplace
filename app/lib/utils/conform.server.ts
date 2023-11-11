import { Submission } from "@conform-to/react";

export function addError<S extends Submission>({
  error,
  key,
  submission,
}: {
  submission: S;
  key: S extends Submission<infer U> ? keyof U : never;
  error: string;
}) {
  if (submission.error[key]) {
    submission.error[key].push(error);
  } else {
    submission.error[key] = [error];
  }
}
