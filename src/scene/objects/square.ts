import { mat4 } from "gl-matrix";
import { SceneObject } from "./sceneObject";

export class Square implements SceneObject {
    buffer: GPUBuffer;

    vertices: Float32Array;

    device: GPUDevice;

    model: mat4 = mat4.create();

    usage: number = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;


    constructor(device: GPUDevice) {
        this.device = device;

        // mat4.translate(this.model, this.model, [0, 0, 0]);
        mat4.rotateY(this.model, this.model, Math.PI / 4);
        mat4.scale(this.model, this.model, [0.5, 0.5, 0.5]);

        this.vertices = new Float32Array([
            // triangle 1
            -0.5, -0.5, 0.0, 1.0, 0.7, 1.0,
            -0.5, 0.5, 0.0, 1.0, 1.0, 1.0,
            0.5, -0.5, 0.0, 0.7, 1.0, 1.0,
            // triangle 2
            0.5, -0.5, 0.0, 1.0, 1.0, 0.7,
            -0.5, 0.5, 0.0, 1.0, 0.7, 1.0,
            0.5, 0.5, 0.0, 1.0, 1.0, 1.0,
        ]);
        
        this.buffer = this.device.createBuffer({
            size: this.vertices.byteLength,
            usage: this.usage,
            mappedAtCreation: true
        });

        new Float32Array(this.buffer.getMappedRange()).set(this.vertices);
        
        this.buffer.unmap();

    }
    getVertexCount(): number {
        return 6;
    }
    update(vertices: any[]): void {
        throw new Error("Method not implemented.");
    }
}
