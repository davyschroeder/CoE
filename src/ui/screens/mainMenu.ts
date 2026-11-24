import type { App, Screen } from '../app';
import { h, toast } from '../dom';
import { t } from '../../i18n/index';
import { latestSave } from '../../engine/save';
import { openSaveLoad } from './saveLoad';
import { openSettings } from './settingsView';
import { CreationScreen } from './creation';
import { unlockAudio, playMusic, sfx } from '../../audio/audio';

export class MainMenu implements Screen {
  el: HTMLElement;
  private raf = 0;
  private canvas: HTMLCanvasElement;

  constructor(app: App) {
    this.canvas = h('canvas', { class: 'menu-bg' });
    const latest = latestSave();
    const btn = (label: string, fn: () => void, disabled = false) =>
      h('button', { class: 'menu-btn', disabled, onclick: () => { unlockAudio(); playMusic('menu'); sfx('click'); fn(); } }, label);
    this.el = h('div', { class: 'screen main-menu' },
      this.canvas,
      h('div', { class: 'menu-center' },
        h('div', { class: 'title-block' },
          h('div', { class: 'title-small' }, 'Chronicles of'),
          h('h1', { class: 'title' }, 'AETHER'),
          h('div', { class: 'title-sub' }, t('menu.subtitle'))),
        h('div', { class: 'menu-buttons' },
          btn(t('menu.new'), () => app.setScreen(new CreationScreen(app))),
          btn(latest ? `${t('menu.continue')} — ${latest.playerName}, ${latest.location}` : t('menu.continue'), () => latest && app.load(latest.slot), !latest),
          btn(t('menu.load'), () => openSaveLoad(app, 'load')),
          btn(t('menu.settings'), () => openSettings(app)),
          btn(t('menu.credits'), () => credits()),
          btn(t('menu.fullscreen'), () => toggleFullscreen())),
        h('div', { class: 'menu-foot' }, 'Aetherfall Isometric Edition · An original fantasy RPG · Fully local play. Use F11 or Fullscreen for a wider view.')),
      h('div', { class: 'coa-menu-mark' }, h('strong', null, 'Every choice becomes legend'), 'An original fantasy adventure'));
  }

  mount(): void {
    // The painted menu replaces the original procedural backdrop.
    if (getComputedStyle(this.canvas).display === 'none') return;
    const ctx = this.canvas.getContext('2d')!;
    const lanterns = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random(), v: 0.0002 + Math.random() * 0.0005, hue: [40, 20, 200, 280][Math.floor(Math.random() * 4)], ph: Math.random() * 6 }));
    const draw = (time: number) => {
      const W = (this.canvas.width = this.canvas.clientWidth), H = (this.canvas.height = this.canvas.clientHeight);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b0d1a'); g.addColorStop(0.6, '#1b1530'); g.addColorStop(1, '#2a1a22');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // ruined cathedral silhouette
      ctx.fillStyle = '#07080f';
      const bx = W * 0.5, by = H * 0.82;
      ctx.beginPath();
      ctx.moveTo(bx - 260, by); ctx.lineTo(bx - 260, by - 120); ctx.lineTo(bx - 140, by - 190); ctx.lineTo(bx - 20, by - 120);
      ctx.lineTo(bx - 20, by - 260); ctx.lineTo(bx + 10, by - 300); ctx.lineTo(bx + 30, by - 250); ctx.lineTo(bx + 50, by - 280); ctx.lineTo(bx + 60, by - 120);
      ctx.lineTo(bx + 180, by - 170); ctx.lineTo(bx + 280, by - 110); ctx.lineTo(bx + 280, by); ctx.closePath(); ctx.fill();
      ctx.fillRect(0, by, W, H - by);
      for (const l of lanterns) {
        l.y -= l.v; if (l.y < -0.05) { l.y = 1.05; l.x = Math.random(); }
        const x = l.x * W + Math.sin(time / 2000 + l.ph) * 12, y = l.y * H;
        const r = 3 * l.s;
        const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
        gl.addColorStop(0, `hsla(${l.hue},90%,70%,0.9)`); gl.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 6, 0, Math.PI * 2); ctx.fill();
      }
      this.raf = requestAnimationFrame(draw);
    };
    this.raf = requestAnimationFrame(draw);
  }

  unmount(): void { cancelAnimationFrame(this.raf); }
}

export function toggleFullscreen(): void {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => toast('Fullscreen not available here.', 'bad'));
  else document.exitFullscreen?.();
}

function credits(): void {
  import('../dom').then(({ modal }) => modal('Credits', h('div', { class: 'prose' },
    h('p', null, h('b', null, 'Chronicles of Aether: The Shattered Veil')),
    h('p', null, 'An original fantasy role-playing game inspired by tabletop d20 play. All setting, characters and text are original.'),
    h('p', null, 'Design, writing and code: built iteratively with Claude Code for the project owner.'),
    h('p', null, 'Isometric Edition: painted character portraits and miniatures, layered isometric environments, illustrated scenery and atmospheric effects. All artwork is packaged locally. Audio is generated at runtime.'),
    h('p', null, 'Rules: an original d20 system using openly reusable tabletop mechanics (ability scores, proficiency, advantage).'))));
}
