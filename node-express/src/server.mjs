import { createApp } from "./app.mjs";
import { loadConfig } from "./config.mjs";

const config = loadConfig();
createApp({ config }).listen(config.port, "127.0.0.1", () => {
  console.log(`Partner example listening on http://127.0.0.1:${config.port}`);
});
