import { FontParser } from "../fonts/fontParser";
import { Controller } from "./controller";
import { App } from "../app";
import { Glyph } from "../scene/objects/glyph";

// FIXME: why is there problem with loading textController.ts
export class TextController implements Controller {
    
  private inputElem: HTMLInputElement;
  private buttonElem: HTMLElement;
  private colorElem: HTMLInputElement;
  private bgcolorElem: HTMLInputElement;

  // font parser has glyph or glyph has font parser, so no need to pass both
  fontParser: FontParser;

  glyph: Glyph;


  constructor(
    fontParser: FontParser,
    glyph: Glyph
  ) {
    this.fontParser = fontParser;
    this.glyph = glyph;

    this.inputElem = document.getElementById("text-input") as HTMLInputElement;
    this.buttonElem = document.getElementById("text-submit-btn") as HTMLElement;
    this.colorElem = document.getElementById("text-color") as HTMLInputElement;
    this.bgcolorElem = document.getElementById("bgcolor") as HTMLInputElement;

    // FIXME: setup; change
    this.glyph.color = this.hexToRgb(this.colorElem.value);
    this.glyph.background = this.hexToRgb(this.bgcolorElem.value);
    glyph.update();

  }
  
  addEventListener(app: App): void {
    this.colorElem.addEventListener("input", () => {
      this.glyph.color = this.hexToRgb(this.colorElem.value);

      this.glyph.update();
      app.notify();
    });

    this.bgcolorElem.addEventListener("input", () => {
      this.glyph.background = this.hexToRgb(this.bgcolorElem.value);

      this.glyph.update();
      app.notify();
    });
    
  }

  hexToRgb(hex: string): number[] {
    // Convert hex color string to RGB color object
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;
    const a = 1.0;
    return [r, g, b, a];
  }
}
