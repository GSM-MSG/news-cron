import "dotenv/config";
import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { News } from "./news";
import dayjs from "dayjs";

const getYozmList = async () => {
  const yozmBaseURL = "https://yozm.wishket.com";
  const result: News[] = [];
  let html: AxiosResponse<any> | undefined;
  let $: cheerio.CheerioAPI;
  try {
    html = await axios.get(yozmBaseURL + "/magazine/list/develop");
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
  return result.slice(0, 5).reverse();
};

export const sendYozm = async () => {
  const yozmList = await getYozmList();
  const webhookClient = new WebhookClient({
    url: process.env.YOZM_WEBHOOK ?? ""
  });

  const embeds = yozmList.map((news) =>
    new EmbedBuilder()
      .setTitle(news.title)
      .setDescription(news.description)
      .setURL(news.url)
      .setColor(news.color)
      .setThumbnail(news.thumbnailURL ?? null)
  );

  const currentDate = dayjs();
  await webhookClient.send({
    content: `## 오늘의 요즘IT 최신글 5개!`,
    embeds: embeds
  });
};
