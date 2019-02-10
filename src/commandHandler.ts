import fs, { stat } from "fs";
import path from "path";
import { MessageContext } from "vk-io";

const COMMAND_PATH = "./commands";

export type ICommandCond = (ctx: MessageContext) => Promise<ICommandCondError>;
export type ICommandExec = (
  ctx: MessageContext,
  data: {
    handler: CommandHandler;
    state: any;
  }
) => Promise<ICommandPart | void>;

export interface ICommandCondError {
  error: boolean;
  message?: string;
}

export interface ICommandPart {
  next?: ICommandExec;
  condition?: ICommandCond;
  data?: any;
}

export interface ICommandData {
  aliases: string[];
  description: string;
  global?: boolean;
}

export interface ICommandPayload {
  command: string;
  [key: string]: any;
}

export interface ICommand extends ICommandData, ICommandPart {}

export interface ICommandState {
  command: ICommandData;
  stack: ICommandPart[];
}

// function loadCommands(): Promise<ICommand[]> {
//   return new Promise<ICommand[]>(async (res, rej) => {
//     const files = await new Promise<string[]>((res, rej) =>
//       fs.readdir(COMMAND_PATH, (err, files) => {
//         if (err) return rej(err);
//         return res(files);
//       })
//     ).catch(rej);
//     if (!files) return;
//     return res(
//       await Promise.all(
//         files
//           .filter(f => f.endsWith(".js"))
//           .map(async file => {
//             return (await import(path.resolve(COMMAND_PATH, file))).default || undefined;
//           })
//           .filter(f => f !== undefined)
//       )
//     );
//   });
// }

import start from "./commands/start";
import students from "./commands/students";
import undo from "./commands/undo";
import time from "./commands/time";
import { studentGetKeyboard } from "./keyboards";

async function loadCommands() {
  return [start, students, undo, time];
}

export default async function init(prefix: string) {
  try {
    return new CommandHandler(prefix, await loadCommands());
  } catch (error) {
    return Promise.reject(error);
  }
}

const fallbackCommand: ICommandExec = async ctx => {
  console.log(`Fallback Command by user ${ctx.peerId}`);
  ctx.send("Для взаимодействия с ботом используется клавиатуру ниже", { keyboard: studentGetKeyboard });
};

export class CommandHandler {
  prefix: string;
  commands: ICommand[];
  commandsState: Map<number, ICommandState> = new Map();
  constructor(prefix: string, commands: ICommand[]) {
    this.commands = commands || [];
    this.prefix = prefix;
  }
  getCommand(name: string) {
    return name.startsWith(this.prefix) && this.commands.find(c => c.aliases.includes(name.substr(1, name.length)));
  }
  async handleMessage(ctx: MessageContext) {
    const state = this.commandsState.get(ctx.peerId);
    const payload = ctx.messagePayload;
    await this.handleCommand(ctx, this.getCommand(payload ? `${this.prefix}${payload.command}` : ctx.text) as ICommand, state);
  }
  async handleCommand(ctx: MessageContext, command?: ICommand, state?: ICommandState) {
    if (!command && !state) fallbackCommand(ctx, { handler: this, state: {} });
    if (command && command.global && command.next) return await command.next(ctx, { handler: this, state: {} });

    if (!state && command) {
      state = this.createState(command);
      this.commandsState.set(ctx.peerId, state);
    }
    if (command && state && command.aliases[0] !== state.command.aliases[0]) return;
    if (!state) return;

    const last = state.stack[state.stack.length - 1];
    const condition = (last.condition && (await last.condition(ctx))) || ({} as any);
    // if (condition.error)
    // else if (condition.message) ctx.send(condition.message);
    if (condition) {
      if (condition.error) ctx.send(condition.message || "Неверные параметры");
      else {
        if (condition.message) ctx.send(condition.message);
        // this.handleState(ctx, state);
        await this.handleState(ctx, state, last);
      }
    }
  }
  createState(command: ICommand): ICommandState {
    command.data = {};
    return {
      command,
      stack: [command]
    };
  }
  async handleState(ctx: MessageContext, state: ICommandState, command: ICommandPart) {
    console.log(`Handling command ${state.command.aliases[0]} from user ${ctx.peerId}`);
    const next = command.next
      ? await command.next(ctx, {
          handler: this,
          state: command.data
        })
      : undefined;
    if (!next) this.commandsState.delete(ctx.peerId);
    else state.stack.push(next);
  }
  undoState(ctx: MessageContext) {
    const state = this.commandsState.get(ctx.peerId);
    if (!state) return;
    state.stack.splice(-2, 2);
    if (state.stack.length === 0) {
      this.commandsState.delete(ctx.peerId);
      console.log(`Command ${state.command.aliases[0]} state ended by user ${ctx.peerId}`);
      return true;
    } else {
      this.handleState(ctx, state, state.stack[state.stack.length - 1]);
      // console.log(`Command ${state.command.aliases[0]} state ended by user ${ctx.peerId}`);
      return false;
    }
  }
}
