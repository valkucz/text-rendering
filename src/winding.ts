import { vec2 } from "gl-matrix";

/**
 * 
 * @param points 3 control points of current Bezier curve.
 * @returns winding number
 */
function windingNumberCalculation(points: vec2[], pos: vec2): number {

    let a = vec2.create();
    let b = vec2.create();
    let c = vec2.create();

    vec2.subtract(a, points[0], pos);
    vec2.subtract(b, points[1], pos);
    vec2.subtract(c, points[2], pos);

    let sc = vec2.create();
    let r = vec2.create();
    let s = vec2.create();

    vec2.scale(sc, b, 2);
    vec2.subtract(r, a, sc);
    vec2.add(r, r, c);

    vec2.subtract(s, a, b);

    const ra = 1.0 / r[1];
    const rb = 0.5 / s[1];
  
    const d = Math.sqrt(Math.max(s[1] * s[1] - r[1] * a[1], 0.0));
    let t1 = (s[1] - d) * ra;
    let t2 = (s[1] + d) * ra;
  
    if (r[1] == 0) {
      t1 = a[1] * rb;
      t2 = t1;
    }
  
    // solve poly
    const res1 = (r[0] * t1 - s[0] * 2.0) * t1 + a[0];
    const res2 = (r[0] * t2 - s[0] * 2.0) * t2 + a[0];
  
    const code1 =
      (~a[1] & (b[1] |c[1])) | (~b[1] & c[1]);
    const code2 =
      (a[1] & (~b[1] | ~c[1])) |
      (b[1] & ~c[1]);
  
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
        controlPoints, pos
      );
    });
    return windingNumber != 0;
  }