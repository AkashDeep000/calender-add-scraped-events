import axios from "axios";
import cheerio from "cheerio";
import fs from "fs/promises";
import "dotenv/config";

const getNewCookies = async () => {
  console.log(process.env.GURUWALK_EMAIL, process.env.GURUWALK_PASS);
  const resInit = await axios.get(
    "https://www.guruwalk.com/login_with_password",
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

  //console.log(resInit.headers["set-cookie"]);

  axios.defaults.headers.cookie = resInit.headers["set-cookie"];

  const $resInit = cheerio.load(resInit.data);
  const authenticityToken = $resInit('meta[name="csrf-token"]').attr("content");

  console.log("Got authenticityToken for Guruwalk");

  const resLogin = await axios({
    method: "post",
    url: `https://www.guruwalk.com/login_with_password`,
    maxRedirects: 0,
    validateStatus: (status) => status === 302,
    headers: {
      Cookie: resInit.headers["set-cookie"],
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,bn;q=0.6",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded",
      pragma: "no-cache",
      "sec-ch-ua": '"Not:A-Brand";v="99", "Chromium";v="112"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      Referer: "https://www.guruwalk.com/login_with_password",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 11; Redmi Note 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    },

    data: `authenticity_token=${authenticityToken}&user_login%5Bemail%5D=${encodeURIComponent(
      process.env.GURUWALK_EMAIL
    )}&user_login%5Bpassword%5D=${encodeURIComponent(
      process.env.GURUWALK_PASS
    )}&commit=Login`,
  });

  const loginCookies = resLogin.headers["set-cookie"];

  console.log("Got Login Cookies :" + loginCookies);

  const authJson = {
    cookies: loginCookies,
  };
  const authJsonString = JSON.stringify(authJson);

  await fs.writeFile("./guruwalk-cookies.json", authJsonString, (err) => {
    if (err) {
      console.log("Error writing guruwalk-cookies file", err);
    } else {
      console.log("Successfully wrote guruwalk-cookies file");
    }
  });
  return authJson.cookies;
};

const getCookies = async () => {
  console.log("Trying to get cached Cookies");
  try {
    const cookies = await fs.readFile("./guruwalk-cookies.json", "utf8");
    if (cookies) {
      const cookiesJson = JSON.parse(cookies);
      console.log(cookiesJson);
      return cookiesJson.cookies;
    }
  } catch (e) {
    console.log("Trying to get new Cookies");
    const cookies = await getNewCookies();
    return cookies;
  }
};

export default getCookies;
export { getNewCookies, getCookies };
