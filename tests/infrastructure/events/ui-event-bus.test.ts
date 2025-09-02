import { describe, it, expect, mock, beforeEach } from "bun:test";
import { UIEventBus } from "../../../src/infrastructure/events/ui-event-bus";
import { UIEventFactory } from "../../../src/domain/events/ui-events";
import { Position } from "../../../src/domain/value-objects/position";

describe("UIEventBus", () => {
  let eventBus: UIEventBus;

  beforeEach(() => {
    eventBus = new UIEventBus();
  });

  it("should create event bus", () => {
    expect(eventBus.isEnabled).toBe(true);
    expect(eventBus.getListenerCount()).toBe(0);
  });

  it("should register and emit events", () => {
    const handler = mock(() => {});
    const event = UIEventFactory.createCardSelected(0, 'test-card');

    eventBus.on('card-selected', handler);
    eventBus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it("should register once listener", () => {
    const handler = mock(() => {});
    const event1 = UIEventFactory.createCardSelected(0, 'test-card-1');
    const event2 = UIEventFactory.createCardSelected(1, 'test-card-2');

    eventBus.once('card-selected', handler);
    eventBus.emit(event1);
    eventBus.emit(event2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event1);
  });

  it("should remove event listeners", () => {
    const handler = mock(() => {});
    const event = UIEventFactory.createCardSelected(0, 'test-card');

    eventBus.on('card-selected', handler);
    eventBus.off('card-selected', handler);
    eventBus.emit(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should handle multiple listeners with priority", () => {
    const calls: number[] = [];
    const handler1 = mock(() => calls.push(1));
    const handler2 = mock(() => calls.push(2));
    const handler3 = mock(() => calls.push(3));

    eventBus.on('card-selected', handler1, 1);
    eventBus.on('card-selected', handler2, 3);
    eventBus.on('card-selected', handler3, 2);

    const event = UIEventFactory.createCardSelected(0, 'test-card');
    eventBus.emit(event);

    // 優先度順に実行される（高い順）
    expect(calls).toEqual([2, 3, 1]);
  });

  it("should disable and enable event bus", () => {
    const handler = mock(() => {});
    const event = UIEventFactory.createCardSelected(0, 'test-card');

    eventBus.on('card-selected', handler);
    eventBus.setEnabled(false);
    eventBus.emit(event);

    expect(handler).not.toHaveBeenCalled();

    eventBus.setEnabled(true);
    eventBus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it("should emit batch events", () => {
    const handler = mock(() => {});
    const events = [
      UIEventFactory.createCardSelected(0, 'card-1'),
      UIEventFactory.createCardSelected(1, 'card-2'),
      UIEventFactory.createCardSelected(2, 'card-3'),
    ];

    eventBus.on('card-selected', handler);
    eventBus.emitBatch(events);

    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("should emit delayed events", (done) => {
    const handler = mock(() => {
      expect(handler).toHaveBeenCalled();
      done();
    });
    const event = UIEventFactory.createCardSelected(0, 'test-card');

    eventBus.on('card-selected', handler);
    eventBus.emitDelayed(event, 10);

    // 即座には呼ばれない
    expect(handler).not.toHaveBeenCalled();
  });

  it("should emit conditional events", () => {
    const handler = mock(() => {});
    const event = UIEventFactory.createCardSelected(0, 'test-card');

    eventBus.on('card-selected', handler);

    // 条件がfalseの場合
    eventBus.emitIf(event, () => false);
    expect(handler).not.toHaveBeenCalled();

    // 条件がtrueの場合
    eventBus.emitIf(event, () => true);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("should track event history", () => {
    const event1 = UIEventFactory.createCardSelected(0, 'card-1');
    const event2 = UIEventFactory.createCardSelected(1, 'card-2');

    eventBus.emit(event1);
    eventBus.emit(event2);

    const history = eventBus.getEventHistory();
    expect(history).toHaveLength(2);
    expect(history[0]).toEqual(event1);
    expect(history[1]).toEqual(event2);
  });

  it("should filter event history by type", () => {
    const cardEvent = UIEventFactory.createCardSelected(0, 'card-1');
    const gameEvent = UIEventFactory.createGameStart('normal');

    eventBus.emit(cardEvent);
    eventBus.emit(gameEvent);

    const cardHistory = eventBus.getEventHistory('card-selected');
    expect(cardHistory).toHaveLength(1);
    expect(cardHistory[0]).toEqual(cardEvent);
  });

  it("should limit event history", () => {
    const event1 = UIEventFactory.createCardSelected(0, 'card-1');
    const event2 = UIEventFactory.createCardSelected(1, 'card-2');
    const event3 = UIEventFactory.createCardSelected(2, 'card-3');

    eventBus.emit(event1);
    eventBus.emit(event2);
    eventBus.emit(event3);

    const limitedHistory = eventBus.getEventHistory(undefined, 2);
    expect(limitedHistory).toHaveLength(2);
    expect(limitedHistory[0]).toEqual(event2);
    expect(limitedHistory[1]).toEqual(event3);
  });

  it("should clear event history", () => {
    const event = UIEventFactory.createCardSelected(0, 'card-1');
    eventBus.emit(event);

    expect(eventBus.getEventHistory()).toHaveLength(1);

    eventBus.clearHistory();
    expect(eventBus.getEventHistory()).toHaveLength(0);
  });

  it("should find events by predicate", () => {
    const event1 = UIEventFactory.createCardSelected(0, 'archer-card');
    const event2 = UIEventFactory.createCardSelected(1, 'mage-card');
    const event3 = UIEventFactory.createCardSelected(2, 'archer-card');

    eventBus.emit(event1);
    eventBus.emit(event2);
    eventBus.emit(event3);

    const archerEvents = eventBus.findEvents(
      (event) => event.type === 'card-selected' && (event as any).cardId === 'archer-card'
    );

    expect(archerEvents).toHaveLength(2);
    expect(archerEvents[0]).toEqual(event1);
    expect(archerEvents[1]).toEqual(event3);
  });

  it("should get last event", () => {
    const event1 = UIEventFactory.createCardSelected(0, 'card-1');
    const event2 = UIEventFactory.createGameStart('normal');

    eventBus.emit(event1);
    eventBus.emit(event2);

    const lastEvent = eventBus.getLastEvent();
    expect(lastEvent).toEqual(event2);

    const lastCardEvent = eventBus.getLastEvent('card-selected');
    expect(lastCardEvent).toEqual(event1);
  });

  it("should get listener count", () => {
    const handler1 = mock(() => {});
    const handler2 = mock(() => {});

    expect(eventBus.getListenerCount()).toBe(0);

    eventBus.on('card-selected', handler1);
    expect(eventBus.getListenerCount()).toBe(1);
    expect(eventBus.getListenerCount('card-selected')).toBe(1);

    eventBus.on('game-start', handler2);
    expect(eventBus.getListenerCount()).toBe(2);
    expect(eventBus.getListenerCount('card-selected')).toBe(1);
    expect(eventBus.getListenerCount('game-start')).toBe(1);
  });

  it("should get event types", () => {
    const handler = mock(() => {});

    eventBus.on('card-selected', handler);
    eventBus.on('game-start', handler);

    const eventTypes = eventBus.getEventTypes();
    expect(eventTypes).toContain('card-selected');
    expect(eventTypes).toContain('game-start');
    expect(eventTypes).toHaveLength(2);
  });

  it("should remove all listeners", () => {
    const handler1 = mock(() => {});
    const handler2 = mock(() => {});

    eventBus.on('card-selected', handler1);
    eventBus.on('game-start', handler2);

    expect(eventBus.getListenerCount()).toBe(2);

    eventBus.removeAllListeners('card-selected');
    expect(eventBus.getListenerCount()).toBe(1);

    eventBus.removeAllListeners();
    expect(eventBus.getListenerCount()).toBe(0);
  });

  it("should get statistics", () => {
    const handler = mock(() => {});
    eventBus.on('card-selected', handler);
    eventBus.emit(UIEventFactory.createCardSelected(0, 'card-1'));

    const stats = eventBus.getStats();
    expect(stats.totalListeners).toBe(1);
    expect(stats.eventTypes).toBe(1);
    expect(stats.historySize).toBe(1);
    expect(stats.isEnabled).toBe(true);
  });

  it("should get debug info", () => {
    const handler1 = mock(() => {});
    const handler2 = mock(() => {});

    eventBus.on('card-selected', handler1, 1);
    eventBus.on('card-selected', handler2, 3);

    const debugInfo = eventBus.getDebugInfo();
    expect(debugInfo['card-selected']).toEqual({
      count: 2,
      priorities: [3, 1],
    });
  });

  it("should handle errors in event handlers", () => {
    const errorHandler = mock(() => {
      throw new Error('Test error');
    });
    const normalHandler = mock(() => {});

    eventBus.on('card-selected', errorHandler);
    eventBus.on('card-selected', normalHandler);

    const event = UIEventFactory.createCardSelected(0, 'test-card');
    
    // エラーが投げられても他のハンドラーは実行される
    expect(() => eventBus.emit(event)).not.toThrow();
    expect(normalHandler).toHaveBeenCalled();
  });

  it("should handle complex event scenarios", () => {
    const cardHandler = mock(() => {});
    const towerHandler = mock(() => {});
    const gameHandler = mock(() => {});

    eventBus.on('card-played', cardHandler);
    eventBus.on('tower-placed', towerHandler);
    eventBus.on('game-start', gameHandler);

    const position = new Position(100, 200);
    const cardEvent = UIEventFactory.createCardPlayed('archer-card', position, 3);
    const towerEvent = UIEventFactory.createTowerPlaced('tower-1', position, 'archer-card');
    const gameEvent = UIEventFactory.createGameStart('normal');

    eventBus.emitBatch([cardEvent, towerEvent, gameEvent]);

    expect(cardHandler).toHaveBeenCalledWith(cardEvent);
    expect(towerHandler).toHaveBeenCalledWith(towerEvent);
    expect(gameHandler).toHaveBeenCalledWith(gameEvent);
  });
});