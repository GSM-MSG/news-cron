import "dotenv/config";
import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { News } from "./news";
import { getJSON, setJSON } from "./utils/json-utils";

interface FENewsNews {
  title: string;
}

const feNewsJSONFile = "./fe-news.json";

const getLastNewsTitle = (): string | null => {
  const json = getJSON<FENewsNews>(feNewsJSONFile);
  return json?.title ?? null;
};

const setLastNewsTitle = (news: FENewsNews) => {
  setJSON(feNewsJSONFile, news);
};

const getFENewsList = async () => {
  const feNewsBaseURL = "https://fenews.substack.com/archive?sort=new";
  const result: News[] = [];
  let html: AxiosResponse<any> | undefined;
  let $: cheerio.CheerioAPI;
  try {
    html = await axios.get(feNewsBaseURL);
    $ = cheerio.load(html?.data);
  } catch (error) {
    console.log("ERROR : getFENews");
    return result;
  }

  const $bodyList = $("div.portable-archive-list").children("div");

  $bodyList.each((i, elem) => {
    if ($(elem).find("div > div > div > div > div:nth-child(1) > a").text().length == 0) {
      return;
    }
    const news = {
      title: $(elem).find("div > div > div > div > div:nth-child(1) > a").text(),
      description:
        $(elem).find("div > div > div > div > div:nth-child(2) > a").text().slice(0, 250) + "...",
      url:
        $(elem).find("div > div > div > div > div:nth-child(1) > a").attr("href") ?? feNewsBaseURL,
      thumbnailURL: $(elem).find("div > div:nth-child(2) > div > picture > img").attr("src"),
      color: 0xf3e050
    };
    result.push(news);
  });
  return result.slice(0, 10);
};

export const sendFENews = async () => {
  const fenewsList = await getFENewsList();
  const lastNewsTitle = getLastNewsTitle();
  let filteredList = fenewsList;

  if (lastNewsTitle) {
    const lastIndex = fenewsList.findIndex((news) => news.title === lastNewsTitle);
    if (lastIndex !== -1) {
      filteredList = fenewsList.slice(0, lastIndex);
    }
  }

  if (filteredList.length === 0) {
    return;
  }

  const webhookClient = new WebhookClient({
    url: process.env.FE_NEWS_WEBHOOK ?? ""
  });

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
