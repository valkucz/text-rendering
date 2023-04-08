import { Controller } from "./controller";
import { App, defaultUrl } from "../app";
import { Glyph } from "../scene/objects/glyph";
import { hexToRgba, rgbaToHex } from "../math";

const PREFIX = "./public/";

import { colors } from './appController'
import { TextBlock } from "../scene/objects/textBlock";

const defaultColorHex = colors['primary'];

const defaultBgColorHex = colors['secondary'];

const defaultText = 'A';
// FIXME: why is there problem with loading textController.ts
export class TextController implements Controller {
    
  private inputElem: HTMLInputElement;
  private resetBtn: HTMLButtonElement;
  private colorElem: HTMLInputElement;
  private bgcolorElem: HTMLInputElement;
  private fontElem: HTMLSelectElement;


  color: number[];
  bgColor: number[];
  textBlock: TextBlock;

  defaultColor: number[];
  defaultBgColor: number[];
  // font parser has glyph or glyph has font parser, so no need to pass both


  constructor(
    textBlock: TextBlock,
  ) {

    this.inputElem = document.getElementById("text-input") as HTMLInputElement;
    this.resetBtn = document.getElementById("text-reset") as HTMLButtonElement;
    this.colorElem = document.getElementById("text-color") as HTMLInputElement;
    this.bgcolorElem = document.getElementById("bgcolor") as HTMLInputElement;
    this.fontElem = document.getElementById("text-font") as HTMLSelectElement;
    // TODO: remove defaults, use direct colors
    this.defaultColor = this.color = defaultColorHex;
    this.defaultBgColor = this.bgColor = defaultBgColorHex;
    this.textBlock = textBlock;

    console.log('Text controller', defaultColorHex, colors['primary']);
    this.setup();
    
    
  }
  
  setup() {
    this.inputElem.value = defaultText;
    this.textBlock.updateText(defaultText);
    this.textBlock.color = this.defaultColor;
    this.textBlock.bgColor = this.defaultBgColor;
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

    this.resetBtn.addEventListener("click", async () => {

      console.log('Text controller', defaultColorHex, colors['primary']);
      if (this.color != colors['primary'] || this.bgColor != colors['secondary']) {
        this.updateColors();

        
      }
      const url = PREFIX + this.fontElem.value;
      this.fontElem.selectedIndex = 0;
      if (url != defaultUrl) {
        await this.textBlock.updateFont(defaultUrl);
      }

      this.inputElem.value = defaultText;
      this.textBlock.updateText(defaultText);
      app.notify();
    })

    this.fontElem.addEventListener("change", async () => {
      const url = PREFIX + this.fontElem.value;
      await this.textBlock.updateFont(url);
      app.notify();
    })   
  }

  updateColors() {
    console.log('updateColors()', this.color, this.defaultColor);
    console.log('text controller', this.color);
    this.color = colors['primary'];
    this.bgColor = colors['secondary'];


  }

  setElemColors() {
    this.textBlock.color = this.color;
    this.textBlock.bgColor = this.bgColor;
    this.bgcolorElem.value = rgbaToHex(this.bgColor);
    // console.log('hex', this.bgcolorElem.value);
    this.colorElem.value = rgbaToHex(this.color);
  }

}
