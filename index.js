import "dotenv/config";
import guruwalkLoop from "./utils/guruwalkFn.js";
import fareharborLoop from "./utils/fareharborFn.js";
import fs from "fs";
import express from "express";
import cron from "node-cron";
import db from "./db/index.js";

try {
  fareharborLoop();
} catch (e) {
  console.log(e);
  fareharborLoop();
}
try {
  guruwalkLoop();
} catch (e) {
  console.log(e);
  guruwalkLoop();
}

// runing express server to ping this service
const app = express();
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000, () => {
  console.log(`App listening on port 3000`);
});

cron.schedule("0 1 * * *", () => {
  console.log("Deleting old records...");
  const previousDB = db.JSON();
  console.log(previousDB);
  db.JSON(Object.fromEntries(Object.entries(previousDB).slice(-500)));
  console.log(db.JSON());
});
