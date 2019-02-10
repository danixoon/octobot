import crypto from "crypto";
import readline from "readline";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";

// import { IStudent } from "./commands/students";

const rl = readline.createInterface(process.stdin, process.stdout);

(async () => {
  while (true) {
    let fileName = await question("Введите имя файла: ");
    var p = `./${fileName}.xlsx`;
    if (await exists(p)) break;
    rl.write(`Файла по пути ${p} не существует.\n`);
  }
  const table = xlsx.readFile(p);
  const sheetLists = table.SheetNames;
  const result = xlsx.utils.sheet_to_json(table.Sheets[sheetLists[0]]);
  while (true) {
    var tableName = await question("Введите имя столбца с именем студента: ");
    const student = result.find((el: any) => el[tableName] !== undefined);
    if (student) break;
    rl.write("Такого столбца не существует\n");
  }
  const creditinals = result.map((r: any) => {
    const password = makeid();
    const hash = crypto
      .createHash("md5")
      .update(password)
      .digest("hex");
    return { studentName: r[tableName], password, hash };
  });
  await new Promise(res => fs.writeFile("./passwords.json", JSON.stringify(creditinals), res));
  rl.write("Успешное сохранение в файл passwords.json");
  setTimeout(() => {}, 1000);
  rl.close();
})();

async function exists(path: string) {
  return new Promise<boolean>(res => fs.exists(path, res));
}

async function question(text: string): Promise<string> {
  return new Promise<string>(res => rl.question(text, res));
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 5; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}
