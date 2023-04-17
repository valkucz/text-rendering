import { vec3 } from "gl-matrix";
import { App } from "../app";
import { Camera } from "../scene/camera";

export class SceneController {
  // TODO: remove duplicity
  rotateX: HTMLInputElement;
  rotateY: HTMLInputElement;
  rotateZ: HTMLInputElement;

  moveX: HTMLInputElement;
  moveY: HTMLInputElement;
  moveZ: HTMLInputElement;

  resetBtn: HTMLButtonElement;

  scale: HTMLInputElement;

  rotateXvalue: number;
  rotateYvalue: number;
  rotateZvalue: number;

  moveXvalue: number;
  moveYvalue: number;
  moveZvalue: number;

  scaleValue: number;
  camera: Camera;

  constructor(id: string, camera: Camera) {
    this.rotateX = document.getElementById(
      id + "-rotate-x"
    ) as HTMLInputElement;
    this.rotateY = document.getElementById(
      id + "-rotate-y"
    ) as HTMLInputElement;
    this.rotateZ = document.getElementById(
      id + "-rotate-z"
    ) as HTMLInputElement;

    this.moveX = document.getElementById(id + "-move-x") as HTMLInputElement;
    this.moveY = document.getElementById(id + "-move-y") as HTMLInputElement;
    this.moveZ = document.getElementById(id + "-move-z") as HTMLInputElement;

    this.scale = document.getElementById(id + "-scale") as HTMLInputElement;
    this.resetBtn = document.getElementById(id + "-reset") as HTMLButtonElement;
    // or set default in different directtion ...
    // not from html, but to html
    // it would be the same for the Reset button
    this.rotateXvalue = parseInt(this.rotateX.value);
    this.rotateYvalue = parseInt(this.rotateY.value);
    this.rotateZvalue = parseInt(this.rotateZ.value);

    this.moveXvalue = parseInt(this.moveX.value);
    this.moveYvalue = parseInt(this.moveY.value);
    this.moveZvalue = parseInt(this.moveZ.value);

    this.scaleValue = parseInt(this.scale.value);

    this.camera = camera;
    this.setup();
  }

  setup() {
    this.camera.scale(-5);
    this.camera.move([-29, 0, 0]);
    this.camera.rotateY(15);
    this.camera.rotateX(-15);

    this.scaleValue -= 5;
    this.moveXvalue -= 29;
    this.rotateYvalue += 15;
    this.rotateXvalue -= 15;
    // this.scaleValue = parseInt(this.scale.value);
  }

  addEventListener(app: App): void {
    // TODO: remove duplicity
    this.rotateX.addEventListener("input", () => {
      this.camera.rotateX(parseInt(this.rotateX.value) - this.rotateXvalue);
      this.rotateXvalue = parseInt(this.rotateX.value);
      app.notify();
    });
    this.rotateY.addEventListener("input", () => {
      this.camera.rotateY(parseInt(this.rotateY.value) - this.rotateYvalue);
      this.rotateYvalue = parseInt(this.rotateY.value);
      app.notify();
    });
    this.rotateZ.addEventListener("input", () => {
      this.camera.rotateZ(parseInt(this.rotateZ.value) - this.rotateZvalue);
      this.rotateZvalue = parseInt(this.rotateZ.value);
      app.notify();
    });

    this.moveX.addEventListener("input", () => {
      this.camera.move(
        vec3.fromValues(parseInt(this.moveX.value) - this.moveXvalue, 0, 0)
      );
      this.moveXvalue = parseInt(this.moveX.value);
      app.notify();
    });
    this.moveY.addEventListener("input", () => {
      this.camera.move(
        vec3.fromValues(0, parseInt(this.moveY.value) - this.moveYvalue, 0)
      );
      this.moveYvalue = parseInt(this.moveY.value);
      app.notify();
    });
    this.moveZ.addEventListener("input", () => {
      this.camera.move(
        vec3.fromValues(0, 0, parseInt(this.moveZ.value) - this.moveZvalue)
      );
      this.moveZvalue = parseInt(this.moveZ.value);
      app.notify();
    });

    this.scale.addEventListener("input", () => {
      this.camera.scale(parseInt(this.scale.value) - this.scaleValue);
      this.scaleValue = parseInt(this.scale.value);
      app.notify();
    });

    this.resetBtn.addEventListener("click", () => {
      this.reset();
      this.camera.reset();
      this.setup();
      app.notify();
    });
  }

  reset() {
    this.rotateX.value = "180";
    this.rotateY.value = "180";
    this.rotateZ.value = "180";

    this.moveX.value = "250";
    this.moveY.value = "250";
    this.moveZ.value = "250";

    this.scale.value = "250";
  }
}
