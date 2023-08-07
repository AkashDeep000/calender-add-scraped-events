import { getNewCookies, getCookies } from "./fareharborLogin.js";
import axios from "axios";
let fareharborCookies = await getCookies();

const fetchFareharborEvents = async (page) => {
  const events = [];
  const getRes = async (page) => {
    try {
      const res = await axios({
        method: "get",
        url: `https://fareharbor.com/api/v1/companies/gironaexplorers/search/bookings/new/${
          page > 1 ? `?page=${page - 1}` : ""
        }`,
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
    res = await getRes(page);
  } catch (e) {
    console.log(e);
    fareharborCookies = await getNewCookies();
    res = await getRes(page);
  }

  const bookings = await res.data.bookings;

  const tour = {};
  const time = {};

  for (let i = 0; i < bookings.length; i++) {
    const event = {};
    if (bookings[i].item.name) {
      tour[bookings[i].item.uri] = bookings[i].item.name;
      event.title = bookings[i].item.name;
    } else {
      event.title = tour[bookings[i].item.uri];
    }
    if (bookings[i].availability?.utc_start_at) {
      time[bookings[i].availability.uri] = {
        utc_start_at: bookings[i].availability.utc_start_at,
        utc_end_at: bookings[i].availability.utc_end_at,
      };
      event.start = bookings[i].availability.utc_start_at;
      event.end = bookings[i].availability.utc_end_at;
    } else {
      event.start = time[bookings[i].availability.uri].utc_start_at;
      event.end = time[bookings[i].availability.uri].utc_end_at;
    }
    event.id = bookings[i].uuid;
    event.walker = bookings[i].contact.name;
    event.language = bookings[i].contact.display_language;
    event.peopleCount = bookings[i].customer_count;
    event.adults = bookings[i].customer_breakdown_short.match(/\d/g)[0];
    event.childs = bookings[i].customer_breakdown_short.match(/\d/g)[1];
    event.phone = bookings[i].contact.normalized_phone;

    if (!bookings[i].is_cancelled) {
      events.push(event);
    }
  }
  return events;
};
export default fetchFareharborEvents;
