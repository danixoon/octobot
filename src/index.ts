import VK, { MessageContext, Keyboard } from "vk-io";
import path from "path";
import initHandler, { CommandHandler } from "./commandHandler";
import fs from "fs";
import * as dataHandler from "./dataHandler";
import logger, { LogType } from "./logHandler";

const CONFIG_PATH = "./config/config.json";
const COMMAND_PREFIX = "/";

let config;
let commandHandler: CommandHandler;
let vk: VK = new VK();

const { updates } = vk;

async function run() {
  config = (await dataHandler.loadData(CONFIG_PATH).catch(err => logger.log("main", err, LogType.error))) as any;
  vk.setOptions(config);
  commandHandler = await initHandler(COMMAND_PREFIX);
  if (process.env.UPDATES === "webhook") {
    await vk.updates.startWebhook();
    logger.log("main", "webhook server started", LogType.info);
  } else {
    await vk.updates.startPolling();
    logger.log("main", "long polling server started", LogType.info);
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
