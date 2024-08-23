import discussions from "../../seedData/discussions";
import createDiscussions from "../createDiscussions"

const seedDiscussions = () => {
  createDiscussions(discussions);
};

export default seedDiscussions;