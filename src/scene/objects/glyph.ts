import { mat4, vec4 } from "gl-matrix";

export interface Glyph {
  vertices: Float32Array;
  modelMatrix: mat4;
  boundingBox: vec4;
  length: number;
  transformsSize: number;
  verticesSize: number;
  verticesOffset: number;
  transformsOffset: number;
}