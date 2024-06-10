import { ColorResolvable } from "discord.js";

export interface News {
  title: string;
  description: string;
  url: string;
  thumbnailURL?: string;
  color: ColorResolvable;
}
