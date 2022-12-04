// parsing text
import { Typr } from './Typr';
import { Point, drawBezier } from './draw'
import { cubicToQuadratic, sdBezier } from './decasteljau';
import { min } from 'mathjs';

async function loadFont(url: string){
    const response: Response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const tables = Typr.parse(arrayBuffer);
    console.log(tables);
    return tables[0];
  }

function getPosition(pos: number, crds: number[], koef: number = 1){
    return new Point(crds[pos] / koef, (crds[pos + 1])/ koef);
}
function parseShape(cmds: string[], crds: number[], canvasController: CanvasController, segments: number = 50){
    const ctx = canvasController.ctx;
    // ctx.scale(1, -1);
    let pos: number = 0;
    let points: Point[] = [];
    let point;
    const koef: number = 2;
    const scale: number = 350 / 1000;
    const x = 0;
    const y = 350;
    ctx.translate(x,y);
    ctx.scale(scale,-scale);

    let firstPoint = getPosition(0, crds, koef);

    let minmax = findMinMax(canvasController.canvas, crds);

    // first point on curve
    cmds.forEach(cmd => {
      switch(cmd){
        case 'M':
            firstPoint = getPosition(pos, crds);
            ctx.moveTo(firstPoint.x, firstPoint.y);
            pos += 2;
            break;
        case 'L':
            point = getPosition(pos, crds);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            pos += 2;
            break;
        case 'C':
            points.push(getPosition(pos - 2, crds));
            for(let i = pos; i < pos + 6; i +=2){
              points.push(getPosition(i, crds));
            }

            // approximation

            // FIX: middle point 2times rendered
            cubicToQuadratic(points)
              .forEach(qpoints =>
                {
                  drawBezier(qpoints, segments, ctx);
                }
                );

            // drawBezier(points, segments, ctx);
            points = [];
            pos += 6;
            break;
        case 'Q':
            points.push(getPosition(pos - 2, crds));
            for(let i = pos; i < pos + 4; i +=2){
              points.push(getPosition(i, crds));
            }

            drawBezier(points, segments, ctx);
            // fill(minmax[0], minmax[1], points);

            points = [];
            pos += 4;
            break;
        case 'Z':
            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.stroke();
            break;
        default: break;
      }
    }
    )
    ctx.scale(1/scale,-1/scale);
    ctx.translate(-x,-y);
  }

  export async function parseText(canvasController: CanvasController){

    const font = await loadFont('./MontserratAlternates-Medium.otf');
    let shape = Typr.U.shape(font, 'abcdefgh', true);
    let path = Typr.U.shapeToPath(font, shape);

    // test case
    // parseShape(["M", "Q", "Q"], [100,100, 250,100, 350,200, 450, 300, 500, 500], ctx);

    parseShape(path.cmds, path.crds, canvasController);
  }

  export function findMinMax(canvas: HTMLCanvasElement, crds: number[], koef: number = 1): Point[] {
    let min = new Point(1589, 1053);
    let max = new Point(-840, -263);
    let x, y;
    for (let i = 0; i < crds.length - 1; i = i + 2) {
      x = crds[i] / koef;
      y = crds[i + 1] / koef;
      if (x  < min.x && y < min.y) {
        min = new Point(x, y);
      }
      if (x > max.x && y > max.y) {
        max = new Point(x, y);
      }
    }
    // console.log(min, max);
    return [min, max];
  }
  
  export function fill(min: Point, max: Point, points: Point[], ctx) {
    for (let y = min.y; y <= max.y; y++) {
      for (let x = min.x; x <= max.x; x++) {
        let pos = new Point(x, y);
        let res = Math.round(sdBezier(pos, points));
        ctx.fillStyle = 'rgb(255,' + (res * 2 % 256).toString() + ',' + (res * 5 % 256).toString() + ' )';

        ctx.fillRect(pos.x, pos.y, 1,1);
      }
    }
  }
