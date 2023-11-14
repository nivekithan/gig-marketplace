import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { AlertCircle } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { z } from "zod";
import { InputErrors, InputField } from "~/components/inputField";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { TextTitle } from "~/components/ui/text";
import {
  createCreditCardForUser,
  editCreditCardForUser,
  getCreditCardDetailsForUser,
} from "~/models/creditCard.server";
import { getUserCredits } from "~/models/user.server";
import { requireUser } from "~/session";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request);
  const [userCredit, creditCard] = await Promise.all([
    getUserCredits({ userId }),
    getCreditCardDetailsForUser({ userId }),
  ]);

  if (userCredit === null) {
    throw new Response("Not found", { status: 404 });
  }

  return json({ credit: userCredit, creditCard });
}

export async function action({ request }: ActionFunctionArgs) {
  const [userId, formData] = await Promise.all([
    requireUser(request),
    request.formData(),
  ]);

  const submission = parse(formData, {
    schema: UpdateOrCreateCreditCardSchema,
  });

  if (!submission.value || submission.intent !== "submit") {
    return json({ submission }, { status: 400 });
  }

  const submissionData = submission.value;

  if (submissionData.type === "createCreditCard") {
    await createCreditCardForUser({
      cardNumber: submissionData.cardNumber.toString(),
      name: submissionData.name,
      userId,
    });
    return json({ submission });
  } else if (submissionData.type === "editCreditCard") {
    await editCreditCardForUser({
      cardNumber: submissionData.cardNumber.toString(),
      name: submissionData.name,
      userId,
    });
    return json({ submission });
  }
}
const UpdateOrCreateCreditCardSchema = z.object({
  name: z
    .string({ required_error: "Card holder name is required field" })
    .min(1, "Card holder name must be atleast 1 characters long"),
  cardNumber: z
    .number({
      required_error: "Card number is a required field",
      invalid_type_error: "Provide valid credit card number",
    })
    .int("Provide valid credit card number")
    .positive("Provide valid credit card number"),
  type: z.union([z.literal("createCreditCard"), z.literal("editCreditCard")]),
});

export default function Component() {
  const { credit, creditCard } = useLoaderData<typeof loader>();

  const creditCardFetcher = useFetcher<typeof action>();

  const [
    creditCardForm,
    { cardNumber: cardNumberField, name: nameField, type: typeField },
  ] = useForm({
    lastSubmission: creditCardFetcher.data?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: UpdateOrCreateCreditCardSchema });
    },
  });

  const isSubmittingCreditCardDetails =
    creditCardFetcher.state === "loading" ||
    creditCardFetcher.state === "submitting";

  return (
    <div className="w-[720px] flex flex-col gap-y-6">
      <TextTitle>Credits</TextTitle>

      <Alert className="flex flex-col gap-y-2" variant="destructive">
        <AlertTitle className="font-semibold tracking-tight flex gap-x-2">
          <AlertCircle className="w-4 h-4" />
          Do not put your real eredit card number
        </AlertTitle>
        <AlertDescription>
          This website is created for a hackathon to showcase Pangea
          capabilities in a product. We don't take or give actual money.
          Therefore you can put any credit number in below field and the
          transaction will succeed
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-1">
          <h1 className="font-semibold">Remaining Credits: {credit} </h1>
          <p className="text-sm font-light">
            1 credit is equal to 1 USD dollar
          </p>
        </div>
        <div className="flex gap-x-2">
          <Button variant="secondary" size="sm">
            Add Credit
          </Button>
          <Button variant="secondary" size="sm">
            Withdraw Credit
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-y-4">
        <h1 className="font-semibold">Credit card</h1>
        <creditCardFetcher.Form
          className="flex flex-col gap-y-3"
          method="post"
          {...creditCardForm.props}
        >
          <InputField>
            <Label>Card holder name:</Label>
            <Input
              {...conform.input(nameField)}
              placeholder="Name on credit card"
              defaultValue={creditCard?.name}
            />
            <InputErrors errors={nameField.errors} />
          </InputField>
          <InputField>
            <Label>Card number:</Label>
            <Input
              {...conform.input(cardNumberField)}
              placeholder="Credit card number..."
              defaultValue={creditCard?.number}
            />
            <InputErrors errors={cardNumberField.errors} />
          </InputField>
          <div>
            <Button
              type="submit"
              name={typeField.name}
              value={creditCard ? "editCreditCard" : "createCreditCard"}
              className="flex gap-x-2"
            >
              Update credit card
              <ClipLoader
                size={16}
                color={"white"}
                loading={isSubmittingCreditCardDetails}
              />
            </Button>
          </div>
        </creditCardFetcher.Form>
      </div>
    </div>
  );
}
