import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  json,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { z } from "zod";
import { InputErrors, InputField } from "~/components/inputField";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { TextTitle } from "~/components/ui/text";
import { ValidGigSkills, validSkills } from "~/models/skills";
import { editUser, getUserById, whiteLabelUser } from "~/models/user.server";
import { requireUser } from "~/session";
import Select, { MultiValue } from "react-select";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ClipLoader } from "react-spinners";

export function meta(): ReturnType<MetaFunction> {
  return [{ title: "Settings | Profile" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request);
  const userDetails = await getUserById({ userId });

  if (!userDetails) {
    throw new Response("Not found", { status: 404 });
  }

  const whiteLabelUserDetials = whiteLabelUser(userDetails);

  return json({ user: whiteLabelUserDetials });
}

export async function action({ request }: ActionFunctionArgs) {
  const [userId, formData] = await Promise.all([
    requireUser(request),
    request.formData(),
  ]);

  const submission = parse(formData, { schema: UpdateUserDetailsSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json({ submission }, { status: 400 });
  }

  const { email, name, skills } = submission.value;
  await editUser({ email, name, skills, userId });

  return json({ submission });
}

const UpdateUserDetailsSchema = z.object({
  name: z
    .string({ required_error: "Name is a required field" })
    .min(1, "Name must be atleast 1 characters long"),
  email: z
    .string({ required_error: "Email is required field" })
    .email("Provide valid email address"),
  skills: z.array(
    z.union(
      validSkills.map((skill) => {
        return z.literal(skill);
      }) as [z.ZodLiteral<ValidGigSkills>, z.ZodLiteral<ValidGigSkills>],
    ),
  ),
});

export default function Component() {
  const { user } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const [selectedSkills, setSelectedSkills] = useState<MultiValue<{
    label: string;
    value: string;
  }> | null>(() => {
    return (
      user.skills?.map((skill) => {
        return { label: skill, value: skill };
      }) || null
    );
  });

  const [updateUserDetailsForm, { email, name, skills }] = useForm({
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: UpdateUserDetailsSchema });
    },
  });

  const navigation = useNavigation();
  const isUpdatingProfile = navigation.state === "submitting";

  return (
    <div className="max-w-[720px]">
      <TextTitle className="mb-8">Your Profile details</TextTitle>

      <Form
        method="post"
        {...updateUserDetailsForm.props}
        className="flex flex-col gap-y-3"
      >
        <InputField>
          <Label>Profile name:</Label>
          <Input
            {...conform.input(name)}
            placeholder="Set your profile name"
            defaultValue={user.name || undefined}
          />
          <InputErrors errors={name.errors} />
        </InputField>

        <InputField>
          <Label>Update your email:</Label>
          <Input
            {...conform.input(email)}
            placeholder="Update your email address"
            defaultValue={user.email}
          />
          <InputErrors errors={email.errors} />
        </InputField>
        <div>
          <Label>Select Skills:</Label>
          <Select
            isMulti
            options={validSkills.map((skill) => {
              return { label: skill, value: skill };
            })}
            onChange={setSelectedSkills}
            defaultValue={selectedSkills || undefined}
            name="unknown"
          />
          <div>
            {selectedSkills?.map(({ value }, i) => {
              return (
                <input
                  name={`${skills.name}[${i}]`}
                  defaultValue={value}
                  hidden
                  key={value}
                />
              );
            })}
          </div>
        </div>
        <div className="mt-4">
          <Button variant="default" className="flex gap-x-2">
            Save Changes
            <ClipLoader size={16} loading={isUpdatingProfile} color="white" />
          </Button>
        </div>
      </Form>
    </div>
  );
}
