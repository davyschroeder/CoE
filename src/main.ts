import './styles.css';
import { App } from './ui/app';
import { installTooltips } from './ui/dom';
import { loadSettings, settings } from './core/settings';

loadSettings();
document.documentElement.style.setProperty('--font-scale', String(settings().fontScale));
installTooltips();
const app = new App(document.getElementById('app')!);
app.showMenu();
// Exposed for debugging in the browser console.
(window as any).aether = app;
window.addEventListener('beforeunload', (e) => {
  if (app.state) { e.preventDefault(); e.returnValue = ''; }
});
