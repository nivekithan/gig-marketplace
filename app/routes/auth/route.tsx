import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useForm, conform } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button } from "~/components/ui/button";
import { InputErrors, InputField } from "~/components/inputField";
import { getUserId } from "./auth.server";
import { addError } from "~/lib/utils/conform.server";
import {
  authSessionStorage,
  getAuthSession,
  requireAnonymous,
} from "~/session";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAnonymous(request);

  return null;
}

const AuthSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be equal or greater than 8 letter"),
});

export async function action({ request }: ActionFunctionArgs) {
  const [authSession, formData] = await Promise.all([
    getAuthSession(request),
    request.formData(),
  ]);

  const submission = parse(formData, { schema: AuthSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json({ submission: submission }, { status: 400 });
  }

  const { email, password } = submission.value;

  const userState = await getUserId({ email, password });

  if (userState.status === "INVALID_PASSWORD") {
    addError({
      submission,
      key: "password",
      error: "Email and password is not matching",
    });

    return json({ submission }, { status: 400 });
  }

  const userId = userState.userId;

  authSession.set("userId", userId);
  return redirect("/app/settings/profile", {
    headers: {
      "Set-Cookie": await authSessionStorage.commitSession(authSession),
    },
  });
}

export default function Component() {
  const [authForm, { email, password }] = useForm({
    onValidate({ formData }) {
      return parse(formData, { schema: AuthSchema });
    },
  });

  return (
    <main className="container min-h-screen grid place-items-center">
      <Card>
        <CardHeader>
          <CardTitle>Sign in / Sign Up</CardTitle>
        </CardHeader>
        <CardContent>
          <Form
            {...authForm.props}
            className="flex flex-col gap-y-4"
            method="post"
          >
            <InputField>
              <Label>Email:</Label>
              <Input {...conform.input(email)} />
              <InputErrors errors={email.errors} />
            </InputField>
            <InputField>
              <Label>Password:</Label>
              <Input {...conform.input(password)} type="password" />
              <InputErrors errors={password.errors} />
            </InputField>
            <Button>Submit</Button>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
