import { ICommand, CommandSession, ICommandResponse, ActionCallback, timeout } from "../handler";
import crypto from "crypto";

type Root = (s: CommandSession, r: ICommandResponse) => void;

const command: ICommand = {
  aliases: ["quest"],
  description: "Квест, ае",
  async execute(session, response) {
    startLocation(session, response);
    passRoot(session, response);
    await session.init();
  }
};

const startLocation: Root = (s, r) => {
  const quest = [
    async () => {
      switch (await r.question("Ты попадаешь в шарагу, у тебя тысячи долгов", ["Попытаться сдать", "Убежать", "Помощь зала"])) {
        case 0:
          s.next(0, "PASS_ROOT");
          break;
      }
    }
  ];
  s.state(quest, "START");
};

const passRoot: Root = (s, r) => {
  let answer = 0;
  const quest = [
    async () => {
      r.say("Неизвестный подходит к вам и задаёт вопрос..");
      await timeout(1000);
      answer = await r.question("Ты ебе или кто?", ["САМ ТЫ ЕБЕ", "да"]);
    },
    async () => {
      switch (answer) {
        case 0:
          r.say("ОФИГЕЛ МЕНЯ ОСКОРБЛЯТЬ?!");
          await timeout(1000);
          r.say("ТЕБЕ ЖОПА");
          break;
        case 1:
          r.say("Вау, ты первый, кто признался");
          break;
      }
    },
    async () => {
      await timeout(3000);
      r.say("Ладно, забыли и хватит");
    }
  ];
  s.state(quest, "PASS_ROOT");
};

export default command;
