import { Submission, conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  defer,
  json,
} from "@remix-run/node";
import {
  Await,
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import getUrls from "get-urls";
import { Clock } from "lucide-react";
import { Suspense } from "react";
import { z } from "zod";
import { ExpandedGigInfo, GigInfo } from "~/components/GigInfo";
import { InputErrors, InputField } from "~/components/inputField";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { TextTitle } from "~/components/ui/text";
import { AutoSizeTextArea } from "~/components/ui/textarea";
import { addError } from "~/lib/utils/conform.server";
import { verifyUrlisGood } from "~/lib/utils/pangea.server";
import {
  ClientGigRow,
  finishGig,
  getSimilarGigs,
  gigById,
  whiteLabelGigs,
} from "~/models/gigs.server";
import {
  ClientProposalRow,
  acceptProposalForGig,
  createProposal,
  deleteProposalByUserOnGig,
  editProposal,
  getAccpetedProposalForGig,
  getAllOpenProposalForGig,
  getNumberOfProposalForGig,
  proposalByUserForGig,
  rejectProposal,
  whiteLableProposal,
} from "~/models/proposal.server";
import { ClientUSerRow, whiteLabelUser } from "~/models/user.server";
import { requireUser } from "~/session";
import * as Spinners from "react-spinners";
const ClipLoader = Spinners.ClipLoader;

export function meta(): ReturnType<MetaFunction> {
  return [{ title: "Gig Marketplace" }];
}

const RouteParamsSchema = z.object({ id: z.string() });

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = RouteParamsSchema.parse(params);
  const userId = await requireUser(request);

  const [gig, numberOfProposals] = await Promise.all([
    gigById({ id }),
    getNumberOfProposalForGig({ gigId: id }),
  ]);

  if (gig === null) {
    throw new Response("Not found", { status: 404 });
  }

  const similarGigs = getSimilarGigs(gig).then((gig) =>
    gig.map(whiteLabelGigs),
  );
  const isGigCreatedByUser = userId === gig.createdBy;
  const proposalByUser = (async () => {
    if (isGigCreatedByUser) {
      return null;
    }

    const proposal = await proposalByUserForGig({ gigId: id, userId });

    return proposal;
  })();

  const allProposalsToGig = (async () => {
    if (!isGigCreatedByUser) {
      return null;
    }

    if (gig.status === "CREATED") {
      const allProposals = await getAllOpenProposalForGig({ gigId: id });

      return allProposals.map(({ proposal, user }) => {
        return {
          user: whiteLabelUser(user),
          proposal: whiteLableProposal(proposal),
        };
      });
    }

    const accpetedProposal = await getAccpetedProposalForGig({ gigId: id });
    return [
      {
        user: whiteLabelUser(accpetedProposal.user),
        proposal: whiteLableProposal(accpetedProposal.proposal),
      },
    ];
  })();

  return defer({
    gig: whiteLabelGigs(gig),
    proposal: proposalByUser,
    noOfProposal: numberOfProposals,
    isCreatedByUser: userId === gig.createdBy,
    allProposalsToGig: allProposalsToGig,
    similarGigs: similarGigs,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = RouteParamsSchema.parse(params);
  const [userId, formData] = await Promise.all([
    requireUser(request),
    request.formData(),
  ]);

  const submission = parse(formData, {
    schema: z.union([
      CreateOrEditProposalSchema,
      AcceptOrRejectProposalSchema,
      FinishGigSchema,
    ]),
  });

  if (!submission.value || submission.intent !== "submit") {
    return json({ submission }, { status: 400 });
  }

  const submissionData = submission.value;
  if (submissionData.type === "create") {
    const allUrlsInProposal = getUrls(submissionData.proposal);

    const urlStatus = await Promise.all(
      new Array(...allUrlsInProposal).map(async (url) => {
        return { url: url, isSafe: await verifyUrlisGood(url) };
      }),
    );

    let isUrlSafe = true;

    urlStatus.forEach(({ isSafe, url }) => {
      if (!isSafe) {
        isUrlSafe = false;
      }

      addError({
        submission: submission as Submission<{ proposal: string }>,
        key: "proposal",
        error: `Url: ${url} is considered to be harmful. Please remove it from the proposal`,
      });
    });

    if (!isUrlSafe) {
      return json({ submission }, { status: 400 });
    }

    await createProposal({
      createdBy: userId,
      gigId: id,
      proposal: submissionData.proposal,
    });
  } else if (submissionData.type === "edit") {
    const allUrlsInProposal = getUrls(submissionData.proposal);

    const urlStatus = await Promise.all(
      new Array(...allUrlsInProposal).map(async (url) => {
        return { url: url, isSafe: await verifyUrlisGood(url) };
      }),
    );

    let isUrlSafe = true;

    urlStatus.forEach(({ isSafe, url }) => {
      if (!isSafe) {
        isUrlSafe = false;
      }

      addError({
        submission: submission as Submission<{ proposal: string }>,
        key: "proposal",
        error: `Url: ${url} is considered to be harmful. Please remove it from the proposal`,
      });
    });

    if (!isUrlSafe) {
      return json({ submission }, { status: 400 });
    }

    await editProposal({
      createdBy: userId,
      gigId: id,
      proposal: submissionData.proposal,
    });
  } else if (submissionData.type === "delete") {
    await deleteProposalByUserOnGig({ gigId: id, userId });
  } else if (submissionData.type === "accept") {
    await acceptProposalForGig({ gigId: id, id: submissionData.proposalId });
  } else if (submissionData.type === "reject") {
    await rejectProposal({ id: submissionData.proposalId });
  } else if (submissionData.type === "finish") {
    await finishGig({ id });
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
    <div className="flex justify-between">
      <div className="flex-1">
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
          {isCreatedByUser ? <AllProposal /> : <AddProposalForm />}
        </main>
      </div>
      <div className="h-screen sticky top-0 border-l">
        <SimilarGigs />
      </div>
    </div>
  );
}

function SimilarGigsSkeleton() {
  return (
    <div className="px-4 flex flex-col gap-y-4 w-[420px]">
      <Skeleton className="w-[390px] h-[24px] rounded-md" />
      <Skeleton className="w-[420px] h-[200px] rounded-md" />
      <Skeleton className="w-[420px] h-[200px] rounded-md" />
      <Skeleton className="w-[420px] h-[200px] rounded-md" />
    </div>
  );
}
function SimilarGigs() {
  const { similarGigs } = useLoaderData<typeof loader>();
  return (
    <Suspense fallback={<SimilarGigsSkeleton />}>
      <Await resolve={similarGigs}>
        {(gigs) => {
          if (gigs.length === 0) {
            return null;
          }

          return (
            <div className="px-4 flex flex-col gap-y-4 w-[420px]">
              <TextTitle>Related Gigs</TextTitle>

              {gigs.map((gig) => {
                return (
                  <div
                    key={gig.id}
                    className="max-w-[420px] border p-4 rounded-md transition-colors hover:border-primary"
                  >
                    <Link to={`/app/gig/g/${gig.id}`}>
                      <GigInfo {...gig} />
                    </Link>
                  </div>
                );
              })}
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
}

function EmptyProposalState() {
  return (
    <Alert>
      <Clock size={22} />
      <div>
        <AlertTitle className="text-lg font-semibold tracking-tight">
          No proposal made yet
        </AlertTitle>
        <AlertDescription>
          No one has sent proposal for this gig. Check again after some time
        </AlertDescription>
      </div>
    </Alert>
  );
}
function AllProposal() {
  const { allProposalsToGig, gig } = useLoaderData<typeof loader>();

  return (
    <Suspense fallback={<CreateProposalSkeleton />}>
      <Await resolve={allProposalsToGig}>
        {(allProposalsToGig) => {
          if (allProposalsToGig === null || allProposalsToGig.length === 0) {
            return <EmptyProposalState />;
          }

          return (
            <div className="flex flex-col gap-y-6">
              {allProposalsToGig.map((proposal) => {
                return (
                  <div
                    key={proposal.proposal.id}
                    className="flex flex-col gap-y-6"
                  >
                    {proposal.proposal.status === "OPEN" ? (
                      <SingleOpenProposal
                        proposal={proposal.proposal}
                        user={proposal.user}
                      />
                    ) : (
                      <SingleAcceptedOrCompletedProposal
                        proposal={proposal.proposal}
                        user={proposal.user}
                        gig={gig}
                      />
                    )}
                    <Separator />
                  </div>
                );
              })}
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
}

const FinishGigSchema = z.object({ type: z.literal("finish") });

function SingleAcceptedOrCompletedProposal({
  proposal,
  user,
  gig,
}: {
  proposal: ClientProposalRow;
  user: ClientUSerRow;
  gig: ClientGigRow;
}) {
  const finishGigFetcher = useFetcher<typeof action>();

  const [finishGigForm, { type }] = useForm({
    onValidate({ formData }) {
      return parse(formData, { schema: FinishGigSchema });
    },
  });

  const isFinishingGig =
    finishGigFetcher.state === "loading" ||
    finishGigFetcher.state === "submitting";

  return (
    <div className="flex flex-col gap-y-3">
      <p className="flex gap-x-2 items-center">
        <span>
          <span className="text-muted-foreground text-sm"> Proposed By:</span>{" "}
          {user.name || user.email}
        </span>
        <Badge>
          {gig.status === "COMPLETED" ? "Gig Completed" : "ACCEPTED"}{" "}
        </Badge>
      </p>
      <AutoSizeTextArea defaultValue={proposal.proposal} readOnly />
      {gig.status === "COMPLETED" ? null : (
        <finishGigFetcher.Form
          className="flex items-center gap-x-2"
          method="post"
          {...finishGigForm.props}
        >
          <Button
            type="submit"
            name={type.name}
            value="finish"
            className="flex gap-x-2"
          >
            Finish Gig
            <ClipLoader loading={isFinishingGig} color="white" size={16} />
          </Button>
        </finishGigFetcher.Form>
      )}
    </div>
  );
}

const AcceptOrRejectProposalSchema = z.object({
  type: z.union([z.literal("accept"), z.literal("reject")]),
  proposalId: z.string(),
});
function SingleOpenProposal({
  proposal,
  user,
}: {
  proposal: ClientProposalRow;
  user: ClientUSerRow;
}) {
  const updateProposalFetcher = useFetcher();
  const [proposalForm, { proposalId, type }] = useForm({
    onValidate({ formData }) {
      return parse(formData, { schema: AcceptOrRejectProposalSchema });
    },
  });

  const isSubmittingForm =
    updateProposalFetcher.state === "loading" ||
    updateProposalFetcher.state === "submitting";

  const isAcceptingProposal =
    isSubmittingForm &&
    updateProposalFetcher.formData?.get("type") === "accept" &&
    updateProposalFetcher.formData.get("proposalId") === proposal.id;

  const isRejectingProposal =
    isSubmittingForm &&
    updateProposalFetcher.formData?.get("type") === "reject" &&
    updateProposalFetcher.formData.get("proposalId") === proposal.id;

  return (
    <div className="flex flex-col gap-y-3">
      <p>
        <span className="text-muted-foreground text-sm"> Proposed By:</span>{" "}
        {user.name || user.email}
      </p>
      <AutoSizeTextArea defaultValue={proposal.proposal} readOnly />
      <updateProposalFetcher.Form
        className="flex items-center gap-x-2"
        method="post"
        {...proposalForm.props}
      >
        <input
          hidden
          {...conform.input(proposalId)}
          defaultValue={proposal.id}
        />

        <Button
          type="submit"
          name={type.name}
          value="accept"
          className="flex gap-x-2"
        >
          Accept Proposal
          <ClipLoader loading={isAcceptingProposal} color="white" size={16} />
        </Button>
        <Button
          variant="secondary"
          name={type.name}
          value={"reject"}
          className="flex gap-x-2"
        >
          Reject Proposal
          <ClipLoader loading={isRejectingProposal} color="black" size={16} />
        </Button>
      </updateProposalFetcher.Form>
    </div>
  );
}

function AddProposalForm() {
  const { proposal, gig } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

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
    <Suspense fallback={<CreateProposalSkeleton />}>
      <Await resolve={proposal}>
        {(proposal) => {
          const isCreatingProposal = proposal === null;

          const proposalStatus = (() => {
            if (
              proposal?.status === "REJECTED" ||
              (gig.status !== "CREATED" && proposal?.status !== "ACCEPTED")
            ) {
              return "REJECETD";
            } else if (proposal?.status === "ACCEPTED") {
              return "ACCEPTED";
            }

            return "OPEN";
          })();

          return (
            <Form
              className="flex flex-col gap-y-6"
              method="post"
              {...createGigForm.props}
            >
              <InputField>
                <div className="flex gap-x-2 items-center">
                  <Label>Your proposal:</Label>
                  {proposalStatus === "OPEN" ? null : (
                    <Badge>{proposalStatus}</Badge>
                  )}
                </div>
                <AutoSizeTextArea
                  placeholder="Your proposal..."
                  {...conform.textarea(proposalField)}
                  defaultValue={proposal ? proposal.proposal : undefined}
                  readOnly={proposalStatus !== "OPEN"}
                />
                <InputErrors errors={proposalField.errors} />
              </InputField>
              {proposalStatus === "OPEN" ? (
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
                      <ClipLoader
                        size={16}
                        loading={isDeletingProposal}
                        color="white"
                      />
                    </Button>
                  )}
                </div>
              ) : null}
            </Form>
          );
        }}
      </Await>
    </Suspense>
  );
}

function CreateProposalSkeleton() {
  return (
    <div className="flex flex-col gap-y-2">
      <Skeleton className="w-[720px] h-[90px] rounded-md" />
      <Skeleton className="w-[150px] h-[40px] rounded-md" />
    </div>
  );
}
