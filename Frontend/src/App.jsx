import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ErrorBoundary from './component/Common/ErrorBoundary/index.jsx';
import GlobalStyles from './component/GlobalStyles/index.jsx';
import ProtectedRoute from './component/Common/ProtectedRoute/index.jsx';
import { publicRoutes, privateRoutes } from './routes/index.jsx';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <GlobalStyles>
          <Router>
            <Routes>
              {/* Public routes */}
              {publicRoutes.map((route, index) => {
                const Page = route.component;
                let Layout = route.layout || React.Fragment;
                
                return (
                  <Route
                    key={index}
                    path={route.path}
                    element={
                      <Layout>
                        <Page />
                      </Layout>
                    }
                  />
                );
              })}

              {/* Private routes */}
              {privateRoutes.map((route, index) => {
                const Page = route.component;
                let Layout = route.layout || React.Fragment;
                
                return (
                  <Route
                    key={index}
                    path={route.path}
                    element={
                      <ProtectedRoute allowedRoles={route.allowedRoles}>
                        <Layout>
                          <Page />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                );
              })}
            </Routes>
          </Router>
        </GlobalStyles>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
