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
  deleteProposalByUserOnGig,
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
    isCreatedByUser: userId === gig.createdBy,
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
  } else if (type === "delete") {
    await deleteProposalByUserOnGig({ gigId: id, userId });
  }

  return json({ submission });
}

const CreateOrEditProposalSchema = z.object({
  proposal: z
    .string({ required_error: "Proposal is a required field" })
    .min(100, "Proposal must be atleast 100 characters long"),
  type: z.union([z.literal("create"), z.literal("edit"), z.literal("delete")]),
});

export default function Component() {
  const { gig, noOfProposal, isCreatedByUser } = useLoaderData<typeof loader>();

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
      {isCreatedByUser ? null : <AddProposalForm />}
    </main>
  );
}

function AddProposalForm() {
  const { proposal } = useLoaderData<typeof loader>();
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
  const isSubmittingForm =
    navigation.state === "loading" || navigation.state === "submitting";

  const isCreatingOrEditingProposal =
    (isSubmittingForm && navigation.formData?.get("type") === "create") ||
    navigation.formData?.get("type") === "edit";

  const isDeletingProposal =
    isSubmittingForm && navigation.formData?.get("type") === "delete";

  return (
    <Form
      className="flex flex-col gap-y-6"
      method="post"
      {...createGigForm.props}
    >
      <InputField>
        <Label>Your proposal:</Label>
        <Textarea
          placeholder="Your proposal..."
          {...conform.textarea(proposalField)}
          defaultValue={proposal ? proposal.proposal : undefined}
        />
        <InputErrors errors={proposalField.errors} />
      </InputField>
      <div className="flex gap-x-3 items-center">
        <Button
          type="submit"
          className="flex gap-x-2"
          disabled={isSubmittingForm}
          name={typeField.name}
          value={isCreatingProposal ? "create" : "edit"}
        >
          {isCreatingProposal ? "Submit Proposal" : "Edit Proposal"}
          <ClipLoader
            size={16}
            loading={isCreatingOrEditingProposal}
            color="white"
          />
        </Button>
        {isCreatingProposal ? null : (
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            name={typeField.name}
            value={"delete"}
            disabled={isSubmittingForm}
            className="flex gap-x-2"
          >
            Delete Proposal
            <ClipLoader size={16} loading={isDeletingProposal} color="white" />
          </Button>
        )}
      </div>
    </Form>
  );
}
