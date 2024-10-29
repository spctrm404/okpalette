import { FigmaMessage, FigmaDocumentColorSpace } from '../types/figmaTypes';
import { Matrix, XY } from '../types/commonTypes';
import { Hues, PaletteParam, Constraint } from '../types/paletteTypes';
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
import Svg from './components/Svg/Svg';
import Switch from './components/Switch/Switch';
import ToggleButton from './components/ToggleButton/ToggleButton';
import WebGl from './components/WebGl/WebGl';
import XYSlider from './components/XYSlider/XYSlider';
import st from './_App.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(st);

type State = {
  isHueSynced: boolean;
  creatingApcaTable: boolean;
} & PaletteParam &
  Constraint;

type Action =
  | {
      type: 'setNumber';
      payload: {
        field: keyof Omit<State, 'isHueSynced' | 'creatingApcaTable' | 'hues'>;
        value: number;
      };
    }
  | {
      type: 'setNumbers';
      payload: Array<{
        field: keyof Omit<State, 'isHueSynced' | 'creatingApcaTable' | 'hues'>;
        value: number;
      }>;
    }
  | {
      type: 'toggleBoolean';
      payload: keyof Pick<State, 'isHueSynced' | 'creatingApcaTable'>;
    }
  | {
      type: 'setBoolean';
      payload: {
        field: keyof Pick<State, 'isHueSynced' | 'creatingApcaTable'>;
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
    isHueSynced: true,
    hues: { from: 0, to: 0 },
    creatingApcaTable: false,
    colour: {
      sRgb: { r: 255, g: 255, b: 255 },
      dispP3: { r: 1, g: 1, b: 1 },
      gamut: 'sRGB',
    },
    constraining: false,
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const [documentColorSpace, setDocumentColorSpace] =
    useState<FigmaDocumentColorSpace>('LEGACY');

  const sendMsg = () => {
    console.log('state', state);
    const palette = createPalette(state);
    if (state.creatingApcaTable) {
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
  const onChangeHueSyncedHandler = useCallback(
    (newBoolean: boolean) => {
      dispatch({
        type: 'setBoolean',
        payload: { field: 'isHueSynced', value: newBoolean },
      });
      if (newBoolean)
        dispatch({
          type: 'setHue',
          payload: {
            field: 'to',
            value: state.hues.from,
          },
        });
    },
    [state.hues.from]
  );
  const onChangeHueFromHandler = useCallback(
    (newNumber: number) => {
      dispatch({
        type: 'setHue',
        payload: {
          field: 'from',
          value: newNumber,
        },
      });
      if (state.isHueSynced)
        dispatch({
          type: 'setHue',
          payload: {
            field: 'to',
            value: newNumber,
          },
        });
    },
    [state.isHueSynced]
  );
  const onChangeHueToHandler = useCallback(
    (newNumber: number) => {
      dispatch({
        type: 'setHue',
        payload: {
          field: 'to',
          value: newNumber,
        },
      });
      if (state.isHueSynced)
        dispatch({
          type: 'setHue',
          payload: {
            field: 'from',
            value: newNumber,
          },
        });
    },
    [state.isHueSynced]
  );
  const onChangeSwatchStepHandler = useCallback((newString: string) => {
    dispatch({
      type: 'setNumber',
      payload: { field: 'swatchStep', value: parseInt(newString) },
    });
  }, []);
  const onChangeApcaOptHandler = useCallback((newBoolean: boolean) => {
    dispatch({
      type: 'setBoolean',
      payload: { field: 'creatingApcaTable', value: newBoolean },
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
  // useLayoutEffect(() => {
  //   if (!state.isHueSynced)
  //     dispatch({
  //       type: 'setHue',
  //       payload: {
  //         field: 'to',
  //         value: state.hues.from,
  //       },
  //     });
  // }, [state.isHueSynced, state.hues.from]);
  useLayoutEffect(() => {
    setHues?.(state.hues);
  }, [state.hues]);

  const hueId = useId();
  const lcId = useId();
  const stepId = useId();
  const apcaId = useId();

  return (
    <>
      <div className={cx('section', 'document-info')}>
        <div className={cx('label', 'document-info__label')}>
          Document's Color Space:
        </div>
        <div className={cx('value', 'document-info__value')}>
          {documentColorSpace == 'DISPLAY_P3' && 'Display P3'}
          {documentColorSpace == 'SRGB' && 'sRGB'}
          {documentColorSpace == 'LEGACY' && 'Legacy'}
        </div>
      </div>
      <div className={cx('section', 'hue')}>
        <div className={cx('label', 'hue__label')} id={hueId}>
          Hue
        </div>
        <div className={cx('sliders', 'hue__sliders')}>
          <div className={cx('hue__gradient')}></div>
          <Slider
            aria-labelledby={hueId}
            thumbPos="top"
            className={cx('hue__slider', 'hue__slider-from')}
            value={state.hues.from}
            minValue={0}
            maxValue={360}
            step={HUE_STEP}
            onChange={onChangeHueFromHandler}
            onChangeEnd={onChangeHueFromHandler}
          />
          <Slider
            aria-labelledby={hueId}
            thumbPos="bottom"
            className={cx('hue__slider', 'hue__slider-to')}
            value={state.hues.to}
            minValue={0}
            maxValue={360}
            step={HUE_STEP}
            onChange={onChangeHueToHandler}
            onChangeEnd={onChangeHueToHandler}
          />
        </div>
        <div className={cx('numberfields', 'hue__numberfields')}>
          <NumberField
            label="Hs"
            className={cx('hue__number-field', 'hue__number-field-from')}
            value={state.hues.from}
            minValue={0}
            maxValue={360}
            step={HUE_STEP}
            onChange={onChangeHueFromHandler}
            noButton={true}
          />
          <NumberField
            label="He"
            className={cx('hue__number-field', 'hue__number-field-to')}
            value={state.hues.to}
            minValue={0}
            maxValue={360}
            step={HUE_STEP}
            onChange={onChangeHueToHandler}
            noButton={true}
          />
          <ToggleButton
            aria-labelledby={hueId}
            buttontype="tonal"
            className={cx('hue__toggle')}
            isSelected={state.isHueSynced}
            materialIcon="link_off"
            materialIconAlt="link"
            onChange={onChangeHueSyncedHandler}
          />
        </div>
      </div>
      <div className={cx('section', 'lc')}>
        <div className={cx('label', 'lc__label')} id={lcId}>
          Lightness & Chroma
        </div>
        <div className={cx('sliders', 'lc__sliders')}>
          <WebGl
            className={cx('lc__gamut')}
            documentColorSpace={documentColorSpace}
            peakLightness={state.peakLightness}
            peakChroma={state.peakChroma}
            hues={state.hues}
            resolutionMultiplier={2}
          />
          <Svg
            className={cx('lc__svg')}
            documentColorSpace={documentColorSpace}
            peakLightness={state.peakLightness}
            peakChroma={state.peakChroma}
            hues={state.hues}
          />
          <XYSlider
            aria-labelledby={lcId}
            className={cx('lc__xy-slider')}
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
        </div>
        <div className={cx('numberfields', 'lc__numberfields')}>
          <NumberField
            label="L"
            className={cx('lc__number-field', 'lc__number-field-l')}
            value={state.peakLightness}
            minValue={0}
            maxValue={1}
            step={LIGHTNESS_STEP}
            onChange={onChangeLightnessHandler}
            noButton={true}
          />
          <NumberField
            label="C"
            className={cx('lc__number-field', 'lc__number-field-c')}
            value={state.peakChroma}
            minValue={0}
            maxValue={DISP_P3_CHROMA_LIMIT}
            step={CHROMA_STEP}
            onChange={onChangeChromaHandler}
            noButton={true}
          />
        </div>
      </div>
      <div className={cx('section', 'swatch-step')}>
        <div className={cx('label', 'swatch-step__label')} id={stepId}>
          Swatch step
        </div>
        <RadioButton
          aria-labelledby={stepId}
          buttontype="filled"
          className={cx('radio-button', 'swatch-step__radio-button')}
          radioItems={radioItemsRef.current}
          value={`${state.swatchStep}`}
          onChange={onChangeSwatchStepHandler}
        />
      </div>
      <div className={cx('section', 'apca-opt')}>
        <div className={cx('label', 'apca-opt__label')} id={apcaId}>
          Create APCA Matrix
        </div>
        <Switch
          aria-labelledby={apcaId}
          className={cx('apca-opt__switch')}
          isSelected={state.creatingApcaTable}
          onChange={onChangeApcaOptHandler}
        />
      </div>
      <div className={cx('section', 'create')}>
        <Button
          className={cx('button', 'create__button')}
          buttontype="filled"
          label="Create Palette"
          onPress={sendMsg}
        />
      </div>
      {/* <div>
        <p>swatchStep: {state.swatchStep}</p>
        <p>peakLightness: {state.peakLightness}</p>
        <p>peakChroma: {state.peakChroma}</p>
        <p>isHueSynced: {state.isHueSynced ? 'true' : 'false'}</p>
        <p>hues.from: {state.hues.from}</p>
        <p>hues.to: {state.hues.to}</p>
        <p>creatingApcaTable: {state.creatingApcaTable ? 'true' : 'false'}</p>
      </div> */}
    </>
  );
}

export default App;
