import "dotenv/config";
import dateFn from "date-and-time";
import fetchGuruwalkEvents from "./fetchGuruwalkEvents.js";
import fetchPreviousEvent from "./fetchPreviousEvent.js";
import addEvent from "./addEvent.js";
import db from "../db/index.js";

let fetchGuruwalkEventsLoopCount = 1;
const fetchGuruwalkEventsLoop = async () => {
  const events = await fetchGuruwalkEvents(fetchGuruwalkEventsLoopCount);
  console.log(
    "Fetching events page (Guruwalk): " + fetchGuruwalkEventsLoopCount
  );

  const haveNextFn = () => {
    let haveNextPage = false;

    for (let i = 0; i < events.length; i++) {
      if (events.length !== 0 && !db.has(events[events.length - 1].id)) {
        haveNextPage = true;
      }
    }
    return haveNextPage;
  };

  const haveNext = haveNextFn();
  console.log({ haveNext });

  for (let i = 0; i < events.length; i++) {
     await addEvent(events[i], "GW");
  }

  if (haveNext) {
    fetchGuruwalkEventsLoopCount++;
    await fetchGuruwalkEventsLoop();
  }
};

const loop = async () => {
  await fetchGuruwalkEventsLoop();
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  fetchGuruwalkEventsLoopCount = 1;
  console.log(
    "waiting for " +
      (process.env.DELAY || 3) +
      " Second before next fetch (Guruwalk)"
  );
  await delay(process.env.DELAY * 1000 || 3000);
  await loop();
};

export default loop;
