import { FontParser } from "../fonts/fontParser";
import { Controller } from "./controller";
import { App } from "../app";
import { Glyph } from "../scene/objects/glyph";
import { hexToRgb } from "../math";

// FIXME: why is there problem with loading textController.ts
export class TextController implements Controller {
    
  private inputElem: HTMLInputElement;
  private submitBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private colorElem: HTMLInputElement;
  private bgcolorElem: HTMLInputElement;

  // font parser has glyph or glyph has font parser, so no need to pass both
  fontParser: FontParser;

  glyph: Glyph;

  text: string;


  constructor(
    fontParser: FontParser,
    glyph: Glyph,
    text: string
  ) {
    this.fontParser = fontParser;
    this.glyph = glyph;
    this.text = text;

    this.inputElem = document.getElementById("text-input") as HTMLInputElement;
    this.submitBtn = document.getElementById("text-submit") as HTMLButtonElement;
    this.resetBtn = document.getElementById("text-reset") as HTMLButtonElement;
    this.colorElem = document.getElementById("text-color") as HTMLInputElement;
    this.bgcolorElem = document.getElementById("bgcolor") as HTMLInputElement;


  }
  
  addEventListener(app: App): void {
    this.colorElem.addEventListener("input", () => {
      this.glyph.color = hexToRgb(this.colorElem.value);

      this.glyph.updateColor();
      app.notify();
    });

    this.bgcolorElem.addEventListener("input", () => {
      this.glyph.backgroundColor = hexToRgb(this.bgcolorElem.value);

      this.glyph.updateColor();
      app.notify();
    });


    // FIXME: how should handle empty.
    this.inputElem.addEventListener("input", () => {
      this.text = this.inputElem.value;
      if (this.text.length > 0) {
        const vertices = this.fontParser.parseText(this.text);
        this.glyph.updateVertices(vertices);
        app.notify();
      }
    });

    this.resetBtn.addEventListener("click", () => {
      this.inputElem.value = "";
      // TODO: reset inputer with color
      this.fontParser.reset();
      const vertices = this.fontParser.parseText(this.text);
      this.glyph.updateVertices(vertices);
      this.glyph.resetColor();

      app.notify();
    })
    
  }

}
