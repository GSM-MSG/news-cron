import "dotenv/config";
import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { News } from "./news";
import { getJSON, setJSON } from "./utils/json-utils";

interface DevPillNews {
  title: string;
}

const devPillJSONFile = "./dev-pill.json";

const getLastNewsTitle = (): string | null => {
  const json = getJSON<DevPillNews>(devPillJSONFile);
  return json?.title ?? null;
};

const setLastNewsTitle = (news: DevPillNews) => {
  setJSON(devPillJSONFile, news);
};

const getDevPillList = async () => {
  const devPillBaseURL = "https://maily.so/devpill";
  const result: News[] = [];
  let html: AxiosResponse<any> | undefined;
  let $: cheerio.CheerioAPI;
  try {
    html = await axios.get(devPillBaseURL);
    $ = cheerio.load(html?.data);
  } catch (error) {
    console.log("ERROR : getDevPill");
    return result;
  }

  const $bodyList = $("#preRenderedPosts").children("div");

  $bodyList.each((i, elem) => {
    const news = {
      title: $(elem).find("a > div > div.text-slate-900").text().trim(),
      description: $(elem).find("a > div > p.text-slate-700").text().slice(0, 100) + "...",
      url: $(elem).find("a").attr("href") ?? "",
      thumbnailURL:
        $(elem)
          .find("a > div:nth-child(2) > div")
          .attr("style")
          ?.match(/url\(["']?([^"']*)["']?\)/)?.[1] ?? "",
      color: 0xe1031d
    };
    result.push(news);
  });
  return result.slice(0, 10);
};

export const sendDevPill = async () => {
  const tipsterList = await getDevPillList();
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
    url: process.env.DEV_PILL_WEBHOOK ?? ""
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
