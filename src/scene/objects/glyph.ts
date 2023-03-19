import { mat4, vec3 } from "gl-matrix";
import { degToRad } from "../../math";
import { SceneObject } from "./sceneObject";
import { VertexBuffer } from "./vertexBuffer";

  // TODO: square for each glyph?
export class Glyph extends SceneObject {

  vertexBuffer: VertexBuffer;

  defaultAngle: number = 90;

  // FIXME: change
  defaultPosition: number = 0;


  constructor(device: GPUDevice, vertices: Float32Array) {
    super();
    this.vertexBuffer = this.createVertexBuffer(device, vertices);

    
  }

  createVertexBuffer(device: GPUDevice, vertices: Float32Array): VertexBuffer {
    return new VertexBuffer(device, vertices);
  }



}
