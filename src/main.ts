import './style.css'
import { Point, drawLines, getCanvasPoint } from './draw'
import { solveDeCasteljau } from './decasteljau'
import { Typr } from './Typr';
// canvas & context setup
const canvas = <HTMLCanvasElement>document.getElementById('canvas');
var ctx = canvas.getContext('2d');
if (!ctx){
  throw new Error('');
}

function clearCanvas(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  points = [];
  pointsValue.innerHTML = '0';

  ctx.strokeStyle = 'black';
  canvas.style.cursor = 'crosshair';
}


function drawBezier(points: Point[]){
  let segments = slider.value;
  let res = solveDeCasteljau(points, Number(segments) + 1);

  drawLines(res, ctx);
  
  // drawBtn.disabled = true;
  // canvas.style.cursor = 'not-allowed';
}

function parseShape(cmds: string[], crds: number[], ctx: CanvasRenderingContext2D){
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
        drawBezier(points);
        points = [];
        pos += 6;
        break;
      case 'Q':
        for(let i = pos; i < pos + 4; i +=2){
          points.push(new Point(crds[i], crds[i + 1]));
        }
        drawBezier(points);
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

ctx.strokeStyle = 'black';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


let checkedPoints: Point[] = [];
let pointsValue = document.getElementById('pointsValue');
pointsValue!.innerHTML = '0';

let slider = document.getElementById('slider');
let sliderValue = document.getElementById('sliderValue');

sliderValue.innerHTML = slider.value;
slider.oninput = function(){
  sliderValue.innerHTML = this.value;
}

let drawBtn: any = document.getElementById("drawBtn");
drawBtn.disabled = true;
drawBtn.addEventListener("click", () => drawBezier(checkedPoints));
document.getElementById("deleteBtn")?.addEventListener("click",  () => clearCanvas());

canvas.addEventListener('mousedown', function(e){

  if (canvas.style.cursor !== 'not-allowed'){
      let point = getCanvasPoint(e, canvas);
      if (checkedPoints.length === 0){
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          drawBtn.disabled = false;
      }
      else{
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
      }
      ctx.fillRect(point.x, point.y, 5,5);
      checkedPoints.push(point);
      pointsValue.innerHTML = checkedPoints.length.toString();
  }
})

// parsing text

const response: Response = await fetch('/MontserratAlternates-Medium.otf');
const blob = await response.blob();
const arrayBuffer = await blob.arrayBuffer();
const tables = Typr.parse(arrayBuffer);
const font = tables[0];

console.log(font);
let shape = Typr.U.shape(font, 'o', true);
console.log(shape);

let val = Typr.U.shapeToPath(font, shape);

console.log(val);
parseShape(val.cmds, val.crds, ctx);

