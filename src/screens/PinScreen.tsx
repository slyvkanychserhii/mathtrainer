import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { setPin, hasPin, checkPin, getKeypadSoundEnabled, getKeypadSoundVolume } from '../data/store';
import { useLocale } from '../i18n/LocaleContext';

export default function PinScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'set' | 'confirm' | 'enter' | null>(null);
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPinState] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const { t } = useLocale();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const clickBufferRef = useRef<AudioBuffer | null>(null);
  const audioClickRef = useRef<HTMLAudioElement | null>(null);
  const keypadSoundEnabledRef = useRef(true);
  const keypadSoundVolumeRef = useRef(0.3);

  useEffect(() => {
    setMode(hasPin() ? 'enter' : 'set');
    keypadSoundEnabledRef.current = getKeypadSoundEnabled();
    keypadSoundVolumeRef.current = getKeypadSoundVolume();

    const base = import.meta.env.BASE_URL || '/';
    audioClickRef.current = new Audio(`${base}sounds/click.wav`);
    audioClickRef.current.volume = 0.3;
    audioClickRef.current.load();

    const ac = new AbortController();
    audioCtxRef.current = new AudioContext();
    fetch(`${base}sounds/click.wav`, { signal: ac.signal })
      .then(r => r.arrayBuffer())
      .then(buf => audioCtxRef.current!.decodeAudioData(buf))
      .then(buf => { clickBufferRef.current = buf; })
      .catch(() => {});

    return () => {
      ac.abort();
      audioCtxRef.current?.close();
    };
  }, []);

  const playClick = useCallback(() => {
    if (!keypadSoundEnabledRef.current) return;
    const ctx = audioCtxRef.current;
    const buf = clickBufferRef.current;
    const vol = keypadSoundVolumeRef.current;
    if (ctx && buf) {
      if (ctx.state === 'suspended') ctx.resume();
      const gain = ctx.createGain();
      gain.gain.value = vol;
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
    } else if (audioClickRef.current) {
      audioClickRef.current.volume = vol;
      audioClickRef.current.currentTime = 0;
      audioClickRef.current.play();
    }
  }, []);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 250);
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    setError('');
    if (key === 'del') {
      playClick();
      setPinState(prev => prev.slice(0, -1));
    } else if (/^[0-9]$/.test(key) && pin.length < 4) {
      playClick();
      const newPin = pin + key;
      setPinState(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          if (mode === 'set') {
            setFirstPin(newPin);
            setPinState('');
            setMode('confirm');
          } else if (mode === 'confirm') {
            if (newPin === firstPin) {
              setPin(newPin);
              navigate('/parent-panel', { replace: true });
            } else {
              setError(t('pin.error.mismatch'));
              setPinState('');
              triggerShake();
            }
          } else if (mode === 'enter') {
            if (checkPin(newPin)) {
              navigate('/parent-panel', { replace: true });
            } else {
              setError(t('pin.error.wrong'));
              setPinState('');
              triggerShake();
            }
          }
        }, 200);
      }
    }
  }, [pin, mode, firstPin, navigate, triggerShake, t]);

  const getTitle = () => {
    if (mode === 'set') return t('pin.set');
    if (mode === 'confirm') return t('pin.confirm');
    if (mode === 'enter') return t('pin.enter');
    return '';
  };

  if (!mode) return null;

  return (
    <div className="app-container">
      <button className="back-btn" onClick={() => navigate(-1)}>{t('back')}</button>

      <div className="pin-content">
        <div className="pin-title">{getTitle()}</div>

        <div className={shaking ? 'shake' : ''}>
          <div className="pin-dots">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`pin-dot ${pin.length > i ? 'pin-dot-filled' : ''}`} />
            ))}
          </div>
        </div>

        {error ? <div className="pin-error">{error}</div> : <div className="pin-error-placeholder" />}

        {mode === 'enter' && (
          <button className="pin-forgot" onClick={() => alert(`${t('pin.forgotAlertTitle')}\n${t('pin.forgotAlertMessage')}`)}>
            {t('pin.forgot')}
          </button>
        )}

        <div className="pin-numpad" style={{ marginTop: mode === 'enter' ? 0 : 44 }}>
          {[['1','2','3'],['4','5','6'],['7','8','9']].map((row, ri) => (
            <div key={ri} className="pin-numpad-row">
              {row.map(key => (
                <button key={key} className="pin-num-key" onPointerDown={() => handleKeyPress(key)}>{key}</button>
              ))}
            </div>
          ))}
          <div className="pin-numpad-row">
            <div className="pin-num-spacer" />
            <button className="pin-num-key" onPointerDown={() => handleKeyPress('0')}>0</button>
            <button className="pin-num-key" onPointerDown={() => handleKeyPress('del')}>{t('numpad.delete')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
