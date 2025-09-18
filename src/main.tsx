import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  
  root.render(
    <BrowserRouter>
      <ThemeProvider>
          <AppRouter />
      </ThemeProvider>
    </BrowserRouter>
  );
} else {
  console.error('Root element not found');
}