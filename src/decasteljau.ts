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

function sdBezier(pos: Point, points: Point[]){
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
    let ky = kk * (2.0 * a.dot(a) + b.dot(b)) / 3.0;
    let kz = kk * d.dot(a);

    let res = 0.0;
    let p = ky - kx ** 2.0;
    let p3 = p**3.0;
    let q = kx * (2.0 * kx ** 2.0 - 3.0 * ky) + kz;
    let h = q ** 2.0 + 4.0 * p3;

    if (h >= 0){
        h = Math.sqrt(h);
        let x = new Point(h, -h).divide(2.0);
        let uv = x.sign().multiplyPoint(x.abs().pow(new Point(1.0/3, 1.0/3)));
        let t = clamp(uv.x + uv.y-kx, 0.0, 1.0);
        res = d.add(c.add(b.multiply(t).multiply(t))).dot2();
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
export function clamp(value: number, minimum: number, maximum: number) {
    return max(min(value, maximum), minimum);
}
