import cron from "node-cron";
import "dotenv/config";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import dateFn from "date-and-time";
import fetchFareharborEvents from "./fetchFareharborEvents.js";

import JSONdb from "simple-json-db";
const db = new JSONdb("./storage.json");

const client = new JWT({
  email: process.env.EMAIL,
  key: process.env.KEY,
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ],
});
const calendar = google.calendar({ version: "v3" });

let fetchFareharborEventsLoopCount = 1;
const fetchFareharborEventsLoop = async () => {
  console.log(fetchFareharborEventsLoopCount);
  const events = await fetchFareharborEvents(fetchFareharborEventsLoopCount);
  console.log("Fetching events page: " + fetchFareharborEventsLoopCount);
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!db.has(event.id)) {
      //Creating Event
      try {
        const title = event.title;

        let calenderTitle = `${event.title} ${event.language}`;
        console.log(calenderTitle);

        const res = await calendar.events.insert({
          calendarId: process.env.CALENDER_ID,
          auth: client,
          requestBody: {
            //id: event.id,
            summary: calenderTitle,
            //location: locationRes,
            description: `${
              event.childs
                ? `${event.adults}a ${event.childs}n`
                : event.peopleCount
            } ${event.walker}\n${event.phone}\nLanguage: ${
              event.language
            }\nfareharbor.com`,
            start: {
              dateTime: event.start,
            },
            end: {
              dateTime: event.end,
            },
          },
        });

        console.log("Succesfullly added a event on Google calender from Fareharbor");

        //saving in local DB
        db.set(event.id, event);
       
      } catch (error) {
        console.log(error.errors);
        if (error.errors && error.errors[0].reason === "duplicate") {
          //saving in local DB
          db.set(event.id, event);
          console.log("Ignoring creation of duplicate event and continuing.");
          if (i === events.length - 1) {
            fetchFareharborEventsLoopCount++;
            await fetchFareharborEventsLoop(fetchFareharborEventsLoopCount);
          }
        } else {
          throw new Error(error);
        }
      }
    }
  }
};

const loop = async () => {
  await fetchFareharborEventsLoop();
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  fetchFareharborEventsLoopCount = 1;
  console.log("waiting for " + process.env.DELAY + " Second before next fetch");
  await delay(process.env.DELAY * 1000 || 3000);
  await loop();
};

export default loop;
// cron.schedule(`*/${process.env.CORN} * * * * *`, () => {
//   console.log("will execute every" + process.env.CORN + "second until stopped");
// });
