import { mat4, vec3, glMatrix as glm } from "gl-matrix";
import { cos, sin } from "mathjs";
import { conversionFactor } from "../main";
import { SceneObject } from "./objects/sceneObject";

export class Camera extends SceneObject {
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

  constructor() {
    super();
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

  rotate(): void {}
}
