import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from './i18n/LocaleContext';
import TestListScreen from './screens/TestListScreen';
import TestScreen from './screens/TestScreen';
import TestResultScreen from './screens/TestResultScreen';
import PinScreen from './screens/PinScreen';
import ParentPanel from './screens/ParentPanel';
import StatsListScreen from './screens/StatsListScreen';
import StatsDetailScreen from './screens/StatsDetailScreen';

export default function App() {
  return (
    <HashRouter>
      <LocaleProvider>
        <Routes>
          <Route path="/" element={<TestListScreen />} />
          <Route path="/test/:taskId" element={<TestScreen />} />
          <Route path="/test-result/:sessionId" element={<TestResultScreen />} />
          <Route path="/pin" element={<PinScreen />} />
          <Route path="/parent-panel" element={<ParentPanel />} />
          <Route path="/stats" element={<StatsListScreen />} />
          <Route path="/stats/:sessionId" element={<StatsDetailScreen />} />
        </Routes>
      </LocaleProvider>
    </HashRouter>
  );
}
