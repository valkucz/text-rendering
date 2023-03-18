import { vec2 } from "gl-matrix";
import { App } from "./app";
import "./style.css";
// import 'bulma/css/bulma.css';
// set canvas
const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const ctx: GPUCanvasContext = <GPUCanvasContext>canvas.getContext("webgpu");
// const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Context is null or undefined");
}

var dpr = window.devicePixelRatio || 1;
var rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr * 3;
canvas.height = rect.height * dpr * 3;

// TODO: remove export
export const conversionFactor = vec2.fromValues(canvas.width, canvas.height);
export const segments: number = 15;




const app = await App.initialize(ctx);
app.run();

var navbar = document.querySelector('.navbar');
var lastScrollTop = 0;

document.addEventListener('scroll', function() {
  var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (scrollTop > lastScrollTop) {
    navbar.classList.remove('is-visible');
  } else {
    navbar.classList.add('is-visible');
  }
  lastScrollTop = scrollTop;
});







