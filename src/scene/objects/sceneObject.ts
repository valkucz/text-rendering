import { mat4, vec3 } from "gl-matrix";
import { degToRad } from "../../math";

// TODO: remove
export class SceneObject {
  model: mat4 = mat4.create();
  velocity: number;

  // vertexBuffer: VertexBuffer;


  constructor() {
    this.velocity = 0.1;

    this.setModel();
  }
  setModel() {
    // for default setting, use fromXRotation?
    // https://glmatrix.net/docs/module-mat4.html
    mat4.rotateY(this.model, this.model, Math.PI / 2);
    // mat4.rotateZ(this.model, this.model, -Math.PI);
    mat4.scale(this.model, this.model, [0.5, 0.5, 0.5]);
  }

  // Scene methods:
  
  rotateX(value: number): void {
    // value < 0, 360 >, initial 90 => Math.PI / 2
    mat4.rotateX(this.model, this.model, degToRad(value));
  }

  // FIXME: moving in opposite direction; check camera
  rotateY(value: number): void {
    // value < 0, 360 >, initial 90 => Math.PI / 2
    mat4.rotateY(this.model, this.model, degToRad(value));
  }

  rotateZ(value: number): void {
    // value < 0, 360 >, initial 90 => Math.PI / 2
    mat4.rotateZ(this.model, this.model, degToRad(value));
  }

  move(vec: vec3): void {
    vec3.scale(vec, vec, this.velocity);
    mat4.translate(this.model, this.model, vec);
  }

  scale(value: number): void {
    mat4.scale(this.model, this.model, [value, value, value]);
  }

  // move(vec: vec3): void {
  //   vec3.scale(vec, vec, this.velocity);
  //   mat4.translate(this.model, this.model, vec);
  // }
  // zoom / scale ?
  reset() {
    this.model = mat4.create();
    this.setModel();
  }
}


