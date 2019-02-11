import { ICommand, ICommandExec } from "../commandHandler";
import { emptyKeyboard, backButton } from "../keyboards";
import crypto from "crypto";
import { Keyboard } from "vk-io";

const command: ICommand = {
  aliases: ["hash"],
  description: "Выдаёт хеш",
  async next(ctx, { handler }) {
    ctx.send("Окей, я выдам тебе хеш, напиши строку", { keyboard: Keyboard.keyboard([backButton]) });
    return {
      next: getHash
    };
  }
};

const getHash: ICommandExec = async ctx => {
  const hash = crypto
    .createHash("md5")
    .update(ctx.text)
    .digest("hex");
  ctx.send(`Вот твой хеш: ${hash}`, { keyboard: Keyboard.keyboard([]) });
};

export default command;
