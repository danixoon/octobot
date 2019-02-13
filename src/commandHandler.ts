import fs, { stat } from "fs";
import path from "path";
import { MessageContext, Keyboard } from "vk-io";
import logger from "./logHandler";

const COMMAND_PATH = "./commands";

export type ICommandCond = (ctx: MessageContext) => Promise<ICommandCondResult>;
export type ICommandExec = (
  ctx: MessageContext,
  data: {
    handler: CommandHandler;
    state: any;
  }
) => Promise<ICommandCallback | void>;

export interface ICommandCondResult {
  error: boolean;
  message?: string;
  next?: ICommandExec;
}

export interface ICommandCallback {
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

export interface ICommand extends ICommandData, ICommandCallback {}

export interface ICommandState {
  command: ICommandData;
  stack: ICommandCallback[];
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
import students from "./commands/student";
import undo from "./commands/undo";
import time from "./commands/secret";
import help from "./commands/help";
import hash from "./commands/hash";

import { passwordGetButton } from "./keyboards";

async function loadCommands() {
  return [start, students, undo, time, help, hash];
}

export default async function init(prefix: string) {
  try {
    return new CommandHandler(prefix, await loadCommands());
  } catch (error) {
    return Promise.reject(error);
  }
}

const fallbackCommand: ICommandExec = async ctx => {
  // console.log();
  logger.log(`command handler`, `fallback command by user ${ctx.peerId}`);
  ctx.send("Для взаимодействия с ботом используйте клавиатуру ниже", { keyboard: Keyboard.keyboard([passwordGetButton]) });
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
    return name.startsWith(this.prefix) && this.commands.find(c => c.aliases.includes(name.toLowerCase().substr(1, name.length)));
  }
  async forceExitMessage(ctx: MessageContext) {
    await ctx.send("Вы вышли из бота", {
      keyboard: Keyboard.keyboard([passwordGetButton])
    });
  }
  async handleMessage(ctx: MessageContext) {
    const state = this.commandsState.get(ctx.peerId);
    const payload = ctx.messagePayload;
    await this.handleCommand(ctx, this.getCommand(payload ? `${this.prefix}${payload.command}` : ctx.text) as ICommand, state);
  }
  async handleCommand(ctx: MessageContext, command?: ICommand, state?: ICommandState) {
    if (!command && !state) fallbackCommand(ctx, { handler: this, state: {} });
    if (command && command.global && command.next) {
      logger.log("command handler", `handling global command ${command.aliases[0]} from user ${ctx.peerId}`);
      return await command.next(ctx, { handler: this, state: {} });
    }

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
      if (condition.error) {
        if (condition.message) ctx.send(condition.message);
      } else {
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
  async handleState(ctx: MessageContext, state: ICommandState, command: ICommandCallback) {
    // console.log(`Handling command ${state.command.aliases[0]} from user ${ctx.peerId}`);
    logger.log("command handler", `handling command ${state.command.aliases[0]} from user ${ctx.peerId}`);
    const next = command.next
      ? await command.next(ctx, {
          handler: this,
          state: command.data
        })
      : undefined;
    if (!next) {
      this.commandsState.delete(ctx.peerId);
      // this.forceExitMessage(ctx);
    } else state.stack.push(next);
  }
  undoState(ctx: MessageContext) {
    const state = this.commandsState.get(ctx.peerId);
    if (!state) return;
    state.stack.splice(-2, 2);
    if (state.stack.length === 0) {
      this.commandsState.delete(ctx.peerId);
      // this.forceExitMessage(ctx);
      logger.log("command handler", `command ${state.command.aliases[0]} state ended by user ${ctx.peerId}`);
      // console.log(`Command ${state.command.aliases[0]} state ended by user ${ctx.peerId}`);
      return true;
    } else {
      this.handleState(ctx, state, state.stack[state.stack.length - 1]);
      // console.log(`Command ${state.command.aliases[0]} state ended by user ${ctx.peerId}`);
      return false;
    }
  }
}
