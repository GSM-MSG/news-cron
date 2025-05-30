import { sendDevPill } from "./dev-pill";
import { sendEOPlanet } from "./eo-planet";
import { sendFENews } from "./fe-news";
import { sendLeadersCompass } from "./leaders-compass";
import { sendProductLab } from "./product-lab";
import { sendTipster } from "./tipster";
import { sendDesignYozm } from "./yozm-design";
import { sendDevelopYozm } from "./yozm-develop";
import { sendPMYozm } from "./yozm-pm";
import { sendProductYozm } from "./yozm-product";

async function main() {
  await sendEOPlanet();
  await sendDevPill();
}

main();
