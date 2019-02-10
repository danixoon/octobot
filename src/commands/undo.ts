import { ICommand, ICommandExec } from "../commandHandler";
import { emptyKeyboard } from "../keyboards";

const command: ICommand = {
  aliases: ["back", "назад"],
  description: "Запуск",
  global: true,
  async next(ctx, { handler }) {
    const deleted = handler.undoState(ctx);
    if (deleted)
      ctx.send("Вы вышли из бота", {
        keyboard: emptyKeyboard
      });
  }
};

export default command;
