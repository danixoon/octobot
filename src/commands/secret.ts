import { ICommand } from "../handler";
import { emptyKeyboard } from "../keyboards";

const command: ICommand = {
  aliases: ["secret"],
  description: "Секреееет :)",
  async execute(session, response) {
    const answer = await response.question("Ты как?", ["плохо", "хорошо", "ну так"]);
    switch (answer) {
      case 0:
        response.say("так тебе и надо");
        break;
      case 1:
        response.say("очень жаль");
        break;
      case 2:
        response.say("эээ");
        break;
    }
    throw new Error("I AM EXCEPTION AHAHAHHAHA");
  }
};

export default command;
