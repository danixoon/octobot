import { ICommand } from "../handler";
import { emptyKeyboard, backButton } from "../keyboards";
import crypto from "crypto";
import { Keyboard } from "vk-io";

const command: ICommand = {
  aliases: ["hash"],
  description: "Выдаёт хеш",
  async execute(session, ctx) {
    ctx.say("Окей, я выдам тебе хеш, напиши строку");
    const str = await session.message();
    const hash = crypto
      .createHash("md5")
      .update(str)
      .digest("hex");
    ctx.say(`Вот твой хеш: ${hash}`);
  }
};

export default command;
