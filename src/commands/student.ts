import { ICommand } from "../handler";
import { emptyKeyboard, backButton, passwordGetButton, defaultKeyboard } from "../keyboards";
import xlsx from "xlsx";
import crypto from "crypto";
import { Keyboard, MessageContext } from "vk-io";
import * as dataHandler from "../dataHandler";
import logger, { LogType } from "../logger";

const PASSWORD_PATH = "./config/passwords.json";

export interface ICredentials {
  admin: string;
  users: IStudent[];
}

export interface IStudent {
  hash: string;
  password?: string;
  studentName: string;
}

const command: ICommand = {
  aliases: ["student"],
  description: "Выдать информацию о студенте",
  async execute(session, response) {
    let credentials: ICredentials;
    let user: IStudent;
    session
      .state()
      .action(async () => {
        credentials = (await dataHandler.loadData<ICredentials>(PASSWORD_PATH).catch(err => logger.log("command: student", err, LogType.error))) as ICredentials;
        if (!credentials) {
          response.say("Вышла ошибочка при загрузке данных студентов, свяжитесь с админами, плес...", Keyboard.keyboard([passwordGetButton]));
          return;
        }
        response.say("Введите пароль.", defaultKeyboard);
        while (true) {
          const pass = await session.message();
          const hash = crypto
            .createHash("md5")
            .update(pass)
            .digest("hex");
          if (credentials.admin === hash) return session.next(0, "ADMIN_PANEL");
          const u = credentials.users.find(c => c.hash === hash);
          if (u) {
            user = u;
            break;
          } else {
            response.say("Неверный пароль.");
          }
        }
      })
      .action(async () => {
        const student = findStudent(user.studentName);
        if (!student) response.say("Студент не найден в таблице.");
        else {
          response.say("Подождите..");
          const doc = xlsx.utils.json_to_sheet([student]);
          const book = xlsx.utils.book_new();
          xlsx.utils.book_append_sheet(book, doc, "Ведомость");
          xlsx.writeFile(book, "./student.xlsx");
          await response.ctx.sendDocument({
            value: "./student.xlsx",
            filename: `${user.studentName} (${new Date().toISOString().split("T")[0]}).xlsx`
          });
        }
      });
    let answer = 0;
    session
      .state("ADMIN_PANEL")
      .action(async () => {
        answer = await session.question(response, "Чего вы желаете, господин?", ["Вывести аккаунты", "Изменить аккуанты", "Завершить"]);
      })
      .action(async () => {
        switch (answer) {
          case 0:
            response.say(`Аккаунты:\n${credentials.users.map(u => `${u.studentName}@${u.password}`).join("\n")}`);
            break;
          case 1:
            response.say("Упс, эта возможность пока недоступна");
            break;
          case 2:
            return;
        }
        session.next(0, "ADMIN_PANEL");
      });
    await session.init();
  }
};

function findStudent(name: string): any {
  const table = xlsx.readFile("./config/students.xlsx");
  var sheetLists = table.SheetNames;
  const result = xlsx.utils.sheet_to_json(table.Sheets[sheetLists[0]]);
  const student = result.find((el: any) => el["имя"] === name);
  return student;
}

export default command;
