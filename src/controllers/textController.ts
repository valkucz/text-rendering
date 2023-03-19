import { FontParser } from "../fonts/fontParser";
import { Controller } from "./controller";
import { App } from "../app";

// FIXME: why is there problem with loading textController.ts
export class TextController implements Controller {
    
  private inputElem: HTMLElement;
  private buttonElem: HTMLElement;
  private fontElem: HTMLElement;
  private colorElem: HTMLElement;
  private bgcolorElem: HTMLElement;

  fontParser: FontParser;


  constructor(
    fontParser: FontParser
  ) {
    this.fontParser = fontParser;

    this.inputElem = document.getElementById("text-input") as HTMLElement;
    this.buttonElem = document.getElementById("text-submit-btn") as HTMLElement;
    this.fontElem = document.getElementById("text-font") as HTMLElement;
    this.colorElem = document.getElementById("text-color") as HTMLElement;
    this.bgcolorElem = document.getElementById("bgcolor") as HTMLElement;

  }
  addEventListener(app: App): void {
    // empty
  }
}
