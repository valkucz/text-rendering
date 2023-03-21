import { vec2 } from "gl-matrix";

const gamma = 0.5;

export function cubicToQuadratic(cubicPoints: vec2[]): vec2[][] {
  if (cubicPoints.length !== 4) {
    throw new Error(
      "Cubic line needs to have 4 control points, now it has: " +
        cubicPoints.length.toString()
    );
  }
  // cubic curve is being split to 2 quadratics
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
