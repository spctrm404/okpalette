import { XY } from '../../../types/commonTypes';
import { clamp, quantize } from '../../../utils/numberUtils';
import {
  mergeProps,
  MoveMoveEvent,
  PressEvent,
  useFocus,
  useHover,
  useMove,
  usePress,
} from 'react-aria';
import { useState } from 'react';
import st from './_XYSlider.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type XYSlliderProps = {
  value?: XY;
  minValue?: XY;
  maxValue?: XY;
  step?: XY;
  onChangeEnd?: (newNumbers: XY) => void;
  onChange?: (newNumbers: XY) => void;
  isDisabled?: boolean;
  className?: string;
};

const XYSlider = ({
  value = { x: 50, y: 50 },
  minValue = { x: 0, y: 0 },
  maxValue = { x: 100, y: 100 },
  step = { x: 1, y: 1 },
  onChangeEnd = () => {},
  onChange = () => {},
  isDisabled = false,
  className = '',
  ...props
}: XYSlliderProps) => {
  const CONTAINER_SIZE = 200;
  const BALL_SIZE = 30;

  let [position, setPosition] = useState<XY>({
    x: 0,
    y: 0,
  });

  let clamp = (pos: number) =>
    Math.min(Math.max(pos, 0), CONTAINER_SIZE - BALL_SIZE);
  let { moveProps } = useMove({
    onMoveStart(e) {},
    onMove(e) {
      setPosition(({ x, y }) => {
        if (e.pointerType === 'keyboard') {
          x = clamp(x);
          y = clamp(y);
        }

        x += e.deltaX;
        y += e.deltaY;
        return { x, y };
      });
    },
    onMoveEnd(e) {
      setPosition(({ x, y }) => {
        x = clamp(x);
        y = clamp(y);
        return { x, y };
      });
    },
  });

  return (
    <>
      <div
        style={{
          width: CONTAINER_SIZE,
          height: CONTAINER_SIZE,
          background: 'white',
          border: '1px solid black',
          position: 'relative',
          touchAction: 'none',
        }}
      >
        <div
          {...moveProps}
          tabIndex={0}
          style={{
            width: BALL_SIZE,
            height: BALL_SIZE,
            borderRadius: '100%',
            position: 'absolute',
            left: clamp(position.x),
            top: clamp(position.y),
          }}
        />
      </div>
    </>
  );
};

export default XYSlider;
