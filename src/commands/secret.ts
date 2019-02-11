import { ICommand, ICommandExec } from "../commandHandler";
import { emptyKeyboard } from "../keyboards";

const command: ICommand = {
  aliases: ["secret"],
  description: "Секреееет :)",
  global: true,
  async next(ctx, { handler }) {
    ctx.send("Я БЛЯЯЯ НЕНАВИЖУ ЭТИХ ЛЮДЕЙ СУКА ПИСАЛ 500000 ЛЕТ УМЕР", {
      keyboard: emptyKeyboard
    });
  }
};

export default command;
