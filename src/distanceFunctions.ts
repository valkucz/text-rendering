import { acos, cos, min, sin, sqrt } from "mathjs";
import { absVec2, clamp, powVec2, signVec2 } from "./math";
import { vec2 } from "gl-matrix";

export function sdBezier(pos: vec2, points: vec2[]): number | math.Complex {
  if (points.length !== 3) {
    throw new Error(
      " quadratic bezier line needs to have 3 control points, now it has: " +
        points.length.toString()
    );
  }
  let a = vec2.create();
  vec2.subtract(a, points[1], points[0]);
  // const a = points[1].substract(points[0]);
  let b = vec2.create();
  let sc = vec2.create();

  vec2.scale(sc, points[1], 2);
  vec2.subtract(b, points[0], sc);
  vec2.add(b, b, points[2]);

  // const b = points[0].substract(points[1].multiply(2)).add(points[2]);
  let c = vec2.create();
  vec2.scale(c, a, 2);
  // const c = a.multiply(2);

  let d = vec2.create();
  vec2.subtract(d, points[0], pos);
  // const d = points[0].substract(pos);

  const kk = 1.0 / vec2.dot(b, b);
  const kx = kk * vec2.dot(a, b);
  const ky = (kk * (2.0 * vec2.dot(a, a) + vec2.dot(d, b))) / 3.0;
  const kz = kk * vec2.dot(d, a);

  const p = ky - kx * kx;
  const p3 = p * p * p;
  const q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
  const h = q * q + 4.0 * p3;

  if (h >= 0.0) {
    const h1 = Math.sqrt(h);
    let x = vec2.fromValues(h1, -h1);
    vec2.subtract(x, x, vec2.fromValues(q, q));
    vec2.scale(x, x, 1 / 2.0);

    // const x = new Point(h1, -h1).substract(new Point(q, q)).divide(2.0);
    let uv = vec2.create();

    vec2.multiply(uv, signVec2(x), powVec2(absVec2(x), 1 / 3.0));

    const t = clamp(uv[0] + uv[1] - kx, 0.0, 1.0);
    let y = vec2.create();
    vec2.scale(b, b, t);

    vec2.add(y, c, b);
    vec2.scale(c, c, t);
    vec2.add(y, d, c);

    return sqrt(vec2.dot(y, y));
  }
  const z = sqrt(-p);
  const v = acos(q / (p * z * 2.0)) / 3.0;
  const m = cos(v);
  const n = sin(v) * 1.732050808;

  // const t = new Point(m + m, -n - m).multiply(z).substract(kx).clamp(0.0, 1.0);
  let t1 = vec2.fromValues(m + m, -n - m);
  vec2.scale(t1, t1, z);
  vec2.subtract(t1, t1, kx);
  let t = vec2.fromValues(clamp(t1[0], 0, 1), clamp(t1[1], 0, 1));

  let t3 = vec2.create();
  let t4 = vec2.create();
  let b2 = vec2.create();

  vec2.scale(b2, b, t[0]);
  vec2.scale(b2, b2, t[0]);
  vec2.add(t3, b2, c);
  vec2.add(t3, d, c);

  vec2.scale(b2, b, t[1]);
  vec2.scale(b2, b2, t[1]);
  vec2.add(t4, b2, c);
  vec2.add(t4, d, c);

  return sqrt(min(vec2.dot(t3, t3), vec2.dot(t4, t4)));
}

export function sdLine(p: vec2, a: vec2, b: vec2): number {
  let pa = vec2.create();
  let ba = vec2.create();

  vec2.subtract(pa, p, a);
  vec2.subtract(ba, b, a);

  let h = clamp(vec2.dot(pa, ba) / vec2.dot(ba, ba), 0.0, 1.0);

  let res = vec2.create();
  vec2.scale(ba, ba, h);
  vec2.subtract(res, pa, ba);
  return vec2.length(res);
}
