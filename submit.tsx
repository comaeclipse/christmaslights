import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import Submit from './components/Submit';

const SubmitApp: React.FC = () => {
  return <Submit />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SubmitApp />
  </React.StrictMode>
);
