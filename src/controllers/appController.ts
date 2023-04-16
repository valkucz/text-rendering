import { App } from "../app";
import { hexToRgba } from "../math";
import { Controller } from "./controller";
import { TextController } from "./textController";

/* Dark mode */
const dark = {
  0: hexToRgba("#03C4A1"),
  1: hexToRgba("#66347f"),
  3: hexToRgba("#232931"),
};

/* Light mode */
const light = {
  0: hexToRgba("#9DE5FF"),
  1: hexToRgba("#fbfbfb"),
  3: hexToRgba("#ffffff"),
};

export const colors = {
  primary: light[0],
  secondary: light[1],
  ternary: light[3],
};

export class AppController implements Controller {
  private navbar: HTMLElement;
  private modeBtn: HTMLButtonElement;

  private textController: TextController;

  private isLight: boolean = true;
  private lastScrollTop: number = 0;

  constructor(textController: TextController) {
    this.navbar = document.querySelector(".navbar") as HTMLElement;
    this.modeBtn = document.getElementById("mode-btn") as HTMLButtonElement;

    // Init
    this.textController = textController;
    this.textController.setElemColors();
  }

  addEventListener(app: App) {
    document.addEventListener("scroll", () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > this.lastScrollTop) {
        this.navbar.classList.remove("is-visible");
      } else {
        this.navbar.classList.add("is-visible");
      }
      this.lastScrollTop = scrollTop;
    });

    this.modeBtn.addEventListener("click", () => {
      console.log("here");
      if (this.isLight) {
        this.isLight = false;
        colors["primary"] = dark[0];
        colors["secondary"] = dark[1];
        colors["ternary"] = dark[3];
        document.documentElement.classList.add("dark-mode");
      } else {
        this.isLight = true;
        colors["primary"] = light[0];
        colors["secondary"] = light[1];
        colors["ternary"] = light[3];
        document.documentElement.classList.remove("dark-mode");
      }
      this.textController.color = colors["primary"];
      this.textController.bgColor = colors["secondary"];
      this.textController.setElemColors();
      app.notify();
    });
  }
}
