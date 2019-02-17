import { ICommand } from "../handler";
import { emptyKeyboard } from "../keyboards";

const command: ICommand = {
  aliases: ["secret"],
  description: "Секреееет :)",
  global: true,
  async execute(session, ctx) {
    ctx.say("Я БЛЯЯЯ НЕНАВИЖУ ЭТИХ ЛЮДЕЙ СУКА ПИСАЛ 500000 ЛЕТ УМЕР", emptyKeyboard);
  }
};

export default command;
