import { vec2 } from "gl-matrix";
import { App } from "./app";
import "./style.css";

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
app.addEventListeners();

const slider = document.getElementById('slider-rotate');
const textInput = document.getElementById('text-input');
const submitBtn = document.getElementById('submit-btn');



// TODO: move to custom file

const menuButtonElement = document.getElementById('controller-menu-button');
const menuElement = document.getElementById('controller-menu');
const menuImg = document.getElementById('menu-icon');



menuButtonElement.addEventListener('click', () => {
  if (menuElement.style.display === 'none') {
    menuImg.style.transform = 'rotate(90deg)';
    menuElement.style.display = 'block';
  }
  else {
    menuImg.style.transform = 'rotate(0deg)';
    menuElement.style.display = 'none';
  }
});





// NO NEED; REMOVE
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
