import { ICommand, ICommandExec } from "../commandHandler";
import { emptyKeyboard } from "../keyboards";

const command: ICommand = {
  aliases: ["help"],
  description: "Помощь по всем командам",
  global: true,
  async next(ctx, { handler }) {
    const commands = `Вот мои команды:\n\n${handler.commands.map(c => `/${c.aliases[0]}: ${c.description}`).join("\n")}`;
    ctx.send(commands);
  }
};

export default command;
