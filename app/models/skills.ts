export const validSkills = [
  "NextJs",
  "React",
  "Typescript",
  "Javascript",
  "Nodejs",
] as const;

export type ValidGigSkills = (typeof validSkills)[number];
