import { vec2 } from "gl-matrix";
import { App } from "./app";
import "./style.css";
// import 'bulma/css/bulma.css';
// set canvas
const canvas = <HTMLCanvasElement>document.getElementById("canvas");
// const ctx = canvas.getContext("2d");

var dpr = window.devicePixelRatio || 1;
var rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr * 3;
canvas.height = rect.height * dpr * 3;

// TODO: remove export
export const conversionFactor = vec2.fromValues(canvas.width, canvas.height);
export const segments: number = 15;

const app = await App.initialize(canvas);
app.run();

// TODO: move to menu controller, rename menu controller?
const navbar = document.querySelector(".navbar") as HTMLElement;
let lastScrollTop = 0;

document.addEventListener("scroll", function () {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (scrollTop > lastScrollTop) {
    navbar.classList.remove("is-visible");
  } else {
    navbar.classList.add("is-visible");
  }
  lastScrollTop = scrollTop;
});

const modeBtn = document.getElementById("mode-btn") as HTMLButtonElement;
let isLight = true;
modeBtn.addEventListener('click', () => {
  if (isLight) {
    isLight = false;
    document.documentElement.classList.add('dark-mode');
  }
  else {
    isLight = true;
    document.documentElement.classList.remove('dark-mode');
  }


})
