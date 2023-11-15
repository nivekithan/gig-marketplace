import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  json,
} from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { TextTitle } from "~/components/ui/text";
import {
  ClientGigRow,
  deleteGig,
  editGigs,
  getGigsCreatedBy,
  gigById,
  whiteLabelGigs,
} from "~/models/gigs.server";
import { requireUser } from "~/session";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { GigCreateOrEditFields } from "~/components/GigCreateEditFormFields";
import { z } from "zod";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { useState } from "react";
import { ValidGigSkills, validSkills } from "~/models/skills";
import { GigInfo } from "~/components/GigInfo";
import { CornerRightUp } from "lucide-react";
import { addCreditsToUser } from "~/models/user.server";
import { db } from "~/lib/utils/db.server";
import getUrls from "get-urls";
import { verifyUrlisGood } from "~/lib/utils/pangea.server";
import { addError } from "~/lib/utils/conform.server";
import * as Spinners from "react-spinners";

const ClipLoader = Spinners.ClipLoader;

export function meta(): ReturnType<MetaFunction> {
  return [{ title: "All created gigs" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request);

  const gigs = await getGigsCreatedBy({ userId });

  return json({ gigs: gigs.map(whiteLabelGigs) });
}

export async function action({ request }: ActionFunctionArgs) {
  const [userId, formData] = await Promise.all([
    requireUser(request),
    request.formData(),
  ]);

  const submission = parse(formData, { schema: EditOrDeleteGigSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json({ submission });
  }

  const { description, id, name, type } = submission.value;
  if (type === "edit") {
    const allUrlsInDescription = getUrls(description);

    const urlStatus = await Promise.all(
      new Array(...allUrlsInDescription).map(async (url) => {
        return { url: url, isSafe: await verifyUrlisGood(url) };
      }),
    );

    let isUrlSafe = true;

    urlStatus.forEach(({ isSafe, url }) => {
      if (!isSafe) {
        isUrlSafe = false;
      }

      addError({
        submission,
        key: "description",
        error: `Url: ${url} is considered to be harmful. Please remove it from the description`,
      });
    });

    if (!isUrlSafe) {
      return json({ submission }, { status: 400 });
    }

    const updatedGig = await editGigs({
      createdBy: userId,
      description,
      id,
      name,
    });

    return json({ updatedGig: whiteLabelGigs(updatedGig), submission });
  } else if (type === "delete") {
    db.transaction(async () => {
      const gigDetails = await gigById({ id });

      await deleteGig({ createdBy: userId, id });

      if (!gigDetails) {
        throw new Error(`Unexpected Error: There is no gig with id ${id} `);
      }

      await addCreditsToUser({ credits: gigDetails.price, userId });
    });

    return json({ submission });
  }
}

export default function Component() {
  const { gigs } = useLoaderData<typeof loader>();

  return gigs.length === 0 ? (
    <CreatedGigsEmptyState />
  ) : (
    <div className="flex flex-col gap-y-6">
      <div>
        <Button asChild variant="default" size="sm">
          <Link to="/app/gig/create">Create new gig</Link>
        </Button>
      </div>
      {gigs.map((gig) => {
        return <SingleGig {...gig} key={gig.id} />;
      })}
    </div>
  );
}

function CreatedGigsEmptyState() {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-3">
        <TextTitle>You have not created any gigs yet</TextTitle>
        <p>Click below to start creating gigs for others to finish</p>
      </div>
      <div>
        <Button asChild>
          <Link to="/app/gig/create">Create new gig</Link>
        </Button>
      </div>
    </div>
  );
}

const EditOrDeleteGigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.union([z.literal("edit"), z.literal("delete")]),
  skills: z.array(
    z.union(
      validSkills.map((skill) => z.literal(skill)) as [
        z.ZodLiteral<ValidGigSkills>,
        z.ZodLiteral<ValidGigSkills>,
      ],
    ),
  ),
});

function SingleGig({
  name,
  id,
  description,
  createdAt,
  price,
  skills,
  status,
}: ClientGigRow) {
  const editGigFetcher = useFetcher<typeof action>();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isSubmitingForm =
    editGigFetcher.state === "loading" || editGigFetcher.state === "submitting";

  const isEditingGig =
    isSubmitingForm && editGigFetcher.formData?.get("type") === "edit";
  const isDeletingGig =
    isSubmitingForm && editGigFetcher.formData?.get("type") === "delete";

  const [
    updateGigForm,
    {
      description: descriptionField,
      id: idField,
      name: nameField,
      skills: skillsField,
    },
  ] = useForm({
    lastSubmission: editGigFetcher.data?.submission,
    onValidate({ formData }) {
      return parse(formData, {
        schema: EditOrDeleteGigSchema,
      });
    },
  });

  return (
    <Sheet open={isSheetOpen} onOpenChange={(v) => setIsSheetOpen(v)}>
      <div className="flex flex-col gap-y-2">
        <Link
          type="button"
          className="p-4  border rounded-md w-[720px] transition-colors hover:border-primary text-start"
          to={`/app/gig/g/${id}`}
        >
          <GigInfo
            createdAt={createdAt}
            description={description}
            name={name}
            skills={skills}
            price={price}
            status={status}
          />
        </Link>
        <div>
          <SheetTrigger asChild>
            <Button variant="secondary" className="flex gap-x-2">
              <span> Edit Proposal </span>
              <CornerRightUp size={14} />
            </Button>
          </SheetTrigger>
        </div>
      </div>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Gig</SheetTitle>
          <SheetDescription>
            Make changes to your gig here. Click save when you are done.
          </SheetDescription>
        </SheetHeader>
        <editGigFetcher.Form
          method="post"
          {...updateGigForm.props}
          className="flex flex-col gap-y-6 mt-6"
        >
          <div className="flex flex-col gap-y-3">
            <GigCreateOrEditFields
              description={descriptionField}
              name={nameField}
              defaultDescription={description}
              defaultName={name}
              defaultSkills={skills}
              skills={skillsField}
            />
          </div>
          <input hidden {...conform.input(idField)} defaultValue={id} />
          <div className="flex gap-x-4 items-center">
            <Button
              type="submit"
              className="text-primary-foreground flex gap-x-2"
              name="type"
              value="edit"
            >
              Save changes
              <ClipLoader size={16} color="white" loading={isEditingGig} />
            </Button>
            <Button
              variant={"destructive"}
              type="submit"
              name="type"
              value="delete"
              size="sm"
              className="flex gap-x-2"
            >
              Delete Gig
              <ClipLoader size={16} color="white" loading={isDeletingGig} />
            </Button>
          </div>
        </editGigFetcher.Form>
      </SheetContent>
    </Sheet>
  );
}
