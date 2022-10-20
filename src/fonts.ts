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

  
function parseShape(cmds: string[], crds: number[], ctx: CanvasRenderingContext2D, segments: number = 17){
    let pos: number = 0;
    let points: Point[] = [];
    cmds.forEach(cmd => {
      console.log(pos, crds[pos]);
      switch(cmd){
        case 'M':
          ctx.moveTo(crds[pos], crds[pos + 1]);
          pos += 2;
          break;
        case 'L':
          ctx.lineTo(crds[pos], crds[pos + 1]);
          ctx.stroke();
          pos += 2;
          break;
        case 'C':
          for(let i = pos; i < pos + 6; i +=2){
            points.push(new Point(crds[i], crds[i + 1]));
          }
          drawBezier(points, segments, ctx);
          points = [];
          pos += 6;
          break;
        case 'Q':
          for(let i = pos; i < pos + 4; i +=2){
            points.push(new Point(crds[i], crds[i + 1]));
          }
          drawBezier(points, segments, ctx);
          points = [];
          pos += 4;
          break;
        case 'Z':
          ctx.lineTo(crds[0], crds[1]);
          ctx.stroke();
          break;
  
        default: break;
      }
    }
    )
  }

  export function parseText(ctx: CanvasRenderingContext2D){
    const font = loadFont('/MontserratAlternates-Medium.otf');
    let shape = Typr.U.shape(font, 'I', true);
    console.log(shape);
    let val = Typr.U.shapeToPath(font, shape);
    console.log(val);
    parseShape(val.cmds, val.crds, ctx);
  }