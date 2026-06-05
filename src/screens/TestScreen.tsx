import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTaskById } from '../data/tasks';
import { getExamplesCount, getSoundEnabled, getMemoryMode, getMemorySeconds, getTransitionPause, saveSession, generateId, getWrongExamples, addWrongExample, removeWrongExample, type ExampleResult } from '../data/store';
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
  const audioWrongRef = useRef<HTMLAudioElement | null>(null);
  const audioReloadRef = useRef<HTMLAudioElement | null>(null);

  function genUnique(prev: ExampleDef | null): ExampleDef {
    for (let attempt = 0; attempt < 50; attempt++) {
      const ex = task.generate();
      if (!prev || ex.a !== prev.a || ex.op !== prev.op || ex.b !== prev.b) return ex;
    }
    return task.generate();
  }

  const isReview = taskId === '56';
  const [examples, setExamples] = useState<ExampleDef[]>(() => {
    if (isReview) return [];
    const initial: ExampleDef[] = [];
    let last: ExampleDef | null = null;
    for (let i = 0; i < 10; i++) {
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
  const sessionSavedRef = useRef(false);

  const savePartialSession = useCallback(() => {
    if (sessionSavedRef.current) return;
    const r = resultsRef.current;
    if (r.length === 0) return;
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
    sessionSavedRef.current = true;
  }, [taskId, task.name]);

  const handleBack = useCallback(() => {
    savePartialSession();
    navigate(-1);
  }, [savePartialSession, navigate]);

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
      sessionSavedRef.current = true;
      navigate(`/test-result/${session.id}`, { replace: true });
    } else {
      setFeedback(null);
      setInput('');
      setBouncing(false);
      setTransitioning(true);
      setTimeout(() => {
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
      setFeedback('correct');
      setBouncing(true);
      setTimeout(() => setBouncing(false), 400);
      if (soundEnabledRef.current && audioCorrectRef.current) {
        audioCorrectRef.current.currentTime = 0;
        audioCorrectRef.current.play();
      }
      if (isReview) {
        removeWrongExample({ a: example.a, op: example.op, b: example.b });
      }
    } else {
      setFeedback('wrong');
      triggerShake();
      addWrongExample(result);
      if (soundEnabledRef.current && audioWrongRef.current) {
        audioWrongRef.current.currentTime = 0;
        audioWrongRef.current.play();
      }
    }
    setTimeout(() => {
      setLocked(false);
      goToNext();
    }, isCorrect ? 500 : 1500);
  }, [input, locked, example, triggerShake, goToNext, isReview, removeWrongExample]);

  const handleKeyPress = useCallback((key: string) => {
    if (locked || feedback || transitioning) return;
    if (key === 'del') {
      setInput(prev => prev.slice(0, -1));
    } else if (key === 'ok') {
      handleSubmit();
    } else if (/^[0-9]$/.test(key) && input.length < MAX_DIGITS) {
      setInput(prev => prev + key);
    }
  }, [locked, feedback, transitioning, input, handleSubmit]);

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
      const n = getExamplesCount();
      configRef.current = { count: n };
      const newExamples: ExampleDef[] = [];
      let last: ExampleDef | null = null;
      for (let i = 0; i < n; i++) {
        const ex = genUnique(last);
        newExamples.push(ex);
        last = ex;
      }
      setExamples(newExamples);
    }

    const base = import.meta.env.BASE_URL || '/';
    audioCorrectRef.current = new Audio(`${base}sounds/correct.wav`);
    audioWrongRef.current = new Audio(`${base}sounds/wrong.wav`);
    audioCorrectRef.current.volume = 0.6;
    audioWrongRef.current.volume = 0.5;
    audioReloadRef.current = new Audio(`${base}sounds/reload.wav`);
    audioReloadRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (showIntro) return;
    if (noMistakesRef.current) return;
    if (transitioning) return;
    if (soundEnabledRef.current && audioReloadRef.current) {
      audioReloadRef.current.currentTime = 0;
      audioReloadRef.current.play();
    }
  }, [transitioning]);

  useEffect(() => {
    if (showIntro) return;
    if (noMistakesRef.current) return;
    const timer = setTimeout(() => setTransitioning(false), transitionPauseRef.current * 1000);
    return () => clearTimeout(timer);
  }, [showIntro]);

  useEffect(() => {
    return () => savePartialSession();
  }, [savePartialSession]);

  const startTimeRef = useRef(Date.now());
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  useEffect(() => {
    if (showIntro || transitioning || noMistakesRef.current) return;
    setHidden(false);
    if (memoryModeRef.current && feedback === null) {
      const timer = setTimeout(() => setHidden(true), memorySecondsRef.current * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, feedback, showIntro, transitioning]);

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
                  <div className={`expression-text ${hidden || transitioning ? 'expression-text-hidden' : ''}`}>{example.a} {example.op} {example.b}</div>
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
                  <button key="ok" className="num-key submit-key" onClick={() => handleKeyPress('ok')}>
                    {t('numpad.ok')}
                  </button>
                );
              }
              return (
                <button key={key} className="num-key" onClick={() => handleKeyPress(key)}>
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
