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


  async run() {
    // const perFrameData = this.renderer.prepare();
    // this.renderer.render(perFrameData);

    this.sceneController.addEventListener(this);
    this.textController.addEventListener(this);
    this.appController.addEventListener(this);


    // Timestamping: 
    const timestamps = [];
    const test = 'A'.repeat(100);
    const converter = 10 ** 9;
    const frames = 200;
    let total = 0;
    this.textController.textBlock.text = test;
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
      name: 'timestamps'
    };

    // Creating layout
    const layout = {
      title: 'Timestamps',
      xaxis: {
        title: 'Frame number',
      },
      yaxis: {
        title: 'Time (seconds)',
      },
    };

    const figure = {
      data: [trace],
      layout: layout,
    };

    Plotly.newPlot("myPlot", [trace], layout);

  //   // Export the figure as SVG
  // const img = Plotly.toImage(figure, { format: 'svg' });
  //   // Save the SVG image to a file
  //   const svgBlob = new Blob([img], { type: 'image/svg+xml;charset=utf-8' });
  //   const url = URL.createObjectURL(svgBlob);
    
  //   const link = document.createElement('a');
  //   link.download = 'timestamps.svg';
  //   link.href = url;
  //   link.click();
    
  //   // Cleanup
  //   URL.revokeObjectURL(url);
  
}
}
