import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { ValidationMap } from "react";
import { z } from "zod";
import { GigCreateOrEditFields } from "~/components/GigCreateEditFormFields";
import { Button } from "~/components/ui/button";
import { TextTitle } from "~/components/ui/text";
import { createGigs } from "~/models/gigs.server";
import { ValidGigSkills, validSkills } from "~/models/skills";
import { requireUser } from "~/session";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  return null;
}

const CreateGigSchema = z.object({
  name: z
    .string({ required_error: "Name of gig is required field" })
    .min(1, "Name must be atleast 1 letter"),
  description: z
    .string({ required_error: "Description of gig is required field" })
    .min(1, "Description must be atleast 1 letter"),
  price: z
    .number({
      required_error: "Price is required field",
      invalid_type_error: "Provide valid number",
    })
    .positive("Price must be a positive number"),
  skills: z.array(
    z.union(
      validSkills.map((skills) => z.literal(skills)) as [
        z.ZodLiteral<ValidGigSkills>,
        z.ZodLiteral<ValidGigSkills>,
      ],
    ),
  ),
});

export async function action({ request }: ActionFunctionArgs) {
  const [formData, userId] = await Promise.all([
    request.formData(),
    requireUser(request),
  ]);

  const submission = parse(formData, { schema: CreateGigSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json({ submission }, { status: 400 });
  }

  const { description, name, price, skills } = submission.value;
  await createGigs({
    description,
    name,
    price,
    createdByUserId: userId,
    skills,
  });

  return redirect("/app/gig/type/created");
}

export default function Component() {
  const [createGigForm, { description, name, price, skills }] = useForm({
    onValidate({ formData }) {
      return parse(formData, { schema: CreateGigSchema });
    },
  });

  return (
    <div className="flex flex-col gap-y-8">
      <TextTitle>Create new Gig</TextTitle>
      <Form
        method="post"
        {...createGigForm.props}
        className="max-w-[640px] flex flex-col gap-y-3"
      >
        <GigCreateOrEditFields
          description={description}
          name={name}
          price={price}
          skills={skills}
        />
        <div>
          <Button type="submit">Create new Gig</Button>
        </div>
      </Form>
    </div>
  );
}
