import { describe, it, expect, beforeEach } from "bun:test";
import { ManaPool } from "../../../src/domain/entities/ManaPool";
import { ManaTransaction } from "../../../src/domain/value-objects/ManaTransaction";

describe("ManaPool", () => {
  let manaPool: ManaPool;

  beforeEach(() => {
    manaPool = new ManaPool("test-pool-1", 10, 99);
  });

  describe("初期化", () => {
    it("正しい初期値で作成される", () => {
      expect(manaPool.getId()).toBe("test-pool-1");
      expect(manaPool.getCurrentMana()).toBe(10);
      expect(manaPool.getMaxMana()).toBe(99);
    });

    it("初期魔力が上限を超える場合はエラー", () => {
      expect(() => new ManaPool("test", 100, 99)).toThrow("初期魔力が上限を超えています");
    });

    it("負の値の場合はエラー", () => {
      expect(() => new ManaPool("test", -1, 99)).toThrow("魔力値は0以上である必要があります");
      expect(() => new ManaPool("test", 10, -1)).toThrow("魔力上限は1以上である必要があります");
    });
  });

  describe("魔力生成", () => {
    it("魔力を正常に生成できる", () => {
      const transaction = new ManaTransaction(5, "generation", Date.now());
      const result = manaPool.generateMana(transaction);
      
      expect(result.isSuccess).toBe(true);
      expect(manaPool.getCurrentMana()).toBe(15);
    });

    it("上限を超える生成は上限でキャップされる", () => {
      const transaction = new ManaTransaction(95, "generation", Date.now());
      const result = manaPool.generateMana(transaction);
      
      expect(result.isSuccess).toBe(true);
      expect(manaPool.getCurrentMana()).toBe(99);
      expect(result.actualAmount).toBe(89); // 実際に生成された量
    });

    it("負の値での生成はエラー", () => {
      expect(() => new ManaTransaction(-1, "generation", Date.now()))
        .toThrow("取引量は0以上である必要があります");
    });
  });

  describe("魔力消費", () => {
    beforeEach(() => {
      // テスト用に魔力を50に設定
      const transaction = new ManaTransaction(40, "generation", Date.now());
      manaPool.generateMana(transaction);
    });

    it("魔力を正常に消費できる", () => {
      const transaction = new ManaTransaction(20, "consumption", Date.now());
      const result = manaPool.consumeMana(transaction);
      
      expect(result.isSuccess).toBe(true);
      expect(manaPool.getCurrentMana()).toBe(30);
    });

    it("不足している場合は消費できない", () => {
      const transaction = new ManaTransaction(60, "consumption", Date.now());
      const result = manaPool.consumeMana(transaction);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("魔力が不足しています");
      expect(manaPool.getCurrentMana()).toBe(50); // 変更されない
    });

    it("負の値での消費はエラー", () => {
      expect(() => new ManaTransaction(-1, "consumption", Date.now()))
        .toThrow("取引量は0以上である必要があります");
    });
  });

  describe("魔力検証", () => {
    it("消費可能かどうかを正しく判定する", () => {
      expect(manaPool.canConsume(5)).toBe(true);
      expect(manaPool.canConsume(10)).toBe(true);
      expect(manaPool.canConsume(11)).toBe(false);
    });

    it("上限に達しているかどうかを正しく判定する", () => {
      expect(manaPool.isAtMaxCapacity()).toBe(false);
      
      // 上限まで生成
      const transaction = new ManaTransaction(89, "generation", Date.now());
      manaPool.generateMana(transaction);
      
      expect(manaPool.isAtMaxCapacity()).toBe(true);
    });
  });

  describe("状態取得", () => {
    it("魔力状態を正しく取得できる", () => {
      const status = manaPool.getStatus();
      
      expect(status.current).toBe(10);
      expect(status.max).toBe(99);
      expect(status.percentage).toBeCloseTo(10.1, 1);
      expect(status.isAtMax).toBe(false);
    });
  });
});