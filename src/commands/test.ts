import { ICommand, ActionCallback, CommandSession, IContextWrapper } from "../handler";
import { MessageContext, Keyboard } from "vk-io";
import { backButton, defaultKeyboard } from "../keyboards";

const command: ICommand = {
  aliases: ["test"],
  description: "Тест..",
  async execute(session, ctx) {
    const data: any = {};
    await session
      .state("USER_DATA")
      .action(async () => {
        ctx.say("Как тебя зовут?");
        data.name = await session.message();
      })
      .action(async () => {
        ctx.say("Сколько тебе лет?");
        data.age = await session.message();
      })
      .action(async () => {
        ctx.say(`Ваши данные:\nИмя: ${data.name}\nВозраст: ${data.age}`);
        ctx.say(`Всё верно? (да/нет)`);
        while (true) {
          const answer = (await session.message()).toLowerCase();
          if (answer === "да") break;
          else if (answer === "нет") return session.next(0, "USER_DATA");
          else ctx.say("Ответьте да/нет");
        }
        session.next(0, 1);
      })
      .state("LIFE_GOAL")
      .action(async () => {
        ctx.say("Зачем ты живёшь?");
        data.lifeGoal = await session.message();
      })
      .action(async () => {
        ctx.say(`Твоя цель жизни: ${data.lifeGoal}`);
        session.next(0, "FUNNY_STATE");
      })
      .state(init(session, ctx), "FUNNY_STATE")
      .init();
  }
};

function init(session: CommandSession, ctx: IContextWrapper) {
  const actions: ActionCallback[] = [
    async () => {
      ctx.say("Ха-ха!");
      await session.message();
    },
    async () => {
      ctx.say("Ты такой забавный!");
      await session.message();
    }
  ];
  return actions;
}

export default command;
