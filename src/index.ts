import VK, { MessageContext, Keyboard } from "vk-io";
import path from "path";
import initHandler, { CommandHandler } from "./commandHandler";
import fs from "fs";

const CONFIG_PATH = "./config/config.json";
const COMMAND_PREFIX = "/";

let config;
let commandHandler: CommandHandler;
let vk: VK = new VK();

const { updates } = vk;

async function loadConfig(path: string) {
  return new Promise((res, rej) =>
    fs.readFile(path, (err, data: any) => {
      if (err) return rej;
      try {
        return res(JSON.parse(data));
      } catch (error) {
        rej(error);
      }
    })
  );
}

async function run() {
  config = (await loadConfig(CONFIG_PATH)) as any;
  vk.setOptions(config);
  commandHandler = await initHandler(COMMAND_PREFIX);
  if (process.env.UPDATES === "webhook") {
    await vk.updates.startWebhook();
    console.log("Webhook server started");
  } else {
    await vk.updates.startPolling();
    console.log("Polling started");
  }
}

// Skip outbox message and handle errorsА
updates.use(async (context: MessageContext, next) => {
  //Ignore outbox messages
  if (context.type === "message" && context.isOutbox) {
    return;
  }
  try {
    await next();
  } catch (error) {
    console.error("Error:", error);
  }
});

// Handle message payload
updates.use(async (ctx: MessageContext, next) => {
  if (ctx.type !== "message") return await next();
  await commandHandler.handleMessage(ctx);
  await next;
});

run().catch(console.error);
