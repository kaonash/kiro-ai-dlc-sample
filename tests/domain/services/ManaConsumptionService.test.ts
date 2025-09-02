import { describe, it, expect, beforeEach } from "bun:test";
import { ManaConsumptionService } from "../../../src/domain/services/mana-consumption-service";
import { ManaPool } from "../../../src/domain/entities/mana-pool";
import { ManaTransaction } from "../../../src/domain/value-objects/mana-transaction";

describe("ManaConsumptionService", () => {
  let service: ManaConsumptionService;
  let manaPool: ManaPool;

  beforeEach(() => {
    service = new ManaConsumptionService();
    // 魔力を50に設定
    manaPool = new ManaPool("test-pool", 10, 99);
    const transaction = new ManaTransaction(40, "generation", Date.now());
    manaPool.generateMana(transaction);
  });

  describe("魔力消費可能性チェック", () => {
    it("十分な魔力がある場合は消費可能", () => {
      const result = service.canConsumeMana(manaPool, 30);
      expect(result.canConsume).toBe(true);
      expect(result.currentMana).toBe(50);
      expect(result.requiredMana).toBe(30);
    });

    it("魔力が不足している場合は消費不可", () => {
      const result = service.canConsumeMana(manaPool, 60);
      expect(result.canConsume).toBe(false);
      expect(result.currentMana).toBe(50);
      expect(result.requiredMana).toBe(60);
      expect(result.shortage).toBe(10);
    });

    it("ちょうど同じ魔力の場合は消費可能", () => {
      const result = service.canConsumeMana(manaPool, 50);
      expect(result.canConsume).toBe(true);
      expect(result.shortage).toBeUndefined();
    });

    it("0ポイント消費は常に可能", () => {
      const result = service.canConsumeMana(manaPool, 0);
      expect(result.canConsume).toBe(true);
    });

    it("負の値での消費チェックはエラー", () => {
      expect(() => service.canConsumeMana(manaPool, -1))
        .toThrow("消費量は0以上である必要があります");
    });
  });

  describe("魔力消費実行", () => {
    it("正常に魔力を消費できる", () => {
      const currentTime = Date.now();
      const result = service.consumeMana(manaPool, 20, "card-play", currentTime);
      
      expect(result.isSuccess).toBe(true);
      expect(result.consumedAmount).toBe(20);
      expect(result.remainingMana).toBe(30);
      expect(manaPool.getCurrentMana()).toBe(30);
    });

    it("魔力不足の場合は消費できない", () => {
      const currentTime = Date.now();
      const result = service.consumeMana(manaPool, 60, "card-play", currentTime);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("魔力が不足しています");
      expect(manaPool.getCurrentMana()).toBe(50); // 変更されない
    });

    it("0ポイント消費は何もしない", () => {
      const currentTime = Date.now();
      const result = service.consumeMana(manaPool, 0, "test", currentTime);
      
      expect(result.isSuccess).toBe(true);
      expect(result.consumedAmount).toBe(0);
      expect(manaPool.getCurrentMana()).toBe(50);
    });

    it("負の値での消費はエラー", () => {
      const currentTime = Date.now();
      expect(() => service.consumeMana(manaPool, -1, "test", currentTime))
        .toThrow("消費量は0以上である必要があります");
    });
  });

  describe("複数カード消費シミュレーション", () => {
    it("複数のカードコストを一度にチェックできる", () => {
      const cardCosts = [10, 15, 20, 30];
      const result = service.simulateMultipleConsumption(manaPool, cardCosts);
      
      expect(result.totalCost).toBe(75);
      expect(result.canConsumeAll).toBe(false);
      expect(result.maxAffordableCards).toBe(3); // 10 + 15 + 20 = 45 <= 50
      expect(result.affordableCards).toEqual([10, 15, 20]);
    });

    it("すべてのカードが消費可能な場合", () => {
      const cardCosts = [10, 15, 20];
      const result = service.simulateMultipleConsumption(manaPool, cardCosts);
      
      expect(result.totalCost).toBe(45);
      expect(result.canConsumeAll).toBe(true);
      expect(result.maxAffordableCards).toBe(3);
      expect(result.affordableCards).toEqual([10, 15, 20]);
    });

    it("空の配列の場合", () => {
      const cardCosts: number[] = [];
      const result = service.simulateMultipleConsumption(manaPool, cardCosts);
      
      expect(result.totalCost).toBe(0);
      expect(result.canConsumeAll).toBe(true);
      expect(result.maxAffordableCards).toBe(0);
      expect(result.affordableCards).toEqual([]);
    });
  });

  describe("消費履歴管理", () => {
    it("消費履歴を記録できる", () => {
      const currentTime = Date.now();
      service.consumeMana(manaPool, 20, "card-attack", currentTime);
      service.consumeMana(manaPool, 10, "card-defense", currentTime + 1000);
      
      const history = service.getConsumptionHistory(manaPool.getId());
      expect(history).toHaveLength(2);
      expect(history[0].amount).toBe(20);
      expect(history[0].reason).toBe("card-attack");
      expect(history[1].amount).toBe(10);
      expect(history[1].reason).toBe("card-defense");
    });

    it("履歴をクリアできる", () => {
      const currentTime = Date.now();
      service.consumeMana(manaPool, 20, "test", currentTime);
      
      service.clearConsumptionHistory(manaPool.getId());
      const history = service.getConsumptionHistory(manaPool.getId());
      expect(history).toHaveLength(0);
    });
  });
});