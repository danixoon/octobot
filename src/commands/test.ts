import { ICommand, ActionCallback, Session } from "../handler";
import { MessageContext, Keyboard } from "vk-io";
import { backButton } from "../keyboards";

const command: ICommand = {
  aliases: ["test"],
  description: "Тест..",
  async execute(session, ctx) {
    const data: any = {};
    await session
      .state("USER_DATA")
      .action(async () => {
        ctx.send("Как тебя зовут?", {
          keyboard: Keyboard.keyboard([backButton])
        });
        data.name = await session.message();
      })
      .action(async () => {
        ctx.send("Сколько тебе лет?");
        data.age = await session.message();
      })
      .action(async () => {
        ctx.send(`Ваши данные:\nИмя: ${data.name}\nВозраст: ${data.age}`);
        ctx.send(`Всё верно? (да/нет)`);
        while (true) {
          const answer = (await session.message()).toLowerCase();
          if (answer === "да") break;
          else if (answer === "нет") return session.next(0, "USER_DATA");
          else ctx.send("Ответьте да/нет");
        }
        session.next(0, 1);
      })
      .state("LIFE_GOAL")
      .action(async () => {
        ctx.send("Зачем ты живёшь?");
        data.lifeGoal = await session.message();
      })
      .action(async () => {
        ctx.send(`Твоя цель жизни: ${data.lifeGoal}`);
        session.next(0, "FUNNY_STATE");
      })
      .state(init(session, ctx), "FUNNY_STATE")
      .init();
  }
};

function init(session: Session, ctx: MessageContext) {
  const actions: ActionCallback[] = [
    async () => {
      ctx.send("Ха-ха!");
      await session.message();
    },
    async () => {
      ctx.send("Ты такой забавный!");
      await session.message();
    }
  ];
  return actions;
}

export default command;
