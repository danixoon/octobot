import { ICommand, ICommandExec } from "../commandHandler";
import { passwordGetButton, backButton } from "../keyboards";
import { Keyboard } from "vk-io";

const command: ICommand = {
  aliases: ["back", "назад", "undo"],
  description: "Отменить действие/перейти на этап назад",
  global: true,
  async next(ctx, { handler }) {
    const deleted = handler.undoState(ctx);
    if (deleted) handler.forceExitMessage(ctx);
  }
};

export default command;
