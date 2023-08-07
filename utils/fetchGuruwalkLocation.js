import axios from "axios";
import cheerio from "cheerio";

const getGuruwalkLocation = async (url) => {
  const res = await axios.get(
    "https://www.guruwalk.com/walks/31351-free-tour-girona-essential-with-local-guide",
    {
      headers: {
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
  const $ = cheerio.load(res.data);
  const location = $("div.address").text().trim();
  const durationArray = $(`div[data-section="tour_duration"]`)
    .text()
    .trim()
    .match(/\d/g);
  
  const duration = durationArray[0] * 60 + (durationArray[1] || 0);
  
  return { location, duration };
};
export default getGuruwalkLocation;
