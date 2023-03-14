import { SceneObject } from "../scene/objects/sceneObject";
import { Controller } from "./controller";

export class SceneController implements Controller {
    rotateX: HTMLElement;
    rotateY: HTMLElement;
    rotateZ: HTMLElement;

    moveX: HTMLElement;
    moveY: HTMLElement;
    moveZ: HTMLElement;

    object: SceneObject;
    
    constructor(id: string, object: SceneObject){
        this.rotateX = document.getElementById(id + '-rotate-x') as HTMLElement;
        this.rotateY = document.getElementById(id + '-rotate-y') as HTMLElement;
        this.rotateZ = document.getElementById(id + '-rotate-z') as HTMLElement;

        this.moveX = document.getElementById(id + '-move-x') as HTMLElement;
        this.moveY = document.getElementById(id + '-move-y') as HTMLElement;
        this.moveZ = document.getElementById(id + '-move-z') as HTMLElement;

        this.object = object;
    }
    addEventListener(): void {
        
    }
}