import { LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { GigInfo } from "~/components/GigInfo";
import { InputField } from "~/components/inputField";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TextTitle } from "~/components/ui/text";
import {
  ClientGigRow,
  latestGigsNotCreatedBy,
  searchGigsForQuery,
  whiteLabelGigs,
} from "~/models/gigs.server";
import { requireUser } from "~/session";
import * as Spinners from "react-spinners";

const ClipLoader = Spinners.ClipLoader;

console.log({ ClipLoader });

export function meta(): ReturnType<MetaFunction> {
  return [{ title: "Latests gigs" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request);
  const url = new URL(request.url);
  const queryParam = url.searchParams.get("q");

  if (!queryParam) {
    const latestGigs = await latestGigsNotCreatedBy({ userId });
    return json({ gigs: latestGigs.map(whiteLabelGigs) });
  } else {
    const gigs = await searchGigsForQuery({ query: queryParam });
    return json({ gigs: gigs.map(whiteLabelGigs) });
  }
}

export default function Component() {
  const { gigs } = useLoaderData<typeof loader>();
  const isLatestsGigsEmpty = gigs.length === 0;

  const navigation = useNavigation();
  const isSearching = navigation.state === "loading";

  const [searchParams] = useSearchParams();
  const queryValue = searchParams.get("q");

  return (
    <div className="max-w-[720px] flex flex-col gap-y-6">
      <Form>
        <InputField>
          <Input
            className="rounded-full h-[48px] px-4"
            placeholder="Search for gigs..."
            name="q"
            defaultValue={queryValue || undefined}
          />
          <div className="min-h-[25px] min-w-[25px]">
            <ClipLoader size={16} color="black" loading={isSearching} />
          </div>
        </InputField>
      </Form>
      {isLatestsGigsEmpty ? (
        <LatestGigsEmptyState />
      ) : (
        <div className="flex flex-col gap-y-6">
          {gigs.map((gig) => {
            return <SingleGig {...gig} key={gig.id} />;
          })}
        </div>
      )}
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
