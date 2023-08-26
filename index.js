import cron from "node-cron";
import "dotenv/config";
import guruwalkLoop from "./utils/guruwalkFn.js";
import fareharborLoop from "./utils/fareharborFn.js";
import fs from "fs";
import express from "express"

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
// runing express server to ping this service
const app = express()
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(3000, () => {
  console.log(`App listening on port 3000`)
})