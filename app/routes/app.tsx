import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, Link, Outlet, useLocation } from "@remix-run/react";
import {
  Bell,
  CreditCard,
  History,
  Home,
  LogOut,
  UserCircle2,
} from "lucide-react";
import { LinkGroup, LinkHeader, LinkItem } from "~/components/linkGroup";
import { Button } from "~/components/ui/button";
import { authSessionStorage, getAuthSession } from "~/session";
import { match } from "path-to-regexp";

export async function action({ request }: ActionFunctionArgs) {
  const authSession = await getAuthSession(request);

  return redirect("/auth", {
    headers: {
      "Set-Cookie": await authSessionStorage.destroySession(authSession),
    },
  });
}
export default function Component() {
  const location = useLocation();
  const decodeUri = match<{ setting: string }>("/app/settings/:setting", {
    decode: decodeURIComponent,
  });
  const matchedNavPath = decodeUri(location.pathname);
  const matchedPath = matchedNavPath
    ? matchedNavPath.params["setting"]
    : "home";

  return (
    <main className="flex container-2xl">
      <div className="min-w-[15%] border-r min-h-screen">
        <div className="mt-4 flex flex-col gap-y-3">
          <div className="px-4">
            <Button
              variant={matchedPath === "home" ? "secondary" : "ghost"}
              asChild
              className="font-semibold tracking-tight flex gap-x-2 justify-start"
            >
              <Link to="/app/gig/type/latest">
                <Home size={16} /> Home
              </Link>
            </Button>
          </div>
          <LinkGroup>
            <LinkHeader>General</LinkHeader>
            <LinkItem
              to="/app/settings/profile"
              active={matchedPath === "profile"}
            >
              <UserCircle2 size="16" />
              Profile
            </LinkItem>
            <LinkItem
              to="/app/settings/notifications"
              active={matchedPath === "notifications"}
            >
              <Bell size="16" /> Notifications
            </LinkItem>
          </LinkGroup>
          <LinkGroup>
            <LinkHeader>Billing</LinkHeader>
            <LinkItem
              to="/app/settings/credits"
              active={matchedPath === "credits"}
            >
              <CreditCard size={16} /> Credits
            </LinkItem>
            <LinkItem
              to="/app/settings/paymentHistory"
              active={matchedPath === "paymentHistory"}
            >
              <History size={16} /> Payment History
            </LinkItem>
          </LinkGroup>

          <Form method="post" className="px-4">
            <Button
              variant={"link"}
              type="submit"
              name="type"
              value="logout"
              className="font-semibold tracking-tight flex gap-x-2"
            >
              <LogOut size={16} /> Logout
            </Button>
          </Form>
        </div>
      </div>
      <div className="mt-4 ml-4 flex-1">
        <Outlet />
      </div>
    </main>
  );
}
