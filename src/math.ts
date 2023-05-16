import { vec2 } from "gl-matrix";
import { max, min } from "mathjs";

const gamma = 0.5;

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
  // Convert hex color string to RGB color object
  const r = parseInt(hex.substring(1, 3), 16) / 255;
  const g = parseInt(hex.substring(3, 5), 16) / 255;
  const b = parseInt(hex.substring(5, 7), 16) / 255;
  const a = 1.0;

  return [r, g, b, a];
}

export function rgbaToHex(rgba: number[]): string {
  const [r, g, b] = rgba;

  const red = Math.round(r * 255)
    .toString(16)
    .padStart(2, "0");
  const green = Math.round(g * 255)
    .toString(16)
    .padStart(2, "0");
  const blue = Math.round(b * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${red}${green}${blue}`;
}

export function cubicToQuadratic(cubicPoints: vec2[]): vec2[][] {
  if (cubicPoints.length !== 4) {
    throw new Error(
      "Cubic line needs to have 4 control points, now it has: " +
        cubicPoints.length.toString()
    );
  }
  // Cubic curve is being split to 2 quadratics
  let quadraticPoints1: vec2[] = [vec2.create(), vec2.create(), vec2.create()];
  let quadraticPoints2: vec2[] = [vec2.create(), vec2.create(), vec2.create()];

  vec2.copy(quadraticPoints1[0], cubicPoints[0]);
  vec2.copy(quadraticPoints2[2], cubicPoints[3]);

  let diff = vec2.create();

  vec2.subtract(diff, cubicPoints[1], cubicPoints[0]);
  vec2.scale(diff, diff, 1.5 * gamma);
  vec2.add(quadraticPoints1[1], cubicPoints[0], diff);

  vec2.subtract(diff, cubicPoints[3], cubicPoints[2]);
  vec2.scale(diff, diff, 1.5 * (1 - gamma));
  vec2.subtract(quadraticPoints2[1], cubicPoints[3], diff);

  let a = vec2.create();
  let b = vec2.create();

  vec2.scale(a, quadraticPoints1[1], 1 - gamma);
  vec2.scale(b, quadraticPoints2[1], gamma);
  vec2.add(quadraticPoints1[2], a, b);

  vec2.copy(quadraticPoints2[0], quadraticPoints1[2]);

  return [quadraticPoints1, quadraticPoints2];
}
