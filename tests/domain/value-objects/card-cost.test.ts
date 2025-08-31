import { describe, expect, it } from "bun:test";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";

describe("CardCost", () => {
  describe("正常なケース", () => {
    it("有効なコスト値で作成できる", () => {
      const cost = new CardCost(3);
      expect(cost.value).toBe(3);
    });

    it("最小コスト（1）で作成できる", () => {
      const cost = new CardCost(1);
      expect(cost.value).toBe(1);
    });

    it("最大コスト（10）で作成できる", () => {
      const cost = new CardCost(10);
      expect(cost.value).toBe(10);
    });
  });

  describe("異常なケース", () => {
    it("0以下のコストでエラーが発生する", () => {
      expect(() => new CardCost(0)).toThrow("カードコストは1以上である必要があります");
      expect(() => new CardCost(-1)).toThrow("カードコストは1以上である必要があります");
    });

    it("10を超えるコストでエラーが発生する", () => {
      expect(() => new CardCost(11)).toThrow("カードコストは10以下である必要があります");
    });

    it("整数以外でエラーが発生する", () => {
      expect(() => new CardCost(3.5)).toThrow("カードコストは整数である必要があります");
    });
  });

  describe("等価性", () => {
    it("同じコスト値のオブジェクトは等価である", () => {
      const cost1 = new CardCost(5);
      const cost2 = new CardCost(5);
      expect(cost1.equals(cost2)).toBe(true);
    });

    it("異なるコスト値のオブジェクトは等価でない", () => {
      const cost1 = new CardCost(3);
      const cost2 = new CardCost(5);
      expect(cost1.equals(cost2)).toBe(false);
    });
  });

  describe("比較", () => {
    it("コストの大小比較ができる", () => {
      const cost1 = new CardCost(3);
      const cost2 = new CardCost(5);

      expect(cost1.isLessThan(cost2)).toBe(true);
      expect(cost2.isLessThan(cost1)).toBe(false);
      expect(cost1.isLessThan(cost1)).toBe(false);
    });

    it("コストの以下比較ができる", () => {
      const cost1 = new CardCost(3);
      const cost2 = new CardCost(5);
      const cost3 = new CardCost(3);

      expect(cost1.isLessThanOrEqual(cost2)).toBe(true);
      expect(cost2.isLessThanOrEqual(cost1)).toBe(false);
      expect(cost1.isLessThanOrEqual(cost3)).toBe(true);
    });
  });
});
