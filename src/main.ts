import "./style.css";
import { initialize } from "./rendering/renderer";

// set canvas
const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const ctx: GPUCanvasContext = <GPUCanvasContext>canvas.getContext("webgpu");

var dpr = window.devicePixelRatio || 1;
var rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr * 3;
canvas.height = rect.height * dpr * 3;

await initialize(ctx);

