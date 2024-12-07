import "dotenv/config";
import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { News } from "./news";
import { getJSON, setJSON } from "./utils/json-utils";

interface TipsterNews {
  title: string;
}

const tipsterJSONFile = "./tipster-news.json";

const getLastNewsTitle = (): string | null => {
  const json = getJSON<TipsterNews>(tipsterJSONFile);
  return json?.title ?? null;
};

const setLastNewsTitle = (news: TipsterNews) => {
  setJSON(tipsterJSONFile, news);
};

const getTipsterList = async () => {
  const tipsterBaseURL = "https://maily.so/tipster";
  const result: News[] = [];
  let html: AxiosResponse<any> | undefined;
  let $: cheerio.CheerioAPI;
  try {
    html = await axios.get(tipsterBaseURL);
    $ = cheerio.load(html?.data);
  } catch (error) {
    console.log("ERROR : getTipster");
    return result;
  }

  const $bodyList = $("#preRenderedPosts").children("div");

  $bodyList.each((i, elem) => {
    try {
      const news = {
        title: $(elem).find("a > div > div.text-slate-900").text().trim(),
        description: $(elem).find("a > div > p.text-slate-700").text().slice(0, 100) + "...",
        url: $(elem).find("a").attr("href") ?? "",
        thumbnailURL: $(elem)
          .find("a > div:nth-child(2) > div")
          .attr("style")
          ?.match(/url\(["']?([^"']*)["']?\)/)?.[1],
        color: 0xe7be54
      };
      result.push(news);
    } catch (e) {
      console.error(e);
    }
  });
  return result.slice(0, 10);
};

export const sendTipster = async () => {
  const tipsterList = await getTipsterList();
  const lastNewsTitle = getLastNewsTitle();
  let filteredList = tipsterList;

  if (lastNewsTitle) {
    const lastIndex = tipsterList.findIndex((news) => news.title === lastNewsTitle);
    if (lastIndex !== -1) {
      filteredList = tipsterList.slice(0, lastIndex);
    }
  }

  if (filteredList.length === 0) {
    return;
  }

  const webhookClient = new WebhookClient({
    url: process.env.NEWS_LETTER_WEBHOOK ?? ""
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
