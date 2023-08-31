import "dotenv/config";
import { google } from "googleapis";
import { JWT } from "google-auth-library";

const client = new JWT({
  email: process.env.EMAIL,
  key: process.env.KEY.split(String.raw`\n`).join("\n"),
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ],
});
const calendar = google.calendar({ version: "v3" });
let deleteCount = 0;
let totalCount = 0;
let pageToken;
const deleteEvent = async () => {
  const res = await calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    auth: client,
  });
  console.log(res)
  totalCount += res.data.items.length;
  console.log(totalCount);
  for (let i = 0; i < res.data.items.length; i++) {
    if (res.data.items[i].creator.email === process.env.EMAIL) {
      const deleteRes = await calendar.events.delete({
        calendarId: process.env.CALENDAR_ID,
        auth: client,
        eventId: res.data.items[i].id,
      });
      deleteCount++;
      console.log("Deleted: " + deleteCount + "/" + totalCount);
    }
  }
  if (res.data.items.length === 2500) {
    pageToken = res.data.nextPageToken;
    await deleteEvent();
  }
};

deleteEvent();
