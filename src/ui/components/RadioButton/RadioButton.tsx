import { useCallback } from 'react';
import {
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
} from 'react-aria-components';
import st from './_RadioButton.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type RadioProps = {
  buttontype?: 'standard' | 'outlined' | 'tonal' | 'filled';
  radioItems?: { uid: string; value: string; text: string }[];
  value?: string;
  defaultValue?: string;
  onChange?: (newString: string) => void;
  className?: string;
};

const Radio = ({
  buttontype = 'outlined',
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
      className={cx(
        'radio-button-group',
        'radio-button-group__root',
        className
      )}
      data-button-type={buttontype}
      {...props}
    >
      {radioItems.map((aRadioItem) => {
        return (
          <AriaRadio
            className={`${cx('radio-button')} radio-button`}
            key={aRadioItem.uid}
            value={aRadioItem.value}
            data-button-type={buttontype}
          >
            <div
              className={cx(
                'radio-button__shape',
                'radio-button__shape--part-bg',
                'radio-button-bg'
              )}
            />
            <div className={cx('radio-button__state', 'radio-button-state')} />
            <div
              className={cx('radio-button__content', 'radio-button-content')}
            >
              <div
                className={cx(
                  'radio-button__content__text',
                  'radio-button-text'
                )}
              >
                {aRadioItem.text}
              </div>
            </div>
          </AriaRadio>
        );
      })}
    </AriaRadioGroup>
  );
};

export default Radio;
