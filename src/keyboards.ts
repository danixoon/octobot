import { Keyboard } from "vk-io";

export const emptyKeyboard = Keyboard.keyboard([]);

export const backButton = Keyboard.textButton({
  color: "negative",
  label: "Назад",
  payload: { command: "undo" }
});

export const passwordGetButton = Keyboard.textButton({
  color: "positive",
  label: "Ввести пароль",
  payload: {
    command: "student"
  }
});

export const defaultKeyboard = Keyboard.keyboard([backButton]);

export const yesNoKeyboard = Keyboard.keyboard([
  [
    Keyboard.textButton({
      color: "positive",
      label: "Да",
      payload: {
        // command: this.aliases[0],
        answer: true
      }
    }),
    Keyboard.textButton({
      color: "negative",
      label: "Нет",
      payload: {
        // command: this.aliases[0],
        answer: false
      }
    })
  ],
  [backButton]
]);
