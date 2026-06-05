import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setPin, hasPin, checkPin } from '../data/store';
import { useLocale } from '../i18n/LocaleContext';

export default function PinScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'set' | 'confirm' | 'enter' | null>(null);
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPinState] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    setMode(hasPin() ? 'enter' : 'set');
  }, []);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 250);
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    setError('');
    if (key === 'del') {
      setPinState(prev => prev.slice(0, -1));
    } else if (/^[0-9]$/.test(key) && pin.length < 4) {
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
                <button key={key} className="pin-num-key" onClick={() => handleKeyPress(key)}>{key}</button>
              ))}
            </div>
          ))}
          <div className="pin-numpad-row">
            <div className="pin-num-spacer" />
            <button className="pin-num-key" onClick={() => handleKeyPress('0')}>0</button>
            <button className="pin-num-key" onClick={() => handleKeyPress('del')}>{t('numpad.delete')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
