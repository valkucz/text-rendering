import { vec2 } from "gl-matrix";
import { App } from "./app";
import "./style.css";
const canvas = <HTMLCanvasElement>document.getElementById("canvas");

var dpr = window.devicePixelRatio || 1;
var rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries.at(0);

    if (
      entry instanceof ResizeObserverEntry &&
      entry.devicePixelContentBoxSize
    ) {
      let width = entry.devicePixelContentBoxSize[0].inlineSize;
      let height = entry.devicePixelContentBoxSize[0].blockSize;

      console.log(width, height);

        canvas.style =
        "width:" +
        (width / window.devicePixelRatio).toString() +
        "px; height:" +
        (height / window.devicePixelRatio).toString() +
        "px";

        canvas.width = width;
        canvas.height = height;
    }
});

// resizeObserver.observe(canvas.parentElement, { box: "device-pixel-content-box" });

// TODO: remove export
export const conversionFactor = vec2.fromValues(canvas.width, canvas.height);
export const segments: number = 15;

const app = await App.initialize(canvas);
app.run();

