import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Deshabilitar zoom (pinch, doble tap)
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, false);

// Bloquear pinch-zoom
document.addEventListener('gesturestart', (e) => e.preventDefault(), false);
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Prevenir zoom con Ctrl+Plus, Ctrl+Minus en navegadores
window.addEventListener('wheel', (e) => {
  if (e.ctrlKey) e.preventDefault();
}, { passive: false });
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
    e.preventDefault();
  }
});

// Fijar escala en zoom accidental
document.documentElement.style.zoom = '100%';
window.addEventListener('orientationchange', () => {
  document.documentElement.style.zoom = '100%';
});