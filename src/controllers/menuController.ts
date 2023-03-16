import { App } from "../app";
import { Controller } from "./controller";

export class MenuController implements Controller {
    private element: HTMLElement;
    private content: HTMLElement;
    private menuButtonElement: HTMLElement;

    private expanded: boolean = true;
    private width: number = 250;

    constructor() {
        this.element = document.getElementById('controller-menu') as HTMLElement;
        this.content = document.getElementById('content-menu') as HTMLElement;
        this.menuButtonElement = document.getElementById('controller-menu-button') as HTMLElement;
    }

    addEventListener(app: App): void {
        console.log('Offset width', this.element.offsetWidth);
        this.menuButtonElement.addEventListener('click', () => {
            if (this.expanded) {
                console.log('not expanding');
                this.element.style.right = `-${200}px`;
                this.content.style.opacity = '50%';
                // this.content.style.visibility = 'hidden';
                this.expanded = false;
            }
            else {
                console.log('expanding');
                this.element.style.right = `${0}px`;
                this.content.style.opacity = '50%';
                // this.content.style.visibility = 'visible';
                this.expanded = true;
            }
        });
    }
}