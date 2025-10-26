import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import ErrorBoundary from './component/Common/ErrorBoundary/index.jsx';
import GlobalStyles from './component/GlobalStyles/index.jsx';
import AppRoutes from './routes/index.jsx';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <GlobalStyles>
          <Router>
            <AppRoutes />
          </Router>
        </GlobalStyles>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
