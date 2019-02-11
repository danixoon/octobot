import { ICommand, ICommandExec } from "../commandHandler";
import { emptyKeyboard, backButton } from "../keyboards";
import xlsx from "xlsx";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { Keyboard } from "vk-io";
import * as dataHandler from "../dataHandler";
import logger, { LogType } from "../logHandler";

const PASSWORD_PATH = "./config/passwords.json";

export interface IStudent {
  hash: string;
  studentName: string;
}

const command: ICommand = {
  aliases: ["student"],
  description: "Выдать информацию о студенте",
  async next(ctx, { state }) {
    const passwords = await dataHandler.loadData<IStudent[]>(PASSWORD_PATH).catch(err => logger.log("command: student", err, LogType.error));
    if (!passwords) {
      ctx.send("Вышла ошибочка при загрузке данных студентов, свяжитесь с админами, плес...");
      return;
    }
    ctx.send("Введите пароль.", {
      keyboard: Keyboard.keyboard([[backButton]])
    });
    return {
      next: getStudentInfo,
      data: state,
      condition: async ctx => {
        const hash = crypto
          .createHash("md5")
          .update(ctx.text)
          .digest("hex");
        const user = passwords.find(p => p.hash === hash);
        if (!user)
          return {
            error: true,
            message: "Неверный пароль."
          };
        else {
          state.user = user.studentName;
          return {
            error: false,
            message: "Отправляю.."
          };
        }
      }
    };
  }
};

const getStudentInfo: ICommandExec = async (ctx, { state }) => {
  const student = findStudent(state.user);
  if (!student) ctx.send("Студент не найден.");
  else {
    const doc = xlsx.utils.json_to_sheet([student]);
    const book = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(book, doc, "Ведомость");
    xlsx.writeFile(book, "./student.xlsx");
    ctx.sendDocument({
      value: "./student.xlsx",
      filename: `${state.user} (${new Date().toISOString().split("T")[0]}).xlsx`
    });
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
