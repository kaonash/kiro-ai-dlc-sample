import { describe, it, expect } from "bun:test";
import { HealthValue } from "../../../src/domain/value-objects/health-value.js";

describe("HealthValue", () => {
  describe("作成", () => {
    it("有効な体力値で作成できる", () => {
      const health = new HealthValue(100);
      expect(health.value).toBe(100);
    });

    it("0で作成できる", () => {
      const health = new HealthValue(0);
      expect(health.value).toBe(0);
    });

    it("負の値では作成できない", () => {
      expect(() => new HealthValue(-1)).toThrow("体力値は0以上である必要があります");
    });

    it("小数点を含む値は整数に丸められる", () => {
      const health = new HealthValue(75.8);
      expect(health.value).toBe(75);
    });

    it("最大値を超える値では作成できない", () => {
      expect(() => new HealthValue(101, 100)).toThrow("体力値は最大値を超えることはできません");
    });

    it("最大値と同じ値で作成できる", () => {
      const health = new HealthValue(100, 100);
      expect(health.value).toBe(100);
    });
  });

  describe("ダメージ処理", () => {
    it("ダメージを適用した新しいインスタンスを返す", () => {
      const health = new HealthValue(100);
      const newHealth = health.subtract(30);
      
      expect(newHealth.value).toBe(70);
      expect(health.value).toBe(100); // 元のオブジェクトは変更されない
    });

    it("ダメージが体力を超える場合は0になる", () => {
      const health = new HealthValue(50);
      const newHealth = health.subtract(80);
      
      expect(newHealth.value).toBe(0);
    });

    it("0ダメージでは値が変わらない", () => {
      const health = new HealthValue(100);
      const newHealth = health.subtract(0);
      
      expect(newHealth.value).toBe(100);
    });

    it("負のダメージではエラー", () => {
      const health = new HealthValue(100);
      expect(() => health.subtract(-10)).toThrow("ダメージは0以上である必要があります");
    });
  });

  describe("回復処理", () => {
    it("回復を適用した新しいインスタンスを返す", () => {
      const health = new HealthValue(70, 100);
      const newHealth = health.add(20);
      
      expect(newHealth.value).toBe(90);
      expect(health.value).toBe(70); // 元のオブジェクトは変更されない
    });

    it("回復が最大値を超える場合は最大値になる", () => {
      const health = new HealthValue(80, 100);
      const newHealth = health.add(30);
      
      expect(newHealth.value).toBe(100);
    });

    it("0回復では値が変わらない", () => {
      const health = new HealthValue(70, 100);
      const newHealth = health.add(0);
      
      expect(newHealth.value).toBe(70);
    });

    it("負の回復値ではエラー", () => {
      const health = new HealthValue(70, 100);
      expect(() => health.add(-10)).toThrow("回復量は0以上である必要があります");
    });

    it("最大値が設定されていない場合は無制限に回復", () => {
      const health = new HealthValue(70);
      const newHealth = health.add(50);
      
      expect(newHealth.value).toBe(120);
    });
  });

  describe("状態判定", () => {
    it("体力がゼロかどうかの判定", () => {
      const zeroHealth = new HealthValue(0);
      const nonZeroHealth = new HealthValue(1);
      
      expect(zeroHealth.isZero()).toBe(true);
      expect(nonZeroHealth.isZero()).toBe(false);
    });

    it("体力が満タンかどうかの判定", () => {
      const fullHealth = new HealthValue(100, 100);
      const partialHealth = new HealthValue(99, 100);
      const noMaxHealth = new HealthValue(100);
      
      expect(fullHealth.isFull()).toBe(true);
      expect(partialHealth.isFull()).toBe(false);
      expect(noMaxHealth.isFull()).toBe(false); // 最大値が設定されていない場合はfalse
    });

    it("危険な体力レベルかどうかの判定（25%以下）", () => {
      const dangerousHealth = new HealthValue(25, 100);
      const safeHealth = new HealthValue(26, 100);
      const criticalHealth = new HealthValue(10, 100);
      
      expect(dangerousHealth.isDangerous()).toBe(true);
      expect(safeHealth.isDangerous()).toBe(false);
      expect(criticalHealth.isDangerous()).toBe(true);
    });

    it("警告レベルの体力かどうかの判定（50%以下）", () => {
      const warningHealth = new HealthValue(50, 100);
      const safeHealth = new HealthValue(51, 100);
      const dangerousHealth = new HealthValue(25, 100);
      
      expect(warningHealth.isWarning()).toBe(true);
      expect(safeHealth.isWarning()).toBe(false);
      expect(dangerousHealth.isWarning()).toBe(true);
    });
  });

  describe("パーセンテージ計算", () => {
    it("最大値に対する体力の割合を計算", () => {
      const health = new HealthValue(75, 100);
      expect(health.getPercentage()).toBe(75);
    });

    it("最大値が設定されていない場合は100%を返す", () => {
      const health = new HealthValue(75);
      expect(health.getPercentage()).toBe(100);
    });

    it("体力が0の場合は0%を返す", () => {
      const health = new HealthValue(0, 100);
      expect(health.getPercentage()).toBe(0);
    });

    it("体力が最大値と同じ場合は100%を返す", () => {
      const health = new HealthValue(100, 100);
      expect(health.getPercentage()).toBe(100);
    });
  });

  describe("等価性と比較", () => {
    it("等価性の判定", () => {
      const health1 = new HealthValue(75, 100);
      const health2 = new HealthValue(75, 100);
      const health3 = new HealthValue(50, 100);
      
      expect(health1.equals(health2)).toBe(true);
      expect(health1.equals(health3)).toBe(false);
    });

    it("大小比較", () => {
      const health1 = new HealthValue(50);
      const health2 = new HealthValue(75);
      const health3 = new HealthValue(50);
      
      expect(health1.isGreaterThan(health2)).toBe(false);
      expect(health2.isGreaterThan(health1)).toBe(true);
      expect(health1.isGreaterThan(health3)).toBe(false);
    });
  });

  describe("文字列表現", () => {
    it("数値を文字列として表現", () => {
      const health = new HealthValue(75);
      expect(health.toString()).toBe("75");
    });

    it("最大値付きの表現", () => {
      const health = new HealthValue(75, 100);
      expect(health.toStringWithMax()).toBe("75/100");
    });

    it("最大値が設定されていない場合の表現", () => {
      const health = new HealthValue(75);
      expect(health.toStringWithMax()).toBe("75");
    });
  });

  describe("体力バーの表現", () => {
    it("体力バーの文字列表現を生成", () => {
      const health = new HealthValue(75, 100);
      const bar = health.toHealthBar(10);
      
      // 75%なので10文字中7.5文字分が満タン（7文字）
      expect(bar).toBe("███████░░░");
    });

    it("体力が満タンの場合", () => {
      const health = new HealthValue(100, 100);
      const bar = health.toHealthBar(5);
      
      expect(bar).toBe("█████");
    });

    it("体力が0の場合", () => {
      const health = new HealthValue(0, 100);
      const bar = health.toHealthBar(5);
      
      expect(bar).toBe("░░░░░");
    });

    it("最大値が設定されていない場合は満タン表示", () => {
      const health = new HealthValue(50);
      const bar = health.toHealthBar(5);
      
      expect(bar).toBe("█████");
    });
  });
});