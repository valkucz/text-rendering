import { mat4, vec2, vec3 } from "gl-matrix";
import { max, min } from "mathjs";
import { conversionFactor } from "./main";

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
    return vec2.fromValues(Math.pow(vec[0], exponent), Math.pow(vec[1], exponent));
  }


export function normalizeVec3(vec: vec3): vec3 {
  let normalized: vec3 = vec3.create();

  vec3.divide(normalized, vec, conversionFactor);
  return normalized;
  
}