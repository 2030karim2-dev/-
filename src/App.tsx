import React from 'react';
import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes';
import FeedbackToast from './ui/base/FeedbackToast';
import { ErrorBoundary } from './ui/base/ErrorBoundary';
import { DebugConsole } from './ui/base/DebugConsole';
import CommandPalette from './ui/base/CommandPalette';
import { useSystemInitialization } from './core/hooks/useSystemInitialization';
import AIChatButton from './ui/common/AIChatButton';
import AIPageTips from './ui/common/AIPageTips';
const App: React.FC = () => {
  // Centralized system bootstrapping (Auth, I18n, Sync, Shortcuts)
  useSystemInitialization();

  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRoutes />
        <FeedbackToast />
        <DebugConsole />
        <CommandPalette />
        <AIChatButton />
        <AIPageTips />
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;