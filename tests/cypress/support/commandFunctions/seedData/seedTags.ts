import type { TagCreateInput } from "../../../../__generated__/graphql";

const baseTags: string[] = [
  "trivia",
  "music",
  "charityEvent",
  "newYears",
  "Selena",
];

const tags: TagCreateInput[] = baseTags.map((text) => ({
  text,
}));

export default tags;
