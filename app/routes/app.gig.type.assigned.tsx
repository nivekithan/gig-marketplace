import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { GigInfo } from "~/components/GigInfo";
import {
  getAllAssignedGigsForUser,
  whiteLabelGigs,
} from "~/models/gigs.server";
import { requireUser } from "~/session";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request);
  const gigs = await getAllAssignedGigsForUser({ userId });

  return json({ gigs: gigs.map(whiteLabelGigs) });
}

export default function Component() {
  const { gigs } = useLoaderData<typeof loader>();

  return (
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
