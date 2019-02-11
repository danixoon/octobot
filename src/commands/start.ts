import { ICommandExec, ICommand, ICommandPayload } from "../commandHandler";
import { passwordGetButton } from "../keyboards";
import { Keyboard } from "vk-io";

const command: ICommand = {
  aliases: ["start", "начать"],
  description: "Запуск",
  async next(ctx, data) {
    ctx.send("Здравствуй! Я помогу тебе заплакать!", {
      keyboard: Keyboard.keyboard([passwordGetButton])
    });
  }
};

export default command;
