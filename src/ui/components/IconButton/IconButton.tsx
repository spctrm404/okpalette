import { useCallback } from 'react';
import {
  Button as AriaButton,
  ButtonProps as AriaButtonProps,
} from 'react-aria-components';
import st from './_IconButton.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type IconButtonProps = AriaButtonProps & {
  buttontype?: 'standard' | 'outlined' | 'outlined-child' | 'tonal' | 'filled';
  materialIcon?: string;
  onPress?: () => void;
  className?: string;
};

const IconButton = ({
  buttontype = 'standard',
  materialIcon = '',
  onPress = () => {},
  className = '',
  ...props
}: IconButtonProps) => {
  const onPressHandler = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <AriaButton
      className={cx('icon-button', 'icon-button__root', className)}
      data-button-type={buttontype}
      onPress={onPressHandler}
      {...props}
    >
      <div
        className={cx(
          'icon-button__shape',
          'icon-button__shape--part-bg',
          'icon-button-bg'
        )}
      />
      <div className={cx('icon-button__state', 'icon-button-state')} />
      <div className={cx('icon-button__content', 'icon-button-content')}>
        <div
          className={cx(
            'icon-button__content__icon',
            'material-symbols-outlined',
            'icon-button-icon'
          )}
        >
          {materialIcon}
        </div>
      </div>
      <div
        className={cx(
          'icon-button__shape',
          'icon-button__shape--part-fg',
          'icon-button-fg'
        )}
      />
    </AriaButton>
  );
};

export default IconButton;
