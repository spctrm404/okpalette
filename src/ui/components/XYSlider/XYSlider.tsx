import { XY } from '../../../types/commonTypes';
import { clamp, quantize } from '../../../utils/numberUtils';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  mergeProps,
  MoveMoveEvent,
  PressEvent,
  useFocus,
  useHover,
  useMove,
  usePress,
} from 'react-aria';
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
  const [position, setPosition] = useState(value);
  const positionRef = useRef(value);

  const syncRef = useRef(true);

  const [isDragging, setDragging] = useState(false);
  const [isFocused, setFocused] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const getPositionFromValue = (): XY => {
    if (!trackRef.current || !thumbRef.current) return { x: 0, y: 0 };
    const getNormalizedValue = () => {
      return (Object.keys(value) as (keyof XY)[]).reduce((acc, key) => {
        acc[key] =
          key === 'y'
            ? 1 - (value[key] - minValue[key]) / (maxValue[key] - minValue[key])
            : (value[key] - minValue[key]) / (maxValue[key] - minValue[key]);
        return acc;
      }, {} as XY);
    };
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbRect = thumbRef.current.getBoundingClientRect();
    return {
      x: getNormalizedValue().x * trackRect.width - 0.5 * thumbRect.width,
      y: getNormalizedValue().y * trackRect.height - 0.5 * thumbRect.height,
    };
  };

  useLayoutEffect(() => {
    if (syncRef.current) {
      console.log('SYNC');
      positionRef.current = getPositionFromValue();
      setPosition(positionRef.current);
    }
  }, [value]);

  const getNormalizedPosition = (): XY => {
    if (!trackRef.current || !thumbRef.current) return { x: 0, y: 0 };
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbRect = thumbRef.current.getBoundingClientRect();
    const clampedPosition = getClampedPosition(position);
    return {
      x: (clampedPosition.x + 0.5 * thumbRect.width) / trackRect.width,
      y: (clampedPosition.y + 0.5 * thumbRect.height) / trackRect.height,
    };
  };

  const getNormalizedLastPosition = (): XY => {
    if (!trackRef.current || !thumbRef.current) return { x: 0, y: 0 };
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbRect = thumbRef.current.getBoundingClientRect();
    const position = positionRef.current;
    return {
      x: (position.x + 0.5 * thumbRect.width) / trackRect.width,
      y: (position.y + 0.5 * thumbRect.height) / trackRect.height,
    };
  };

  const getValueFromLastPosition = () => {
    return (Object.keys(getNormalizedLastPosition()) as (keyof XY)[]).reduce(
      (acc, key) => {
        acc[key] =
          key === 'y'
            ? (1 - getNormalizedLastPosition()[key]) *
                (maxValue[key] - minValue[key]) +
              minValue[key]
            : getNormalizedLastPosition()[key] *
                (maxValue[key] - minValue[key]) +
              minValue[key];
        return acc;
      },
      {} as XY
    );
  };

  const getClampedValue = (value: XY) => {
    return (Object.keys(value) as (keyof XY)[]).reduce((acc, key) => {
      acc[key] = clamp(value[key], minValue[key], maxValue[key]);
      return acc;
    }, {} as XY);
  };
  const getQuantizedValue = (value: XY) => {
    return (Object.keys(value) as (keyof XY)[]).reduce((acc, key) => {
      acc[key] = quantize(value[key], step[key]);
      return acc;
    }, {} as XY);
  };

  const getClampedPosition = (position: XY): XY => {
    if (!trackRef.current || !thumbRef.current) return { x: 0, y: 0 };
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbRect = thumbRef.current.getBoundingClientRect();
    return {
      x: clamp(
        position.x,
        -0.5 * thumbRect.width,
        trackRect.width - 0.5 * thumbRect.width
      ),
      y: clamp(
        position.y,
        -0.5 * thumbRect.height,
        trackRect.height - 0.5 * thumbRect.height
      ),
    };
  };

  const onChangeEndHandler = () => {
    const newValue = getValueFromLastPosition();
    const quantizedValue = getQuantizedValue(newValue);
    onChangeEnd?.(quantizedValue);
  };
  const onChangeHandler = () => {
    const newValue = getValueFromLastPosition();
    const clampedValue = getClampedValue(newValue);
    const quantizedValue = getQuantizedValue(clampedValue);
    onChange?.(quantizedValue);
  };

  const onPressStart = (e: PressEvent) => {
    console.log('begin');
    syncRef.current = false;
    if (!thumbRef.current) return;
    const thumb = thumbRef.current;
    thumb.focus();
    setFocused(true);
    setDragging(true);
    const thumbRect = thumb.getBoundingClientRect();
    positionRef.current = {
      x: e.x - 0.5 * thumbRect.width,
      y: e.y - 0.5 * thumbRect.height,
    };
    setPosition(positionRef.current);
    onChangeHandler();
  };
  const onMove = (e: MoveMoveEvent) => {
    syncRef.current = false;
    if (e.pointerType === 'keyboard') {
      const clampedPosition = getClampedPosition(positionRef.current);
      setPosition(clampedPosition);
      positionRef.current = clampedPosition;
    }
    positionRef.current.x += e.deltaX;
    positionRef.current.y += e.deltaY;
    setPosition(positionRef.current);
    onChangeHandler();
  };
  const onMoveEnd = () => {
    console.log('end');
    syncRef.current = true;
    const clampedPosition = getClampedPosition(positionRef.current);
    setPosition(clampedPosition);
    positionRef.current = clampedPosition;
    setDragging(false);
    onChangeEndHandler();
  };

  const { hoverProps: thumbHoverProps, isHovered: thumbIsHovered } = useHover(
    {}
  );
  const { focusProps: thumbFocusProps } = useFocus({
    isDisabled: false,
    onFocus: () => {
      if (!isDisabled) setFocused(true);
    },
    onBlur: () => {
      setFocused(false);
    },
  });
  const { pressProps: thumbPressProps } = usePress({
    onPressStart: () => {
      if (!isDisabled) setDragging(true);
    },
  });
  const { moveProps: thumbMoveProp } = useMove({
    onMove: (e) => {
      if (!isDisabled) onMove(e);
    },
    onMoveEnd: () => {
      if (!isDisabled) onMoveEnd();
    },
  });
  const thumbInteractionProps = mergeProps(
    thumbHoverProps,
    thumbFocusProps,
    thumbPressProps,
    thumbMoveProp
  );

  const { hoverProps: trackHoverProps, isHovered: trackIsHovered } = useHover(
    {}
  );
  const { pressProps: trackPressProps } = usePress({
    onPressStart: (e) => {
      if (!isDisabled) onPressStart(e);
    },
    onPressUp: () => {
      setDragging(false);
    },
  });
  const { moveProps: trackMoveProps } = useMove({
    onMove: (e) => {
      if (!isDisabled) onMove(e);
    },
    onMoveEnd: () => {
      if (!isDisabled) onMoveEnd();
    },
  });
  const trackInteractionProps = mergeProps(
    trackHoverProps,
    trackPressProps,
    trackMoveProps
  );

  return (
    <div
      className={cx('xyslider', 'xyslider__root', className)}
      {...(isDisabled && { 'data-disabled': 'true' })}
      style={
        {
          '--normalized-val-x': getNormalizedPosition().x,
          '--normalized-val-y': getNormalizedPosition().y,
        } as React.CSSProperties
      }
      {...props}
      ref={rootRef}
    >
      <div
        className={cx('xyslider__track', 'xyslider-track')}
        {...trackInteractionProps}
        {...(!isDisabled && trackIsHovered && { 'data-hovered': 'true' })}
        {...(isDisabled && { 'data-disabled': 'true' })}
        style={{
          position: 'relative',
          touchAction: 'none',
        }}
        ref={trackRef}
      >
        <div className={cx('xyslider__track__shape', 'xyslider-track-shape')} />
        <div
          className={cx(
            'xyslider__track__guide',
            'xyslider__track__guide--part-top',
            'xyslider__track__guide--part-vertical',
            'xyslider-track-guide-top'
          )}
        />
        <div
          className={cx(
            'xyslider__track__guide',
            'xyslider__track__guide--part-right',
            'xyslider__track__guide--part-horizontal',
            'xyslider-track-guide-right'
          )}
        />
        <div
          className={cx(
            'xyslider__track__guide',
            'xyslider__track__guide--part-bottom',
            'xyslider__track__guide--part-vertical',
            'xyslider-track-guide-bottom'
          )}
        />
        <div
          className={cx(
            'xyslider__track__guide',
            'xyslider__track__guide--part-left',
            'xyslider__track__guide--part-horizontal',
            'xyslider-track-guide-left'
          )}
        />
        <div
          className={cx('xyslider__thumb', 'xyslider-thumb')}
          {...thumbInteractionProps}
          {...(!isDisabled && thumbIsHovered && { 'data-hovered': 'true' })}
          {...(!isDisabled && isDragging && { 'data-dragging': 'true' })}
          {...(!isDisabled && isFocused && { 'data-focused': 'true' })}
          {...(isDisabled && { 'data-disabled': 'true' })}
          tabIndex={0}
          style={{
            position: 'absolute',
            touchAction: 'none',
          }}
          ref={thumbRef}
        >
          <div
            className={cx('xyslider__thumb__state', 'xyslider-thumb-state')}
          />
          <div className={cx('xyslider__thumb__shape', 'xyslider-thumb-shape')}>
            <div
              className={cx(
                'xyslider__thumb__shape__component',
                'xyslider__thumb__shape__component--part-top',
                'xyslider-thumb-shape-top'
              )}
            />
            <div
              className={cx(
                'xyslider__thumb__shape__component',
                'xyslider__thumb__shape__component--part-right',
                'xyslider-thumb-shape-right'
              )}
            />
            <div
              className={cx(
                'xyslider__thumb__shape__component',
                'xyslider__thumb__shape__component--part-bottom',
                'xyslider-thumb-shape-bottom'
              )}
            />
            <div
              className={cx(
                'xyslider__thumb__shape__component',
                'xyslider__thumb__shape__component--part-left',
                'xyslider-thumb-shape-left'
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default XYSlider;
