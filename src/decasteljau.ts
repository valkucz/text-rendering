import { Point } from './draw'

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