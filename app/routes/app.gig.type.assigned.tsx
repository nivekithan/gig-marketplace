import { LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { GigInfo } from "~/components/GigInfo";
import { Button } from "~/components/ui/button";
import { TextTitle } from "~/components/ui/text";
import {
  getAllAssignedGigsForUser,
  whiteLabelGigs,
} from "~/models/gigs.server";
import { requireUser } from "~/session";

export function meta(): ReturnType<MetaFunction> {
  return [{ title: "Assigned gigs" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request);
  const gigs = await getAllAssignedGigsForUser({ userId });

  return json({ gigs: gigs.map(whiteLabelGigs) });
}

export default function Component() {
  const { gigs } = useLoaderData<typeof loader>();

  return gigs.length === 0 ? (
    <AssignedPageEmptyState />
  ) : (
    <div className="max-w-[720px] flex flex-col gap-y-3">
      {gigs.map((gig) => {
        return (
          <div
            className="p-4 border transition-colors hover:border-primary rounded-md"
            key={gig.id}
          >
            <Link to={`/app/gig/g/${gig.id}`}>
              <GigInfo {...gig} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function AssignedPageEmptyState() {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-3">
        <TextTitle>You have not assigned to any gigs yet</TextTitle>
        <p>Click below to search for other gigs</p>
      </div>
      <div>
        <Button asChild>
          <Link to="/app/gig/type/latest">Serach gigs</Link>
        </Button>
      </div>
    </div>
  );
}
