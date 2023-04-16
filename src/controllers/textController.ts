import { Controller } from "./controller";
import { App, defaultUrl } from "../app";
import { hexToRgba, rgbaToHex } from "../math";

const PREFIX = "./public/";

import { colors } from "./appController";
import { TextBlock } from "../scene/objects/textBlock";

const defaultColorHex = colors["primary"];

const defaultBgColorHex = colors["secondary"];

const defaultText = "A";
// FIXME: why is there problem with loading textController.ts
export class TextController implements Controller {
  private inputElem: HTMLInputElement;
  private colorElem: HTMLInputElement;
  private bgcolorElem: HTMLInputElement;
  private fontElem: HTMLSelectElement;
  private windingRadioElem: HTMLInputElement;
  private sdfRadioElem: HTMLInputElement;
  private spacing: HTMLInputElement;
  private width: HTMLInputElement;

  color: number[];
  bgColor: number[];
  textBlock: TextBlock;

  defaultColor: number[];
  defaultBgColor: number[];
  // font parser has glyph or glyph has font parser, so no need to pass both

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
    // TODO: remove defaults, use direct colors
    this.defaultColor = this.color = defaultColorHex;
    this.defaultBgColor = this.bgColor = defaultBgColorHex;
    this.textBlock = textBlock;

    console.log("Text controller", defaultColorHex, colors["primary"]);
    this.setup();
  }

  setup() {
    this.inputElem.value = defaultText;
    this.textBlock.spacing = parseFloat(this.spacing.value);

    this.textBlock.color = this.defaultColor;
    this.textBlock.bgColor = this.defaultBgColor;
    this.textBlock.updateText(defaultText);
  }

  addEventListener(app: App): void {
    this.colorElem.addEventListener("input", () => {
      this.color = hexToRgba(this.colorElem.value);
      this.textBlock.color = this.color;

      app.notify();
    });

    this.bgcolorElem.addEventListener("input", () => {
      this.bgColor = hexToRgba(this.bgcolorElem.value);
      this.textBlock.bgColor = this.bgColor;

      app.notify();
    });

    this.inputElem.addEventListener("input", () => {
      const text = this.inputElem.value;
      if (text.length > 0) {
        this.textBlock.updateText(text);
      }
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
  }

  updateColors() {
    console.log("updateColors()", this.color, this.defaultColor);
    console.log("text controller", this.color);
    this.color = colors["primary"];
    this.bgColor = colors["secondary"];
  }

  setElemColors() {
    this.textBlock.color = this.color;
    this.textBlock.bgColor = this.bgColor;
    this.bgcolorElem.value = rgbaToHex(this.bgColor);
    // console.log('hex', this.bgcolorElem.value);
    this.colorElem.value = rgbaToHex(this.color);
  }
}
