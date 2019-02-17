import { ICommand } from "../handler";
import { passwordGetButton, yesNoKeyboard } from "../keyboards";
import { Keyboard } from "vk-io";

const command: ICommand = {
  aliases: ["start", "начать"],
  description: "Запуск",
  async execute(session, ctx) {
    await session
      .action(async () => {
        await ctx.say("Здравствуй! Я помогу тебе заплакать!", yesNoKeyboard);
        await session.message();
      })
      .init();
  }
};

export default command;
