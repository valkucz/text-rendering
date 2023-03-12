import { vec2 } from "gl-matrix";
import "./style.css";
import { Renderer } from "./rendering/renderer";
import { Camera } from "./scene/camera";
import { mapKeyToMoveDirection } from "./scene/moveDirection";
import { parseText } from "./fonts";
import { Glyph } from "./scene/objects/glyph";

/**
 * Initialization of WebGPU device, adapter.
 * @param vertices
 * @returns renderer if no error occured
 */
async function initializeWebGPU(): Promise<Renderer | void> {
  console.log(navigator.gpu);
  if (!("gpu" in navigator)) {
    console.error("User agent doesn’t support WebGPU.");
    return;
  }

  // create adapter
  const adapter: GPUAdapter = <GPUAdapter>await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("No WebGPU adapters found.");
    return;
  }

  // create device
  const device: GPUDevice = <GPUDevice>await adapter.requestDevice();

  // create camera
  const camera: Camera = new Camera();

  return new Renderer(ctx, device, camera);
}

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

const renderer = await initializeWebGPU();

if (renderer) {
  
  const vertices = await parseText('op');
  const glyph = new Glyph(renderer.device, vertices);

  renderer.render(glyph);

  document.addEventListener("keydown", (event) => {
    renderer.camera.move(mapKeyToMoveDirection(event.key));
    renderer.camera.updateView();
    renderer.render(glyph);
  })
}

// TODO: move to custom file

const menuButtonElement = document.getElementById('controller-menu-button');
const menuElement = document.getElementById('controller-menu');
const menuImg = document.getElementById('menu-icon');

menuButtonElement.addEventListener('click', () => {
  if (menuElement.style.display === 'none') {
    menuImg.style.transform = 'rotate(90deg)';
    menuElement.style.display = 'block';
    // menuImg.src = "./public/icons/angle-down.png"
  }
  else {
    menuImg.style.transform = 'rotate(0deg)';
    menuElement.style.display = 'none';
    // menuImg.src = "./public/icons/angle-right.png"

  }
});

const draggableElement = document.getElementById('drag-controler');


if (!draggableElement) {
  throw new Error('Document elemenet with id "draggable" not found');
}

let mouseX = 0;
let mouseY = 0;
let elementX = 0;
let elementY = 0;

draggableElement.addEventListener('mousedown', (event) => {
  document.addEventListener('mousemove', drag);

  mouseX = event.clientX;
  mouseY = event.clientY;
  elementX = draggableElement.offsetLeft;
  elementY = draggableElement.offsetTop;
});

draggableElement.addEventListener('mouseup', () => {
  document.removeEventListener('mousemove', drag);
});


function drag(event) {
  const deltaX = event.clientX - mouseX;
  const deltaY = event.clientY - mouseY;
  const newElementX = elementX + deltaX;
  const newElementY = elementY + deltaY;

  draggableElement.style.left = `${newElementX}px`;
  draggableElement.style.top = `${newElementY}px`;
}
