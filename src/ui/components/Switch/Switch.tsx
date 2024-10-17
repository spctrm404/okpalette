import { useCallback } from 'react';
import {
  Switch as AriaSwitch,
  SwitchProps as AriaSwitchProps,
} from 'react-aria-components';
import st from './_Switch.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type SwitchProps = AriaSwitchProps & {
  materialIcon?: string;
  materialIconAlt?: string;
  onChange?: (newBoolean: boolean) => void;
  className?: string;
};

const Switch = ({
  materialIcon = '',
  materialIconAlt = '',
  onChange = () => {},
  className = '',
  ...props
}: SwitchProps) => {
  const onChangeHandler = useCallback(
    (newBoolean: boolean) => {
      onChange?.(newBoolean);
    },
    [onChange]
  );

  return (
    <AriaSwitch
      className={cx('switch', 'switch__root', className)}
      onChange={onChangeHandler}
      {...props}
    >
      <div className={cx('switch__track', 'switch-track')}>
        <div className={cx('switch__track__shape', 'switch-track-shape')} />
        <div className={cx('switch__thumb', 'switch-thumb')}>
          <div className={cx('switch__thumb__state', 'switch-thumb-state')} />
          <div className={cx('switch__thumb__shape', 'switch-thumb-shape')}>
            {materialIcon && materialIconAlt && (
              <>
                <div
                  className={cx(
                    'switch__icon',
                    'switch__icon--part-a',
                    'material-symbols-outlined',
                    'switch-icon-a'
                  )}
                >
                  {materialIcon}
                </div>
                <div
                  className={cx(
                    'switch__icon',
                    'switch__icon--part-b',
                    'material-symbols-outlined',
                    'switch-icon-b'
                  )}
                >
                  {materialIconAlt}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AriaSwitch>
  );
};

export default Switch;
