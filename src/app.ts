import { Controller } from "./controllers/controller";
import { MenuController } from "./controllers/menuController";
import { SceneController } from "./controllers/sceneController";
import { TextController } from "./controllers/textController";
import { FontParser } from "./fonts/fontParser";
import { hexToRgb } from "./math";
import { Renderer } from "./rendering/renderer";
import { Camera } from "./scene/camera";
import { Glyph } from "./scene/objects/glyph";

// FIXME: move to fontParser
const defaultUrl = "./public/Blogger_Sans.otf";

// rename to manager,
// divide -> manager, app
export class App {
  fontParser: FontParser;
  renderer: Renderer;
  controllers: Controller[];

  constructor(
    renderer: Renderer,
    fontParser: FontParser,
    controllers: Controller[]
  ) {
    this.renderer = renderer;
    this.fontParser = fontParser;
    this.controllers = controllers;
  }
  // TODO: upravit OOP
  static async initialize(ctx: GPUCanvasContext): Promise<App> {
    console.log(navigator.gpu);
    if (!("gpu" in navigator)) {
      console.error("User agent doesn’t support WebGPU.");
    }

    // Create adapter
    const adapter: GPUAdapter = <GPUAdapter>(
      await navigator.gpu.requestAdapter()
    );
    if (!adapter) {
      console.error("No WebGPU adapters found.");
    }

    // Create device
    const device: GPUDevice = <GPUDevice>await adapter.requestDevice();

    // Create font parser
    const fontParser: FontParser = await FontParser.initialize(defaultUrl);

    // Create camera
    // camera bf initialization error - await.
    const camera: Camera = new Camera();

    // Create object
    const bgColor = hexToRgb(getComputedStyle(document.documentElement)
    .getPropertyValue('--secondary-style-color'));

    const textColor = hexToRgb(getComputedStyle(document.documentElement)
    .getPropertyValue('--primary-style-color'));
  
    // FIXME: hello world problem => prilis dlhy text na maly bb, strata dat pri konverzii?
    const text = 'Oo';
    const vertices = fontParser.parseText(text);
    const glyph = new Glyph(device, vertices, textColor, bgColor);

    // Create renderer
    const renderer = new Renderer(
      device,
      ctx,
      glyph,
      camera.projection,
      camera.view
    );

    // Create controllers
    
    const controllers = [
      new SceneController("glyph", glyph),
      new TextController(fontParser, glyph, text),
      new MenuController(),
    ];

    return new App(renderer, fontParser, controllers);
  }

  notify() {
    console.log("notified");
    const perFrameData = this.renderer.prepare();
    this.renderer.render(perFrameData);
  }

  run() {
    const perFrameData = this.renderer.prepare();
    this.renderer.render(perFrameData);
    this.controllers.forEach((controller) => controller.addEventListener(this));
  }
}
