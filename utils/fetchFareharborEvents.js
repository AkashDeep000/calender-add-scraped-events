import { getNewCookies, getCookies } from "./fareharborLogin.js";
import axios from "axios";
let fareharborCookies = await getCookies();

const fetchFareharborEvents = async (page) => {
  const events = [];
  const getRes = async (url, page) => {
    try {
      const res = await axios({
        method: "get",
        url: `${url}${page > 1 ? `?page=${page - 1}` : ""}`,
        headers: {
          Cookie: fareharborCookies,
          accept: "application/json, text/plain, */*",
          "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,bn;q=0.6",
          "cache-control": "no-cache",
          "content-type": "application/json;charset=UTF-8",
          pragma: "no-cache",
          "sec-ch-ua": '"Not:A-Brand";v="99", "Chromium";v="112"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          //"x-csrftoken": "U7ErRxPA0bquyAnsqh62HY8po0It74h5",
          // "x-fh-realtime-id": "503287.552736",
          "x-fh-target-language": "ca",
          "x-requested-with": "XMLHttpRequest",

          Referer:
            "https://fareharbor.com/gironaexplorers/dashboard/bookings/grid/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      });
      return res;
    } catch (e) {
      throw Error(e);
    }
  };
  let res;
  try {
    res = await getRes(
      "https://fareharbor.com/api/v1/companies/gironaexplorers/search/bookings/new",
      page
    );
  } catch (e) {
    console.log(e);
    fareharborCookies = await getNewCookies();
    res = await getRes(
      "https://fareharbor.com/api/v1/companies/gironaexplorers/search/bookings/new",
      page
    );
  }

  const bookings = await res.data.bookings;
  const tour = {};
  const time = {};
  const source = {};
  //setting tours and time info
  for (let i = 0; i < bookings.length; i++) {
    if (bookings[i].item.name) {
      tour[bookings[i].item.uri] = bookings[i].item.name;
    }
    if (bookings[i].user?.name) {
      source[bookings[i].user.uri] = bookings[i].user.name;
    }
    if (bookings[i].availability.utc_start_at) {
      time[bookings[i].availability.uri] = {
        utc_start_at: bookings[i].availability.utc_start_at,
        utc_end_at: bookings[i].availability.utc_end_at,
        lang: bookings[i].availability.headline,
      };
    }
  }

  for (let i = 0; i < bookings.length; i++) {
    if (!bookings[i].is_cancelled) {
      //if can't find event details fetch from dedicated api
      if (!time[bookings[i].availability.uri]) {
        let res;

        try {
          res = await getRes(
            "https://fareharbor.com" + bookings[i].availability.uri
          );
        } catch (e) {
          console.log(e);
          fareharborCookies = await getNewCookies();
          res = await getRes(
            "https://fareharbor.com" + bookings[i].availability.uri
          );
        }
        time[bookings[i].availability.uri] = {
          utc_start_at: res.data.availability.utc_start_at,
          utc_end_at: res.data.availability.utc_end_at,
          lang: res.data.availability.headline,
        };
      }
      //if can't find event name fetch from dedicated api
      if (!tour[bookings[i].item.uri]) {
        let res;
        try {
          res = await getRes("https://fareharbor.com" + bookings[i].item.uri);
        } catch (e) {
          console.log(e);
          fareharborCookies = await getNewCookies();
          res = await getRes("https://fareharbor.com" + bookings[i].item.uri);
        }
        tour[bookings[i].item.uri] = res.data.item.name;
        console.log(res.data.item.name);
      }

      const event = {};

      const bookingsTitle = tour[bookings[i].item.uri];
      const bookingsLang = time[bookings[i].availability.uri].lang;

      event.title =
        (bookingsTitle.includes("History, Legends & Food")
          ? "HLF"
          : bookingsTitle) +
        (bookingsLang.toLowerCase().includes("english") ? " 🇬🇧" : "");

      event.start = time[bookings[i].availability.uri].utc_start_at;
      event.end = time[bookings[i].availability.uri].utc_end_at;
      event.id = "fh" + bookings[i].unicode.split("#")[1];
      event.walker = bookings[i].contact.name;
      event.peopleCount = bookings[i].customer_count;
      event.adults = bookings[i].customer_breakdown_short.match(/\d/g)[0];
      event.childs = bookings[i].customer_breakdown_short.match(/\d/g)[1];
      event.phone = bookings[i].contact.normalized_phone;
      event.source =
        source[bookings[i].user?.uri]
          ?.replace("-API", "")
          ?.replace("API", "")
          ?.trim() || "Web";
      events.push(event);
    }
  }
  return events;
};
export default fetchFareharborEvents;
