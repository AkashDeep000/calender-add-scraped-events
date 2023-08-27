import "dotenv/config";
import dateFn from "date-and-time";
import fetchFareharborEvents from "./fetchFareharborEvents.js";
import fetchPreviousEvent from "./fetchPreviousEvent.js";
import addEvent from "./addEvent.js";
import JSONdb from "simple-json-db";
const db = new JSONdb("./storage.json");

let fetchFareharborEventsLoopCount = 1;
const fetchFareharborEventsLoop = async () => {
  const events = await fetchFareharborEvents(fetchFareharborEventsLoopCount);
  console.log(
    "Fetching events page (Fareharbor): " + fetchFareharborEventsLoopCount
  );

  const haveNextFn = () => {
    let isRelavent = false;
    let haveNextPage = false;

    for (let i = 0; i < events.length; i++) {
      if (
        dateFn.subtract(new Date(), new Date(events[i].start)).toDays() < 60
      ) {
        isRelavent = true;
      }

      if (events.length !== 0 && !db.has(events[events.length - 1].id)) {
        haveNextPage = true;
      }
    }
    return isRelavent && haveNextPage;
  };

  const haveNext = haveNextFn();
  console.log({ haveNext });

  for (let i = 0; i < events.length; i++) {
    if (dateFn.subtract(new Date(), new Date(events[i].start)).toDays() < 1) {
      await addEvent(events[i], "FareHarbor");
    }
  }

  if (haveNext) {
    fetchFareharborEventsLoopCount++;
    await fetchFareharborEventsLoop();
  }
};
const loop = async () => {
  await fetchFareharborEventsLoop();
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  fetchFareharborEventsLoopCount = 1;
  console.log(
    "waiting for " +
      (process.env.DELAY || 3) +
      " Second before next fetch (Fareharbor)"
  );
  await delay(process.env.DELAY * 1000 || 3000);
  await loop();
};

export default loop;
