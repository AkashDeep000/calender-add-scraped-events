import "dotenv/config";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import fetchFareharborEvents from "./fetchFareharborEvents.js";
import fetchPreviousEvent from "./fetchPreviousEvent.js";
import db from "../db/index.js";
const client = new JWT({
  email: process.env.EMAIL,
  key: process.env.KEY.split(String.raw`\n`).join("\n"),
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ],
});
const calendar = google.calendar({ version: "v3" });

const addEvent = async (event, site) => {
  if (!db.has(event.id)) {
    //Creating Event
    try {
      const calendarTitle = event.title;
      const description = `${
        event.childs ? `${event.adults}a ${event.childs}n` : event.peopleCount
      } ${event.walker}\n${event.phone}\n${site}`;

      const previousEvent = await fetchPreviousEvent(event.start, event.end);

      if (!previousEvent) {
        const res = await calendar.events.insert({
          calendarId: process.env.CALENDAR_ID,
          auth: client,
          requestBody: {
            summary: calendarTitle,
            description: description,
            start: {
              dateTime: event.start,
            },
            end: {
              dateTime: event.end,
            },
          },
        });
      } else {
        const res = await calendar.events.update({
          calendarId: process.env.CALENDAR_ID,
          auth: client,
          eventId: previousEvent.id,
          requestBody: {
            summary:
              (site === "FareHarbor" ? event.title : previousEvent.summary),
            description:
              previousEvent.description
                .replace(description, "")
                .replace("\n\n\n", "") +
              "\n\n" +
              description,
            start: previousEvent.start,
            end: previousEvent.end,
          },
        });
      }

      console.log({
        addedEvent: {
          title: calendarTitle,
          description,
          start: event.start,
          site,
        },
      });

      //saving in local DB
      db.set(event.id, true);
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
};

export default addEvent;
