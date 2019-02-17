import { EventEmitter } from "events";
import readline from "readline";
import { MessageContext } from "vk-io";
import logger, { LogType } from "./logger";

export type ActionCallback = () => Promise<any>;

const defaultCommands: ICommand[] = [
  {
    aliases: ["undo"],
    description: "Отменяет действие",
    global: true,
    execute: async cmd => {
      await cmd.undo();
    }
  },
  {
    description: "Выходит из команды",
    aliases: ["stop"],
    global: true,
    execute: async cmd => {
      await cmd.stop();
    }
  }
];

export class CommandHandler {
  sessions: Map<number, Session> = new Map();
  commands: ICommand[];
  prefix: string;

  constructor(prefix: string = "/", commands?: ICommand[]) {
    this.commands = commands ? defaultCommands.concat(commands) : defaultCommands;
    this.prefix = prefix;
  }

  async handle(user: number, ctx: MessageContext) {
    const payload = ctx.messagePayload as IPayload;
    const command = (payload && payload.command && `${this.prefix}${payload.command}`) || ctx.text;
    const isCommand = command.startsWith(this.prefix);
    const commandName = isCommand ? command.substr(this.prefix.length, command.length) : command;
    const cmd = isCommand && this.commands.find(c => c.aliases.includes(commandName));

    let session = this.sessions.get(user);

    if (!session && !cmd) return;
    if (session && cmd && cmd.global) return await this.execute(session, cmd, ctx);
    if ((session && !cmd) || (session && cmd))
      return session.onMessage({
        message: ctx.text,
        payload: ctx.messagePayload as any
      });
    if (!session && cmd) {
      session = new Session(this);
      this.sessions.set(user, session);
      await this.execute(session, cmd, ctx);
      this.sessions.delete(user);
      return;
    }
  }
  async execute(session: Session, cmd: ICommand, ctx: MessageContext) {
    const commandName = `${this.prefix}${cmd.aliases[0]}`;
    logger.log("handler", `executing ${commandName}`);
    await session.execute(cmd, ctx).catch(err => {
      logger.log("handler", `command ${commandName} error: ${err ? err.message || err : "uh.."}`, LogType.error);
    });
    logger.log("handler", `executed ${commandName}`);
  }
}

export interface ICommand {
  aliases: string[];
  description: string;
  global?: boolean;
  execute: (session: Session, ctx: MessageContext) => Promise<void>;
}

interface IAction {
  callback: ActionCallback;
  id?: string;
}

interface IState {
  id?: string;
  actions: IAction[];
}

interface IMessage {
  message: string;
  payload?: IPayload;
}

interface IPayload {
  command?: any;
  [key: string]: any;
}

export class Session {
  private states: IState[] = [];
  private currentState: number = 0;
  private currentAction: number = 0;
  private inState: boolean = false;
  private emitter: EventEmitter = new EventEmitter();
  public readonly handler: CommandHandler;
  public command?: ICommand;
  public constructor(handler: CommandHandler) {
    this.handler = handler;
    this.emitter.on("state", async () => {
      this.emitter.removeAllListeners("message");
      this.inState = true;
      await this.init();
      this.inState = false;
    });
    this.emitter.on("stop", () => {
      this.command = undefined;
      this.states = [];
      this.currentAction = 0;
      this.emitter.removeAllListeners();
    });
  }
  public state(actions: ActionCallback[], name?: string): Session;
  public state(name?: string): Session;
  public state(...args: any[]): Session {
    if (typeof args[0] === "string") {
      this.states.push({ actions: [], id: args[0] });
    } else {
      this.states.push({
        actions: args[0].map((a: ActionCallback) => {
          return { callback: a };
        }),
        id: args[1]
      });
    }
    return this;
  }
  public action(cb: ActionCallback): Session;
  public action(name: string, cb: ActionCallback): Session;
  public action(...args: any[]): Session {
    if (this.states.length === 0) this.state();
    const last = this.states[this.states.length - 1];

    if (typeof args[0] === "function") {
      last.actions.push({ callback: args[0] });
    } else if (typeof args[0] === "string" && typeof args[1] === "function") {
      last.actions.push({ callback: args[1], id: args[0] });
    }
    return this;
  }
  private async update() {
    const curr = this.states[this.currentState].actions[this.currentAction++];
    if (!curr) return;
    await new Promise(async (res, rej) => {
      this.emitter.once("invalidate", res);
      await curr.callback().catch(rej);
      res();
    });
    this.emitter.emit("state");
    await this.update();
  }
  public async init() {
    if (!this.inState) await this.update();
  }
  public onMessage(data: IMessage) {
    this.emitter.emit("message", data);
  }
  public async messagePayload(): Promise<IMessage> {
    return await new Promise(res => {
      this.emitter.once("message", res);
    });
  }
  public async message(): Promise<string> {
    const payload = await this.messagePayload();
    return payload.message;
  }
  private invalidate() {
    this.emitter.emit("invalidate");
  }
  public async execute(command: ICommand, ctx: MessageContext) {
    return new Promise(async (res, rej) => {
      this.emitter.once("stop", () => res());

      if (!command.global) this.command = command;
      await command.execute(this, ctx).catch(rej);
      if (!command.global) this.command = undefined;

      res();
    });
  }
  public stop() {
    this.emitter.emit("stop");
  }
  public undo() {
    const last = this.states[this.states.length - 1];
    this.currentAction -= 2;
    if (this.currentAction >= 0 && this.currentAction < last.actions.length) this.invalidate();
    else this.stop();
  }
  public next(actionId: number | string, stateId: number | string = this.currentState) {
    const stateIndex = typeof stateId === "string" ? this.states.findIndex(s => s.id === stateId) : stateId;
    if (stateIndex === -1 || stateIndex < 0 || stateIndex >= this.states.length) return;

    const actionIndex = typeof actionId === "string" ? this.states[stateIndex].actions.findIndex(a => actionId === a.id) : actionId;
    if (actionIndex === -1 || actionIndex < 0 || actionIndex >= this.states.length) return;
    this.currentAction = actionIndex;
    this.currentState = stateIndex;
    return this.invalidate();
  }
  public repeat() {
    this.currentAction--;
    this.invalidate();
  }
}

export async function timeout(ms: number) {
  await new Promise(res => setTimeout(res, ms));
}
