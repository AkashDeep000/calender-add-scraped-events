import "dotenv/config";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
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

const fetchPreviousEvent = async (start, end, title) => {
  try {
    const res = await calendar.events.list({
      calendarId: process.env.CALENDAR_ID,
      auth: client,
      timeMin: start,
      timeMax: end,
      singleEvents: true,
    });

    if (res.data.items.length === 0) return null;

    let previousEventIndex;
    let currentIndex = 0;

    const isSameLang = (item) => {
      if (item.summary.includes("🇬🇧")) {
        return title.includes("🇬🇧");
      } else {
        return !title.includes("🇬🇧");
      }
    };

    const isSamePrice = (item) => {
      if (item.summary.includes("FT ")) {
        return title.includes("FT ");
      } else {
        return !title.includes("FT ");
      }
    };

    const filteredItems = res.data.items.filter(
      (item) =>
        item.creator.email === process.env.EMAIL &&
        dateFn
          .subtract(new Date(start), new Date(item.start.dateTime))
          .toMinutes() === 0 &&
        dateFn
          .subtract(new Date(end), new Date(item.end.dateTime))
          .toMinutes() === 0 &&
        item.summary.split(" ").slice(1).join(" ") === title
    );
    return filteredItems[0] || null;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export default fetchPreviousEvent;
