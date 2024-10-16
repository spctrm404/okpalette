// todo: add num disp option

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  NumberField as AriaNumberField,
  Label as AriaLabel,
  Group as AriaGroup,
  Input as AriaInput,
} from 'react-aria-components';
import IconButton from '../IconButton/IconButton';
import st from './_NumberField.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type NumberFieldProps = {
  label?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  value?: number;
  onChange?: (newNumber: number) => void;
  isWheelDisabled?: boolean;
  className?: string;
  isDisabled?: boolean;
  noButton?: boolean;
};

const NumberField = ({
  label,
  minValue = 0,
  maxValue = 100,
  step = 1,
  value = 50,
  onChange = () => {},
  isWheelDisabled = true,
  noButton = false,
  className = '',
  ...props
}: NumberFieldProps) => {
  const [innerValue, setInnerValue] = useState(value);
  const innerValueRef = useRef(innerValue);

  const inputRef = useRef<HTMLInputElement>(null);

  const syncInnerValueToValue = useCallback(() => {
    setInnerValue(value);
    innerValueRef.current = value;
  }, [value]);

  const onChangeHandler = useCallback((newValue: number) => {
    setInnerValue(newValue);
    innerValueRef.current = newValue;
  }, []);
  const onKeyDownHandler = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') onChange?.(innerValueRef.current);
    },
    [onChange]
  );
  const onBlurHandler = useCallback(() => {
    onChange?.(innerValueRef.current);
  }, [onChange]);
  const onPressHandler = useCallback(() => {
    onChange?.(innerValueRef.current);
  }, [onChange]);

  useLayoutEffect(() => {
    syncInnerValueToValue();
  }, [value]);

  const digitLength = useCallback(() => {
    const [minIntegerPart, minDecimalPart] = minValue.toString().split('.');
    const [maxIntegerPart, maxDecimalPart] = maxValue.toString().split('.');
    const [stepIntegerPart, stepDecimalPart] = step.toString().split('.');
    const maxIntegerLength = Math.max(
      minIntegerPart.length,
      maxIntegerPart.length,
      stepIntegerPart.length
    );
    const maxDecimalLength = Math.max(
      minDecimalPart ? minDecimalPart.length + 1 : 0,
      maxDecimalPart ? maxDecimalPart.length + 1 : 0,
      stepDecimalPart ? stepDecimalPart.length + 1 : 0
    );
    return maxIntegerLength + maxDecimalLength;
  }, [minValue, maxValue, step]);

  return (
    <AriaNumberField
      className={cx('number-field', 'number-field__root', className)}
      minValue={minValue}
      maxValue={maxValue}
      step={step}
      value={innerValue}
      onChange={onChangeHandler}
      onKeyDown={onKeyDownHandler}
      onBlur={onBlurHandler}
      isWheelDisabled={isWheelDisabled}
      {...(label && { 'data-has-label': true })}
      {...(noButton && { 'data-no-button': noButton })}
      style={{ '--min-ch': digitLength() } as React.CSSProperties}
      {...props}
    >
      <AriaGroup className={cx('number-field__group', 'number-field-group')}>
        {label && (
          <AriaLabel
            className={cx('number-field__input__label', 'number-field-label')}
          >
            {label}
          </AriaLabel>
        )}
        <AriaInput
          className={cx('number-field__input', 'number-field-input')}
          ref={inputRef}
        />
        <div
          className={cx(
            'number-field__input__shape',
            'number-field-intput-shape'
          )}
        />
        <div
          className={cx(
            'number-field__input__state',
            'number-field-input-shape'
          )}
        />
        {noButton || (
          <>
            <IconButton
              className={cx(
                'number-field__button',
                'number-field__button--part-decrease',
                'number-field-button-decrease'
              )}
              buttontype={'tonal'}
              materialIcon={'remove'}
              onPress={onPressHandler}
              slot={'decrement'}
            />
            <IconButton
              className={cx(
                'number-field__button',
                'number-field__button--part-increase',
                'number-field-button-increase'
              )}
              buttontype={'tonal'}
              materialIcon={'add'}
              onPress={onPressHandler}
              slot={'increment'}
            />
          </>
        )}
      </AriaGroup>
    </AriaNumberField>
  );
};

export default NumberField;
