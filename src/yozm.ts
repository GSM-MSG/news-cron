import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { News } from "./news";

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
  return result;
};

export const sendYozm = async () => {
  const yozmList = await getYozmList();
  console.log(yozmList);
  const webhookClient = new WebhookClient({
    url: "https://discord.com/api/webhooks/1248659872149536869/pRXkrfloy6l-CxJEIBxVp92ywI2ooHz68fA400LpYSkY_4W5rDe76Qek-6njXK7Xn68a"
  });

  const embeds = yozmList.map((news) =>
    new EmbedBuilder()
      .setTitle(news.title)
      .setDescription(news.description)
      .setURL(news.url)
      .setColor(news.color)
      .setThumbnail(news.thumbnailURL ?? null)
  );

  const currentDate = new Date();
  await webhookClient.send({
    content: `## ${currentDate.getFullYear()}년 ${currentDate.getMonth()}월 ${currentDate.getDay()}일 요즘 IT 최신글 10개`,
    embeds: embeds
  });
};
