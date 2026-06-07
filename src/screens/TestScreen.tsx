import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTaskById } from '../data/tasks';
import { getExamplesCount, getSoundEnabled, getMemoryMode, getMemorySeconds, getTransitionPause, saveSession, generateId, getWrongExamples, addWrongExample, removeWrongExample, getKeypadSoundEnabled, getKeypadSoundVolume, type ExampleResult } from '../data/store';
import { useLocale } from '../i18n/LocaleContext';

interface ExampleDef {
  a: number;
  op: string;
  b: number;
  answer: number;
}

const MAX_DIGITS = 4;

export default function TestScreen() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const task = getTaskById(Number(taskId))!;
  const configRef = useRef<{ count: number }>({ count: 10 });
  const resultsRef = useRef<ExampleResult[]>([]);
  const soundEnabledRef = useRef(true);
  const audioCorrectRef = useRef<HTMLAudioElement | null>(null);
  const audioReloadRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wrongBufferRef = useRef<AudioBuffer | null>(null);
  const clickBufferRef = useRef<AudioBuffer | null>(null);
  const audioClickRef = useRef<HTMLAudioElement | null>(null);
  const keypadSoundEnabledRef = useRef(true);
  const keypadSoundVolumeRef = useRef(0.3);

  function genUnique(prev: ExampleDef | null): ExampleDef {
    for (let attempt = 0; attempt < 50; attempt++) {
      const ex = task.generate();
      if (ex && (!prev || ex.a !== prev.a || ex.op !== prev.op || ex.b !== prev.b)) return ex;
    }
    return task.generate() || { a: 1, op: '+', b: 1, answer: 2 };
  }

  const isReview = taskId === '56';
  const [examples, setExamples] = useState<ExampleDef[]>(() => {
    if (isReview) return [];
    const n = getExamplesCount();
    const initial: ExampleDef[] = [];
    let last: ExampleDef | null = null;
    for (let i = 0; i < n; i++) {
      const ex = genUnique(last);
      initial.push(ex);
      last = ex;
    }
    return initial;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [locked, setLocked] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [transitioning, setTransitioning] = useState(() => isReview ? true : !getMemoryMode());
  const [hidden, setHidden] = useState(false);
  const [showIntro, setShowIntro] = useState(() => isReview ? false : getMemoryMode());
  const [noMistakes, setNoMistakes] = useState(false);
  const memoryModeRef = useRef(false);
  const memorySecondsRef = useRef(1);
  const transitionPauseRef = useRef(1);
  const noMistakesRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (memoryModeRef.current && feedback === null) {
      hideTimerRef.current = setTimeout(() => setHidden(true), memorySecondsRef.current * 1000);
    }
  }, [feedback]);

  const handleReveal = useCallback(() => {
    setHidden(false);
    startHideTimer();
  }, [startHideTimer]);

  const handleBack = useCallback(() => {
    if (resultsRef.current.length > 0 && !window.confirm(t('test.confirmExit'))) return;
    navigate(-1);
  }, [navigate, t]);

  const example = examples[currentIndex];

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 250);
  }, []);

  const goToNext = useCallback(() => {
    const r = resultsRef.current;
    if (currentIndex + 1 >= configRef.current.count) {
      const correctCount = r.filter(x => x.isCorrect).length;
      const totalTime = r.reduce((s, x) => s + x.timeMs, 0);
      const session = {
        id: generateId(),
        taskId: Number(taskId),
        taskName: task.name,
        date: new Date().toISOString(),
        examples: r,
        correctCount,
        totalCount: r.length,
        totalTimeMs: totalTime,
      };
      saveSession(session);
      navigate(`/test-result/${session.id}`, { replace: true });
    } else {
      setFeedback(null);
      setInput('');
      setBouncing(false);
      setTransitioning(true);
      setTimeout(() => {
        if (soundEnabledRef.current && audioReloadRef.current) {
          audioReloadRef.current.currentTime = 0;
          audioReloadRef.current.play();
        }
        setTransitioning(false);
        setCurrentIndex(prev => prev + 1);
      }, transitionPauseRef.current * 1000);
    }
  }, [currentIndex, taskId, task.name, navigate]);

  const handleSubmit = useCallback(() => {
    if (locked || input === '') return;
    const numAnswer = parseInt(input, 10);
    if (isNaN(numAnswer)) return;
    const isCorrect = numAnswer === example.answer;
    const elapsed = Date.now() - startTimeRef.current;
    const result: ExampleResult = {
      a: example.a, op: example.op, b: example.b,
      correctAnswer: example.answer, childAnswer: numAnswer,
      isCorrect, timeMs: elapsed,
    };
    resultsRef.current.push(result);
    setLocked(true);
    if (isCorrect) {
      if (soundEnabledRef.current && audioCorrectRef.current) {
        audioCorrectRef.current.currentTime = 0;
        audioCorrectRef.current.play();
      }
      setFeedback('correct');
      setBouncing(true);
      setTimeout(() => setBouncing(false), 400);
      if (isReview) {
        removeWrongExample({ a: example.a, op: example.op, b: example.b });
      }
    } else {
      if (soundEnabledRef.current) {
        const ctx = audioCtxRef.current;
        const buf = wrongBufferRef.current;
        if (ctx && buf) {
          if (ctx.state === 'suspended') ctx.resume();
          const source = ctx.createBufferSource();
          source.buffer = buf;
          source.connect(ctx.destination);
          source.start(0);
        }
      }
      setFeedback('wrong');
      triggerShake();
      addWrongExample(result);
    }
    setTimeout(() => {
      setLocked(false);
      goToNext();
    }, isCorrect ? 500 : 1500);
  }, [input, locked, example, triggerShake, goToNext, isReview, removeWrongExample]);

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

  const handleKeyPress = useCallback((key: string) => {
    if (locked || feedback || transitioning) return;
    if (key === 'del') {
      playClick();
      setInput(prev => prev.slice(0, -1));
    } else if (key === 'ok') {
      playClick();
      handleSubmit();
    } else if (/^[0-9]$/.test(key) && input.length < MAX_DIGITS) {
      playClick();
      setInput(prev => prev + key);
    }
  }, [locked, feedback, transitioning, input, handleSubmit, playClick]);

  const progress = configRef.current.count > 0 ? (currentIndex / configRef.current.count) * 100 : 0;

  useEffect(() => {
    const s = getSoundEnabled();
    const mm = getMemoryMode();
    const ms = getMemorySeconds();
    const tp = getTransitionPause();
    soundEnabledRef.current = s;
    memoryModeRef.current = mm;
    memorySecondsRef.current = ms;
    transitionPauseRef.current = tp;
    keypadSoundEnabledRef.current = getKeypadSoundEnabled();
    keypadSoundVolumeRef.current = getKeypadSoundVolume();

    if (isReview) {
      const wrong = getWrongExamples();
      if (wrong.length === 0) {
        setNoMistakes(true);
        noMistakesRef.current = true;
        configRef.current = { count: 0 };
      } else {
        if (mm) setShowIntro(true);
        const seen = new Set<string>();
        const unique = wrong.filter(ex => {
          const key = `${ex.a}|${ex.op}|${ex.b}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const count = Math.min(getExamplesCount(), unique.length);
        const shuffled = [...unique];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        shuffled.length = Math.min(shuffled.length, count);
        setExamples(shuffled.map(ex => ({ a: ex.a, op: ex.op, b: ex.b, answer: ex.correctAnswer })));
        configRef.current = { count };
      }
    } else {
      configRef.current = { count: getExamplesCount() };
    }

    const base = import.meta.env.BASE_URL || '/';
    audioCorrectRef.current = new Audio(`${base}sounds/correct.wav`);
    audioReloadRef.current = new Audio(`${base}sounds/reload.wav`);
    audioClickRef.current = new Audio(`${base}sounds/click.wav`);
    audioCorrectRef.current.volume = 0.6;
    audioReloadRef.current.volume = 0.5;
    audioClickRef.current.volume = 0.3;
    audioCorrectRef.current.load();
    audioReloadRef.current.load();

    const ac = new AbortController();
    audioCtxRef.current = new AudioContext();
    Promise.all([
      fetch(`${base}sounds/wrong.wav`, { signal: ac.signal }).then(r => r.arrayBuffer()).then(buf => audioCtxRef.current!.decodeAudioData(buf)).then(buf => { wrongBufferRef.current = buf; }),
      fetch(`${base}sounds/click.wav`, { signal: ac.signal }).then(r => r.arrayBuffer()).then(buf => audioCtxRef.current!.decodeAudioData(buf)).then(buf => { clickBufferRef.current = buf; }),
    ]).catch(() => {});

    return () => {
      ac.abort();
      audioCtxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (showIntro) return;
    if (noMistakesRef.current) return;
    const timer = setTimeout(() => {
      if (soundEnabledRef.current && audioReloadRef.current) {
        audioReloadRef.current.currentTime = 0;
        audioReloadRef.current.play();
      }
      setTransitioning(false);
    }, transitionPauseRef.current * 1000);
    return () => clearTimeout(timer);
  }, [showIntro]);

  useEffect(() => {
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, []);

  const startTimeRef = useRef(Date.now());
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  useEffect(() => {
    if (showIntro || transitioning || noMistakesRef.current) return;
    setHidden(false);
    startHideTimer();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [currentIndex, feedback, showIntro, transitioning, startHideTimer]);

  if (noMistakes) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={handleBack}>{t('back')}</button>
          <span className="page-header-title">{t('test.title')}</span>
        </div>
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-text">{t('mistakes.empty')}</div>
        </div>
      </div>
    );
  }

  if (!example) return null;

  return (
    <div className="app-container">
      <div className="page-header">
        <button className="back-btn" onClick={handleBack}>{t('back')}</button>
        <span className="page-header-title">{t('test.title')}</span>
      </div>

      {showIntro ? (
        <div className="memory-intro">
          <div className="memory-intro-text">{t('test.memoryHint')}</div>
          <button className="memory-intro-btn" onClick={() => {
            setShowIntro(false);
            setTransitioning(true);
          }}>
            {t('test.memoryStart')}
          </button>
        </div>
      ) : (
        <>
          <div className="test-task-name">{task.name}</div>

          <div className="progress-row">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="test-counter">{currentIndex + 1}/{configRef.current.count}</span>
          </div>

          <div className="test-body">
              <div className="expression-area">
                <div className={shaking ? 'shake' : bouncing ? 'drop-bounce' : ''}>
                  {hidden && memoryModeRef.current ? (
                    <div className="expression-memory-icon" onClick={handleReveal}>🫣</div>
                  ) : (
                    <div className={`expression-text ${transitioning ? 'expression-text-hidden' : ''}`}>{example.a} {example.op} {example.b}</div>
                  )}
                </div>
              </div>

              <div className="equals-text">{t('expression.equals')}</div>

              <div className="input-area">
                <div className={`input-box ${feedback === 'correct' ? 'input-box-correct' : ''} ${feedback === 'wrong' ? 'input-box-wrong' : ''}`}>
                  <span className="input-text">{input || '\u00A0'}</span>
                  <div className="cursor" />
                </div>
                <div className="feedback-area">
                  <div className="feedback-pop" style={{ textAlign: 'center' }}>
                    {feedback ? (
                      <>
                        <div className={`feedback-icon ${feedback === 'correct' ? 'feedback-correct' : 'feedback-wrong'}`}>
                          {feedback === 'correct' ? t('feedback.correct') : t('feedback.wrong')}
                        </div>
                        {feedback === 'wrong' && (
                          <div className="correct-answer">{t('feedback.correctAnswer', { answer: example.answer })}</div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
          </div>

          <div className="numpad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'del', 'ok'].map(key => {
              if (key === 'ok') {
                return (
                  <button key="ok" className="num-key submit-key" onPointerDown={() => handleKeyPress('ok')}>
                    {t('numpad.ok')}
                  </button>
                );
              }
              return (
                <button key={key} className="num-key" onPointerDown={() => handleKeyPress(key)}>
                  {key === 'del' ? t('numpad.delete') : key}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
