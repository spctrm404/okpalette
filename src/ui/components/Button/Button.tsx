import { useCallback } from 'react';
import {
  Button as AriaButton,
  ButtonProps as AriaButtonProps,
} from 'react-aria-components';
import st from './_Button.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type ButtonProps = AriaButtonProps & {
  buttontype?: 'text' | 'outlined' | 'elevated' | 'tonal' | 'filled';
  materialIcon?: string;
  label?: string;
  onPress?: () => void;
  className?: string;
};

const Button = ({
  buttontype = 'text',
  materialIcon = '',
  label = 'label',
  onPress = () => {},
  className = '',
  ...props
}: ButtonProps) => {
  const onPressHandler = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <AriaButton
      className={cx('button', 'button__root', className)}
      data-button-type={buttontype}
      {...(materialIcon && { 'data-has-icon': materialIcon })}
      onPress={onPressHandler}
      {...props}
    >
      <div
        className={cx('button__shape', 'button__shape--part-bg', 'button-bg')}
      />
      <div className={cx('button__state', 'button-state')} />
      <div className={cx('button__content', 'button-content')}>
        {materialIcon && (
          <div
            className={cx(
              'button__content__icon',
              'material-symbols-outlined',
              'button-icon'
            )}
          >
            {materialIcon}
          </div>
        )}
        <div className={cx('button__content__text', 'button-text')}>
          {label}
        </div>
      </div>
      <div
        className={cx('button__shape', 'button__shape--part-fg', 'button-fg')}
      />
    </AriaButton>
  );
};

export default Button;
