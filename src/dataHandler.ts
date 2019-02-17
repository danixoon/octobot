import fs from "fs";
import { ICommand } from "./handler";
import hash from "./commands/hash";
import help from "./commands/help";
import secret from "./commands/secret";
import student from "./commands/student";
import start from "./commands/start";
import test from "./commands/test";

export function getAllCommands(): ICommand[] {
  return [hash, help, secret, student, start, test];
}

export function loadData<T>(path: string): Promise<T> {
  return new Promise((res, rej) => {
    fs.readFile(path, (err, data) => {
      if (err) return rej(err);
      try {
        return res(JSON.parse(data.toString()));
      } catch (err) {
        rej(err);
      }
    });
  });
}
export function saveData(path: string, data: any) {
  return new Promise((res, rej) => {
    fs.writeFile(path, data, err => {
      if (err) return rej(err);
      return res();
    });
  });
}
