import { Point } from "./draw";

function windingNumberCalculation(points: Point[]): number {
    const a = points[0].substract(points[1].multiply(2.0)).add(points[2]);
    const b = points[0].substract(points[1]);
  
    const ra = 1.0 / a.y;
    const rb = 0.5 / b.y;
  
    const d = Math.sqrt(Math.max(b.y * b.y - a.y * points[0].y, 0.0));
    let t1 = (b.y - d) * ra;
    let t2 = (b.y + d) * ra;
  
    if (a.y == 0) {
      t1 = points[0].y * rb;
      t2 = t1;
    }
  
    // solve poly
    const res1 = (a.x * t1 - b.x * 2.0) * t1 + points[0].x;
    const res2 = (a.x * t2 - b.x * 2.0) * t2 + points[0].x;
  
    const code1 =
      (~points[0].y & (points[1].y | points[2].y)) | (~points[1].y & points[2].y);
    const code2 =
      (points[0].y & (~points[1].y | ~points[2].y)) |
      (points[1].y & ~points[2].y);
  
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
  
  export function isInsideGlyph(pos: Point, quadraticCurves: Point[][]): boolean {
    let windingNumber = 0;
    quadraticCurves.forEach((controlPoints) => {
      // for ray in direction of +x axis
      windingNumber += windingNumberCalculation(
        controlPoints.map((point) => point.substract(pos))
      );
    });
    return windingNumber != 0;
  }