import React from 'react';
import ReactDOM from 'react-dom/client';
<<<<<<<< HEAD:Frontend/src/index.jsx
import './styles/main.scss';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals.js';
========
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
>>>>>>>> linh2:form-agent-AI-project/frontend/src/index.tsx

const root = ReactDOM.createRoot(
  document.getElementById('root')
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
