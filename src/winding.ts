import { vec2 } from "gl-matrix";

/**
 * 
 * @param points 3 control points of current Bezier curve.
 * @returns winding number
 */
function windingNumberCalculation(points: vec2[]): number {

    const sc = vec2.create();
    const a = vec2.create();
    const b = vec2.create();

    vec2.scale(sc, points[1], 2.0);
    vec2.subtract(a, points[0], sc);
    vec2.add(a, points[0], points[2]);

    vec2.subtract(b, points[0], points[1]);

    const ra = 1.0 / a[1];
    const rb = 0.5 / b[1];
  
    const d = Math.sqrt(Math.max(b[1] * b[1] - a[1] * points[0][1], 0.0));
    let t1 = (b[1] - d) * ra;
    let t2 = (b[1] + d) * ra;
  
    if (a[1] == 0) {
      t1 = points[0][1] * rb;
      t2 = t1;
    }
  
    // solve poly
    const res1 = (a[0] * t1 - b[0] * 2.0) * t1 + points[0][0];
    const res2 = (a[0] * t2 - b[0] * 2.0) * t2 + points[0][0];
  
    const code1 =
      (~points[0][1] & (points[1][1] | points[2][1])) | (~points[1][1] & points[2][1]);
    const code2 =
      (points[0][1] & (~points[1][1] | ~points[2][1])) |
      (points[1][1] & ~points[2][1]);
  
    // TEST CURVE
    let windingNumber = 0;
    if ((code1 | code2) < 0) {
      if (code1 < 0.0 && res1 > 0.0) {
        windingNumber++;
      }
      if (code2 < 0.0 && res2 > 0.0) {
        windingNumber--;
      }
    }
    return windingNumber;
  }
  
  export function isInsideGlyph(pos: vec2, quadraticCurves: vec2[][]): boolean {
    let windingNumber = 0;
    quadraticCurves.forEach((controlPoints) => {
      // for ray in direction of +x axis
      windingNumber += windingNumberCalculation(
        controlPoints.map((point) => vec2.subtract(point, point, pos))
      );
    });
    return windingNumber != 0;
  }