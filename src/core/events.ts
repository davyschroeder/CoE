/** Minimal typed event bus used to decouple the engine from the UI. */
type Handler = (payload: any) => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler>>();
  on(event: string, h: Handler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }
  emit(event: string, payload?: any): void {
    this.handlers.get(event)?.forEach((h) => {
      try { h(payload); } catch (e) { console.error(`Event handler for ${event} failed`, e); }
    });
  }
}

export const bus = new EventBus();
