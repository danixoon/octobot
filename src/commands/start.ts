import { ICommandExec, ICommand, ICommandPayload } from "../commandHandler";
import { studentGetKeyboard } from "../keyboards";

const command: ICommand = {
  aliases: ["start", "начать"],
  description: "Запуск",
  async next(ctx, data) {
    ctx.send("Здравствуй! Я помогу тебе заплакать!", {
      keyboard: studentGetKeyboard
    });
  }
};

export default command;
