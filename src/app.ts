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
import Plotly from 'plotly.js-dist-min';
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
      // open -na Google\ Chrome\ Canary.app --args --user-data-dir=/tmp/temporary-chrome-profile-dir --disable-dawn-features=disallow_unsafe_apis
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
      camera.projectionMatrix,
      camera.viewMatrix,
      colors["secondary"]
    );

    return new App(
      renderer,
      fontParser,
      new SceneController("glyph", camera),
      textController,
      new AppController(textController),
      camera
    );
  }

  notify() {
    this.renderer.canvasColor = this.textController.bgColor;
    this.renderer.viewMatrix = this.camera.viewMatrix;

    const perFrameData = this.renderer.prepare();
    this.renderer.render(perFrameData);
  }

  createPlot(timestamps, title, id) {
        // Creating plot:
        const trace = {
          x: frames,
          y: timestamps,
          type: 'scatter',
          mode: 'lines',
          name: title
        };
    
        // Creating layout
        const layout = {
          title: title,
          xaxis: {
            title: 'Frame number',
          },
          yaxis: {
            title: 'Time (seconds)',
          },
        };
    
        Plotly.newPlot(id, [trace], layout);
  }

  async runTimestamping(isWinding, title, id) {
    // Timestamping: 
    const timestamps = [];
    const test = 'A'.repeat(100);
    const converter = 10 ** 9;
    const frames = 100;
    let total = 0;
    this.textController.textBlock.text = test;
    this.textController.textBlock.isWinding = isWinding;
    for (let i = 0; i < frames; i++) {
      const perFrameData = this.renderer.prepare();
      let number =  Number(await this.renderer.render(perFrameData)) / converter;
      total += number;

      timestamps.push(number);
    }

    const avg = total / frames;
    const fps = 1 / avg;
    console.log('Total time: ', total);
    console.log('Fps: ', fps);
    console.log('Timestamps array: ', timestamps, timestamps.length);

            // Creating plot:
            const trace = {
              x: frames,
              y: timestamps,
              type: 'scatter',
              mode: 'lines',
              name: title
            };
        
            // Creating layout
            const layout = {
              title: title,
              xaxis: {
                title: 'Frame number',
              },
              yaxis: {
                title: 'Time (seconds)',
              },
            };
        
            Plotly.newPlot(id, [trace], layout);
    // Plotly.purge(id);
  }


  async run() {
    // const perFrameData = this.renderer.prepare();
    // this.renderer.render(perFrameData);

    this.sceneController.addEventListener(this);
    this.textController.addEventListener(this);
    this.appController.addEventListener(this);


    // Timestamping: 
    await this.runTimestamping(true, 'Timestamps for winding', 'plotWinding');
    await this.runTimestamping(false, 'Timestamps for sdf', 'plotSdf');
  
}
}
