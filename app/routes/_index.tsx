import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { requireUser } from "~/session";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);

  return null;
}
export default function Index() {
  return <h1>Hello world</h1>;
}
