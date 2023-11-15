import { TextTitle } from "./ui/text";
import { formatRelative } from "date-fns";
import { Badge } from "./ui/badge";
import { ValidGigSkills } from "~/models/skills";
import { Button } from "./ui/button";
import { ClientGigRow } from "~/models/gigs.server";

export function CompactGigInfo({
  createdAt,
  description,
  status,
  name,
  skills,
  price,
}: ClientGigRow) {
  const postedBefore = formatRelative(new Date(createdAt), new Date());

  return (
    <div className="flex flex-col gap-y-3 max-w-[400px]">
      <div className="flex flex-col gap-y-2 items-start">
        <TextTitle className="text-md">{name}</TextTitle>
        <p className="text-xs text-muted-foreground flex gap-x-2 items-center">
          <span>Posted on {postedBefore}</span>
          {status === "CREATED" ? null : (
            <Badge className="text-xs">{status}</Badge>
          )}
        </p>
        <p className="text-sm line-clamp-3">{description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-x-2 flex-wrap">
          {skills.map((skill) => {
            return (
              <Badge id="skill" variant="secondary" key={skill}>
                {skill}
              </Badge>
            );
          })}
        </div>
        <Button asChild variant="secondary">
          <p className="font-semibold text-sm">$ {price}</p>
        </Button>
      </div>
    </div>
  );
}

export function GigInfo({
  name,
  skills,
  description,
  createdAt,
  price,
  status,
}: {
  name: string;
  skills: ValidGigSkills[];
  description: string;
  createdAt: string;
  price: number;
  status: ClientGigRow["status"];
}) {
  const postedBefore = formatRelative(new Date(createdAt), new Date());
  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex flex-col gap-y-2 items-start">
        <TextTitle className="text-md">{name}</TextTitle>
        <p className="text-xs text-muted-foreground flex gap-x-2 items-center">
          <span>Posted on {postedBefore}</span>
          {status === "CREATED" ? null : (
            <Badge className="text-xs">{status}</Badge>
          )}
        </p>
        <p className="text-sm line-clamp-3">{description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-x-2 flex-wrap">
          {skills.map((skill) => {
            return (
              <Badge id="skill" variant="secondary" key={skill}>
                {skill}
              </Badge>
            );
          })}
        </div>
        <Button asChild variant="secondary">
          <p className="font-semibold text-sm">$ {price}</p>
        </Button>
      </div>
    </div>
  );
}

export type ExpandedGigInfoProps = {
  name: string;
  createdAt: string;
  description: string;
  skills: ValidGigSkills[];
  price: number;
  noOfProposal: number;
};

export function ExpandedGigInfo({
  createdAt,
  description,
  name,
  skills,
  price,
  noOfProposal,
}: ExpandedGigInfoProps) {
  const postedBefore = formatRelative(new Date(createdAt), new Date());
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-4 items-start">
        <TextTitle className="text-xl">{name}</TextTitle>
        <p className="text-xs text-muted-foreground">
          Posted on {postedBefore} | {noOfProposal} Proposals
        </p>
        <p className="text-base">{description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-x-3 flex-wrap">
          {skills.map((skill) => {
            return (
              <Badge id="skill" variant="secondary" key={skill}>
                {skill}
              </Badge>
            );
          })}
        </div>
        <Button asChild variant="secondary">
          <p className="font-semibold text-sm">$ {price}</p>
        </Button>
      </div>
    </div>
  );
}
