import { FigmaDocumentColorSpace } from '../../../types/figmaTypes';
import { Hues } from '../../../types/paletteTypes';
import { DISP_P3_CHROMA_LIMIT } from '../../../constants';
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import st from './_Svg.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type SvgProps = {
  documentColorSpace: FigmaDocumentColorSpace;
  peakLightness: number;
  peakChroma: number;
  hues: Hues;
  className?: string;
  resolutionMultiplier?: number;
};

const Svg = ({
  documentColorSpace,
  peakLightness,
  peakChroma,
  hues,
  className = '',
  ...props
}: SvgProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    console.log(width);
    console.log(height);
    setSize({ width, height });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      setSize({ width, height });
    };
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  console.log('peakChroma', peakChroma);
  console.log('DISP_P3_CHROMA_LIMIT', DISP_P3_CHROMA_LIMIT);
  console.log('ratio', peakChroma / DISP_P3_CHROMA_LIMIT);

  return (
    <div className={cx('svg-container', className)} ref={containerRef}>
      <svg className={cx('svg')} width={size.width} height={size.height}>
        <polyline
          points={`0 ${size.height} ${size.width * peakLightness} ${
            size.height - size.height * (peakChroma / DISP_P3_CHROMA_LIMIT)
          } ${size.width} ${size.height}`}
          stroke={'var(--outline)'}
          fill="transparent"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};

export default Svg;
