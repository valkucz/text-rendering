import { acos, cos, max, min, sin, sqrt } from 'mathjs';
import { Point } from './draw'
const gamma = 0.5;

function deCasteljau(points: Point[], t: number): Point {
    if (points.length == 1) {
        return points[0];
    }
    else {
        let newpoints = [];
        for (let i = 0; i < points.length - 1; i++) {
            let x = (1 - t) * points[i].x + t * points[i + 1].x;
            let y = (1 - t) * points[i].y + t * points[i + 1].y;
            newpoints.push(new Point(x, y));
        }
        return deCasteljau(newpoints, t);
    }
}

export function solveDeCasteljau(points: Point[], segmentCount: number): Point[] {
    let res: Point[] = [];
    for (let i = 0; i < segmentCount; i++) {
        res.push(deCasteljau(points, i / (segmentCount == 1 ? 1 : segmentCount - 1)))
    }
    return res;
}

export function cubicToQuadratic(cubicPoints: Point[]): Point[][] {
    if (cubicPoints.length !== 4) {
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

export function sdBezier(pos: Point, points: Point[]): number | math.Complex {
    if (points.length !== 3) {
        throw new Error(" quadratic bezier line needs to have 3 control points, now it has: "
            + points.length.toString());
    }
    const a = points[1].substract(points[0]);
    const b = points[0].substract(points[1].multiply(2)).add(points[2]);
    const c = a.multiply(2);
    const d = points[0].substract(pos);

    const kk = 1.0 / b.dot(b);
    const kx = kk * a.dot(b);
    const ky = kk * (2.0 * a.dot(a) + d.dot(b)) / 3.0;
    const kz = kk * d.dot(a);

    const p = ky - kx * kx;
    const p3 = p * p * p;
    const q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
    const h = q * q + 4.0 * p3;

    if (h >= 0.0) {
        const h1 = Math.sqrt(h);
        const x = new Point(h1, -h1).substract(new Point(q, q)).divide(2.0);
        const uv = x.sign().multiplyPoint(x.abs().pow(new Point(1.0 / 3.0, 1.0 / 3.0)));
        const t = clamp(uv.x + uv.y - kx, 0.0, 1.0);
        return sqrt(d.add(c.add(b.multiply(t)).multiply(t)).dot2());
    }
    const z = sqrt(-p);
    const v = acos(q / (p * z * 2.0)) / 3.0;
    const m = cos(v);
    const n = sin(v) * 1.732050808;
    const t = (new Point(m + m, -n - m).multiply(z).substract(kx).clamp(0.0, 1.0));
    return sqrt(min(d.add(c.add(b.multiply(t.x).multiply(t.x))).dot2(), d.add(c.add(b.multiply(t.y).multiply(t.y))).dot2()))
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

function windingNumberCalculation(points: Point[]): number {

    // a, b, c

    const a = points[0].substract(points[1].multiply(2.0)).add(points[2]);
    const b = points[0].substract(points[1]);

    const ra = 1.0 / a.y;
    const rb = 0.5 / b.y;

    const d = Math.sqrt(Math.max(b.y * b.y -  a.y * points[0].y, 0.0));
    let t1 = (b.y - d) * ra;
    let t2 = (b.y + d) * ra;


    if (a.y == 0) {
        t1 = points[0].y * rb;
        t2 = t1;
    }

    // solve poly
    const res1 = (a.x * t1 - b.x * 2.0) * t1 + points[0].x;
    const res2 = (a.x * t2 - b.x * 2.0) * t2 + points[0].x;

    const code1 = ~points[0].y & (points[1].y | points[2].y) | (~points[1].y & points[2].y);
    const code2 = points[0].y & (~points[1].y | ~points[2].y) | (points[1].y & ~points[2].y);


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
    // console.log(quadraticCurves);
    quadraticCurves.forEach(controlPoints => {
        // console.log(controlPoints);
        // for ray in direction of +x axis
        windingNumber += windingNumberCalculation(controlPoints.map(point =>
            point.substract(pos).multiplyPoint(new Point(1, -1))))
        // translate == substract point - origin
    })
    return windingNumber != 0;
}