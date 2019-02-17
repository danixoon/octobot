import { ICommand } from "../handler";
import { emptyKeyboard, backButton } from "../keyboards";
import crypto from "crypto";
import { Keyboard } from "vk-io";

const command: ICommand = {
  aliases: ["hash"],
  description: "Выдаёт хеш",
  async execute(session, ctx) {
    ctx.send("Окей, я выдам тебе хеш, напиши строку", { keyboard: Keyboard.keyboard([backButton]) });
    const str = await session.message();
    const hash = crypto
      .createHash("md5")
      .update(ctx.text)
      .digest("hex");
    ctx.send(`Вот твой хеш: ${hash}`, { keyboard: Keyboard.keyboard([]) });
  }
};

export default command;
