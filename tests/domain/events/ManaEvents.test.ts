import { describe, it, expect } from "bun:test";
import { 
  ManaGeneratedEvent, 
  ManaConsumedEvent, 
  ManaCapReachedEvent 
} from "../../../src/domain/events/ManaEvents";

describe("ManaEvents", () => {
  describe("ManaGeneratedEvent", () => {
    it("正しい値で作成される", () => {
      const timestamp = Date.now();
      const event = new ManaGeneratedEvent("pool-1", 5, 15, 99, timestamp);
      
      expect(event.getPoolId()).toBe("pool-1");
      expect(event.getGeneratedAmount()).toBe(5);
      expect(event.getCurrentMana()).toBe(15);
      expect(event.getMaxMana()).toBe(99);
      expect(event.getTimestamp()).toBe(timestamp);
      expect(event.getEventType()).toBe("ManaGenerated");
    });

    it("負の値はエラー", () => {
      expect(() => new ManaGeneratedEvent("pool-1", -1, 15, 99, Date.now()))
        .toThrow("生成量は0以上である必要があります");
    });
  });

  describe("ManaConsumedEvent", () => {
    it("正しい値で作成される", () => {
      const timestamp = Date.now();
      const event = new ManaConsumedEvent("pool-1", 10, 5, "card-attack", timestamp);
      
      expect(event.getPoolId()).toBe("pool-1");
      expect(event.getConsumedAmount()).toBe(10);
      expect(event.getRemainingMana()).toBe(5);
      expect(event.getReason()).toBe("card-attack");
      expect(event.getTimestamp()).toBe(timestamp);
      expect(event.getEventType()).toBe("ManaConsumed");
    });

    it("負の値はエラー", () => {
      expect(() => new ManaConsumedEvent("pool-1", -1, 5, "test", Date.now()))
        .toThrow("消費量は0以上である必要があります");
    });
  });

  describe("ManaCapReachedEvent", () => {
    it("正しい値で作成される", () => {
      const timestamp = Date.now();
      const event = new ManaCapReachedEvent("pool-1", 99, timestamp);
      
      expect(event.getPoolId()).toBe("pool-1");
      expect(event.getMaxMana()).toBe(99);
      expect(event.getTimestamp()).toBe(timestamp);
      expect(event.getEventType()).toBe("ManaCapReached");
    });

    it("負の値はエラー", () => {
      expect(() => new ManaCapReachedEvent("pool-1", -1, Date.now()))
        .toThrow("最大魔力は1以上である必要があります");
    });
  });

  describe("イベント等価性", () => {
    it("同じ値のイベントは等しい", () => {
      const timestamp = Date.now();
      const event1 = new ManaGeneratedEvent("pool-1", 5, 15, 99, timestamp);
      const event2 = new ManaGeneratedEvent("pool-1", 5, 15, 99, timestamp);
      
      expect(event1.equals(event2)).toBe(true);
    });

    it("異なる値のイベントは等しくない", () => {
      const timestamp = Date.now();
      const event1 = new ManaGeneratedEvent("pool-1", 5, 15, 99, timestamp);
      const event2 = new ManaGeneratedEvent("pool-1", 10, 15, 99, timestamp);
      
      expect(event1.equals(event2)).toBe(false);
    });
  });
});