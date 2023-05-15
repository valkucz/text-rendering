import { App } from "../app";
import { hexToRgba } from "../math";
import { TextController } from "./textController";

/* Dark mode */
const dark = {
  0: hexToRgba("#03C4A1"),
  1: hexToRgba("#232931"),
};

/* Light mode */
const light = {
  0: hexToRgba("#9DE5FF"),
  1: hexToRgba("#ffffff"),
};

export const colors = {
  primary: light[0],
  secondary: light[1],
};

export class AppController {
  private navbar: HTMLElement;
  private modeBtn: HTMLButtonElement;
  private burgerBtn: HTMLButtonElement;
  private mobileMood: HTMLAnchorElement;
  private mobileMenu: HTMLElement;
  private textController: TextController;
  private isLight: boolean = true;
  private lastScrollTop: number = 0;

  constructor(textController: TextController) {
    this.navbar = document.querySelector(".navbar") as HTMLElement;
    this.modeBtn = document.getElementById("mode-btn") as HTMLButtonElement;
    this.burgerBtn = document.getElementById("burger-btn") as HTMLButtonElement;
    this.mobileMood = document.getElementById("mobile-mode") as HTMLAnchorElement;
    this.mobileMenu = document.getElementById("mobile-menu-content") as HTMLElement;
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

    this.modeBtn.addEventListener("click", () => this.changeMode(app));
    this.mobileMood.addEventListener("click", () => this.changeMode(app));

    this.burgerBtn.addEventListener("click", () => {
      // this.burgerBtn.ariaExpanded = "true";
      this.burgerBtn.classList.toggle("is-active");
      this.mobileMenu.style.display = this.mobileMenu.style.display === "block" ? "none" : "block";
      // document.getElementById("navbar-menu").classList.toggle("is-active");
    });
  }

  changeMode(app: App) {
    if (this.isLight) {
      this.isLight = false;
      colors["primary"] = dark[0];
      colors["secondary"] = dark[1];
      this.mobileMood.innerHTML = "Light mode";
      document.documentElement.classList.add("dark-mode");
    } else {
      this.isLight = true;
      colors["primary"] = light[0];
      colors["secondary"] = light[1];
      this.mobileMood.innerHTML = "Dark mode";
      document.documentElement.classList.remove("dark-mode");
    }
    this.textController.bgColor = colors["secondary"];
    // this.textController.updateColors();
    this.textController.setElemColors();
    app.notify();
  }
}
