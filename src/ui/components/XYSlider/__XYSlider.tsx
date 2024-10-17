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
import { XY } from '../../../types/commonTypes';
import { clamp, quantize } from '../../../utils/numberUtils';
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
  const [isDragging, setDragging] = useState(false);
  const [isFocused, setFocused] = useState(false);

  const lastValueRef = useRef(value);
  const lastMinValueRef = useRef(minValue);
  const lastMaxValueRef = useRef(maxValue);

  const positionRef = useRef({ x: 0, y: 0 });

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const normalizedPosition = useCallback(() => {
    const trackRect = trackRef.current?.getBoundingClientRect();
    const thumbRect = thumbRef.current?.getBoundingClientRect();
    if (!trackRect || !thumbRect) {
      return { x: 0, y: 0 };
    }
    const position = positionRef.current;
    return {
      x: (position.x + 0.5 * thumbRect.width) / trackRect.width,
      y: 1 - (position.y + 0.5 * thumbRect.height) / trackRect.height,
    };
  }, []);
  const normalizedValue = useCallback(() => {
    return (Object.keys(value) as (keyof XY)[]).reduce((acc, key) => {
      acc[key] =
        key === 'y'
          ? 1 - (value[key] - minValue[key]) / (maxValue[key] - minValue[key])
          : (value[key] - minValue[key]) / (maxValue[key] - minValue[key]);
      return acc;
    }, {} as XY);
  }, [minValue, maxValue, value]);

  const positionFromValue = useCallback(() => {
    const trackRect = trackRef.current?.getBoundingClientRect();
    const thumbRect = thumbRef.current?.getBoundingClientRect();
    if (!trackRect || !thumbRect) {
      return { x: 0, y: 0 };
    }
    return {
      x: normalizedValue().x * trackRect.width - 0.5 * thumbRect.width,
      y: normalizedValue().y * trackRect.height - 0.5 * thumbRect.height,
    };
  }, [normalizedValue]);
  const valueFromPosition = useCallback(() => {
    return (Object.keys(normalizedPosition()) as (keyof XY)[]).reduce(
      (acc, key) => {
        acc[key] =
          normalizedPosition()[key] * (maxValue[key] - minValue[key]) +
          minValue[key];
        return acc;
      },
      {} as XY
    );
  }, [minValue, maxValue, normalizedPosition]);

  const normalizedLastValue = useCallback(() => {
    const lastValue = lastValueRef.current;
    const lastMinValue = lastMinValueRef.current;
    const lastMaxValue = lastMaxValueRef.current;
    return (Object.keys(lastValue) as (keyof XY)[]).reduce((acc, key) => {
      acc[key] =
        key === 'y'
          ? 1 -
            (lastValue[key] - lastMinValue[key]) /
              (lastMaxValue[key] - lastMinValue[key])
          : (lastValue[key] - lastMinValue[key]) /
            (lastMaxValue[key] - lastMinValue[key]);
      return acc;
    }, {} as XY);
  }, []);
  const positionFromLastValue = useCallback(() => {
    const trackRect = trackRef.current?.getBoundingClientRect();
    const thumbRect = thumbRef.current?.getBoundingClientRect();
    if (!trackRect || !thumbRect) {
      return { x: 0, y: 0 };
    }
    return {
      x: normalizedLastValue().x * trackRect.width - 0.5 * thumbRect.width,
      y: normalizedLastValue().y * trackRect.height - 0.5 * thumbRect.height,
    };
  }, [normalizedLastValue]);

  const getClampedValue = useCallback(
    (value: XY) => {
      return (Object.keys(value) as (keyof XY)[]).reduce((acc, key) => {
        acc[key] = clamp(value[key], minValue[key], maxValue[key]);
        return acc;
      }, {} as XY);
    },
    [minValue, maxValue]
  );
  const getQuantizedValue = useCallback(
    (value: XY) => {
      return (Object.keys(value) as (keyof XY)[]).reduce((acc, key) => {
        acc[key] = quantize(value[key], step[key]);
        return acc;
      }, {} as XY);
    },
    [step]
  );

  const clampPosition = useCallback(() => {
    const trackRect = trackRef.current?.getBoundingClientRect();
    const thumbRect = thumbRef.current?.getBoundingClientRect();
    if (!trackRect || !thumbRect) {
      return { x: 0, y: 0 };
    }
    positionRef.current = {
      x: clamp(
        positionRef.current.x,
        -0.5 * thumbRect.width,
        trackRect.width - 0.5 * thumbRect.width
      ),
      y: clamp(
        positionRef.current.y,
        -0.5 * thumbRect.height,
        trackRect.height - 0.5 * thumbRect.height
      ),
    };
  }, []);

  const onChangeEndHandler = useCallback(() => {
    // console.log('onChangeEnd');
    // console.log('value', value);
    const newValue = valueFromPosition();
    // console.log('position', positionRef.current);
    // console.log('newValue', newValue);
    const quantizedValue = getQuantizedValue(newValue);
    onChangeEnd?.(quantizedValue);
  }, [onChangeEnd, valueFromPosition, getQuantizedValue]);
  const onChangeHandler = useCallback(() => {
    // console.log('onChange');
    // console.log('value', value);
    const newValue = valueFromPosition();
    // console.log('position', positionRef.current);
    // console.log('newValue', newValue);
    const clampedValue = getClampedValue(newValue);
    const quantizedValue = getQuantizedValue(clampedValue);
    onChange?.(quantizedValue);
  }, [onChange, valueFromPosition, getClampedValue, getQuantizedValue]);

  const onPressStart = useCallback(
    (e: PressEvent) => {
      const thumb = thumbRef.current;
      if (!thumb) return;
      thumb.focus();
      setFocused(true);
      setDragging(true);
      const thumbRect = thumb?.getBoundingClientRect();
      positionRef.current = {
        x: e.x - 0.5 * thumbRect.width,
        y: e.y - 0.5 * thumbRect.height,
      };
      onChangeHandler();
    },
    [onChangeHandler]
  );
  const onMove = useCallback(
    (e: MoveMoveEvent) => {
      if (e.pointerType === 'keyboard') clampPosition();
      positionRef.current.x += e.deltaX;
      positionRef.current.y += e.deltaY;
      onChangeHandler();
    },
    [clampPosition, onChangeHandler]
  );
  const onMoveEnd = useCallback(() => {
    clampPosition();
    setDragging(false);
    onChangeEndHandler();
  }, [clampPosition, onChangeEndHandler]);

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

  useLayoutEffect(() => {
    lastValueRef.current = { ...value };
    lastMinValueRef.current = { ...minValue };
    lastMaxValueRef.current = { ...maxValue };
  });

  useLayoutEffect(() => {
    // console.log('layoutEffect');
    if (!isDragging)
      // {
      positionRef.current = positionFromValue();
    // console.log('position', positionRef.current);
    // }
  }, [isDragging, positionFromValue]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onResizeHandler = (entries: ResizeObserverEntry[]) => {
      entries.forEach((anEntry) => {
        if (anEntry.target === root) {
          // console.log('resize');
          // const value = lastValueRef.current;
          // const minValue = lastMinValueRef.current;
          // const maxValue = lastMaxValueRef.current;
          // const normalizedValue = Object.keys(value).reduce((acc, key) => {
          //   acc[key] =
          //     key === 'y'
          //       ? 1 -
          //         (value[key] - minValue[key]) / (maxValue[key] - minValue[key])
          //       : (value[key] - minValue[key]) /
          //         (maxValue[key] - minValue[key]);
          //   return acc;
          // }, {});
          // const trackRect = trackRef.current.getBoundingClientRect();
          // const thumbRect = thumbRef.current.getBoundingClientRect();
          // const newPosition = {
          //   x: normalizedValue.x * trackRect.width - 0.5 * thumbRect.width,
          //   y: normalizedValue.y * trackRect.height - 0.5 * thumbRect.height,
          // };
          // positionRef.current = newPosition;
          positionRef.current = positionFromLastValue();
          // console.log('position', positionRef.current);
          // console.log('valueByPosition', valueFromPosition());
        }
      });
    };
    const resizeObserver = new ResizeObserver(onResizeHandler);
    resizeObserver.observe(root);
    return () => {
      resizeObserver.unobserve(root);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      className={cx('xyslider', 'xyslider__root', className)}
      {...(isDisabled && { 'data-disabled': 'true' })}
      style={
        {
          '--normalized-val-x': normalizedValue().x,
          '--normalized-val-y': normalizedValue().y,
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
