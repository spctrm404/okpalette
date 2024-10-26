import { FigmaMessage, FigmaDocumentColorSpace } from '../types/figmaTypes';
import { Matrix, XY } from '../types/commonTypes';
import { Hues, PaletteParam } from '../types/paletteTypes';
import {
  LIGHTNESS_STEP,
  CHROMA_STEP,
  HUE_STEP,
  DISP_P3_CHROMA_LIMIT,
} from '../constants';
import { quantize } from '../utils/numberUtils';
import { createApcaMatrix, createPalette } from '../utils/colourUtils';
import {
  useCallback,
  useContext,
  useEffect,
  useState,
  useReducer,
  useRef,
  useLayoutEffect,
  useId,
} from 'react';
import { ThemeContext } from './contexts/ThemeContext';
import Button from './components/Button/Button';
import IconButton from './components/IconButton/IconButton';
import NumberField from './components/NumberField/NumberField';
import Radio from './components/Radio/Radio';
import RadioButton from './components/RadioButton/RadioButton';
import Slider from './components/Slider/Slider';
import Switch from './components/Switch/Switch';
import ToggleButton from './components/ToggleButton/ToggleButton';
import WebGl from './components/WebGl/WebGl';
import XYSlider from './components/XYSlider/XYSlider';
import st from './_App.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type State = {
  isHueRanged: boolean;
  showDetail: boolean;
  createApcaTable: boolean;
} & PaletteParam;

type Action =
  | {
      type: 'setNumber';
      payload: {
        field: keyof Omit<
          State,
          'isHueRanged' | 'showDetail' | 'createApcaTable' | 'hues'
        >;
        value: number;
      };
    }
  | {
      type: 'setNumbers';
      payload: Array<{
        field: keyof Omit<
          State,
          'isHueRanged' | 'showDetail' | 'createApcaTable' | 'hues'
        >;
        value: number;
      }>;
    }
  | {
      type: 'toggleBoolean';
      payload: keyof Pick<
        State,
        'isHueRanged' | 'showDetail' | 'createApcaTable'
      >;
    }
  | {
      type: 'setBoolean';
      payload: {
        field: keyof Pick<
          State,
          'isHueRanged' | 'showDetail' | 'createApcaTable'
        >;
        value: boolean;
      };
    }
  | {
      type: 'setHues';
      payload: Hues;
    }
  | {
      type: 'setHue';
      payload: {
        field: keyof Hues;
        value: number;
      };
    };

