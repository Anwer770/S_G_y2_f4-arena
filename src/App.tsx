import React from 'react';
import { AppProviders } from './app/providers/AppProviders';
import { MainApp } from './app/App';

/**
 * Enterprise Application Entry Root
 * Delegates orchestration to modular app layers:
 * App -> Providers -> Router -> Layout -> Module -> Page -> Component -> Service -> Repository -> Database
 */
export const App: React.FC = () => {
  return (
    <AppProviders>
      <MainApp />
    </AppProviders>
  );
};

export default App;
