const logColor = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fgBlack: "\x1b[30m",
  fgRed: "\x1b[31m",
  fgGreen: "\x1b[32m",
  fgYellow: "\x1b[33m",
  fgBlue: "\x1b[34m",
  fgMagenta: "\x1b[35m",
  fgCyan: "\x1b[36m",
  fgWhite: "\x1b[37m",

  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

export enum LogType {
  error = "\x1b[31m",
  info = "\x1b[32m",
  warning = "\x1b[33m",
  wtf = "\x1b[35m",
  default = "\x1b[0m"
}

export default {
  log(from: string, data: any, type: LogType = LogType.default) {
    const date = new Date();
    const h = date.getHours().toString();
    const m = date.getMinutes().toString();
    const s = date.getSeconds().toString();
    const time = `${h.length > 1 ? h : `0${h}`}:${m.length > 1 ? m : `0${m}`}:${s.length > 1 ? s : `0${s}`}`;
    console.log(`${type}[${from} ${time}] ${data}${[LogType.default]}`);
  }
};
