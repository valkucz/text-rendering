import { FontParser } from "../fonts/fontParser";
import { Controller } from "./controller";

export class TextController implements Controller {
    
  inputElem: HTMLElement;
  buttonElem: HTMLElement;
  fontElem: HTMLElement;
  colorElem: HTMLElement;
  bgcolorElem: HTMLElement;

  fontParser: FontParser;

  constructor(
    fontParser: FontParser
  ) {
    this.inputElem = document.getElementById("text-input") as HTMLElement;
    this.buttonElem = document.getElementById("text-submit-btn") as HTMLElement;
    this.fontElem = document.getElementById("text-font") as HTMLElement;
    this.colorElem = document.getElementById("text-color") as HTMLElement;
    this.bgcolorElem = document.getElementById("bgcolor") as HTMLElement;

    this.fontParser = fontParser;
  }
  addEventListener(): void {}
}
