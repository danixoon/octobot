import { ICommand } from "../handler";
import { emptyKeyboard, backButton } from "../keyboards";
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
  async execute(session, ctx) {
    let credentials: ICredentials;
    let user: IStudent;
    await session
      .state()
      .action(async () => {
        credentials = (await dataHandler.loadData<ICredentials>(PASSWORD_PATH).catch(err => logger.log("command: student", err, LogType.error))) as ICredentials;
        if (!credentials) {
          ctx.send("Вышла ошибочка при загрузке данных студентов, свяжитесь с админами, плес...");
          return;
        }
        ctx.send("Введите пароль.");
        while (true) {
          const pass = await session.message();
          const hash = crypto
            .createHash("md5")
            .update(pass)
            .digest("hex");
          const u = credentials.users.find(c => c.hash === hash);
          if (u) {
            user = u;
            break;
          } else {
            ctx.send("Неверный пароль.");
          }
        }
      })
      .action(async () => {
        const student = findStudent(user.studentName);
        if (!student) ctx.send("Студент не найден в таблице.");
        else {
          ctx.send("Подождите..");
          const doc = xlsx.utils.json_to_sheet([student]);
          const book = xlsx.utils.book_new();
          xlsx.utils.book_append_sheet(book, doc, "Ведомость");
          xlsx.writeFile(book, "./student.xlsx");
          await ctx.sendDocument({
            value: "./student.xlsx",
            filename: `${user.studentName} (${new Date().toISOString().split("T")[0]}).xlsx`
          });
        }
      })
      .init();
  }
};

const handleStudentInfo = async (ctx: MessageContext, user: string) => {};

function findStudent(name: string): any {
  const table = xlsx.readFile("./config/students.xlsx");
  var sheetLists = table.SheetNames;
  const result = xlsx.utils.sheet_to_json(table.Sheets[sheetLists[0]]);
  const student = result.find((el: any) => el["имя"] === name);
  return student;
}

export default command;
