import { ICommand } from "../handler";
import { emptyKeyboard, backButton, passwordGetButton, defaultKeyboard } from "../keyboards";
import xlsx from "xlsx";
import crypto from "crypto";
import { Keyboard, MessageContext } from "vk-io";
import * as dataHandler from "../dataHandler";
import logger, { LogType } from "../logger";

const CONFIG_PATH = "./config/student.json";

export interface IConfig {
  sheetPath: string;
  headerName: string;
}

const command: ICommand = {
  aliases: ["student"],
  description: "Выдать информацию о студенте",
  async execute(session, response) {
    function errorFallback() {
      response.say("Вышла ошибочка при загрузке данных студентов, свяжитесь с администратором", Keyboard.keyboard([passwordGetButton]));
    }

    let config: IConfig = await dataHandler.loadData<IConfig>(CONFIG_PATH);
    if (!config || !config.sheetPath || !config.headerName) return errorFallback();
    let sheet: any = await loadSheet(config.sheetPath);
    if (!sheet) return errorFallback();

    session
      .state()
      .action(async () => {
        response.say("Введите пароль.");
        while (true) {
          const pass = await session.message();
          const student = findStudent(sheet, pass, config.headerName);
          if (!student) {
            response.say("Неверный пароль. Проверьте написание и повторите попытку.");
            continue;
          }
          response.say("О, УСПЕХ!");
          // if (credentials.admin === hash) return session.next(0, "ADMIN_PANEL");
          // const u = credentials.users.find(c => c.hash === hash);
          // if (u) {
          //   user = u;
          //   break;
          // } else {
          // }
        }
      })
      .action(async () => {
        // const student = findStudent(user.studentName);
        // if (!student) response.say("Студент не найден в таблице.");
        // else {
        //   response.say("Подождите..");
        //   const doc = xlsx.utils.json_to_sheet([student]);
        //   const book = xlsx.utils.book_new();
        //   xlsx.utils.book_append_sheet(book, doc, "Ведомость");
        //   xlsx.writeFile(book, "./student.xlsx");
        //   await response.ctx.sendDocument({
        //     value: "./student.xlsx",
        //     filename: `${user.studentName} (${new Date().toISOString().split("T")[0]}).xlsx`
        //   });
        // }
      });
    let answer = 0;
    session
      .state("ADMIN_PANEL")
      .action(async () => {
        answer = await response.question("Чего вы желаете, господин?", ["Вывести аккаунты", "Изменить аккуанты", "Завершить"]);
      })
      .action(async () => {
        switch (answer) {
          case 0:
            // response.say(`Аккаунты:\n${credentials.users.map(u => `${u.studentName}@${u.password}`).join("\n")}`);
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

async function loadSheet(path: string): Promise<any> {
  const table = xlsx.readFile(path);
  var sheetLists = table.SheetNames;
  return xlsx.utils.sheet_to_json(table.Sheets[sheetLists[0]]);
}

function findStudent(sheet: any, goal: string, header: string): any {
  const student = sheet.find((el: any) => el[header] === goal);
  return student;
}

export default command;
