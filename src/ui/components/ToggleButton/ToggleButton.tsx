import { useCallback } from 'react';
import {
  ToggleButton as AriaToggleButton,
  ToggleButtonProps as AriaToggleButtonProps,
} from 'react-aria-components';
import st from './_ToggleButton.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type ToggleButtonProps = AriaToggleButtonProps & {
  buttontype?: 'standard' | 'outlined' | 'tonal' | 'filled';
  materialIcon?: string;
  materialIconAlt?: string;
  onChange?: (newBoolean: boolean) => void;
  className?: string;
};

const ToggleButton = ({
  buttontype = 'standard',
  materialIcon = '',
  materialIconAlt = '',
  onChange = () => {},
  className = '',
  ...props
}: ToggleButtonProps) => {
  const onChangeHandler = useCallback(
    (newBoolean: boolean) => {
      onChange(newBoolean);
    },
    [onChange]
  );

  return (
    <AriaToggleButton
      className={cx('toggle-button', 'toggle-button__root', className)}
      data-button-type={buttontype}
      onChange={onChangeHandler}
      {...props}
    >
      <div
        className={cx(
          'toggle-button__shape',
          'toggle-button__shape--part-bg',
          'toggle-button'
        )}
      />
      <div className={cx('toggle-button__state', 'toggle-button-state')} />
      <div className={cx('toggle-button__content', 'toggle-button-content')}>
        <div
          className={cx(
            'toggle-button__content__icon',
            'toggle-button__content__icon--part-a',
            'material-symbols-outlined',
            'toggle-button-icon'
          )}
        >
          {materialIcon}
        </div>
        {materialIconAlt && (
          <div
            className={cx(
              'toggle-button__content__icon',
              'toggle-button__content__icon--part-b',
              'material-symbols-outlined',
              'toggle-button-icon-alt'
            )}
          >
            {materialIconAlt}
          </div>
        )}
      </div>
      <div
        className={cx(
          'toggle-button__shape',
          'toggle-button__shape--part-fg',
          'toggle-button-fg'
        )}
      />
    </AriaToggleButton>
  );
};

export default ToggleButton;
