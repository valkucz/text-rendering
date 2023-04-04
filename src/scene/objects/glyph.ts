// import { mat4 } from "gl-matrix";
// import { FontParser } from "../../fonts/fontParser";
// import { SceneObject } from "./sceneObject";
// import { VertexBuffer } from "./vertexBuffer";

// const defaultColor = [0.0, 0.0, 0.0, 1.0];
// const defaultBgColor = [1.0, 1.0, 1.0, 1.0];
// // TODO: square for each glyph?
// export class Glyph extends SceneObject {
//   private _vertexBuffer: VertexBuffer;

//   private _colorBuffer: VertexBuffer;

//   private _text: string;

//   private _color: number[];

//   private _bgColor: number[];

//   models: mat4[];

//   fontParser: FontParser;


//   // TODO: ukladat text namiesto vertices, potom ale nutna dependency na font parser
//   constructor(device: GPUDevice) {
//     super();
    


    

//     this._text = text;

//     this.fontParser = fontParser;
  
//     this._color = color ?? defaultColor;

//     this._bgColor = backgroundColor ?? defaultBgColor;

//     this._colorBuffer = this.createVertexBuffer(device, this.getColorArray());
    
//     this._vertexBuffer = this.createVertexBuffer(device, this.textVertices);
//   }
  
//   setModels() {

//     this.models = 
//   }

//   private getColorArray(): Float32Array {
//     return new Float32Array(this._color.concat(this._bgColor));
//   }

//   private createVertexBuffer(device: GPUDevice, vertices: Float32Array): VertexBuffer {
//     return new VertexBuffer(device, vertices);
//   }

//   public get text(): string {
//     return this._text;
//   }

//   public get color(): number[] {
//     return this._color;
//   }

//   public get bgColor(): number[] {
//     return this._bgColor;
//   }

//   public set color(color: number[]) {
//     this._color = color;
//     this._colorBuffer.update(this.getColorArray());
//   }

//   public set bgColor(bgColor: number[]) {
//     this._bgColor = bgColor;
//     this._colorBuffer.update(this.getColorArray());
//   }

//   public get vertexBuffer(): VertexBuffer {
//     return this._vertexBuffer;
//   }

//   public get colorBuffer(): VertexBuffer {
//     return this._colorBuffer;
//   }

//   private get textVertices() {
//     return this.fontParser.parseText(this._text);
//   }

//   updateText(text: string) {
//     this._text = text;
//     this._vertexBuffer.update(this.textVertices);
//   }

//   async updateFont(font: string) {
//     await this.fontParser.changeFont(font);
//     this._vertexBuffer.update(this.textVertices);
//   }

//   resetText() {
//     this.fontParser.reset();
//     this._vertexBuffer.update(this.textVertices);
//   }
// }

import { mat4, vec4 } from "gl-matrix";

export interface Glyph {
    vertices: Float32Array;
    model: mat4;
    bb: vec4;
}


