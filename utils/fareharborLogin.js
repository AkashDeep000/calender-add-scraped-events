import axios from "axios";
import fs from "fs/promises";
import "dotenv/config";

const getNewCookies = async () => {
  console.log(process.env.GURUWALK_EMAIL, process.env.GURUWALK_PASS);
  const resLogin = await axios({
    method: "POST",
    url: "https://fareharbor.com/api/v1/login/",
    headers: {
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

      Referer: "https://fareharbor.com/gironaexplorers/login/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    data: {
      shortname: "gironaexplorers",
      username: "bot",
      password: "Botpass123",
    },
  });
console.log(resLogin.data)
  const loginCookies = resLogin.headers["set-cookie"];

  console.log("Got Login Cookies :" + loginCookies);

  const authJson = {
    cookies: loginCookies,
  };
  const authJsonString = JSON.stringify(authJson);

  await fs.writeFile("./fareharbor-cookies.json", authJsonString, (err) => {
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
    const cookies = await fs.readFile("./fareharbor-cookies.json", "utf8");
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
