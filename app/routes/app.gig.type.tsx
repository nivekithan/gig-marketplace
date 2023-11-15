import { Link, Outlet, useLocation } from "@remix-run/react";
import { match } from "path-to-regexp";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default function Component() {
  const pathName = useLocation().pathname;
  const decodeUri = match<{ gigType: string }>(
    "/app/gig/type/:gigType/:left*",
    {
      decode: decodeURIComponent,
    },
  );
  const decodedUri = decodeUri(pathName);

  if (!decodedUri) {
    throw new Error("Unexpected Error: Unkown path");
  }

  const gigType = decodedUri.params["gigType"];

  return (
    <div>
      <div>
        <Tabs value={gigType}>
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
