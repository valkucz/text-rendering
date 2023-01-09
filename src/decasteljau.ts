import { acos, cos, max, min, sin, sqrt } from 'mathjs';
import { Point } from './draw'
const gamma = 0.5;

function deCasteljau(points: Point[], t: number): Point{
    if (points.length == 1){
        return points[0];
    }
    else {
        let newpoints = [];
        for (let i = 0; i < points.length - 1; i++){
            let x = (1 - t) * points[i].x + t * points[i + 1].x;
            let y = (1 - t) * points[i].y + t * points[i + 1].y;
            newpoints.push(new Point(x, y));
        }
        return deCasteljau(newpoints, t);
    }
  }
  
export function solveDeCasteljau(points: Point[], segmentCount: number): Point[]{
    let res: Point[] = [];
    for (let i = 0; i < segmentCount; i++){
        res.push(deCasteljau(points, i / (segmentCount == 1 ? 1 : segmentCount - 1)))
    }
    return res;
}

export function cubicToQuadratic(cubicPoints: Point[]){
    if (cubicPoints.length !== 4){
        throw new Error("Cubic line needs to have 4 control points, now it has: "
         + cubicPoints.length.toString());
    }
   // cubic curve is being split to 2 quadratics
   let quadraticPoints1: Point[] = [];
   let quadraticPoints2: Point[] = [];

   quadraticPoints1[0] = cubicPoints[0];
   quadraticPoints2[2] = cubicPoints[3];
   quadraticPoints1[1] = cubicPoints[0].add(cubicPoints[1].substract(cubicPoints[0]).multiply(1.5 * gamma));
   quadraticPoints2[1] = cubicPoints[3].substract(cubicPoints[3].substract(cubicPoints[2]).multiply(1.5 * (1 - gamma)));
   quadraticPoints2[0] = quadraticPoints1[2] = quadraticPoints1[1].multiply(1 - gamma).add(quadraticPoints2[1].multiply(gamma));

   return [quadraticPoints1, quadraticPoints2];
}

export function sdBezier(pos: Point, points: Point[]){
    if (points.length !== 3){
        throw new Error(" quadratic bezier line needs to have 3 control points, now it has: "
         + points.length.toString());
    }
    let a = points[1].substract(points[0]);
    let b = points[0].substract(points[1].multiply(2)).add(points[2]);
    let c = a.multiply(2);
    let d = points[0].substract(pos);

    let kk = 1.0 / b.dot(b);
    let kx = kk * a.dot(b);
    let ky = kk * (2.0 * a.dot(a) + d.dot(b)) / 3.0;
    let kz = kk * d.dot(a);

    let res = 0.0;
    let p = ky - kx * kx;
    let p3 = p * p * p;
    let q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
    let h = q * q + 4.0 * p3;

    if (h >= 0.0){
        h = Math.sqrt(h);
        let x = new Point(h, -h).substract(new Point(q, q)).divide(2.0);
        let uv = x.sign().multiplyPoint(x.abs().pow(new Point(1.0 / 3.0, 1.0 / 3.0)));
        let t = clamp(uv.x + uv.y-kx, 0.0, 1.0);
        res = d.add(c.add(b.multiply(t)).multiply(t)).dot2();
    }
    else { 
        let z = sqrt(-p);
        let v = acos(q / (p * z * 2.0)) / 3.0;
        let m = cos(v);
        let n = sin(v) * 1.732050808;
        let t = (new Point(m + m, -n-m).multiply(z).substract(kx).clamp(0.0, 1.0));
        res = min(d.add(c.add(b.multiply(t.x).multiply(t.x))).dot2(), d.add(c.add(b.multiply(t.y).multiply(t.y))).dot2());
    }
    return sqrt(res);
}
export function sdLine(p: Point, a: Point, b: Point): number {
    let pa = p.substract(a);
    let ba = b.substract(a);

    let h = clamp(pa.dot(ba) / ba.dot(ba), 0.0, 1.0);

    return pa.substract(ba.multiply(h)).length();
}

export function clamp(value: number, minimum: number, maximum: number) {
    return max(min(value, maximum), minimum);
}

function windingNumberCalculation(points: Point[]) : number {
    const a = points[0].substract(points[1].multiply(2)).add(points[2]);
    const b = points[0].substract(points[1]);
    const c = points[0];

    let t1, t2;
    if (a.y == 0) {
        t1 = t2 =  c.y / (2 * b.y);
    }
    else {
        t1 = (b.y - Math.sqrt(b.y ** 2 - a.y * c.y)) / a.y;
        t2 = (b.y + Math.sqrt(b.y ** 2 - a.y * c.y)) / a.y;
    }
    let shift = ((points[0].y > 0 ? 2 : 0) + (points[1].y > 0 ? 4 : 0) + (points[2].y > 0 ? 8 : 0));

    let x = 11892 >> shift;

    // if ((x & 1) != 0 && a.x * t1 ** 2 - 2 * b.x + c.x > 0) {
    //     return 1;
    // }
    // if ((x & 2) != 0 && a.x * t2 ** 2 - 2 * b.x + c.x > 0) {
    //     return 1;
    // }
    // return -1;
    if ((x & 1) != 0) {
        if (a.x * t1 ** 2 - 2 * b.x + c.x > 0) {
            return 1;
        }
        return -1;
    }
    if ((x & 2) != 0) {
        if (a.x * t2 ** 2 - 2 * b.x + c.x > 0) {
            return 1;
        }
        return -1;
    }
    return 0;
}

export function isInsideGlyph(pos: Point, quadraticCurves: Point[][]) : bool {
    let windingNumber = 0;
    quadraticCurves.forEach(controlPoints => {
        // for ray in direction of +x axis
        windingNumber += windingNumberCalculation(controlPoints.map(point => 
            point.substract(pos).multiplyPoint(new Point(1, -1))))
        // translate == substract point - origin
    })
    return windingNumber != 0;
}