import { ICommand } from "../handler";
import { passwordGetButton } from "../keyboards";
import { Keyboard } from "vk-io";

const command: ICommand = {
  aliases: ["start", "начать"],
  description: "Запуск",
  async execute(session, ctx) {
    await ctx.send("Здравствуй! Я помогу тебе заплакать!", {
      keyboard: Keyboard.keyboard([passwordGetButton])
    });
    throw new Error("suka");
  }
};

export default command;
