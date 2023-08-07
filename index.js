import cron from "node-cron";
import "dotenv/config";
import guruwalkLoop from "./utils/guruwalkFn.js";
import fareharborLoop from "./utils/fareharborFn.js";
import fs from "fs";

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

cron.schedule(`0 0 * * 0`, () => {
  console.log("Deleting old records weekly");
  fs.unlinkSync("./storage.json");
});
