import { Controller } from "./controllers/controller";
import { MenuController } from "./controllers/menuController";
import { SceneController } from "./controllers/sceneController";
import { TextController } from "./controllers/textController";
import { parseText } from "./fonts";
import { FontParser } from "./fonts/fontParser";
import { vec2ToFloat32 } from "./math";
import { Renderer } from "./rendering/renderer";
import { Camera } from "./scene/camera";
import { Glyph } from "./scene/objects/glyph";

const defaultUrl = "./public/Blogger_Sans.otf";

export class App {
  fontParser: FontParser;
  renderer: Renderer;

  cameraController: SceneController;
  glyphController: SceneController;
  textController: Controller;
  menuController: Controller;

  constructor(
    renderer: Renderer,
    fontParser: FontParser,
    cameraController: SceneController,
    glyphController: SceneController,
    textController: Controller,
    menuController: Controller
  ) {
    this.renderer = renderer;
    this.fontParser = fontParser;
    this.cameraController = cameraController;
    this.glyphController = glyphController;
    this.textController = textController;
    this.menuController = menuController;
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

    // FIXME: hello world problem => prilis dlhy text na maly bb, strata dat pri konverzii?
    const vertices = fontParser.parseText("horld");
    const glyph = new Glyph(device, vertices);

    // Create renderer
    const renderer = new Renderer(ctx, device);

    // Create controllers

    // Camera controller
    const cameraController = new SceneController("camera", camera);
    const glyphController = new SceneController("glyph", glyph);
    const textController = new TextController(fontParser);
    const menuController = new MenuController();

    renderer.render(<Glyph>(glyphController.object), <Camera>(cameraController.object));

    return new App(renderer, fontParser, cameraController, glyphController, textController, menuController);
  }


  addEventListeners() {
    console.log('here');
    this.cameraController.addEventListener(this);
    this.glyphController.addEventListener(this);
    this.textController.addEventListener(this);
    this.menuController.addEventListener(this);

  }
  notify(){
    // FIXME: solve this type conversion
    this.renderer.render(<Glyph>(this.glyphController.object), <Camera>(this.cameraController.object));
  }
}
