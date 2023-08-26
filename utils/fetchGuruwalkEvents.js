import cheerio from "cheerio";
import { getNewCookies, getCookies } from "./guruwalkLogin.js";
import axios from "axios";
import JSONdb from "simple-json-db";
const db = new JSONdb("./storage.json");
import dateFn from "date-and-time";
import { DateTime } from "luxon";

let guruwalkCookies = await getCookies();

const fetchGuruwalkEvents = async (page) => {
  const events = [];
  const getRes = async (page) => {
    const res = await axios(
      `https://www.guruwalk.com/gurus/bookings?status=1&page=${page}&language=&commit=Search`,
      {
        headers: {
          Cookie: guruwalkCookies,
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,bn;q=0.6",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua": '"Not:A-Brand";v="99", "Chromium";v="112"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 11; Redmi Note 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
        },
      }
    );
    return res;
  };
  let res = await getRes(page);
  //Cheaking if login expired
  if (res.request.res.responseUrl.includes("login")) {
    guruwalkCookies = await getNewCookies();
    res = await getRes(page);
  }
  const html = await res.data;
  //console.log(html);

  const $ = cheerio.load(html);

  $("li")
    .get()
    .map((li) => {
      if ($(li).attr("id")?.includes("booking")) {
        const data = {};
        data.id = $(li).attr("id").replace("booking-", "");
        data.title = $(li).find(".info-container").find("a").text().trim();
        data.url =
          "https://guruwalk.com" +
          $(li).find(".info-container").find("a").attr("href");
        data.walker = $(li)
          .find("i.fa-address-card")
          .next()
          .contents()
          .last()
          .text()
          .trim();
        data.language = $(li).find("i.fa-globe").next().text().trim();
        data.peopleCount = $(li)
          .find("i.fa-users")
          .next()
          .text()
          .trim()
          .match(/\d+/)[0];
        data.phone = $(li).find("i.fa-phone-alt").next().text().trim();
        //formate date and time
        const date = $(li).find("i.fa-calendar").next().text().trim();
        const monthDay = date.split(",")[1].trim();
        const year = date.split(",")[2].trim();
        const time = $(li).find("i.fa-clock").next().text().trim();

        function capitalizeFirstLetter(string) {
          return string.charAt(0).toUpperCase() + string.slice(1);
        }

        const dateString = `${capitalizeFirstLetter(monthDay)} ${year} ${time}`;

        const dateFormated = DateTime.fromFormat(
          dateString,
          "MMMM d yyyy HH:mm",
          { zone: "Europe/Madrid" }
        ).toString();

        data.time = dateFormated;

        events.push(data);
      }
    });
  return events;
};

export default fetchGuruwalkEvents;
