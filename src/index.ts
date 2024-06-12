import { sendEOPlanet } from "./eo-planet";
import { sendDesignYozm } from "./yozm-design";
import { sendDevelopYozm } from "./yozm-develop";
import { sendPMYozm } from "./yozm-pm";
import { sendProductYozm } from "./yozm-product";

async function main() {
  await sendDevelopYozm();
  await sendDesignYozm();
  await sendPMYozm();
  await sendProductYozm();
  await sendEOPlanet();
}

main();
