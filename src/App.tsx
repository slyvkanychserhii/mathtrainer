import { Component, type ReactNode, type ErrorInfo } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from './i18n/LocaleContext';
import { initTaskConfigs } from './data/store';
import TestListScreen from './screens/TestListScreen';
import TestScreen from './screens/TestScreen';
import TestResultScreen from './screens/TestResultScreen';
import PinScreen from './screens/PinScreen';
import ParentPanel from './screens/ParentPanel';
import StatsListScreen from './screens/StatsListScreen';
import StatsDetailScreen from './screens/StatsDetailScreen';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Что-то пошло не так</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>{this.state.error.message}</div>
          <button className="btn-primary" onClick={() => { this.setState({ error: null }); window.location.hash = '#/'; window.location.reload(); }}>
            На главную
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

initTaskConfigs();

export default function App() {
  return (
    <HashRouter>
      <LocaleProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<TestListScreen />} />
            <Route path="/test/:taskId" element={<TestScreen />} />
            <Route path="/test-result/:sessionId" element={<TestResultScreen />} />
            <Route path="/pin" element={<PinScreen />} />
            <Route path="/parent-panel" element={<ParentPanel />} />
            <Route path="/stats" element={<StatsListScreen />} />
            <Route path="/stats/:sessionId" element={<StatsDetailScreen />} />
          </Routes>
        </ErrorBoundary>
      </LocaleProvider>
    </HashRouter>
  );
}
