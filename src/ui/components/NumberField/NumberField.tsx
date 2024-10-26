import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  NumberField as AriaNumberField,
  Label as AriaLabel,
  Group as AriaGroup,
  Input as AriaInput,
  NumberFieldProps as AriaNumberFieldProps,
} from 'react-aria-components';
import IconButton from '../IconButton/IconButton';
import st from './_NumberField.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type NumberFieldProps = AriaNumberFieldProps & {
  label?: string;
  noButton?: boolean;
  onChange?: (newNumber: number) => void;
  className?: string;
};

const NumberField = ({
  label,
  minValue = 0,
  maxValue = 100,
  step = 1,
  value = 50,
  noButton = false,
  onChange = () => {},
  className = '',
  ...props
}: NumberFieldProps) => {
  const [innerValue, setInnerValue] = useState(value);
  const currentInnerValue = useRef(innerValue);

  const syncInnerValueToValue = useCallback(() => {
    setInnerValue(value);
    currentInnerValue.current = value;
  }, [value]);

  const onChangeHandler = useCallback(
    (newValue: number) => {
      setInnerValue(newValue);
      currentInnerValue.current = newValue;
      onChange(currentInnerValue.current);
    },
    [onChange]
  );

  useLayoutEffect(() => {
    syncInnerValueToValue();
  }, [syncInnerValueToValue]);

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
      {...(label && { 'data-has-label': true })}
      {...(noButton && { 'data-no-button': noButton })}
      style={
        {
          '--min-ch': digitLength(),
          '--labal-ch': label ? label.length : 0,
        } as React.CSSProperties
      }
      {...props}
    >
      <AriaGroup className={cx('number-field__group', 'number-field-group')}>
        {label && (
          <div
            className={cx('number-field__input__label', 'number-field-label')}
          >
            <AriaLabel
              className={cx(
                'number-field__input__label__text',
                'number-field-label-text'
              )}
            >
              {label}
            </AriaLabel>
          </div>
        )}
        <AriaInput
          className={cx('number-field__input', 'number-field-input')}
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
              slot={'increment'}
            />
          </>
        )}
      </AriaGroup>
    </AriaNumberField>
  );
};

export default NumberField;
