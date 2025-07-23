// src/WebGPUCanvas.tsx  <-- Убедитесь, что расширение .tsx

import React, { useEffect, useRef, useState } from 'react';

const shaderCode = `
    @vertex
    fn vertex_main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
        return vec4<f32>(position, 0.0, 1.0);
    }

    @fragment
    fn fragment_main() -> @location(0) vec4<f32> {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Красный цвет
    }
`;

const WebGPUCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [statusMessage, setStatusMessage] = useState("Инициализация WebGPU...");

    useEffect(() => {
        // ... (весь код для WebGPU из предыдущего ответа остается здесь без изменений)
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
                        arrayStride: 2 * 4,
                        attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
                    }],
                },
                fragment: {
                    module: shaderModule,
                    entryPoint: 'fragment_main',
                    targets: [{ format: presentationFormat }],
                },
                primitive: {
                    topology: 'triangle-list',
                },
            });

            const vertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
            const vertexBuffer = device.createBuffer({
                size: vertices.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
            vertexBuffer.unmap();
            
            setStatusMessage("WebGPU успешно инициализирован!");

            const renderFrame = () => {
                if (!canvasRef.current) return;
                const commandEncoder = device.createCommandEncoder();
                const textureView = context.getCurrentTexture().createView();
                const renderPassDescriptor: GPURenderPassDescriptor = {
                    colorAttachments: [{
                        view: textureView,
                        clearValue: { r: 0.1, g: 0.1, b: 0.2, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    }],
                };
                const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
                passEncoder.setPipeline(pipeline);
                passEncoder.setVertexBuffer(0, vertexBuffer);
                passEncoder.draw(3);
                passEncoder.end();
                device.queue.submit([commandEncoder.finish()]);
                requestAnimationFrame(renderFrame);
            }
            requestAnimationFrame(renderFrame);
        };
        initWebGPU();
    }, []);

    return (
        <div style={{ width: '100%', maxWidth: '800px', margin: 'auto' }}>
            <p style={{ textAlign: 'center', marginBottom: '1rem' }}>{statusMessage}</p>
            <canvas ref={canvasRef} width="800" height="600" style={{ width: '100%', height: 'auto', borderRadius: '8px' }}></canvas>
        </div>
    );
};

export default WebGPUCanvas;