
import { SceneController } from "./controllers/sceneController";
import { TextController } from "./controllers/textController";
import { AppController } from "./controllers/appController";
import { FontParser } from "./fonts/fontParser";
import { Renderer } from "./rendering/renderer";
import { Camera } from "./scene/camera";
import { colors } from "./controllers/appController";
import { TextBlock } from "./scene/objects/textBlock";
// FIXME: move to fontParser
export const defaultUrl = "./public/Blogger_Sans.otf";

export class App {
  fontParser: FontParser;
  renderer: Renderer;
  sceneController: SceneController;
  textController: TextController;
  appController: AppController;
  camera: Camera;

  constructor(
    renderer: Renderer,
    fontParser: FontParser,
    sceneController: SceneController,
    textController: TextController,
    appController: AppController,
    camera: Camera
  ) {
    this.renderer = renderer;
    this.fontParser = fontParser;
    this.sceneController = sceneController;
    this.textController = textController;
    this.appController = appController;
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
    const textBlock = new TextBlock(device, "A", fontParser);

    // Create controllers
    const textController = new TextController(textBlock);

    // Create renderer
    const renderer = new Renderer(
      device,
      canvas,
      textBlock,
      camera.projection,
      camera.view,
      colors["secondary"]
    );

    return new App(renderer, fontParser, new SceneController("glyph", camera),
    textController,
    new AppController(textController), camera);
  } 

  notify() {
    this.renderer.color = this.textController.bgColor;
    this.renderer.view = this.camera.view;

    const perFrameData = this.renderer.prepare();
    this.renderer.render(perFrameData);
  }

  run() {
    const perFrameData = this.renderer.prepare();
    this.renderer.render(perFrameData);
    this.sceneController.addEventListener(this);
    this.textController.addEventListener(this);
    this.appController.addEventListener(this);
  }
}
