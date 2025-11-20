import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import AppRoutes from './routes/index.jsx';
import GlobalStyles from './components/GlobalStyles/index.jsx';
import './styles/main.scss';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <GlobalStyles>
          <Router future={{ 
            v7_startTransition: true, 
            v7_relativeSplatPath: true 
          }}>
            <AppRoutes />
          </Router>
        </GlobalStyles>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

