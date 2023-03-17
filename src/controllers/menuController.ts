import { App } from "../app";
import { Controller } from "./controller";

export class MenuController implements Controller {
    private element: HTMLElement;
    private content: HTMLElement;
    private openMenuBtn: HTMLElement;
    private closeMenuBtn: HTMLElement;
    private canvas: HTMLElement;

    private expanded: boolean = true;
    private width: number = 250;

    constructor() {
        this.element = document.getElementById('controller-menu') as HTMLElement;
        this.content = document.getElementById('content-menu') as HTMLElement;
        this.canvas = document.getElementById('canvas') as HTMLElement;	
        this.openMenuBtn = document.getElementById('open-menu-button') as HTMLElement;
        this.closeMenuBtn = document.getElementById('close-menu-button') as HTMLElement;
    }

    addEventListener(app: App): void {
        console.log('Offset width', this.element.offsetWidth);

        this.openMenuBtn.addEventListener('click', () => {
            this.element.style.right = `0px`;
        });
        this.closeMenuBtn.addEventListener('click', () => {
            this.element.style.right = `-${this.element.offsetWidth + 2}px`;
        });

    }
}