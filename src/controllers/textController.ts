import { App } from "../app";
import { hexToRgba, rgbaToHex } from "../math";

const PREFIX = "./fonts/";

import { colors } from "./appController";
import { TextBlock } from "../scene/objects/textBlock";

const defaultColorHex = colors["primary"];

const defaultBgColorHex = colors["secondary"];

const defaultText = "Text rendering";
export class TextController {
  private inputElem: HTMLInputElement;
  private colorElem: HTMLInputElement;
  private bgcolorElem: HTMLInputElement;
  private fontElem: HTMLSelectElement;
  private windingRadioElem: HTMLInputElement;
  private sdfRadioElem: HTMLInputElement;
  private spacing: HTMLInputElement;
  private width: HTMLInputElement;
  private size: HTMLInputElement;

  color: number[];
  bgColor: number[];
  textBlock: TextBlock;

  defaultColor: number[];
  defaultBgColor: number[];

  constructor(textBlock: TextBlock) {
    this.inputElem = document.getElementById("text-input") as HTMLInputElement;
    this.colorElem = document.getElementById("text-color") as HTMLInputElement;
    this.bgcolorElem = document.getElementById("bgcolor") as HTMLInputElement;
    this.fontElem = document.getElementById("text-font") as HTMLSelectElement;
    this.windingRadioElem = document.getElementById(
      "radio-is-winding"
    ) as HTMLInputElement;
    this.sdfRadioElem = document.getElementById(
      "radio-is-sdf"
    ) as HTMLInputElement;
    this.spacing = document.getElementById("text-spacing") as HTMLInputElement;
    this.width = document.getElementById("text-width") as HTMLInputElement;
    this.size = document.getElementById("text-size") as HTMLInputElement;
    this.defaultColor = this.color = defaultColorHex;
    this.defaultBgColor = this.bgColor = defaultBgColorHex;
    this.textBlock = textBlock;
    this.setup();
  }

  setup() {
    this.inputElem.value = defaultText;
    this.textBlock.spacing = parseFloat(this.spacing.value);

    this.textBlock.color = this.defaultColor;
    this.textBlock.text = defaultText;
  }

  addEventListener(app: App): void {
    this.colorElem.addEventListener("input", () => {
      this.color = hexToRgba(this.colorElem.value);
      this.textBlock.color = this.color;
      app.notify();
    });

    this.bgcolorElem.addEventListener("input", () => {
      this.bgColor = hexToRgba(this.bgcolorElem.value);
      app.notify();
    });

    this.inputElem.addEventListener("input", () => {
      const text = this.inputElem.value;
      this.textBlock.text = text.length > 0 ? text : '';
      app.notify();
    });

    this.fontElem.addEventListener("change", async () => {
      const url = PREFIX + this.fontElem.value;
      await this.textBlock.updateFont(url);
      app.notify();
    });

    this.windingRadioElem.addEventListener("change", () => {
      this.textBlock.isWinding = true;
      app.notify();
    });

    this.sdfRadioElem.addEventListener("change", () => {
      this.textBlock.isWinding = false;
      app.notify();
    });

    this.spacing.addEventListener("input", () => {
      this.textBlock.spacing = parseFloat(this.spacing.value);
      app.notify();
    });

    this.width.addEventListener("input", () => {
      this.textBlock.width = parseFloat(this.width.value);
      app.notify();
    });

    this.size.addEventListener("input", () => {
      this.textBlock.size = parseFloat(this.size.value);
      app.notify();
    });
  }

  updateColors() {
    this.color = colors["primary"];
    this.bgColor = colors["secondary"];
  }

  setElemColors() {
    this.textBlock.color = this.color;
    this.bgcolorElem.value = rgbaToHex(this.bgColor);
    this.colorElem.value = rgbaToHex(this.color);
  }
}
