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
function parseShape(cmds: string[], crds: number[], canvasController: CanvasController, segments: number = 17){
    const ctx = canvasController.ctx;
    // ctx.scale(1, -1);
    let pos: number = 0;
    let points: Point[] = [];
    let point;
    const koef: number = 5;

    let firstPoint = getPosition(0, crds, koef);
    // ctx.fillRect(point1.x, point1.y, 5,5);

    let minmax = findMinMax(canvasController.canvas, crds);
    console.log(minmax);
    // first point on curve
    console.log(cmds);
    cmds.forEach(cmd => {
      switch(cmd){
        case 'M':
            firstPoint = getPosition(pos, crds, koef);
            ctx.moveTo(firstPoint.x, firstPoint.y);
            pos += 2;
            break;
        case 'L':
            point = getPosition(pos, crds, koef);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            pos += 2;
            break;
        case 'C':
            points.push(getPosition(pos - 2, crds, koef));
            for(let i = pos; i < pos + 6; i +=2){
              points.push(getPosition(i, crds, koef));
            }

            // approximation

            // FIX: middle point 2times rendered
            cubicToQuadratic(points)
              .forEach(qpoints =>
                {
                  drawBezier(qpoints, segments, ctx);
                  fill(minmax[0], minmax[1], qpoints, ctx);
                }
                );

            // drawBezier(points, segments, ctx);
            points = [];
            pos += 6;
            break;
        case 'Q':
            points.push(getPosition(pos - 2, crds, koef));
            for(let i = pos; i < pos + 4; i +=2){
              points.push(getPosition(i, crds, koef));
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
    // ctx.scale(1, -1);
  }

  export async function parseText(canvasController: CanvasController){

    const font = await loadFont('./MontserratAlternates-Medium.otf');
    let shape = Typr.U.shape(font, '8', true);
    let val = Typr.U.shapeToPath(font, shape);

    console.log(Typr.T.head);
    // console.log('units', Typr.T.head.parseTab(font._data, 0, 1).unitsPerEm);
    
    console.log(val);

    // test case
    // parseShape(["M", "Q", "Q"], [100,100, 250,100, 350,200, 450, 300, 500, 500], ctx);

    parseShape(val.cmds, val.crds, canvasController);
  }

  function findMinMax(canvas: HTMLCanvasElement, crds: number[]): Point[] {
    let min = new Point(canvas.width, canvas.height);
    let max = new Point(0, 0);
    let koef = 5;
    for (let i = 0; i < crds.length - 1; i = i + 2) {
      if (crds[i] / koef < min.x && crds[i + 1] / koef < min.y) {
        min = new Point(crds[i] / koef, crds[i + 1] / koef);
      }
      if (crds[i] / koef > max.x && crds[i + 1] / koef > max.y) {
        max = new Point(crds[i] / koef, crds[i + 1] / koef);
      }
    }
    console.log(min, max);
    return [min, max];
  }
  
  export function fill(min: Point, max: Point, points: Point[], ctx) {
    // ctx.fillStyle = 'rgb(255, 165, 130)';
    // ctx.fillRect(0,0, 5,5);
    for (let y = min.y; y <= max.y; y++) {
      for (let x = min.x; x <= max.x; x++) {
        let pos = new Point(x, y);
        let res = Math.round(sdBezier(pos, points));
        // console.log(pos, res);
        // res *= 10;
        ctx.fillStyle = 'rgb(255,' + (res * 2 % 256).toString() + ',' + (res * 5 % 256).toString() + ' )';
        // ctx.strokeStyle = 'rgb(255, 165, 130)';
        ctx.fillRect(pos.x, pos.y, 1,1);

        // console.log(res, pos);

      }

    }
  }