// src/WebGPUCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';

// ===== Matrix Math Helpers =====
// Creates a perspective projection matrix with double precision.
function getProjectionMatrix(aspect: number, fov: number = Math.PI / 4, zNear: number = 0.1, zFar: number = 100.0): Float64Array {
    console.log(`[WebGPU] Creating projection matrix with double precision - aspect: ${aspect}, fov: ${fov}, zNear: ${zNear}, zFar: ${zFar}`);
    
    const f = 1.0 / Math.tan(fov / 2);
    const rangeInv = 1 / (zNear - zFar);
    
    const matrix = new Float64Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (zNear + zFar) * rangeInv, -1,
        0, 0, zNear * zFar * rangeInv * 2, 0
    ]);
    
    console.log(`[WebGPU] Projection matrix created with ${matrix.constructor.name} (64-bit precision)`);
    return matrix;
}

// Multiplies two 4x4 matrices with double precision.
function multiply(a: Float64Array, b: Float64Array): Float64Array {
    console.log(`[WebGPU] Multiplying matrices with double precision (${a.constructor.name} × ${b.constructor.name})`);
    
    const out = new Float64Array(16);
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    
    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    
    console.log(`[WebGPU] Matrix multiplication completed with ${out.constructor.name} result`);
    return out;
}

// Helper function to convert Float64Array to Float32Array for GPU upload
function toFloat32(matrix: Float64Array): Float32Array {
    console.log(`[WebGPU] Converting ${matrix.constructor.name} to Float32Array for GPU upload`);
    return new Float32Array(matrix);
}

const shaderCode = `
    struct VertexOutput {
        @builtin(position) position : vec4<f32>,
        @location(0) color : vec4<f32>,
    }

    @group(0) @binding(0) var<uniform> modelViewProjectionMatrix : mat4x4<f32>;

    @vertex
    fn vertex_main(
        @location(0) position : vec3<f32>,
        @location(1) color : vec4<f32>
    ) -> VertexOutput {
        var output : VertexOutput;
        output.position = modelViewProjectionMatrix * vec4<f32>(position, 1.0);
        output.color = color;
        return output;
    }

    @fragment
    fn fragment_main(input : VertexOutput) -> @location(0) vec4<f32> {
        return input.color;
    }
`;

const WebGPUCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [statusMessage, setStatusMessage] = useState("Инициализация WebGPU...");
    const [fps, setFps] = useState(0);

    useEffect(() => {
        let animationFrameId: number;

        const initWebGPU = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            if (!navigator.gpu) {
                setStatusMessage("Ошибка: WebGPU не поддерживается.");
                return;
            }

            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                setStatusMessage("Ошибка: не удалось получить GPU адаптер.");
                return;
            }

            const device = await adapter.requestDevice();
            
            const context = canvas.getContext('webgpu');
            if (!context) {
                setStatusMessage("Ошибка: не удалось получить WebGPU контекст.");
                return;
            }

            const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
            context.configure({
                device,
                format: presentationFormat,
                alphaMode: 'opaque',
            });

            const shaderModule = device.createShaderModule({ code: shaderCode });
            
            const pipeline = device.createRenderPipeline({
                layout: 'auto',
                vertex: {
                    module: shaderModule,
                    entryPoint: 'vertex_main',
                    buffers: [{
                        arrayStride: 7 * 4, // 3 pos (f32) + 4 color (f32) = 28 bytes
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' }, // position
                            { shaderLocation: 1, offset: 3 * 4, format: 'float32x4' }  // color
                        ],
                    }],
                },
                fragment: {
                    module: shaderModule,
                    entryPoint: 'fragment_main',
                    targets: [{ format: presentationFormat }],
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back',
                },
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth24plus',
                },
            });

            // Vertex data for a tetrahedron
            const vertices = new Float32Array([
                // x,    y,    z,      r,   g,   b,   a
                // Top vertex (Red)
                 0.0,  0.5,  0.0,    1.0, 0.0, 0.0, 1.0,
                // Base vertex 1 (Green)
                -0.5, -0.5,  0.25,   0.0, 1.0, 0.0, 1.0,
                // Base vertex 2 (Blue)
                 0.5, -0.5,  0.25,   0.0, 0.0, 1.0, 1.0,
                // Base vertex 3 (Yellow)
                 0.0, -0.5, -0.5,   1.0, 1.0, 0.0, 1.0,
            ]);
            const vertexBuffer = device.createBuffer({
                size: vertices.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
            vertexBuffer.unmap();

            const indices = new Uint16Array([
                0, 1, 2, // Front face
                0, 2, 3, // Right face
                0, 3, 1, // Left face
                1, 3, 2, // Bottom face
            ]);
            const indexBuffer = device.createBuffer({
                size: indices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Uint16Array(indexBuffer.getMappedRange()).set(indices);
            indexBuffer.unmap();
            
            const uniformBufferSize = 4 * 4 * 4; // 4x4 matrix
            const uniformBuffer = device.createBuffer({
                size: uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            const uniformBindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
            });

            const depthTexture = device.createTexture({
                size: [canvas.width, canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

            setStatusMessage("WebGPU успешно инициализирован!");
            console.log(`[WebGPU] Initialization complete - using double precision (64-bit) matrices like Revit for enhanced accuracy`);

            let lastTime = performance.now();
            let frameCount = 0;

            const renderFrame = () => {
                const now = performance.now();
                const deltaTime = now - lastTime;
                frameCount++;
                if (deltaTime >= 1000) {
                    setFps(frameCount);
                    frameCount = 0;
                    lastTime = now;
                }

                if (!canvasRef.current) return;

                const aspect = canvas.width / canvas.height;
                const projectionMatrix = getProjectionMatrix(aspect);
                const viewMatrix = new Float64Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-3,1]);
                
                const angleY = now / 1500;
                const angleX = now / 2000;

                const cY = Math.cos(angleY), sY = Math.sin(angleY);
                const rotY = new Float64Array([cY,0,sY,0, 0,1,0,0, -sY,0,cY,0, 0,0,0,1]);

                const cX = Math.cos(angleX), sX = Math.sin(angleX);
                const rotX = new Float64Array([1,0,0,0, 0,cX,-sX,0, 0,sX,cX,0, 0,0,0,1]);
                
                console.log(`[WebGPU] Computing transformation matrices for frame - angleX: ${angleX.toFixed(4)}, angleY: ${angleY.toFixed(4)}`);
                
                const modelMatrix = multiply(rotY, rotX);
                const modelViewMatrix = multiply(viewMatrix, modelMatrix);
                const modelViewProjectionMatrix = multiply(projectionMatrix, modelViewMatrix);

                // Convert to Float32Array for GPU upload
                const gpuMatrix = toFloat32(modelViewProjectionMatrix);
                console.log(`[WebGPU] Final MVP matrix converted to ${gpuMatrix.constructor.name} for GPU upload`);

                device.queue.writeBuffer(uniformBuffer, 0, gpuMatrix);

                const commandEncoder = device.createCommandEncoder();
                const textureView = context.getCurrentTexture().createView();
                const renderPassDescriptor: GPURenderPassDescriptor = {
                    colorAttachments: [{
                        view: textureView,
                        clearValue: { r: 0.1, g: 0.1, b: 0.2, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    }],
                    depthStencilAttachment: {
                        view: depthTexture.createView(),
                        depthClearValue: 1.0,
                        depthLoadOp: 'clear',
                        depthStoreOp: 'store',
                    }
                };
                const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
                passEncoder.setPipeline(pipeline);
                passEncoder.setBindGroup(0, uniformBindGroup);
                passEncoder.setVertexBuffer(0, vertexBuffer);
                passEncoder.setIndexBuffer(indexBuffer, 'uint16');
                passEncoder.drawIndexed(indices.length);
                passEncoder.end();
                device.queue.submit([commandEncoder.finish()]);
                
                animationFrameId = requestAnimationFrame(renderFrame);
            }
            renderFrame();

            return () => {
                cancelAnimationFrame(animationFrameId);
            };
        };

        const cleanupPromise = initWebGPU();

        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, []);

    return (
        <div style={{ width: '100%', maxWidth: '800px', margin: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', padding: '0 1rem' }}>
                <span>{statusMessage}</span>
                <span>FPS: {fps}</span>
            </div>
            <canvas ref={canvasRef} width="800" height="600" style={{ width: '100%', height: 'auto', borderRadius: '8px' }}></canvas>
        </div>
    );
};

export default WebGPUCanvas;