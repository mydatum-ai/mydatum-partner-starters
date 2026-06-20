import { createApp } from "./app.mjs";
import { loadConfig } from "./config.mjs";

const config = loadConfig();
createApp({ config }).listen(config.port, config.host, () => {
  console.log(`Partner example listening on http://${config.host}:${config.port}`);
});
