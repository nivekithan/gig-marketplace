import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  defer,
  json,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { ClipLoader } from "react-spinners";
import { z } from "zod";
import { ExpandedGigInfo } from "~/components/GigInfo";
import { InputErrors, InputField } from "~/components/inputField";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { gigById, whiteLabelGigs } from "~/models/gigs.server";
import {
  createProposal,
  editProposal,
  getNumberOfProposalForGig,
  proposalByUserForGig,
} from "~/models/proposal.server";
import { requireUser } from "~/session";

const RouteParamsSchema = z.object({ id: z.string() });

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = RouteParamsSchema.parse(params);
  const userId = await requireUser(request);

  const [gig, proposalByUser, numberOfProposals] = await Promise.all([
    gigById({ id }),
    proposalByUserForGig({ gigId: id, userId }),
    getNumberOfProposalForGig({ gigId: id }),
  ]);

  if (gig === null) {
    throw new Response("Not found", { status: 404 });
  }

  return defer({
    gig: whiteLabelGigs(gig),
    proposal: proposalByUser,
    noOfProposal: numberOfProposals,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = RouteParamsSchema.parse(params);
  const [userId, formData] = await Promise.all([
    requireUser(request),
    request.formData(),
  ]);

  const submission = parse(formData, { schema: CreateOrEditProposalSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json({ submission }, { status: 400 });
  }

  const { proposal, type } = submission.value;
  if (type === "create") {
    await createProposal({
      createdBy: userId,
      gigId: id,
      proposal,
    });
  } else if (type === "edit") {
    await editProposal({ createdBy: userId, gigId: id, proposal });
  }

  return json({ submission });
}

const CreateOrEditProposalSchema = z.object({
  proposal: z
    .string({ required_error: "Proposal is a required field" })
    .min(100, "Proposal must be atleast 100 characters long"),
  type: z.union([z.literal("create"), z.literal("edit")]),
});

export default function Component() {
  const { gig, proposal, noOfProposal } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const isCreatingProposal = proposal === null;

  const [createGigForm, { proposal: proposalField, type: typeField }] = useForm(
    {
      fallbackNative: true,
      lastSubmission: actionData?.submission,
      onValidate({ formData }) {
        return parse(formData, { schema: CreateOrEditProposalSchema });
      },
    },
  );

  const navigation = useNavigation();
  const isSubmittingProposal =
    navigation.state === "loading" || navigation.state === "submitting";

  return (
    <main className="w-[720px]">
      <ExpandedGigInfo
        name={gig.name}
        createdAt={gig.createdAt}
        description={gig.description}
        skills={gig.skills}
        price={gig.price}
        noOfProposal={noOfProposal}
      />
      <Separator className="my-6" />
      <Form
        className="flex flex-col gap-y-6"
        method="post"
        {...createGigForm.props}
      >
        <input
          hidden
          {...conform.input(typeField)}
          defaultValue={isCreatingProposal ? "create" : "edit"}
        />
        <InputField>
          <Label>Your proposal:</Label>
          <Textarea
            placeholder="Your proposal..."
            {...conform.textarea(proposalField)}
            defaultValue={proposal ? proposal.proposal : undefined}
          />
          <InputErrors errors={proposalField.errors} />
        </InputField>
        <div>
          <Button
            type="submit"
            className="flex gap-x-2"
            disabled={isSubmittingProposal}
          >
            {isCreatingProposal ? "Submit Proposal" : "Edit Proposal"}
            <ClipLoader
              size={16}
              loading={isSubmittingProposal}
              color="white"
            />
          </Button>
        </div>
      </Form>
    </main>
  );
}
