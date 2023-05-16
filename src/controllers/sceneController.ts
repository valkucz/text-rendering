import { App } from "../app";
import { Camera } from "../scene/camera";
import { Draggable } from "./draggable";
export class SceneController {
  draggables: Draggable[];
  camera: Camera;
  resetBtn: HTMLButtonElement;

  constructor(id: string, camera: Camera) {
    this.camera = camera;

    this.draggables = [
      {
        currentValue: 0,
        defaultValue: 0,
        input: document.getElementById(id + "-rotate-x") as HTMLInputElement,
        function: this.camera.rotateX.bind(this.camera),
      },
      {
        currentValue: 15,
        defaultValue: 15,
        input: document.getElementById(id + "-rotate-y") as HTMLInputElement,
        function: this.camera.rotateY.bind(this.camera),
      },
      {
        currentValue: 0,
        defaultValue: 0,
        input: document.getElementById(id + "-rotate-z") as HTMLInputElement,
        function: this.camera.rotateZ.bind(this.camera),
      },
      {
        currentValue: 230,
        defaultValue: 230,
        input: document.getElementById(id + "-move-x") as HTMLInputElement,
        function: this.camera.moveX.bind(this.camera),
      },
      {
        currentValue: 250,
        defaultValue: 250,
        input: document.getElementById(id + "-move-y") as HTMLInputElement,
        function: this.camera.moveY.bind(this.camera),
      },
      {
        currentValue: 250,
        defaultValue: 250,
        input: document.getElementById(id + "-move-z") as HTMLInputElement,
        function: this.camera.moveZ.bind(this.camera),
      },
      {
        currentValue: 245,
        defaultValue: 245,
        input: document.getElementById(id + "-scale") as HTMLInputElement,
        function: this.camera.scale.bind(this.camera),
      },
    ];
    this.resetBtn = document.getElementById(id + "-reset") as HTMLButtonElement;
    this.setup();
  }

  setup() {
    this.draggables.forEach((draggable) => {
      draggable.currentValue = draggable.defaultValue;
      draggable.input.value = draggable.defaultValue.toString();
    });
    this.camera.scale(-5);
    this.camera.moveX(-20);
    this.camera.rotateY(15);
  }

  addEventListener(app: App): void {
    this.draggables.forEach((draggable) => {
      draggable.input.addEventListener("input", () => {
        draggable.function(
          parseInt(draggable.input.value) - draggable.currentValue
        );
        draggable.currentValue = parseInt(draggable.input.value);
        app.notify();
      });
    });

    this.resetBtn.addEventListener("click", () => {
      this.camera.reset();
      this.setup();
      app.notify();
    });
  }
}
