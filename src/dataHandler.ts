import fs from "fs";
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
