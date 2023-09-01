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

    const isSameLang = () => {
      if (res.data.items[currentIndex].summary.includes("🇬🇧")) {
        return title.includes("🇬🇧");
      } else {
        return !title.includes("🇬🇧");
      }
    };

    const isSamePrice = () => {
      if (res.data.items[currentIndex].summary.includes("FT ")) {
        return title.includes("FT ");
      } else {
        return !title.includes("FT ");
      }
    };

    const setPreviousEventId = () => {
      if (
        res.data.items[currentIndex]?.creator.email === process.env.EMAIL &&
        dateFn
          .subtract(
            new Date(start),
            new Date(res.data.items[currentIndex].start.dateTime)
          )
          .toMinutes() === 0 &&
        dateFn
          .subtract(
            new Date(end),
            new Date(res.data.items[currentIndex].end.dateTime)
          )
          .toMinutes() === 0 &&
        isSameLang() &&
        isSamePrice()
      ) {
        previousEventIndex = currentIndex;
      } else if (currentIndex < res.data.items.length - 1) {
        currentIndex++;
        setPreviousEventId();
      }
    };
    setPreviousEventId();
    return res.data.items[previousEventIndex];
  } catch (error) {
    console.log(error);
  }
};

export default fetchPreviousEvent;
