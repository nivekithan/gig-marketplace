import { TextTitle } from "./ui/text";
import formatRelative from "date-fns/formatRelative";
import { Badge } from "./ui/badge";
import { ValidGigSkills } from "~/models/skills";
import { Button } from "./ui/button";

export function GigInfo({
  name,
  skills,
  description,
  createdAt,
  price,
}: {
  name: string;
  skills: ValidGigSkills[];
  description: string;
  createdAt: string;
  price: number;
}) {
  const postedBefore = formatRelative(new Date(createdAt), new Date());
  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex flex-col gap-y-2 items-start">
        <TextTitle className="text-md">{name}</TextTitle>
        <p className="text-xs text-muted-foreground">
          Posted on {postedBefore}
        </p>
        <p className="text-sm line-clamp-3">{description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-x-2 flex-wrap">
          {skills.map((skill) => {
            return (
              <Badge id="skill" variant="secondary">
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
  id: string;
  name: string;
  createdAt: string;
  description: string;
  skills: ValidGigSkills[];
  price: number;
};

export function ExpandedGigInfo({
  createdAt,
  description,
  id,
  name,
  skills,
  price,
}: ExpandedGigInfoProps) {
  const postedBefore = formatRelative(new Date(createdAt), new Date());
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-4 items-start">
        <TextTitle className="text-xl">{name}</TextTitle>
        <p className="text-xs text-muted-foreground">
          Posted on {postedBefore}
        </p>
        <p className="text-base">{description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-x-3 flex-wrap">
          {skills.map((skill) => {
            return (
              <Badge id="skill" variant="secondary">
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
