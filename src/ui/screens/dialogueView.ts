import type { App } from '../app';
import type { DialogueTree } from '../../data/schema';
import type { Signal } from '../../engine/effects';
import { DialogueSession } from '../../engine/dialogue';
import { COMPANION_BY_ID } from '../../data/companions';
import { h, clear, toast } from '../dom';
import { npcPortrait, charPortrait } from '../portraits';
import { player } from '../../engine/state';
import { settings } from '../../core/settings';
import { rollDie } from '../../core/dice';
import { sfx } from '../../audio/audio';
import { rollCard } from './rollCard';
import { signed } from '../../core/util';

const FLOW = new Set(['combat', 'dialogue', 'goto', 'shop', 'epilogue', 'camp']);

export function openDialogue(app: App, tree: DialogueTree, onEnd: (signals: Signal[]) => void): void {
  const s = app.state!;
  const session = new DialogueSession(s, tree);
  const layer = document.getElementById('dialogue-layer')!;
  clear(layer);
  const flow: Signal[] = [];
  const root = h('div', { class: 'dialogue panel' });
  layer.appendChild(root);
  let typing: number | null = null;

  const take = (sigs: Signal[]) => {
    const now = sigs.filter((x) => !FLOW.has(x.type));
    flow.push(...sigs.filter((x) => FLOW.has(x.type)));
    if (now.length) app.handleSignals(now);
  };
  take(session.takeEnteredSignals());

  const finish = () => {
    if (typing) clearInterval(typing);
    clear(layer);
    onEnd(flow);
  };

  const speakerPortrait = (speaker: string) => {
    if (speaker === 'player') return charPortrait(player(s), 72);
    return npcPortrait(speaker, 72);
  };

  const typeText = (el: HTMLElement, text: string) => {
    if (typing) clearInterval(typing);
    const speed = settings().textSpeed;
    if (speed === 'instant') { el.textContent = text; return; }
    const step = speed === 'fast' ? 6 : 2;
    let i = 0;
    el.textContent = '';
    el.onclick = () => { if (typing) { clearInterval(typing); typing = null; el.textContent = text; } };
    typing = window.setInterval(() => {
      i += step;
      el.textContent = text.slice(0, i);
      if (i >= text.length && typing) { clearInterval(typing); typing = null; }
    }, 16);
  };

  const render = (extra?: HTMLElement) => {
    clear(root);
    if (session.ended) { finish(); return; }
    const v = session.view();
    const textEl = h('div', { class: 'd-text' });
    const head = h('div', { class: 'd-head' },
      h('div', { class: 'd-portrait', html: speakerPortrait(v.speaker) }),
      h('div', { class: 'd-main' }, h('div', { class: 'd-speaker' }, v.speakerName, h('span', { class: 'd-title' }, tree.title ? ` — ${tree.title}` : '')), textEl));
    root.appendChild(head);
    typeText(textEl, v.text);
    if (v.interjections.length) {
      root.appendChild(h('div', { class: 'd-inter' }, v.interjections.map((ij) =>
        h('div', { class: 'ij' }, h('span', { class: 'ij-portrait', html: npcPortrait(ij.speaker, 32) }), h('div', null, h('b', null, ij.speakerName.split(' ')[0] + ': '), ij.text)))));
    }
    if (extra) root.appendChild(extra);
    const opts = h('div', { class: 'd-options' });
    if (v.canContinue || (!v.options.length)) {
      opts.appendChild(h('button', { class: 'd-opt', onclick: () => { sfx('click'); take(session.continue().signals); render(); } }, v.canContinue ? 'Continue…' : 'End conversation'));
    }
    v.options.forEach((o, i) => {
      const warn = o.objectors.length ? h('span', { class: 'warn', 'data-tip': `${o.objectors.map((id) => COMPANION_BY_ID[id].name).join(', ')} will object strongly.` }, ' ⚠') : null;
      const b = h('button', { class: `d-opt tone-${o.tone ?? 'none'} ${o.enabled ? '' : 'locked'}`, disabled: !o.enabled, 'data-tip': o.lockedReason ?? (o.checkLabel ? `Skill check: ${o.checkLabel}` : '') },
        h('span', { class: 'num' }, `${i + 1}.`),
        o.checkLabel ? h('span', { class: 'chk' }, `[${o.checkLabel}] `) : null,
        o.text, warn,
        !o.enabled && o.lockedReason ? h('span', { class: 'lockr' }, ` (${o.lockedReason})`) : null);
      b.onclick = () => choose(o.index);
      opts.appendChild(b);
    });
    root.appendChild(opts);
    if (v.decision && v.options.filter((o) => o.enabled).length > 1) {
      root.appendChild(h('div', { class: 'd-party' },
        h('button', { class: 'btn small', onclick: () => showOpinions() }, '❝ Ask the party'),
        h('button', { class: 'btn small ghost', 'data-tip': 'Everyone votes; your vote counts double and breaks ties.', onclick: () => voteFlow() }, '⚖ Let us vote')));
    }
    keyHandler = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= v.options.length) { const o = v.options[n - 1]; if (o.enabled) choose(o.index); }
      else if ((e.key === ' ' || e.key === 'Enter') && (v.canContinue || !v.options.length)) { take(session.continue().signals); render(); }
    };
  };

  let keyHandler: ((e: KeyboardEvent) => void) | null = null;
  const onKey = (e: KeyboardEvent) => { if (!document.getElementById('modal-layer')!.children.length && keyHandler && layer.contains(root)) keyHandler(e); };
  window.addEventListener('keydown', onKey);
  const origFinish = finish;
  void origFinish;

  const showOpinions = () => {
    const ops = session.opinions();
    const v = session.view();
    render(h('div', { class: 'd-opinions' }, ops.map((op) => {
      const opt = v.options.find((o) => o.index === op.optionIndex);
      return h('div', { class: 'ij' }, h('span', { class: 'ij-portrait', html: npcPortrait(`comp:${op.compId}`, 32) }),
        h('div', null, h('b', null, COMPANION_BY_ID[op.compId].name.split(' ')[0] + ': '), op.text, h('div', { class: 'muted small' }, `→ favours: "${opt?.text.slice(0, 60)}${(opt?.text.length ?? 0) > 60 ? '…' : ''}"${op.strength > 2 ? ' (strongly)' : ''}`)));
    })));
  };

  const voteFlow = () => {
    const v = session.view();
    render(h('div', { class: 'd-opinions' }, h('p', null, 'Which option do you vote for? Your companions will cast their own votes.'),
      v.options.filter((o) => o.enabled).map((o) => h('button', { class: 'd-opt', onclick: () => {
        const res = session.vote(o.index);
        sfx('click');
        const winner = v.options.find((x) => x.index === res.winner)!;
        render(h('div', { class: 'd-opinions' },
          res.ballots.map((b) => h('div', { class: 'ij' }, h('span', { class: 'ij-portrait', html: npcPortrait(`comp:${b.compId}`, 32) }), h('div', null, h('b', null, COMPANION_BY_ID[b.compId].name.split(' ')[0] + ': '), b.text))),
          h('p', null, h('b', null, `The party decides: "${winner.text.slice(0, 80)}"`), ` (votes: ${res.tally.filter((t) => t > 0).join(' / ')})`),
          h('div', { class: 'row' },
            h('button', { class: 'btn', onclick: () => choose(res.winner) }, 'Go with the vote'),
            res.winner !== o.index ? h('button', { class: 'btn ghost', 'data-tip': 'Overruling a vote may cost some respect.', onclick: () => { for (const b of res.ballots) if (b.index === res.winner) s.companions[b.compId].rel.respect -= 2; choose(o.index); } }, 'Overrule them (your call)') : null)));
      } }, o.text))));
  };

  const choose = (index: number) => {
    const node = session.node;
    const opt = node.options?.[index];
    if (!opt) return;
    if (opt.check) {
      const cands = session.candidates(index);
      const doRoll = (rollerId: string) => {
        const forced = settings().manualDice ? undefined : undefined;
        const res = session.choose(index, rollerId, forced);
        sfx('dice');
        take(res.signals);
        const card = res.roll ? rollCard(res.roll) : undefined;
        if (res.roll?.success) setTimeout(() => sfx('quest'), 300);
        render(card ? h('div', null, card, ...res.refusals.map((r) => h('div', { class: 'ij refuse' }, h('b', null, r.speakerName.split(' ')[0] + ': '), r.text))) : undefined);
      };
      const pickRoller = (after: (id: string) => void) => {
        if (opt.check!.who === 'player' || cands.length <= 1) { after(cands[0]?.char.id ?? player(s).id); return; }
        render(h('div', { class: 'd-opinions' }, h('p', null, 'Who makes the attempt?'),
          cands.map((c) => h('button', { class: 'd-opt', onclick: () => after(c.char.id) }, `${c.char.name} (${signed(c.bonus)})`)),
          volunteer(cands)));
      };
      pickRoller((id) => {
        if (settings().manualDice) {
          render(h('div', { class: 'd-opinions center' }, h('button', { class: 'btn big', onclick: () => { void rollDie; doRoll(id); } }, '🎲 Roll the d20')));
        } else doRoll(id);
      });
      return;
    }
    const res = session.choose(index);
    sfx('click');
    take(res.signals);
    render(res.refusals.length ? h('div', null, res.refusals.map((r) => h('div', { class: 'ij refuse' }, h('b', null, r.speakerName.split(' ')[0] + ': '), r.text))) : undefined);
  };

  const volunteer = (cands: { char: any; bonus: number }[]) => {
    const best = cands[0];
    if (!best || best.char.kind !== 'companion') return null;
    const def = COMPANION_BY_ID[best.char.companionId];
    if (def.traits.initiative < 0.5) return null;
    return h('div', { class: 'ij' }, h('b', null, def.name.split(' ')[0] + ': '), `"Let me handle this one."`);
  };

  const cleanup = new MutationObserver(() => { if (!layer.contains(root)) { window.removeEventListener('keydown', onKey); cleanup.disconnect(); } });
  cleanup.observe(layer, { childList: true });
  render();
  void toast;
}
