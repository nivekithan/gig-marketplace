import { LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { GigInfo } from "~/components/GigInfo";
import { Button } from "~/components/ui/button";
import { TextTitle } from "~/components/ui/text";
import { ClientGigRow, getAllGigsProposedByUser } from "~/models/gigs.server";
import { requireUser } from "~/session";

export function meta(): ReturnType<MetaFunction> {
  return [{ title: "Proposed gigs" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request);
  const gigsProposedByUser = await getAllGigsProposedByUser({ userId });

  return json({ gigs: gigsProposedByUser });
}

export default function Component() {
  const { gigs } = useLoaderData<typeof loader>();
  return gigs.length === 0 ? (
    <ProposedEmptyState />
  ) : (
    <div className="flex flex-col gap-y-3">
      {gigs.map((gig) => {
        return <SingleGig {...gig} key={gig.id} />;
      })}
    </div>
  );
}

function ProposedEmptyState() {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-3">
        <TextTitle>You have not proposed to any gigs yet</TextTitle>
        <p>Click below to search for gigs posted by others</p>
      </div>
      <div>
        <Button asChild>
          <a href="/app/gig/type/latest">Search for gigs</a>
        </Button>
      </div>
    </div>
  );
}

function SingleGig({
  name,
  description,
  createdAt,
  skills,
  id,
  price,
  status,
}: ClientGigRow) {
  return (
    <Link
      to={`/app/gig/g/${id}`}
      className="p-4 border rounded-md max-w-[720px] transition-colors hover:border-primary text-start block"
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
  );
}
