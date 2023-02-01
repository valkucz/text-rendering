
import { Point } from "./draw";
const gamma = 0.5;

function deCasteljau(points: Point[], t: number): Point {
  if (points.length == 1) {
    return points[0];
  } else {
    let newpoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      let x = (1 - t) * points[i].x + t * points[i + 1].x;
      let y = (1 - t) * points[i].y + t * points[i + 1].y;
      newpoints.push(new Point(x, y));
    }
    return deCasteljau(newpoints, t);
  }
}

export function solveDeCasteljau(
  points: Point[],
  segmentCount: number
): Point[] {
  let res: Point[] = [];
  for (let i = 0; i < segmentCount; i++) {
    res.push(
      deCasteljau(points, i / (segmentCount == 1 ? 1 : segmentCount - 1))
    );
  }
  return res;
}

export function cubicToQuadratic(cubicPoints: Point[]): Point[][] {
  if (cubicPoints.length !== 4) {
    throw new Error(
      "Cubic line needs to have 4 control points, now it has: " +
        cubicPoints.length.toString()
    );
  }
  // cubic curve is being split to 2 quadratics
  let quadraticPoints1: Point[] = [];
  let quadraticPoints2: Point[] = [];

  quadraticPoints1[0] = cubicPoints[0];
  quadraticPoints2[2] = cubicPoints[3];
  quadraticPoints1[1] = cubicPoints[0].add(
    cubicPoints[1].substract(cubicPoints[0]).multiply(1.5 * gamma)
  );
  quadraticPoints2[1] = cubicPoints[3].substract(
    cubicPoints[3].substract(cubicPoints[2]).multiply(1.5 * (1 - gamma))
  );
  quadraticPoints2[0] = quadraticPoints1[2] = quadraticPoints1[1]
    .multiply(1 - gamma)
    .add(quadraticPoints2[1].multiply(gamma));

  return [quadraticPoints1, quadraticPoints2];
}


