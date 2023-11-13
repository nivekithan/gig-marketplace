import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { TextTitle } from "~/components/ui/text";
import {
  ClientGigRow,
  deleteGig,
  editGigs,
  getGigsCreatedBy,
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
import { useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";
import { ValidGigSkills, validSkills } from "~/models/skills";
import { Badge } from "~/components/ui/badge";
import { GigInfo } from "~/components/GigInfo";

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

  const { description, id, name, price, type } = submission.value;
  if (type === "edit") {
    const updatedGig = await editGigs({
      createdBy: userId,
      description,
      id,
      name,
      price,
    });

    return json({ updatedGig: whiteLabelGigs(updatedGig), submission });
  } else if (type === "delete") {
    const deletedGig = await deleteGig({ createdBy: userId, id });

    return json({ deletedGig: whiteLabelGigs(deletedGig), submission });
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
        <Button>
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
  price: z.number().positive().int(),
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
      price: priceField,
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

  useEffect(() => {
    if (!isSubmitingForm) {
      setIsSheetOpen(false);
    }
  }, [isSubmitingForm]);

  return (
    <Sheet open={isSheetOpen} onOpenChange={(v) => setIsSheetOpen(v)}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="p-4  border rounded-md w-[720px] transition-colors hover:border-primary text-start"
        >
          <GigInfo
            createdAt={createdAt}
            description={description}
            name={name}
            skills={skills}
            price={price}
          />
        </button>
      </SheetTrigger>
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
          className="flex flex-col gap-y-3 mt-6"
        >
          <GigCreateOrEditFields
            description={descriptionField}
            name={nameField}
            price={priceField}
            defaultDescription={description}
            defaultName={name}
            defaultPrice={price}
            defaultSkills={skills}
            skills={skillsField}
          />
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
