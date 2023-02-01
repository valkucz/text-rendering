import { Point } from "./draw";
import { acos, cos, min, sin, sqrt } from "mathjs";
import { clamp } from "./math";

export function sdBezier(pos: Point, points: Point[]): number | math.Complex {
  if (points.length !== 3) {
    throw new Error(
      " quadratic bezier line needs to have 3 control points, now it has: " +
        points.length.toString()
    );
  }
  const a = points[1].substract(points[0]);
  const b = points[0].substract(points[1].multiply(2)).add(points[2]);
  const c = a.multiply(2);
  const d = points[0].substract(pos);

  const kk = 1.0 / b.dot(b);
  const kx = kk * a.dot(b);
  const ky = (kk * (2.0 * a.dot(a) + d.dot(b))) / 3.0;
  const kz = kk * d.dot(a);

  const p = ky - kx * kx;
  const p3 = p * p * p;
  const q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
  const h = q * q + 4.0 * p3;

  if (h >= 0.0) {
    const h1 = Math.sqrt(h);
    const x = new Point(h1, -h1).substract(new Point(q, q)).divide(2.0);
    const uv = x
      .sign()
      .multiplyPoint(x.abs().pow(new Point(1.0 / 3.0, 1.0 / 3.0)));
    const t = clamp(uv.x + uv.y - kx, 0.0, 1.0);
    return sqrt(d.add(c.add(b.multiply(t)).multiply(t)).dot2());
  }
  const z = sqrt(-p);
  const v = acos(q / (p * z * 2.0)) / 3.0;
  const m = cos(v);
  const n = sin(v) * 1.732050808;
  const t = new Point(m + m, -n - m).multiply(z).substract(kx).clamp(0.0, 1.0);
  return sqrt(
    min(
      d.add(c.add(b.multiply(t.x).multiply(t.x))).dot2(),
      d.add(c.add(b.multiply(t.y).multiply(t.y))).dot2()
    )
  );
}

export function sdLine(p: Point, a: Point, b: Point): number {
  let pa = p.substract(a);
  let ba = b.substract(a);

  let h = clamp(pa.dot(ba) / ba.dot(ba), 0.0, 1.0);

  return pa.substract(ba.multiply(h)).length();
}
