// TODO: remove vec3
import { vec2, vec3 } from "gl-matrix";
import { max, min } from "mathjs";

export function clamp(value: number, minimum: number, maximum: number) {
  return max(min(value, maximum), minimum);
}

export function signVec2(vec: vec2): vec2 {
  return vec2.fromValues(Math.sign(vec[0]), Math.sign(vec[1]));
}

export function absVec2(vec: vec2): vec2 {
  return vec2.fromValues(Math.abs(vec[0]), Math.abs(vec[1]));
}

export function powVec2(vec: vec2, exponent: number): vec2 {
  return vec2.fromValues(
    Math.pow(vec[0], exponent),
    Math.pow(vec[1], exponent)
  );
}

// TODO: back to vec2
export function vec3ToFloat32(vertices: vec3[]): Float32Array {
  // TODO: change to 2 later, no need for 3 vertices i guesss
  // 3 = vec3
  let float32Array = new Float32Array(vertices.length * 3);
  float32Array.fill(0);

  for (let i = 0; i < vertices.length; i++) {
    float32Array[i] = vertices[i][0];
    float32Array[i + 1] = vertices[i][1];
    float32Array[i + 2] = vertices[i][2];
  }

  return float32Array;
}

export function vec2ToFloat32(vertices: vec2[]): Float32Array {
  let float32Array = new Float32Array(vertices.length * 2);
  float32Array.fill(0);

  for (let i = 0; i < vertices.length; i++) {
    let j = 2 * i;
    float32Array[j] = vertices[i][0];
    float32Array[j + 1] = vertices[i][1];
  }
  return float32Array;
}

export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function hexToRgba(hex: string): number[] {
  console.log(hex);
  // Convert hex color string to RGB color object
  const r = parseInt(hex.substring(1, 3), 16) / 255;
  const g = parseInt(hex.substring(3, 5), 16) / 255;
  const b = parseInt(hex.substring(5, 7), 16) / 255;
  const a = 1.0;

  return [r, g, b, a];
}

export function rgbaToHex(rgba: number[]): string {
  const [r, g, b, a] = rgba;

  const red = Math.round(r).toString(16).padStart(2, "0");
  const green = Math.round(g).toString(16).padStart(2, "0");
  const blue = Math.round(b).toString(16).padStart(2, "0");

  const alpha = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${red}${green}${blue}${alpha}`;
}