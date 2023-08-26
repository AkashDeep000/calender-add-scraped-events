import cron from "node-cron";
import "dotenv/config";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import dateFn from "date-and-time";
import fetchGuruwalkEvents from "./fetchGuruwalkEvents.js";
import fetchGuruwalkLocation from "./fetchGuruwalkLocation.js";
import JSONdb from "simple-json-db";
const db = new JSONdb("./storage.json");

const client = new JWT({
  email: process.env.EMAIL,
  key: process.env.KEY.split(String.raw`\n`).join('\n'),
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ],
});
const calendar = google.calendar({ version: "v3" });

let fetchGuruwalkEventsLoopCount = 1;
const fetchGuruwalkEventsLoop = async () => {
  console.log(fetchGuruwalkEventsLoopCount);
  const events = await fetchGuruwalkEvents(fetchGuruwalkEventsLoopCount);
  console.log("Fetching events page: " + fetchGuruwalkEventsLoopCount);
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!db.has(event.id)) {
      //Creating Event
      try {
        const { location, duration } = await fetchGuruwalkLocation(event.url);
        
        const title = event.title;
        const getShortLocation = (title, locationRes) => {
          const locationWords = location.split(/[ ,]+/);
          const titleWords = title.split(" ");
          let shortLocation = "";
          for (let i = 0; i < titleWords.length; i++) {
            for (let j = 0; j < locationWords.length; j++) {
              if (
                titleWords[i].toLowerCase() === locationWords[j].toLowerCase()
              ) {
                if (shortLocation) {
                  shortLocation += " ";
                }
                shortLocation += titleWords[i];
              }
            }
          }
          return shortLocation;
        };
        const shortLocation = getShortLocation(title, location);

        let calenderTitle = "";
        if (shortLocation) {
          calenderTitle += title.split(shortLocation)[0] + shortLocation;
        } else if (title.toLowerCase().includes("tour")) {
          function split(str, index) {
            const result = [str.slice(0, index), str.slice(index)];
            return result;
          }
          console.log(split(title, title.toLowerCase().indexOf("tour")));
          calenderTitle += title.split("tour")[0] + "Tour";
        } else {
          calenderTitle += "Tour";
        }
        // add language on title
        if (event.language.toLowerCase() === "english") {
          calenderTitle += " " + "🇬🇧";
        } else if (event.language.toLowerCase() !== "spanish") {
          calenderTitle += " " + event.language;
        }
        if (title.toLowerCase().includes("night")) {
          calenderTitle += " " + "Nocturn";
        }
        console.log(calenderTitle);

        const res = await calendar.events.insert({
          calendarId: process.env.CALENDER_ID,
          auth: client,
          requestBody: {
            id: event.id,
            summary: calenderTitle,
            //location: locationRes,
            description: `${event.peopleCount} ${event.walker}\n${event.phone}\nLanguage: ${event.language}\nguruwalk.com`,
            start: {
              dateTime: event.time,
              //   timeZone: "Europe/Madrid",
            },
            end: {
              dateTime: dateFn.addMinutes(new Date(event.time), duration),
            },
          },
        });
        console.log("Succesfullly added a event on Google calender");
        //  console.log(res);
        //saving in local DB
        db.set(event.id, event);
        //calling new page
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
  console.log("waiting for " + process.env.DELAY + " Second before next fetch");
  await delay(process.env.DELAY * 1000 || 3000);
  await loop();
};

export default loop;
// cron.schedule(`*/${process.env.CORN} * * * * *`, () => {
//   console.log("will execute every" + process.env.CORN + "second until stopped");
// });
