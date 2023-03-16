import { vec3 } from "gl-matrix";
import { App } from "../app";
import { Renderer } from "../rendering/renderer";
import { SceneObject } from "../scene/objects/sceneObject";
import { Controller } from "./controller";

export class SceneController implements Controller {
    // TODO: remove duplicity
    rotateX: HTMLElement;
    rotateY: HTMLElement;
    rotateZ: HTMLElement;

    moveX: HTMLElement;
    moveY: HTMLElement;
    moveZ: HTMLElement;

    scale: HTMLElement;

    rotateXvalue: number;
    rotateYvalue: number;
    rotateZvalue: number;

    moveXvalue: number;
    moveYvalue: number;
    moveZvalue: number;

    scaleValue: number


    object: SceneObject;

    
    constructor(id: string, object: SceneObject){
        this.rotateX = document.getElementById(id + '-rotate-x') as HTMLElement;
        this.rotateY = document.getElementById(id + '-rotate-y') as HTMLElement;
        this.rotateZ = document.getElementById(id + '-rotate-z') as HTMLElement;

        this.moveX = document.getElementById(id + '-move-x') as HTMLElement;
        this.moveY = document.getElementById(id + '-move-y') as HTMLElement;
        this.moveZ = document.getElementById(id + '-move-z') as HTMLElement;

        this.scale = document.getElementById(id + '-scale') as HTMLElement;

        // or set default in different directtion ... 
        // not from html, but to html 
        // it would be the same for the Reset button
        this.rotateXvalue = this.rotateX.value;
        this.rotateYvalue = this.rotateY.value;
        this.rotateZvalue = this.rotateZ.value;

        this.moveXvalue = this.moveX.value;
        this.moveYvalue = this.moveY.value;
        this.moveZvalue = this.moveZ.value;

        this.scaleValue = this.scale.value;

        this.object = object;
    }
    addEventListener(app: App): void {
        
        
        this.rotateX.addEventListener('input', () => {
            this.object.rotateX(this.rotateX.value - this.rotateXvalue);
            this.rotateXvalue = this.rotateX.value;
            app.notify();
        });
        this.rotateY.addEventListener('input', () => {
            this.object.rotateY(this.rotateY.value - this.rotateYvalue);
            this.rotateYvalue = this.rotateY.value;
            app.notify();
        });
        this.rotateZ.addEventListener('input', () => {
            this.object.rotateZ(this.rotateZ.value - this.rotateZvalue);
            this.rotateZvalue = this.rotateZ.value;
            app.notify();
        });

        this.moveX.addEventListener('input', () => {
            this.object.move(vec3.fromValues(this.moveX.value - this.moveXvalue, 0, 0));
            this.moveXvalue = this.moveX.value;
            app.notify();
        });
        this.moveY.addEventListener('input', () => {
            this.object.move(vec3.fromValues(0, this.moveY.value - this.moveYvalue, 0));
            this.moveYvalue = this.moveY.value;
            app.notify();
        });
        this.moveZ.addEventListener('input', () => {
            this.object.move(vec3.fromValues(0, 0, this.moveZ.value - this.moveZvalue));
            this.moveZvalue = this.moveZ.value;
            app.notify();
        });
 
    }

}