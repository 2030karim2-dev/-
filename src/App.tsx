import React from 'react';
import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes';
import FeedbackToast from './ui/base/FeedbackToast';
import { ErrorBoundary } from './core/components/ErrorBoundary';
import CommandPalette from './ui/base/CommandPalette';
import { useSystemInitialization } from './core/hooks/useSystemInitialization';
import AIChatButton from './ui/common/AIChatButton';
const App: React.FC = () => {
  // Centralized system bootstrapping (Auth, I18n, Sync, Shortcuts)
  useSystemInitialization();

  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRoutes />
        <FeedbackToast />
        <CommandPalette />
        <AIChatButton />
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;