import events from "../../seedData/events";
import createEvents from "../createEvents"

const seedEvents = () => {
  createEvents(events);
};

export default seedEvents;
