import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors } from '../types';
import { getTaskById } from '../data/tasks';
import { getExamplesCount, getSoundEnabled, getMemoryMode, getMemorySeconds, saveSession, generateId, type ExampleResult } from '../data/store';
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

  function genUnique(prev: ExampleDef | null): ExampleDef {
    for (let attempt = 0; attempt < 50; attempt++) {
      const ex = task.generate();
      if (!prev || ex.a !== prev.a || ex.op !== prev.op || ex.b !== prev.b) return ex;
    }
    return task.generate();
  }

  const [examples, setExamples] = useState<ExampleDef[]>(() => {
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
  const [hidden, setHidden] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const memoryModeRef = useRef(false);
  const memorySecondsRef = useRef(3);

  useEffect(() => {
    const n = getExamplesCount();
    const s = getSoundEnabled();
    const mm = getMemoryMode();
    const ms = getMemorySeconds();
    configRef.current = { count: n };
    soundEnabledRef.current = s;
    memoryModeRef.current = mm;
    memorySecondsRef.current = ms;
    setShowIntro(mm);
    const newExamples: ExampleDef[] = [];
    let last: ExampleDef | null = null;
    for (let i = 0; i < n; i++) {
      const ex = genUnique(last);
      newExamples.push(ex);
      last = ex;
    }
    setExamples(newExamples);

    const base = import.meta.env.BASE_URL || '/';
    audioCorrectRef.current = new Audio(`${base}sounds/correct.wav`);
    audioWrongRef.current = new Audio(`${base}sounds/wrong.wav`);
    if (audioCorrectRef.current) audioCorrectRef.current.volume = 0.6;
    if (audioWrongRef.current) audioWrongRef.current.volume = 0.5;
  }, []);

  const startTimeRef = useRef(Date.now());
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  useEffect(() => {
    if (showIntro) return;
    setHidden(false);
    if (memoryModeRef.current && feedback === null) {
      const timer = setTimeout(() => setHidden(true), memorySecondsRef.current * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, feedback, showIntro]);

  const example = examples[currentIndex];
  if (!example) return null;

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
      setCurrentIndex(prev => prev + 1);
      setInput('');
      setFeedback(null);
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
    resultsRef.current = [...resultsRef.current, result];
    setLocked(true);
    if (isCorrect) {
      setFeedback('correct');
      if (soundEnabledRef.current && audioCorrectRef.current) {
        audioCorrectRef.current.currentTime = 0;
        audioCorrectRef.current.play();
      }
    } else {
      setFeedback('wrong');
      triggerShake();
      if (soundEnabledRef.current && audioWrongRef.current) {
        audioWrongRef.current.currentTime = 0;
        audioWrongRef.current.play();
      }
    }
    setTimeout(() => {
      setLocked(false);
      goToNext();
    }, isCorrect ? 500 : 1500);
  }, [input, locked, example, triggerShake, goToNext]);

  const handleKeyPress = useCallback((key: string) => {
    if (locked || feedback) return;
    if (key === 'del') {
      setInput(prev => prev.slice(0, -1));
    } else if (key === 'ok') {
      handleSubmit();
    } else if (/^[0-9]$/.test(key) && input.length < MAX_DIGITS) {
      setInput(prev => prev + key);
    }
  }, [locked, feedback, input, handleSubmit]);

  const progress = configRef.current.count > 0 ? (currentIndex / configRef.current.count) * 100 : 0;

  return (
    <div className="app-container">
      <div className="test-top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>{t('back')}</button>
        <span className="test-task-label">{task.name}</span>
        <span className="test-counter">{currentIndex + 1}/{configRef.current.count}</span>
      </div>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {showIntro ? (
        <div className="memory-intro">
          <div className="memory-intro-text">{t('test.memoryHint')}</div>
          <button className="memory-intro-btn" onClick={() => setShowIntro(false)}>
            {t('test.memoryStart')}
          </button>
        </div>
      ) : (
        <>
          <div className="expression-area">
            <div className={shaking ? 'shake' : ''}>
              <div className={`expression-text ${hidden ? 'expression-text-hidden' : ''}`}>{example.a} {example.op} {example.b}</div>
            </div>
            <div className="equals-text">{t('expression.equals')}</div>
          </div>

          <div className="input-area">
            <div className={`input-box ${feedback === 'correct' ? 'input-box-correct' : ''} ${feedback === 'wrong' ? 'input-box-wrong' : ''}`}>
              <span className="input-text">{input || ''}</span>
              <div className="cursor" />
            </div>
            <div className="feedback-area">
              {feedback ? (
                <div className="feedback-pop" style={{ textAlign: 'center' }}>
                  <div className={`feedback-icon ${feedback === 'correct' ? 'feedback-correct' : 'feedback-wrong'}`}>
                    {feedback === 'correct' ? t('feedback.correct') : t('feedback.wrong')}
                  </div>
                  {feedback === 'wrong' && (
                    <div className="correct-answer">{t('feedback.correctAnswer', { answer: example.answer })}</div>
                  )}
                </div>
              ) : null}
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
