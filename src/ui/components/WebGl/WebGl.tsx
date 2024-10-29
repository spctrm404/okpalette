import { FigmaDocumentColorSpace } from '../../../types/figmaTypes';
import { Hues } from '../../../types/paletteTypes';
import { useRef, useEffect } from 'react';
import vertex from './vertex.glsl';
import fragment from './fragment.glsl';
import st from './_WebGl.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type WebGlProps = {
  documentColorSpace: FigmaDocumentColorSpace;
  peakLightness: number;
  peakChroma: number;
  hues: Hues;
  className?: string;
  resolutionMultiplier?: number;
};

const WebGl = ({
  documentColorSpace,
  peakLightness,
  peakChroma,
  hues,
  className = '',
  resolutionMultiplier = 1,
  ...props
}: WebGlProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const gl = canvas?.getContext('webgl2');

    if (!canvas || !container || !gl) return;

    // 셰이더 및 프로그램 변수 선언
    let program: WebGLProgram | null = null;

    // 셰이더 컴파일 및 프로그램 생성
    const createShader = (
      gl: WebGL2RenderingContext,
      type: number,
      source: string
    ): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        console.error('Failed to compile shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const createProgram = (
      gl: WebGL2RenderingContext,
      vertexShader: WebGLShader,
      fragmentShader: WebGLShader
    ): WebGLProgram | null => {
      const program = gl.createProgram();
      if (!program) return null;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      const success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
        console.error('Failed to link program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }
      return program;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);

    if (!vertexShader || !fragmentShader) return;

    program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    gl.useProgram(program);

    // 버퍼 및 속성 설정
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const vertices = new Float32Array([
      -1.0,
      -1.0, // 왼쪽 아래
      1.0,
      -1.0, // 오른쪽 아래
      -1.0,
      1.0, // 왼쪽 위
      1.0,
      1.0, // 오른쪽 위
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_Position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // 렌더 함수 정의
    const render = () => {
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(
        gl.getUniformLocation(program!, 'u_Resolution'),
        canvas.width,
        canvas.height
      );
      gl.uniform1f(gl.getUniformLocation(program!, 'u_FromHue'), hues.from);
      gl.uniform1f(gl.getUniformLocation(program!, 'u_ToHue'), hues.to);

      const colorSpaceValue = documentColorSpace === 'DISPLAY_P3' ? 1 : 0;
      gl.uniform1i(
        gl.getUniformLocation(program!, 'u_ColorSpace'),
        colorSpaceValue
      );

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // 캔버스 리사이즈 함수 정의
    const resizeCanvas = () => {
      const multiplier = resolutionMultiplier || 1;
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * multiplier;
      canvas.height = height * multiplier;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      render();
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [documentColorSpace, hues]);

  return (
    <div className={cx('web-gl-container', className)} ref={containerRef}>
      <canvas className={cx('web-gl')} ref={canvasRef}></canvas>
    </div>
  );
};

export default WebGl;
