import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Gift } from "lucide-react";
import { GigInfo } from "~/components/GigInfo";
import { Button } from "~/components/ui/button";
import { TextTitle } from "~/components/ui/text";
import {
  ClientGigRow,
  latestGigsNotCreatedBy,
  whiteLabelGigs,
} from "~/models/gigs.server";
import { requireUser } from "~/session";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request);
  const latestGigs = await latestGigsNotCreatedBy({ userId });

  return json({ gigs: latestGigs.map(whiteLabelGigs) });
}

export default function Component() {
  const { gigs } = useLoaderData<typeof loader>();
  const isLatestsGigsEmpty = gigs.length === 0;

  return isLatestsGigsEmpty ? (
    <LatestGigsEmptyState />
  ) : (
    <div>
      {gigs.map((gig) => {
        return <SingleGig {...gig} key={gig.id} />;
      })}
    </div>
  );
}

function LatestGigsEmptyState() {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-3">
        <TextTitle className="max-w-[500px] leading-8">
          Oh No! We could not find any latest gigs matching your skills
        </TextTitle>
        <p>
          Try updating your skills from the settings to get more search results
        </p>
      </div>
      <div>
        <Button>
          <Link to="app/settings">Change your skills</Link>
        </Button>
      </div>
    </div>
  );
}

function SingleGig({ name, description, createdAt, skills, id }: ClientGigRow) {
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
      />
    </Link>
  );
}
