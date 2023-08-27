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

const fetchPreviousEvent = async (start, end) => {
  try {
    const res = await calendar.events.list({
      calendarId: process.env.CALENDAR_ID,
      auth: client,
      timeMin: start,
      timeMax: end,
    });

    if (res.data.items.length === 0) return null;
    let previousEventIndex;
    let currentIndex = 0;
    const setPreviousEventId = () => {
      if (res.data.items[currentIndex].creator.email === process.env.EMAIL) {
        previousEventIndex = currentIndex;
      } else if (currentIndex < res.data.items.length) {
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