function App() {
  const { setHues } = useContext(ThemeContext);

  const radioItemsRef = useRef([
    { uid: 'radioItemsRef_1', value: '1', text: '1' },
    { uid: 'radioItemsRef_2', value: '2', text: '2' },
    { uid: 'radioItemsRef_5', value: '5', text: '5' },
    { uid: 'radioItemsRef_10', value: '10', text: '10' },
  ]);

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case 'setNumber':
        return {
          ...state,
          [action.payload.field]: action.payload.value,
        };
      case 'setNumbers':
        return action.payload.reduce(
          (acc, { field, value }) => ({ ...acc, [field]: value }),
          state
        );
      case 'toggleBoolean':
        return {
          ...state,
          [action.payload]: !state[action.payload],
        };
      case 'setBoolean':
        return {
          ...state,
          [action.payload.field]: action.payload.value,
        };
      case 'setHues':
        return {
          ...state,
          hues: action.payload,
        };
      case 'setHue':
        return {
          ...state,
          hues: {
            ...state.hues,
            [action.payload.field]: action.payload.value,
          },
        };

      default:
        throw new Error('Unknown action type');
    }
  };

  const initialState: State = {
    swatchStep: 10,
    peakLightness: 0.5,
    peakChroma: 0.11,
    isHueRanged: false,
    hues: { from: 0, to: 0 },
    showDetail: true,
    createApcaTable: true,
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const [documentColorSpace, setDocumentColorSpace] =
    useState<FigmaDocumentColorSpace>('LEGACY');

  const sendMsg = () => {
    console.log('state', state);
    const palette = createPalette(state);
    if (state.createApcaTable) {
      const apcaMatrix = createApcaMatrix(palette, documentColorSpace);
      parent.postMessage(
        {
          pluginMessage: {
            type: 'create-apca-matrix',
            data: { apcaMatrix: apcaMatrix },
          } as FigmaMessage,
        },
        '*'
      );
    } else {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'create-palette',
            data: { palette: palette },
          } as FigmaMessage,
        },
        '*'
      );
    }
  };

  const onChangeLightnessAndChromaHandler = useCallback(({ x, y }: XY) => {
    dispatch({
      type: 'setNumbers',
      payload: [
        { field: 'peakLightness', value: x },
        { field: 'peakChroma', value: y },
      ],
    });
  }, []);
  const onChangeLightnessHandler = useCallback((newNumber: number) => {
    dispatch({
      type: 'setNumber',
      payload: { field: 'peakLightness', value: newNumber },
    });
  }, []);
  const onChangeChromaHandler = useCallback((newNumber: number) => {
    dispatch({
      type: 'setNumber',
      payload: { field: 'peakChroma', value: newNumber },
    });
  }, []);
  const onChangeHueRangedHandler = useCallback((newBoolean: boolean) => {
    dispatch({
      type: 'setBoolean',
      payload: { field: 'isHueRanged', value: newBoolean },
    });
  }, []);
  const onChangeHueFromHandler = useCallback((newNumber: number) => {
    dispatch({
      type: 'setHue',
      payload: {
        field: 'from',
        value: newNumber,
      },
    });
  }, []);
  const onChangeHueToHandler = useCallback((newNumber: number) => {
    dispatch({
      type: 'setHue',
      payload: {
        field: 'to',
        value: newNumber,
      },
    });
  }, []);
  const onChangeSwatchStepHandler = useCallback((newString: string) => {
    dispatch({
      type: 'setNumber',
      payload: { field: 'swatchStep', value: parseInt(newString) },
    });
  }, []);

  useLayoutEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const { type, data } = event.data.pluginMessage;

      if (type === 'colorSpace') {
        setDocumentColorSpace(data.colorSpace);
      } else if (type === 'size') {
        const root = document.documentElement;
        root.style.setProperty('--width', `${data.width}`);
        root.style.setProperty('--height', `${data.height}`);
        root.style.setProperty('--px', `${data.px}`);
      }
    };
    window.addEventListener('message', messageHandler);

    return () => window.removeEventListener('message', messageHandler);
  }, []);
  useLayoutEffect(() => {
    if (!state.isHueRanged)
      dispatch({
        type: 'setHue',
        payload: {
          field: 'to',
          value: state.hues.from,
        },
      });
  }, [state.isHueRanged, state.hues.from]);
  useLayoutEffect(() => {
    setHues?.(state.hues);
  }, [state.hues]);

  const hueRangedId = useId();
  const hueFromId = useId();
  const hueToId = useId();
  const lcId = useId();
  const lId = useId();
  const cId = useId();
  const stepId = useId();

  return (
    <>
      <RadioButton
        aria-labelledby={stepId}
        radioItems={radioItemsRef.current}
        value={`${state.swatchStep}`}
        onChange={onChangeSwatchStepHandler}
      />
      <Button
        buttontype="filled"
        label="Create"
        materialIcon="menu"
        onPress={sendMsg}
      />
      <IconButton buttontype="filled" materialIcon="add" onPress={sendMsg} />
      <NumberField
        label="22"
        value={state.hues.from}
        minValue={0}
        maxValue={360}
        step={HUE_STEP}
        onChange={onChangeHueFromHandler}
        formatOptions={{
          minimumIntegerDigits: 3,
        }}
      />
      <NumberField
        label="He"
        value={state.hues.to}
        minValue={0}
        maxValue={360}
        step={HUE_STEP}
        onChange={onChangeHueToHandler}
        noButton={true}
        isDisabled={!state.isHueRanged}
        formatOptions={{
          minimumIntegerDigits: 3,
        }}
      />
      <Slider
        aria-labelledby={hueRangedId}
        thumbPos="bottom"
        value={state.hues.from}
        minValue={0}
        maxValue={360}
        step={HUE_STEP}
        onChange={onChangeHueFromHandler}
        onChangeEnd={onChangeHueFromHandler}
      />
      <Slider
        aria-labelledby={hueRangedId}
        thumbPos="right"
        value={state.hues.to}
        minValue={0}
        maxValue={360}
        step={HUE_STEP}
        onChange={onChangeHueToHandler}
        onChangeEnd={onChangeHueToHandler}
        orientation={'vertical'}
        isDisabled={!state.isHueRanged}
      />
      <Switch
        aria-labelledby={hueRangedId}
        isSelected={state.isHueRanged}
        onChange={onChangeHueRangedHandler}
      />
      <ToggleButton
        aria-labelledby={hueRangedId}
        isSelected={state.isHueRanged}
        materialIcon="toggle_off"
        materialIconAlt="toggle_on"
        onChange={onChangeHueRangedHandler}
      />
      <XYSlider
        aria-labelledby={lcId}
        minValue={{ x: 0, y: 0 }}
        maxValue={{ x: 1, y: DISP_P3_CHROMA_LIMIT }}
        step={{ x: LIGHTNESS_STEP, y: CHROMA_STEP }}
        value={{
          x: state.peakLightness,
          y: state.peakChroma,
        }}
        onChangeEnd={onChangeLightnessAndChromaHandler}
        onChange={onChangeLightnessAndChromaHandler}
      />
      <NumberField
        label="L"
        value={state.peakLightness}
        minValue={0}
        maxValue={1}
        step={LIGHTNESS_STEP}
        onChange={onChangeLightnessHandler}
        noButton={true}
        formatOptions={{
          minimumIntegerDigits: 1,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }}
      />
      <NumberField
        label="C"
        value={state.peakChroma}
        minValue={0}
        maxValue={DISP_P3_CHROMA_LIMIT}
        step={CHROMA_STEP}
        onChange={onChangeChromaHandler}
        noButton={true}
        formatOptions={{
          minimumIntegerDigits: 1,
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }}
      />
    </>
    // <>
    //   <div className={cx('section', 'doc-color')}>
    //     <div className={cx('label', 'doc-color__label')}>
    //       Document's Color Space:
    //     </div>
    //     <div className={cx('value', 'doc-color__value')}>
    //       {documentColorSpace == 'DISPLAY_P3' && 'Display P3'}
    //       {documentColorSpace == 'SRGB' && 'sRGB'}
    //       {documentColorSpace == 'LEGACY' && 'Legacy'}
    //     </div>
    //   </div>
    //   <div className={cx('divider')}></div>
    //   <div className={cx('section', 'h')}>
    //     <div className={cx('section-label', 'h__section-label')}>Hue</div>
    //     <div className={cx('part', 'h__part', 'h__part--switch')}>
    //       <div className={cx('label', 'h__label')} id={hueRangedId}>
    //         Ranged:
    //       </div>
    //       <Switch
    //         aria-labelledby={hueRangedId}
    //         className={cx('h__switch')}
    //         isSelected={state.isHueRanged}
    //         onChange={onChangeHueRangedHandler}
    //       />
    //     </div>
    //     <div className={cx('part', 'h__part', 'h__part--slider')}>
    //       <Slider
    //         aria-labelledby={hueFromId}
    //         className={cx('h__slider', 'h__slider--from')}
    //         value={state.hues.from}
    //         minValue={0}
    //         maxValue={360}
    //         step={HUE_STEP}
    //         onChange={onChangeHueFromHandler}
    //         onChangeEnd={onChangeHueFromHandler}
    //       />
    //       <Slider
    //         aria-labelledby={hueToId}
    //         className={cx('h__slider', 'h__slider--to')}
    //         isDisabled={!state.isHueRanged}
    //         value={state.hues.to}
    //         minValue={0}
    //         maxValue={360}
    //         step={HUE_STEP}
    //         onChange={onChangeHueToHandler}
    //         onChangeEnd={onChangeHueToHandler}
    //       />
    //       <div className={cx('h__gamut')}></div>
    //     </div>
    //     <div
    //       className={cx(
    //         'part--number-field',
    //         'part',
    //         'h__part',
    //         'h__part--number-field'
    //       )}
    //     >
    //       <div className={cx('number-field-group', 'h__number-field-group')}>
    //         <div className={cx('label', 'h__label')} id={hueFromId}>
    //           From:
    //         </div>
    //         <NumberField
    //           aria-labelledby={hueFromId}
    //           className={cx('h__number-field', 'h__number-field--from')}
    //           value={state.hues.from}
    //           minValue={0}
    //           maxValue={360}
    //           step={HUE_STEP}
    //           onChange={onChangeHueFromHandler}
    //           noButton={true}
    //         />
    //       </div>
    //       <div className={cx('number-field-group', 'h__number-field-group')}>
    //         <div className={cx('label', 'h__label')} id={hueToId}>
    //           To:
    //         </div>
    //         <NumberField
    //           aria-labelledby={hueToId}
    //           className={cx('h__number-field', 'h__number-field--to')}
    //           isDisabled={!state.isHueRanged}
    //           value={state.hues.to}
    //           minValue={0}
    //           maxValue={360}
    //           step={HUE_STEP}
    //           onChange={onChangeHueToHandler}
    //           noButton={true}
    //         />
    //       </div>
    //     </div>
    //   </div>
    //   <div className={cx('divider')}></div>
    //   <div className={cx('section', 'l-c')}>
    //     <div className={cx('section-label', 'l-c__section-label')} id={lcId}>
    //       Lightness & Chroma
    //     </div>
    //     <div className={cx('part', 'l-c__part', 'l-c__part--xy-slider')}>
    //       <WebGl
    //         className={cx('l-c__gamut')}
    //         documentColorSpace={documentColorSpace}
    //         peakLightness={state.peakLightness}
    //         peakChroma={state.peakLightness}
    //         hues={state.hues}
    //       />
    //       <XYSlider
    //         aria-labelledby={lcId}
    //         className={cx('l-c__xy-slider')}
    //         minValue={{ x: 0, y: 0 }}
    //         maxValue={{ x: 1, y: DISP_P3_CHROMA_LIMIT }}
    //         step={{ x: LIGHTNESS_STEP, y: CHROMA_STEP }}
    //         value={{
    //           x: state.peakLightness,
    //           y: state.peakChroma,
    //         }}
    //         onChangeEnd={onChangeLightnessAndChromaHandler}
    //         onChange={onChangeLightnessAndChromaHandler}
    //       />
    //     </div>
    //     <div
    //       className={cx(
    //         'part--number-field',
    //         'part',
    //         'l-c__part',
    //         'l-c__part--number-field'
    //       )}
    //     >
    //       <div className={cx('number-field-group', 'l__number-field-group')}>
    //         <div className={cx('label', 'l__label')} id={lId}>
    //           Lightness:
    //         </div>
    //         <NumberField
    //           aria-labelledby={lId}
    //           className={cx('l-c__number-field', 'l-c__number-field--l')}
    //           value={state.peakLightness}
    //           minValue={0}
    //           maxValue={1}
    //           step={LIGHTNESS_STEP}
    //           onChange={onChangeLightnessHandler}
    //           noButton={true}
    //         />
    //       </div>
    //       <div className={cx('number-field-group', 'l__number-field-group')}>
    //         <div className={cx('label', 'l__label')} id={cId}>
    //           Chroma:
    //         </div>
    //         <NumberField
    //           aria-labelledby={cId}
    //           className={cx('l-c__number-field', 'l-c__number-field--c')}
    //           value={state.peakChroma}
    //           minValue={0}
    //           maxValue={DISP_P3_CHROMA_LIMIT}
    //           step={CHROMA_STEP}
    //           onChange={onChangeChromaHandler}
    //           noButton={true}
    //         />
    //       </div>
    //     </div>
    //   </div>
    //   <div className={cx('divider')}></div>
    //   <div className={cx('section', 'input')}>
    //     <div
    //       className={cx('section-label', 'input__section-label')}
    //       // id={stepId}
    //     >
    //       RGB to okLCh
    //     </div>
    //     <div className={cx('part', 'input__part')}>
    //       <div className={cx('input__swatch')}></div>
    //       <NumberField
    //         // aria-labelledby={cId}
    //         className={cx('input__number-field', 'input__number-field--r')}
    //         value={0}
    //         minValue={0}
    //         maxValue={255}
    //         step={1}
    //         onChange={() => {}}
    //         noButton={true}
    //       />
    //       <NumberField
    //         // aria-labelledby={cId}
    //         className={cx('input__number-field', 'input__number-field--g')}
    //         value={0}
    //         minValue={0}
    //         maxValue={255}
    //         step={1}
    //         onChange={() => {}}
    //         noButton={true}
    //       />
    //       <NumberField
    //         // aria-labelledby={cId}
    //         className={cx('input__number-field', 'input__number-field--b')}
    //         value={0}
    //         minValue={0}
    //         maxValue={255}
    //         step={1}
    //         onChange={() => {}}
    //         noButton={true}
    //       />
    //     </div>
    //   </div>
    //   <div className={cx('divider')}></div>
    //   <div className={cx('section', 'step')}>
    //     <div className={cx('section-label', 'step__section-label')} id={stepId}>
    //       Swatch Step
    //     </div>
    //     <div className={cx('part', 'step__part')}>
    //       <Radio
    //         aria-labelledby={stepId}
    //         className={cx('step__radio')}
    //         radioItems={radioItemsRef.current}
    //         value={`${state.swatchStep}`}
    //         onChange={onChangeSwatchStepHandler}
    //         orientation="horizontal"
    //       />
    //     </div>
    //   </div>
    //   <div className={cx('divider')}></div>
    //   <div className={cx('section', 'button')}>
    //     <div className={cx('part', 'button__part')}>
    //       {/* <IconButton
    //         className={cx('button__option')}
    //         buttontype="tonal"
    //         materialIcon="settings"
    //         onPress={() => {}}
    //       /> */}
    //       <Button
    //         className={cx('button__create')}
    //         buttontype="filled"
    //         text="Create"
    //         onPress={sendMsg}
    //       />
    //     </div>
    //   </div>
    // </>
  );
}

export default App;
