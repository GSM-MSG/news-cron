import "dotenv/config";
import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { News } from "./news";
import dayjs from "dayjs";
import { getJSON, setJSON } from "./utils/json-utils";

interface LastYozmProductNews {
  title: string;
}

const yozmProductJSONFile = "./yozm-it-news-pm.json";

const getLastNewsTitle = (): string | null => {
  const json = getJSON<LastYozmProductNews>(yozmProductJSONFile);
  return json?.title ?? null;
};

const setLastNewsTitle = (news: LastYozmProductNews) => {
  setJSON(yozmProductJSONFile, news);
};

const getProductYozmList = async () => {
  const yozmBaseURL = "https://yozm.wishket.com";
  const result: News[] = [];
  let html: AxiosResponse<any> | undefined;
  let $: cheerio.CheerioAPI;
  try {
    html = await axios.get(yozmBaseURL + "/magazine/list/product");
    $ = cheerio.load(html?.data);
  } catch (error) {
    console.log("ERROR : getYozmList");
    return result;
  }

  const $bodyList = $("div.list-cover ").children("div.list-item-link");

  $bodyList.each((i, elem) => {
    const news = {
      title: $(elem).find(".list-item .item-main a.item-title").text(),
      description: $(elem).find(".list-item .item-description").text().slice(0, 100) + "...",
      url: yozmBaseURL + $(elem).find(".list-item .item-main a.item-title").attr("href"),
      thumbnailURL: `${yozmBaseURL}${$(elem)
        .find(".list-item .item-thumbnail-pc .thumbnail-image")
        .attr("src")}`,
      color: 0x6b15ee
    };
    result.push(news);
  });
  return result.slice(0, 5);
};

export const sendProductYozm = async () => {
  const yozmList = await getProductYozmList();
  const lastNewsTitle = getLastNewsTitle();
  let filteredList = yozmList;

  if (lastNewsTitle) {
    const lastIndex = yozmList.findIndex((news) => news.title === lastNewsTitle);
    if (lastIndex !== -1) {
      filteredList = yozmList.slice(0, lastIndex);
    }
  }

  if (filteredList.length === 0) {
    return;
  }

  const webhookClient = new WebhookClient({
    url: process.env.YOZM_WEBHOOK ?? ""
  });

  const embeds = filteredList.reverse().map((news) =>
    new EmbedBuilder()
      .setTitle(news.title)
      .setDescription(news.description)
      .setURL(news.url)
      .setColor(news.color)
      .setThumbnail(news.thumbnailURL ?? null)
  );

  await webhookClient.send({
    content: `## 오늘의 요즘IT-프로덕트 최신글 ${filteredList.length}개!`,
    embeds: embeds
  });

  const lastIndex = filteredList.length - 1;
  setLastNewsTitle(filteredList[lastIndex]);
};
