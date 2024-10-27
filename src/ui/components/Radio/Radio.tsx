import { useCallback } from 'react';
import {
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
} from 'react-aria-components';
import st from './_Radio.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type RadioProps = {
  radioItems?: { uid: string; value: string; text: string }[];
  value?: string;
  defaultValue?: string;
  onChange?: (newString: string) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
};

const Radio = ({
  radioItems = [],
  value = '',
  onChange = () => {},
  className,
  ...props
}: RadioProps) => {
  const onChangeHandler = useCallback(
    (newString: string) => {
      onChange?.(newString);
    },
    [onChange]
  );

  return (
    <AriaRadioGroup
      value={value}
      onChange={onChangeHandler}
      className={cx('radio-group', 'radio-group__root', className)}
      {...props}
    >
      {radioItems.map((aRadioItem) => {
        return (
          <AriaRadio
            className={`${cx('radio')} radio`}
            key={aRadioItem.uid}
            value={aRadioItem.value}
          >
            <div className={cx('radio__button', 'radio-button')}>
              <div
                className={cx('radio__button__state', 'radio-button-state')}
              />
              <div
                className={cx('radio__button__shape', 'radio-button-shape')}
              />
            </div>
            <div className={cx('radio__text', 'radio-text')}>
              {aRadioItem.text}
            </div>
          </AriaRadio>
        );
      })}
    </AriaRadioGroup>
  );
};

export default Radio;
