import VK, { MessageContext, Keyboard } from "vk-io";
import path from "path";
import { CommandHandler } from "./handler";
import fs from "fs";
import * as dataHandler from "./dataHandler";
import logger, { LogType } from "./logger";

const CONFIG_PATH = "./config/config.json";
const COMMAND_PREFIX = "/";

let config;
let commandHandler: CommandHandler = new CommandHandler(COMMAND_PREFIX, dataHandler.getAllCommands());
let vk: VK = new VK();

const { updates } = vk;

async function run() {
  config = (await dataHandler.loadData(CONFIG_PATH).catch(err => logger.log("main", err, LogType.error))) as any;
  vk.setOptions(config);
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
  commandHandler.handle(ctx.peerId, ctx);
  await next;
});

run().catch(console.error);
