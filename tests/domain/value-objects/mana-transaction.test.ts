import { describe, it, expect } from "bun:test";
import { ManaTransaction } from "../../../src/domain/value-objects/mana-transaction";

describe("ManaTransaction", () => {
  describe("初期化", () => {
    it("正しい値で作成される", () => {
      const timestamp = Date.now();
      const transaction = new ManaTransaction(10, "generation", timestamp);
      
      expect(transaction.getAmount()).toBe(10);
      expect(transaction.getType()).toBe("generation");
      expect(transaction.getTimestamp()).toBe(timestamp);
    });

    it("負の値はエラー", () => {
      expect(() => new ManaTransaction(-1, "generation", Date.now()))
        .toThrow("取引量は0以上である必要があります");
    });

    it("無効なタイプはエラー", () => {
      expect(() => new ManaTransaction(10, "invalid" as any, Date.now()))
        .toThrow("無効な取引タイプです");
    });

    it("無効なタイムスタンプはエラー", () => {
      expect(() => new ManaTransaction(10, "generation", -1))
        .toThrow("タイムスタンプは正の値である必要があります");
    });
  });

  describe("等価性", () => {
    it("同じ値のトランザクションは等しい", () => {
      const timestamp = Date.now();
      const transaction1 = new ManaTransaction(10, "generation", timestamp);
      const transaction2 = new ManaTransaction(10, "generation", timestamp);
      
      expect(transaction1.equals(transaction2)).toBe(true);
    });

    it("異なる値のトランザクションは等しくない", () => {
      const timestamp = Date.now();
      const transaction1 = new ManaTransaction(10, "generation", timestamp);
      const transaction2 = new ManaTransaction(5, "generation", timestamp);
      
      expect(transaction1.equals(transaction2)).toBe(false);
    });
  });

  describe("文字列表現", () => {
    it("正しい文字列表現を返す", () => {
      const timestamp = Date.now();
      const transaction = new ManaTransaction(10, "generation", timestamp);
      
      expect(transaction.toString()).toBe(`ManaTransaction(10, generation, ${timestamp})`);
    });
  });

  describe("バリデーション", () => {
    it("生成タイプの検証", () => {
      const transaction = new ManaTransaction(10, "generation", Date.now());
      expect(transaction.isGeneration()).toBe(true);
      expect(transaction.isConsumption()).toBe(false);
    });

    it("消費タイプの検証", () => {
      const transaction = new ManaTransaction(10, "consumption", Date.now());
      expect(transaction.isGeneration()).toBe(false);
      expect(transaction.isConsumption()).toBe(true);
    });
  });
});