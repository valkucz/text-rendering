import { mat4, vec3 } from "gl-matrix";
import { degToRad } from "../../math";

// TODO: remove
export class SceneObject {
  view: mat4 = mat4.create();
  moveVelocity: number;
  scaleVelocity: number;

  // vertexBuffer: VertexBuffer;

  constructor() {
    this.moveVelocity = 0.1;
    this.scaleVelocity = 1.1;

    this.setModel();
  }
  setModel() {
    // for default setting, use fromXRotation?
    // https://glmatrix.net/docs/module-mat4.html
    mat4.rotateY(this.view, this.view, Math.PI / 2);
    // mat4.rotateZ(this.model, this.model, -Math.PI);
    mat4.scale(this.view, this.view, [0.5, 0.5, 0.5]);
  }

  // Scene methods:

  rotateX(value: number): void {
    // value < 0, 360 >, initial 90 => Math.PI / 2
    mat4.rotateX(this.view, this.view, degToRad(value));
  }

  // FIXME: moving in opposite direction; check camera
  // TODO: check rotation if it's in reality correct number
  rotateY(value: number): void {
    // value < 0, 360 >, initial 90 => Math.PI / 2
    mat4.rotateY(this.view, this.view, degToRad(value));
  }

  rotateZ(value: number): void {
    // value < 0, 360 >, initial 90 => Math.PI / 2
    mat4.rotateZ(this.view, this.view, degToRad(value));
  }

  move(vec: vec3): void {
    vec3.scale(vec, vec, this.moveVelocity);
    mat4.translate(this.view, this.view, vec);
  }

  scale(value: number): void {
    const amount = (this.scaleVelocity) ** value;
    const vec = vec3.fromValues(amount, amount, amount);
    mat4.scale(this.view, this.view, vec);
  }

  // TOO: rename
  reset() {
    this.view = mat4.create();
    this.setModel();
  }
}
