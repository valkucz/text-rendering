import { Controller } from "./controllers/controller";
import { MenuController } from "./controllers/menuController";
import { SceneController } from "./controllers/sceneController";
import { TextController } from "./controllers/textController";
import { AppController } from "./controllers/appController";
import { FontParser } from "./fonts/fontParser";
import { hexToRgba } from "./math";
import { Renderer } from "./rendering/renderer";
import { Camera } from "./scene/camera";
import { Glyph } from "./scene/objects/glyph";
import { colors } from "./controllers/appController";
import { TextBlock } from "./scene/objects/textBlock";
// FIXME: move to fontParser
export const defaultUrl = "./public/Blogger_Sans.otf";


// rename to manager,
// divide -> manager, app
export class App {
  fontParser: FontParser;
  renderer: Renderer;
  controllers: Controller[];
  camera: Camera;

  constructor(
    renderer: Renderer,
    fontParser: FontParser,
    controllers: Controller[],
    camera: Camera
  ) {
    this.renderer = renderer;
    this.fontParser = fontParser;
    this.controllers = controllers;
    this.camera = camera;
  }
  // TODO: upravit OOP
  static async initialize(canvas: HTMLCanvasElement): Promise<App> {
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
    const device: GPUDevice = <GPUDevice>await adapter.requestDevice({
      // For timestamp
      // start chrome --disable-dawn-features=disallow_unsafe_apis
      requiredFeatures: ["timestamp-query"],
    });

    // Create font parser
    const fontParser: FontParser = await FontParser.initialize(defaultUrl);

    // Create camera
    // camera bf initialization error - await.
    const camera: Camera = new Camera();

    // Create object

    // FIXME: hello world problem => prilis dlhy text na maly bb, strata dat pri konverzii?
    // const glyph = new Glyph(device, fontParser, 'Oo');
    // const txt = ['A']
    const textBlock = new TextBlock(device, "A", fontParser);

    // Create controllers
    const textController = new TextController(textBlock);
    const controllers = [
      new SceneController("glyph", camera),
      textController,
      new MenuController(),
      new AppController(textController),
    ];

    // Create renderer
    const renderer = new Renderer(
      device,
      canvas,
      textBlock,
      camera.projection,
      camera.view,
      colors["ternary"]
    );

    return new App(renderer, fontParser, controllers, camera);
  }

  notify() {
    console.log("notified");

    this.renderer.color = colors['ternary'];
    this.renderer.view = this.camera.view;

    const perFrameData = this.renderer.prepare();
    this.renderer.render(perFrameData);
  }

  run() {
    const perFrameData = this.renderer.prepare();
    this.renderer.render(perFrameData);
    this.controllers.forEach((controller) => controller.addEventListener(this));
  }
}
