import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { match } from "path-to-regexp";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

export async function loader({ request }: LoaderFunctionArgs) {
  const decodeUri = match<{ gigType: string }>(
    "/app/gig/type/:gigType/:left*",
    {
      decode: decodeURIComponent,
    },
  );
  const url = new URL(request.url);

  const decodedUri = decodeUri(url.pathname);

  if (!decodedUri) {
    throw redirect("/app/gig/type/latest");
  }

  const gigType = decodedUri.params["gigType"];

  return json({ gigType: gigType });
}

export default function Component() {
  const { gigType } = useLoaderData<typeof loader>();

  return (
    <div>
      <div>
        <Tabs defaultValue={gigType}>
          <TabsList>
            <TabsTrigger value="latest" asChild>
              <Link to="/app/gig/type/latest">Latest Gigs</Link>
            </TabsTrigger>
            <TabsTrigger value="created" asChild>
              <Link to="/app/gig/type/created"> Created Gigs </Link>
            </TabsTrigger>
            <TabsTrigger value="assigned" asChild>
              <Link to="/app/gig/type/assigned">Assigned Gigs</Link>
            </TabsTrigger>
            <TabsTrigger value="proposed" asChild>
              <Link to="/app/gig/type/proposed"> Proposed Gigs </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
