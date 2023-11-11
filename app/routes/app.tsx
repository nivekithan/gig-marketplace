import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { match, pathToRegexp } from "path-to-regexp";
import { invariantResponse } from "~/lib/utils/invariant.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const decodeUri = match<{ gigType: string }>("/app/:gigType/:left*", {
    decode: decodeURIComponent,
  });
  const url = new URL(request.url);

  const decodedUri = decodeUri(url.pathname);

  invariantResponse(
    decodedUri,
    "Unexpected Error. RegExp didn't match the url",
  );

  const gigType = decodedUri.params["gigType"];

  return json({ gigType: gigType });
}

export default function Component() {
  const { gigType } = useLoaderData<typeof loader>();

  return (
    <main className="flex">
      <div className="min-w-[15%] border-r min-h-screen"></div>
      <div className="mt-4 ml-4">
        <Tabs defaultValue={gigType}>
          <TabsList>
            <TabsTrigger value="latest">
              <Link to="/app/latest">Latest Gigs</Link>
            </TabsTrigger>
            <TabsTrigger value="created">
              <Link to="/app/created"> Created Gigs </Link>
            </TabsTrigger>
            <TabsTrigger value="assigned">
              <Link to="assigned">Assigned Gigs</Link>
            </TabsTrigger>
            <TabsTrigger value="proposed">
              <Link to="proposed"> Proposed Gigs </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Outlet />
      </div>
    </main>
  );
}
