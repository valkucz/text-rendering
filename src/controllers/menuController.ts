import { App } from "../app";
import { Controller } from "./controller";

export class MenuController implements Controller {
    element: HTMLElement;
    menuButtonElement: HTMLElement;

    constructor() {
        this.element = document.getElementById('controller-menu') as HTMLElement;
        this.menuButtonElement = document.getElementById('controller-menu-button') as HTMLElement;
    }

    addEventListener(app: App): void {
        this.menuButtonElement.addEventListener('click', () => {
            if (this.element.style.display === 'none') {
                this.element.style.display = 'block';
            }
            else {
                this.element.style.display = 'none';
            }
        });
    }
}