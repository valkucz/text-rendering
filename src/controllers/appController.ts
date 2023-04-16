import { App } from "../app";
import { hexToRgba } from "../math";
import { Controller } from "./controller";
import { TextController } from "./textController";
// TODO: add mapper for hex-number[] values ? 
// enum CSSColors { 
    //     Primary,
    //     Secondary,
    //     ELemBg,
    //     PrimaryBg,
    //     Text,
    //     BgImg
    // }
  
// TODO: add rgba numbers directly into map
enum CSSColors {
    '--primary-color',
    '--secondary-color',
    '--elem-bg-color',
    '--primary-bg-color',
    '--text-color',
    '--bg-img'
}
    
/* Dark mode */
const dark = {
    0 : '#03C4A1',
    1: '#a0487b90',
    2: '#503277e9',
    3: '#232931',
    4: '#FFFFFF'
}

/* Light mode */
const light = {
    0: '#9DE5FF',
    1: '#fbfbfb', // #f1e8eb
    2: '#c9cdd79a',
    3: '#ffffff',
    4: '#6b6e75'
}

export const colors = {
    'primary': hexToRgba(light[0]), 
    'secondary': hexToRgba(light[1]),
    'ternary': hexToRgba(light[3])
}

export class AppController implements Controller {
    navbar: HTMLElement;
    modeBtn: HTMLButtonElement;

    textController: TextController;

    isLight: boolean = true;
    lastScrollTop: number = 0;

    constructor(textController: TextController) {
        this.navbar = document.querySelector(".navbar") as HTMLElement;
        this.modeBtn = document.getElementById("mode-btn") as HTMLButtonElement;

        // Init
        this.textController = textController;
        this.setColors(light);
    }

    addEventListener(app: App) {
        document.addEventListener("scroll", () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > this.lastScrollTop) {
              this.navbar.classList.remove("is-visible");
            } else {
              this.navbar.classList.add("is-visible");
            }
            this.lastScrollTop = scrollTop;
          });
        
        this.modeBtn.addEventListener('click', () => {
          console.log('here');
            if (this.isLight) {
              this.isLight = false;
              this.setColors(dark);
              colors['primary'] = hexToRgba(dark[0]);
              colors['secondary'] = hexToRgba(dark[1]);
              colors['ternary'] = hexToRgba(dark[3]);
              document.documentElement.classList.add('dark-mode');
            }
            else {
              this.isLight = true;
              this.setColors(light);
              colors['primary'] = hexToRgba(light[0]);
              colors['secondary'] = hexToRgba(light[1]);
              colors['ternary'] = hexToRgba(light[3]);
              document.documentElement.classList.remove('dark-mode');
            }
            this.textController.color = colors['primary'];
            this.textController.bgColor = colors['secondary'];
            this.textController.setElemColors();
            app.notify();
          })
    }

    setColors(object: Object): void {
        const root = document.querySelector(':root') as HTMLElement;
        Object.values(object).forEach((color, i) => {
            root.style.setProperty(CSSColors[i], color);  
        });
        this.textController.setElemColors();
    }


}