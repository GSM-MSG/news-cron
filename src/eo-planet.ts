import "dotenv/config";
import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { News } from "./news";
import { getJSON, setJSON } from "./utils/json-utils";

interface EOPlanetNews {
  title: string;
}

const eoPlanetJSONFile = "./eo-planet-news.json";

const getLastNewsTitle = (): string | null => {
  const json = getJSON<EOPlanetNews>(eoPlanetJSONFile);
  return json?.title ?? null;
};

const setLastNewsTitle = (news: EOPlanetNews) => {
  setJSON(eoPlanetJSONFile, news);
};

const getEOPlanetList = async () => {
  const eoPlanetBaseURL = "https://eopla.net/";
  const result: News[] = [];
  let html: AxiosResponse<any> | undefined;
  let $: cheerio.CheerioAPI;
  try {
    html = await axios.get(eoPlanetBaseURL);
    $ = cheerio.load(html?.data);
  } catch (error) {
    console.log("ERROR : getEOPlanet");
    return result;
  }

  const $bodyList = $("div.magazines ").children("div.magazine-container");

  $bodyList.each((i, elem) => {
    const news = {
      title: $(elem).find(".title").text(),
      description: $(elem).find(".body").text().slice(0, 100) + "...",
      url: eoPlanetBaseURL + $(elem).find(".title-container a").attr("href"),
      thumbnailURL: `${eoPlanetBaseURL}${$(elem).find("a").attr("src")}`,
      color: 0x71f3a0
    };
    result.push(news);
  });
  return result.slice(0, 10);
};

export const sendEOPlanet = async () => {
  const eoPlanetList = await getEOPlanetList();
  const lastNewsTitle = getLastNewsTitle();
  let filteredList = eoPlanetList;

  if (lastNewsTitle) {
    const lastIndex = eoPlanetList.findIndex((news) => news.title === lastNewsTitle);
    if (lastIndex !== -1) {
      filteredList = eoPlanetList.slice(0, lastIndex);
    }
  }

  if (filteredList.length === 0) {
    return;
  }

  const webhookClient = new WebhookClient({
    url: process.env.EO_PLANET_WEBHOOK ?? ""
  });

  filteredList.reverse().forEach(async (news) => {});
  for (const news of filteredList.reverse()) {
    const embed = new EmbedBuilder()
      .setTitle(news.title)
      .setDescription(news.description)
      .setURL(news.url)
      .setColor(news.color)
      .setThumbnail(news.thumbnailURL ?? null);

    await webhookClient.send({
      embeds: [embed]
    });
  }

  const lastIndex = filteredList.length - 1;
  setLastNewsTitle(filteredList[lastIndex]);
};
