import { Outlet } from "@remix-run/react";

export default function Component() {
  return (
    <main className="flex">
      <div className="min-w-[15%] border-r min-h-screen"></div>
      <div className="mt-4 ml-4 flex-1">
        <Outlet />
      </div>
    </main>
  );
}
