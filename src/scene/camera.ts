import { mat4, vec3, glMatrix as glm } from "gl-matrix";
import { cos, sin } from "mathjs";
import { conversionFactor } from "../main";
import { degToRad } from "../math";

export class Camera {
  view: mat4;

  projection: mat4;

  worldUp: vec3 = [0, 1, 0];

  eye: vec3 = [-1, 0, 0];

  yaw: number = 0;

  pitch: number = 0;

  center: vec3 = vec3.create();

  right: vec3 = vec3.create();

  up: vec3 = vec3.create();

  front: vec3 = vec3.create();

  moveVelocity: number;

  scaleVelocity: number;

  constructor() {
    // create projection matrix
    this.projection = mat4.create();
    // TODO: remove global conversion factor, only as constructor parameter
    mat4.perspective(
      this.projection,
      Math.PI / 4,
      conversionFactor[0] / conversionFactor[1],
      0.1,
      10
    );

    this.moveVelocity = 0.1;
    this.scaleVelocity = 1.1;

    // create view matrix
    this.view = mat4.create();
    this.updateView();
  }

  // move(dir: MoveDirection) {
  //     let vec = vec3.create();
  //     switch (dir) {
  //         case MoveDirection.Forward:
  //             vec3.scale(vec, this.front, this.velocity);
  //             vec3.add(this.eye, this.eye, vec);
  //             break;
  //         case MoveDirection.Backward:
  //             vec3.scale(vec, this.front, this.velocity);
  //             vec3.sub(this.eye, this.eye, vec);
  //             break;
  //         case MoveDirection.Left:
  //             vec3.scale(vec, this.right, this.velocity);
  //             vec3.sub(this.eye, this.eye, vec);
  //             break;
  //         case MoveDirection.Right:
  //             vec3.scale(vec, this.right, this.velocity);
  //             vec3.add(this.eye, this.eye, vec);
  //             break;
  //         default:
  //             break;
  //     }
  // }

  updateView() {
    this.front[0] = cos(glm.toRadian(this.yaw)) * cos(glm.toRadian(this.pitch));
    this.front[1] = sin(glm.toRadian(this.pitch));
    this.front[2] = sin(glm.toRadian(this.yaw)) * cos(glm.toRadian(this.pitch));

    vec3.normalize(this.front, this.front);

    vec3.cross(this.right, this.front, this.worldUp);
    vec3.normalize(this.right, this.right);

    vec3.cross(this.up, this.right, this.front);
    vec3.normalize(this.up, this.up);

    // because it was in different direction idk why
    vec3.negate(this.up, this.up);

    vec3.add(this.center, this.eye, this.front);

    mat4.lookAt(this.view, this.eye, this.center, this.up);
  }

  
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

  setModel() {
    // for default setting, use fromXRotation?
    // https://glmatrix.net/docs/module-mat4.html
    mat4.rotateY(this.view, this.view, Math.PI / 2);
    // mat4.rotateZ(this.model, this.model, -Math.PI);
    mat4.scale(this.view, this.view, [0.5, 0.5, 0.5]);
  }

  // TOO: rename
  reset() {
    this.view = mat4.create();
    this.updateView();  }
}
