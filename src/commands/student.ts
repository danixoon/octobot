import { ICommand, ICommandExec, ICommandCond, ICommandCondResult, ICommandCallback } from "../commandHandler";
import { emptyKeyboard, backButton } from "../keyboards";
import xlsx from "xlsx";
import path from "path";
import crypto from "crypto";
import fs, { stat } from "fs";
import { Keyboard, MessageContext } from "vk-io";
import * as dataHandler from "../dataHandler";
import logger, { LogType } from "../logHandler";

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
  async next(ctx) {
    const credentials = await dataHandler.loadData<ICredentials>(PASSWORD_PATH).catch(err => logger.log("command: student", err, LogType.error));
    const data: any = {
      credentials
    };
    if (!credentials) {
      ctx.send("Вышла ошибочка при загрузке данных студентов, свяжитесь с админами, плес...");
      return;
    }
    ctx.send("Введите пароль.", {
      keyboard: Keyboard.keyboard([[backButton]])
    });
    return {
      next: async (ctx, data) => (data.state.isAdmin ? await handleAdminPanel(ctx, data) : await handleStudentInfo(ctx, data)),
      data,
      condition: async ctx => {
        const hash = crypto
          .createHash("md5")
          .update(ctx.text)
          .digest("hex");
        const isAdmin = credentials.admin === hash;
        const user = isAdmin ? undefined : credentials.users.find(p => p.hash === hash);
        if (!isAdmin && !user) {
          return invalidPassword;
        } else if (isAdmin) {
          data.isAdmin = true;
          return { error: false };
        } else {
          data.user = (user as IStudent).studentName;
          return { error: false };
        }
      }
    };
  }
};

const invalidPassword: ICommandCondResult = {
  error: true,
  message: "Неверный пароль"
};

const handleStudentInfo: ICommandExec = async (ctx, { state, handler }) => {
  const student = findStudent(state.user);
  if (!student) ctx.send("Студент не найден.");
  else {
    ctx.send("Подождите..");
    const doc = xlsx.utils.json_to_sheet([student]);
    const book = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(book, doc, "Ведомость");
    xlsx.writeFile(book, "./student.xlsx");
    await ctx.sendDocument({
      value: "./student.xlsx",
      filename: `${state.user} (${new Date().toISOString().split("T")[0]}).xlsx`
    });
    handler.forceExitMessage(ctx);
  }
};

const handleAdminPanel: ICommandExec = async (ctx, { state, handler }) => {
  enum ActionType {
    getData = "getData",
    setData = "setData",
    complete = "complete"
  }
  ctx.send("Добро пожаловать, господин. Чего желаете?", {
    keyboard: Keyboard.keyboard([
      [Keyboard.textButton({ label: "Готово", color: "positive", payload: { action: ActionType.complete } })],
      [
        Keyboard.textButton({ label: "Вывести данные", color: "primary", payload: { action: ActionType.getData } }),
        Keyboard.textButton({ label: "Внести данные", color: "primary", payload: { action: ActionType.setData } })
      ],
      [backButton]
    ])
  });
  return {
    // next: async (ctx, data) => (!data.state.action)
    condition: async ctx => {
      const payload = ctx.messagePayload;
      if (!payload || !payload.action) return { error: true };
      else {
        state.action = payload.action;
        switch (payload.action as ActionType) {
          case ActionType.getData: {
            await ctx.send("Студенты:\n" + state.credentials.users.map((c: IStudent) => `${c.studentName}:${c.password}`).join("\n"));
            return {
              error: true
            };
          }
          case ActionType.complete: {
            handler.forceExitMessage(ctx);
            return { error: false };
          }
          default:
            return { error: true };
        }
      }
    }
  };
};

function findStudent(name: string): any {
  const table = xlsx.readFile("./config/students.xlsx");
  var sheetLists = table.SheetNames;
  const result = xlsx.utils.sheet_to_json(table.Sheets[sheetLists[0]]);
  const student = result.find((el: any) => el["имя"] === name);
  return student;
}

export default command;
