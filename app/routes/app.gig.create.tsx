import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { ClipLoader } from "react-spinners";
import { z } from "zod";
import { GigCreateOrEditFields } from "~/components/GigCreateEditFormFields";
import { Button } from "~/components/ui/button";
import { TextTitle } from "~/components/ui/text";
import { addError } from "~/lib/utils/conform.server";
import { db } from "~/lib/utils/db.server";
import { createGigs } from "~/models/gigs.server";
import { ValidGigSkills, validSkills } from "~/models/skills";
import { getUserCredits, withdrawCredits } from "~/models/user.server";
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

  const { ok } = await db.transaction(async (tx) => {
    const userAvalaibleCredits = await getUserCredits({ userId: userId });

    if (userAvalaibleCredits < price) {
      addError({
        submission,
        key: "price",
        error:
          "You do not have enough credits to choose this price. Either buy more credits or reduce the price of gig",
      });

      return { ok: false };
    }

    await withdrawCredits({ credits: price, saveTransaction: false, userId });

    await createGigs({
      description,
      name,
      price,
      createdByUserId: userId,
      skills,
    });

    return { ok: true };
  });

  if (!ok) {
    return json({ submission }, { status: 400 });
  }

  return redirect("/app/gig/type/created");
}

export default function Component() {
  const actionData = useActionData<typeof action>();

  const [createGigForm, { description, name, price, skills }] = useForm({
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: CreateGigSchema });
    },
  });

  const navigation = useNavigation();
  const isCreatingNewGig = navigation.state === "submitting";

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
          <Button type="submit" className="flex gap-x-2">
            Create new Gig
            <ClipLoader size={16} color={"white"} loading={isCreatingNewGig} />
          </Button>
        </div>
      </Form>
    </div>
  );
}
