// parsing text
import { Typr } from './Typr';
import { Point, drawBezier } from './draw'

async function loadFont(url: string){
    const response: Response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const tables = Typr.parse(arrayBuffer);
    return tables[0];
  
  }


function getPosition(pos: number, crds: number[], koef: number = 1){
    return new Point(crds[pos] / koef, crds[pos + 1] / koef);
}
function parseShape(cmds: string[], crds: number[], ctx: CanvasRenderingContext2D, segments: number = 17){
    let pos: number = 0;
    let points: Point[] = [];
    let point;
    const koef: number = 4;
    cmds.forEach(cmd => {
      switch(cmd){
        case 'M':
            point = getPosition(pos, crds, koef);
            ctx.moveTo(point.x, point.y);
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
          drawBezier(points, segments, ctx);
          points = [];
          pos += 6;
          break;
        case 'Q':
            points.push(getPosition(pos - 2, crds, koef));
          for(let i = pos; i < pos + 4; i +=2){
            points.push(getPosition(i, crds, koef));
          }
          drawBezier(points, segments, ctx);
          points = [];
          pos += 4;
          break;
        case 'Z':
            point = getPosition(0, crds, koef);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          break;
  
        default: break;
      }
    }
    )
  }

  export async function parseText(ctx: CanvasRenderingContext2D){
    const font = await loadFont('/MontserratAlternates-Medium.otf');
    let shape = Typr.U.shape(font, 'd', true);
    let val = Typr.U.shapeToPath(font, shape);
    console.log(val);
    parseShape(val.cmds, val.crds, ctx);
  }