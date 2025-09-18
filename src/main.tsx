import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { ModeProvider } from './context/ModeContext';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  
  root.render(
    <BrowserRouter>
      <ThemeProvider>
        <ModeProvider>
          <AppRouter />
        </ModeProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
} else {
  console.error('Root element not found');
}