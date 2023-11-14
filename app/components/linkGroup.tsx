import { Link } from "@remix-run/react";
import React from "react";
import { Button } from "./ui/button";

export type LinkGroupProps = {
  children: React.ReactNode;
};

export function LinkGroup({ children }: LinkGroupProps) {
  return <ul className="px-4">{children}</ul>;
}

export type LinkHeaderProps = {
  children: React.ReactNode;
};

export function LinkHeader({ children }: LinkHeaderProps) {
  return (
    <h2 className="text-lg font-semibold tracking-tight px-4 mb-2">
      {children}
    </h2>
  );
}

export type LinkItemProps = {
  children: React.ReactNode;
  to: string;
  active: boolean;
};

export function LinkItem({ children, to, active }: LinkItemProps) {
  return (
    <li>
      <Button
        variant={active ? "secondary" : "ghost"}
        asChild
        className="justify-start w-full"
      >
        <Link to={to} className="flex gap-x-2">
          {children}
        </Link>
      </Button>
    </li>
  );
}
