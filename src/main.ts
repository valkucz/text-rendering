import { vec2 } from "gl-matrix";
import { App } from "./app";
import "./style.css";
const canvas = <HTMLCanvasElement>document.getElementById("canvas");

var dpr = window.devicePixelRatio || 1;
var rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;

export const conversionFactor = vec2.fromValues(canvas.width, canvas.height);

const app = await App.initialize(canvas);
app.run();
