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
    // Create projection matrix
    this.projection = mat4.create();
    mat4.perspective(
      this.projection,
      Math.PI / 2,
      conversionFactor[0] / conversionFactor[1],
      0.1,
      10
    );

    this.moveVelocity = 0.1;
    this.scaleVelocity = 1.1;

    // Create view matrix
    this.view = mat4.create();
    this.setupView();
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

  setupView() {
    console.log("view");
    this.front[0] = cos(glm.toRadian(this.yaw)) * cos(glm.toRadian(this.pitch));
    this.front[1] = sin(glm.toRadian(this.pitch));
    this.front[2] = sin(glm.toRadian(this.yaw)) * cos(glm.toRadian(this.pitch));

    vec3.normalize(this.front, this.front);

    vec3.cross(this.right, this.front, this.worldUp);
    vec3.normalize(this.right, this.right);

    vec3.cross(this.up, this.right, this.front);
    vec3.normalize(this.up, this.up);

    vec3.add(this.center, this.eye, this.front);

    mat4.lookAt(this.view, this.eye, this.center, this.up);
  }

  rotateX(value: number): void {
    mat4.rotateZ(this.view, this.view, degToRad(value));
  }

  rotateY(value: number): void {
    mat4.rotateY(this.view, this.view, degToRad(value));
  }

  rotateZ(value: number): void {
    mat4.rotateX(this.view, this.view, degToRad(value));
  }

  moveX(value: number): void {
    const vec = vec3.fromValues(0, 0, value);
    vec3.scale(vec, vec, this.moveVelocity);
    mat4.translate(this.view, this.view, vec);
  }

  moveY(value: number): void {
    const vec = vec3.fromValues(0, value, 0);
    vec3.scale(vec, vec, this.moveVelocity);
    mat4.translate(this.view, this.view, vec);
  }

  moveZ(value: number): void {
    const vec = vec3.fromValues(value, 0, 0);
    vec3.scale(vec, vec, this.moveVelocity);
    mat4.translate(this.view, this.view, vec);
  }

  scale(value: number): void {
    const amount = this.scaleVelocity ** value;
    const vec = vec3.fromValues(amount, amount, amount);
    mat4.scale(this.view, this.view, vec);
  }

  reset() {
    mat4.lookAt(this.view, this.eye, this.center, this.up);
  }
}
