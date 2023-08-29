import "dotenv/config";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import fetchFareharborEvents from "./fetchFareharborEvents.js";
import fetchPreviousEvent from "./fetchPreviousEvent.js";
import fetchGuruwalkExtraInfo from "./fetchGuruwalkExtraInfo.js";
import db from "../db/index.js";
import dateFn from "date-and-time";

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
    let gwEnd;
    if (event.id.startsWith("gw")) {
      const getGWEnd = async () => {
        if (!event.url) return null;
        try {
          const { duration } = await fetchGuruwalkExtraInfo(event.url);
          return dateFn.addMinutes(new Date(event.start), duration || 120);
        } catch (e) {
          console.log(e);
          return dateFn.addMinutes(new Date(event.start), 120);
        }
      };
      gwEnd = await getGWEnd();
    }

    //Creating Event
    try {
      const calendarTitle = event.title;
      const description = `${
        event.childs ? `${event.adults}a ${event.childs}n` : event.peopleCount
      } ${event.walker}\n${event.phone}\n${site}`;

      const previousEvent = await fetchPreviousEvent(
        event.start,
        gwEnd || event.end,
        event.title
      );

      if (!previousEvent) {
        const res = await calendar.events.insert({
          calendarId: process.env.CALENDAR_ID,
          auth: client,
          requestBody: {
            summary: event.peopleCount + " " + calendarTitle,
            description: description,
            start: {
              dateTime: event.start,
            },
            end: {
              dateTime: gwEnd || event.end,
            },
          },
        });
      } else {
        const res = await calendar.events.update({
          calendarId: process.env.CALENDAR_ID,
          auth: client,
          eventId: previousEvent.id,
          requestBody: {
            summary: `${
              parseInt(previousEvent.summary.replace(/(^\d+)(.+$)/i, "$1")) +
              (previousEvent.description.includes(description)
                ? 0
                : parseInt(event.peopleCount))
            } ${
              event.id.startsWith("fh")
                ? event.title
                : previousEvent.summary
                    .replace(
                      previousEvent.summary.replace(/(^\d+)(.+$)/i, "$1"),
                      ""
                    )
                    .trim()
            }`,

            description: (
              previousEvent.description.replace(description, "") +
              "\n\n" +
              description
            )
              .replace(/((?:\r\n?|\n)+)$|(?:\r\n?|\n){2,}/g, function ($0, $1) {
                return $1 ? "" : "\n\n";
              })
              .trim(),
            start: previousEvent.start,
            end: previousEvent.end,
          },
        });
      }

      console.log({
        addedEvent: {
          title: event.peopleCount + " " + calendarTitle,
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
