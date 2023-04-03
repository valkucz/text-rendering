import { vec3 } from "gl-matrix";
import { App } from "../app";
import { Glyph } from "../scene/objects/glyph";
import { SceneObject } from "../scene/objects/sceneObject";
import { Controller } from "./controller";

export class SceneController implements Controller {
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

  object: SceneObject;

  // TODO: remove id, it's only for glyph now?
  constructor(id: string, object: Glyph) {
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

    this.object = object;
  }
  addEventListener(app: App): void {
    // TODO: remove duplicity
    this.rotateX.addEventListener("input", () => {
      this.object.rotateX(parseInt(this.rotateX.value) - this.rotateXvalue);
      this.rotateXvalue = parseInt(this.rotateX.value);
      app.notify();
    });
    this.rotateY.addEventListener("input", () => {
      this.object.rotateY(parseInt(this.rotateY.value) - this.rotateYvalue);
      this.rotateYvalue = parseInt(this.rotateY.value);
      app.notify();
    });
    this.rotateZ.addEventListener("input", () => {
      this.object.rotateZ(parseInt(this.rotateZ.value) - this.rotateZvalue);
      this.rotateZvalue = parseInt(this.rotateZ.value);
      app.notify();
    });

    this.moveX.addEventListener("input", () => {
      this.object.move(
        vec3.fromValues(parseInt(this.moveX.value) - this.moveXvalue, 0, 0)
      );
      this.moveXvalue = parseInt(this.moveX.value);
      app.notify();
    });
    this.moveY.addEventListener("input", () => {
      this.object.move(
        vec3.fromValues(0, parseInt(this.moveY.value) - this.moveYvalue, 0)
      );
      this.moveYvalue = parseInt(this.moveY.value);
      app.notify();
    });
    this.moveZ.addEventListener("input", () => {
      this.object.move(
        vec3.fromValues(0, 0, parseInt(this.moveZ.value) - this.moveZvalue)
      );
      this.moveZvalue = parseInt(this.moveZ.value);
      app.notify();
    });

    this.scale.addEventListener("input", () => {
      console.log('scaling');
      this.object.scale(parseInt(this.scale.value) - this.scaleValue);
      this.scaleValue = parseInt(this.scale.value);
      app.notify();
    });

    this.resetBtn.addEventListener("click", () => {
      this.reset();
      this.object.reset();
      app.notify();
    });
  }

  reset() {
    this.rotateX.value = "180";
    this.rotateY.value = "180";
    this.rotateZ.value = "180";

    this.moveX.value = "10";
    this.moveY.value = "10";
    this.moveZ.value = "10";

    this.scale.value = "250";
  }
}
