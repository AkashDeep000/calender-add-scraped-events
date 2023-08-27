import cron from "node-cron";
import "dotenv/config";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import dateFn from "date-and-time";
import fetchGuruwalkEvents from "./fetchGuruwalkEvents.js";
import fetchGuruwalkExtraInfo from "./fetchGuruwalkExtraInfo.js";
import JSONdb from "simple-json-db";
const db = new JSONdb("./storage.json");

const client = new JWT({
  email: process.env.EMAIL,
  key: process.env.KEY.split(String.raw`\n`).join("\n"),
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ],
});
const calendar = google.calendar({ version: "v3" });

let fetchGuruwalkEventsLoopCount = 1;
const fetchGuruwalkEventsLoop = async () => {
  const events = await fetchGuruwalkEvents(fetchGuruwalkEventsLoopCount);
  console.log("Fetching events page (Guruwalk): " + fetchGuruwalkEventsLoopCount);
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!db.has(event.id)) {
      //Creating Event
      try {
        const { location, duration } = await fetchGuruwalkExtraInfo(event.url);

        const title = event.title;

        let calendarTitle = "";
        if (title.toLowerCase().includes("tour")) {
          calendarTitle += title.split("Tour")[0] || title.split("tour");
          calendarTitle += "Tour";
          if (
            location &&
            title.toLowerCase().includes(location.toLowerCase())
          ) {
            calendarTitle += " " + location;
          }
        } else {
          calendarTitle += title;
        }
        // add language on title
        if (event.language.toLowerCase() === "english") {
          calendarTitle += " " + "🇬🇧";
        } else {
          calendarTitle += " " + event.language;
        }
        if (title.toLowerCase().includes("night")) {
          calendarTitle += " " + "Nocturn";
        }
        const description = `${event.peopleCount} ${event.walker}\n${event.phone}\nLanguage: ${event.language}\nguruwalk.com`;

        console.log({
          gwEvent: {
            title: calendarTitle,
            description,
          },
        });

        const res = await calendar.events.insert({
          calendarId: process.env.CALENDAR_ID,
          auth: client,
          requestBody: {
            id: event.id,
            summary: calendarTitle,
            description,
            start: {
              dateTime: event.time,
              //   timeZone: "Europe/Madrid",
            },
            end: {
              dateTime: dateFn.addMinutes(
                new Date(event.time),
                duration || 120
              ),
            },
          },
        });
        console.log("Succesfullly added a event from Guruwalk");
        // console.log(res);
        // saving in local DB
        db.set(event.id, event);
        // calling new page
        if (i === events.length - 1) {
          fetchGuruwalkEventsLoopCount++;
          await fetchGuruwalkEventsLoop(fetchGuruwalkEventsLoopCount);
        }
      } catch (error) {
        console.log(error.errors);
        if (error.errors && error.errors[0].reason === "duplicate") {
          //saving in local DB
          db.set(event.id, event);
          console.log("Ignoring creation of duplicate event and continuing.");
          if (i === events.length - 1) {
            fetchGuruwalkEventsLoopCount++;
            await fetchGuruwalkEventsLoop(fetchGuruwalkEventsLoopCount);
          }
        } else {
          throw new Error(error);
        }
      }
    }
  }
};

const loop = async () => {
  await fetchGuruwalkEventsLoop();
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  fetchGuruwalkEventsLoopCount = 1;
  console.log("waiting for " + (process.env.DELAY || 3) + " Second before next fetch (Guruwalk)");
  await delay(process.env.DELAY * 1000 || 3000);
  await loop();
};

export default loop;