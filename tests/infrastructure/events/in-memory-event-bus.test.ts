import { describe, it, expect, beforeEach } from "bun:test";
import { InMemoryEventBus } from "../../../src/infrastructure/events/in-memory-event-bus";
import { ManaGeneratedEvent, ManaConsumedEvent } from "../../../src/domain/events/mana-events";

describe("InMemoryEventBus", () => {
  let eventBus: InMemoryEventBus;
  let receivedEvents: any[];

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
    receivedEvents = [];
  });

  describe("イベント発行と購読", () => {
    it("イベントを発行できる", () => {
      const event = new ManaGeneratedEvent("pool-1", 5, 15, 99, Date.now());
      
      const result = eventBus.publish(event);
      
      expect(result.isSuccess).toBe(true);
    });

    it("イベントを購読できる", () => {
      const handler = (event: any) => {
        receivedEvents.push(event);
      };
      
      const result = eventBus.subscribe("ManaGenerated", handler);
      
      expect(result.isSuccess).toBe(true);
    });

    it("購読したイベントが受信される", () => {
      const handler = (event: any) => {
        receivedEvents.push(event);
      };
      
      eventBus.subscribe("ManaGenerated", handler);
      
      const event = new ManaGeneratedEvent("pool-1", 5, 15, 99, Date.now());
      eventBus.publish(event);
      
      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toBe(event);
    });

    it("複数のハンドラーが登録できる", () => {
      const handler1 = (event: any) => receivedEvents.push(`handler1: ${event.getEventType()}`);
      const handler2 = (event: any) => receivedEvents.push(`handler2: ${event.getEventType()}`);
      
      eventBus.subscribe("ManaGenerated", handler1);
      eventBus.subscribe("ManaGenerated", handler2);
      
      const event = new ManaGeneratedEvent("pool-1", 5, 15, 99, Date.now());
      eventBus.publish(event);
      
      expect(receivedEvents).toHaveLength(2);
      expect(receivedEvents).toContain("handler1: ManaGenerated");
      expect(receivedEvents).toContain("handler2: ManaGenerated");
    });
  });

  describe("イベントタイプ別処理", () => {
    it("異なるイベントタイプを区別できる", () => {
      const generatedHandler = (event: any) => receivedEvents.push(`generated: ${event.getGeneratedAmount()}`);
      const consumedHandler = (event: any) => receivedEvents.push(`consumed: ${event.getConsumedAmount()}`);
      
      eventBus.subscribe("ManaGenerated", generatedHandler);
      eventBus.subscribe("ManaConsumed", consumedHandler);
      
      const generatedEvent = new ManaGeneratedEvent("pool-1", 5, 15, 99, Date.now());
      const consumedEvent = new ManaConsumedEvent("pool-1", 10, 5, "card-play", Date.now());
      
      eventBus.publish(generatedEvent);
      eventBus.publish(consumedEvent);
      
      expect(receivedEvents).toHaveLength(2);
      expect(receivedEvents).toContain("generated: 5");
      expect(receivedEvents).toContain("consumed: 10");
    });

    it("購読していないイベントタイプは受信されない", () => {
      const handler = (event: any) => receivedEvents.push(event);
      
      eventBus.subscribe("ManaGenerated", handler);
      
      const consumedEvent = new ManaConsumedEvent("pool-1", 10, 5, "card-play", Date.now());
      eventBus.publish(consumedEvent);
      
      expect(receivedEvents).toHaveLength(0);
    });
  });

  describe("購読解除", () => {
    it("ハンドラーを購読解除できる", () => {
      const handler = (event: any) => receivedEvents.push(event);
      
      eventBus.subscribe("ManaGenerated", handler);
      const result = eventBus.unsubscribe("ManaGenerated", handler);
      
      expect(result.isSuccess).toBe(true);
      
      const event = new ManaGeneratedEvent("pool-1", 5, 15, 99, Date.now());
      eventBus.publish(event);
      
      expect(receivedEvents).toHaveLength(0);
    });

    it("存在しないハンドラーを購読解除してもエラーにならない", () => {
      const handler = (event: any) => receivedEvents.push(event);
      
      const result = eventBus.unsubscribe("ManaGenerated", handler);
      
      expect(result.isSuccess).toBe(true);
    });

    it("すべてのハンドラーを購読解除できる", () => {
      const handler1 = (event: any) => receivedEvents.push("handler1");
      const handler2 = (event: any) => receivedEvents.push("handler2");
      
      eventBus.subscribe("ManaGenerated", handler1);
      eventBus.subscribe("ManaGenerated", handler2);
      
      const result = eventBus.unsubscribeAll("ManaGenerated");
      
      expect(result.isSuccess).toBe(true);
      
      const event = new ManaGeneratedEvent("pool-1", 5, 15, 99, Date.now());
      eventBus.publish(event);
      
      expect(receivedEvents).toHaveLength(0);
    });
  });

  describe("エラーハンドリング", () => {
    it("nullのイベントを発行するとエラー", () => {
      const result = eventBus.publish(null as any);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("イベントが無効");
    });

    it("nullのハンドラーを購読するとエラー", () => {
      const result = eventBus.subscribe("ManaGenerated", null as any);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("ハンドラーが無効");
    });

    it("空のイベントタイプで購読するとエラー", () => {
      const handler = (event: any) => {};
      
      const result = eventBus.subscribe("", handler);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("イベントタイプが無効");
    });

    it("ハンドラー内でエラーが発生しても他のハンドラーは実行される", () => {
      const errorHandler = (event: any) => {
        throw new Error("テストエラー");
      };
      const normalHandler = (event: any) => {
        receivedEvents.push(event);
      };
      
      eventBus.subscribe("ManaGenerated", errorHandler);
      eventBus.subscribe("ManaGenerated", normalHandler);
      
      const event = new ManaGeneratedEvent("pool-1", 5, 15, 99, Date.now());
      const result = eventBus.publish(event);
      
      expect(result.isSuccess).toBe(true);
      expect(receivedEvents).toHaveLength(1);
    });
  });

  describe("統計情報", () => {
    it("購読者数を取得できる", () => {
      const handler1 = (event: any) => {};
      const handler2 = (event: any) => {};
      
      eventBus.subscribe("ManaGenerated", handler1);
      eventBus.subscribe("ManaGenerated", handler2);
      eventBus.subscribe("ManaConsumed", handler1);
      
      const stats = eventBus.getStatistics();
      
      expect(stats.totalSubscribers).toBe(3);
      expect(stats.eventTypes).toContain("ManaGenerated");
      expect(stats.eventTypes).toContain("ManaConsumed");
      expect(stats.subscribersByType["ManaGenerated"]).toBe(2);
      expect(stats.subscribersByType["ManaConsumed"]).toBe(1);
    });

    it("発行されたイベント数を取得できる", () => {
      const handler = (event: any) => {};
      eventBus.subscribe("ManaGenerated", handler);
      
      const event1 = new ManaGeneratedEvent("pool-1", 5, 15, 99, Date.now());
      const event2 = new ManaGeneratedEvent("pool-2", 3, 8, 50, Date.now());
      
      eventBus.publish(event1);
      eventBus.publish(event2);
      
      const stats = eventBus.getStatistics();
      
      expect(stats.totalEventsPublished).toBe(2);
      expect(stats.eventsByType["ManaGenerated"]).toBe(2);
    });
  });

  describe("パフォーマンス", () => {
    it("大量のイベントを効率的に処理できる", () => {
      const handler = (event: any) => receivedEvents.push(event);
      
      eventBus.subscribe("ManaGenerated", handler);
      
      const startTime = Date.now();
      
      // 1000個のイベントを発行
      for (let i = 0; i < 1000; i++) {
        const event = new ManaGeneratedEvent(`pool-${i}`, 1, 10, 99, Date.now());
        eventBus.publish(event);
      }
      
      const duration = Date.now() - startTime;
      
      expect(receivedEvents).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // 1秒以内
    });

    it("大量のハンドラーを効率的に処理できる", () => {
      // 100個のハンドラーを登録
      for (let i = 0; i < 100; i++) {
        const handler = (event: any) => receivedEvents.push(`handler-${i}`);
        eventBus.subscribe("ManaGenerated", handler);
      }
      
      const event = new ManaGeneratedEvent("pool-1", 5, 15, 99, Date.now());
      
      const startTime = Date.now();
      eventBus.publish(event);
      const duration = Date.now() - startTime;
      
      expect(receivedEvents).toHaveLength(100);
      expect(duration).toBeLessThan(100); // 100ms以内
    });
  });
});