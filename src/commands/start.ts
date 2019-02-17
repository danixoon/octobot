import { ICommand } from "../handler";
import { passwordGetButton } from "../keyboards";
import { Keyboard } from "vk-io";

const command: ICommand = {
  aliases: ["start", "начать"],
  description: "Запуск",
  async execute(session, ctx) {
    await ctx.say("Здравствуй! Я помогу тебе заплакать!", Keyboard.keyboard([passwordGetButton]));
  }
};

export default command;
