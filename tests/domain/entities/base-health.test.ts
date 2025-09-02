import { describe, it, expect } from "bun:test";
import { BaseHealth } from "../../../src/domain/entities/base-health.js";
import { HealthValue } from "../../../src/domain/value-objects/health-value.js";

describe("BaseHealth", () => {
  describe("初期化", () => {
    it("デフォルトの最大体力（100）で初期化される", () => {
      const baseHealth = new BaseHealth();
      
      expect(baseHealth.maxHealth).toBe(100);
      expect(baseHealth.currentHealth.value).toBe(100);
      expect(baseHealth.isDead).toBe(false);
    });

    it("カスタムの最大体力で初期化される", () => {
      const baseHealth = new BaseHealth(150);
      
      expect(baseHealth.maxHealth).toBe(150);
      expect(baseHealth.currentHealth.value).toBe(150);
      expect(baseHealth.isDead).toBe(false);
    });

    it("負の最大体力では初期化できない", () => {
      expect(() => new BaseHealth(-1)).toThrow("最大体力は1以上である必要があります");
    });

    it("0の最大体力では初期化できない", () => {
      expect(() => new BaseHealth(0)).toThrow("最大体力は1以上である必要があります");
    });
  });

  describe("ダメージ処理", () => {
    it("ダメージを受けて体力が減少する", () => {
      const baseHealth = new BaseHealth(100);
      
      baseHealth.takeDamage(30);
      
      expect(baseHealth.currentHealth.value).toBe(70);
      expect(baseHealth.isDead).toBe(false);
    });

    it("体力がゼロになると死亡状態になる", () => {
      const baseHealth = new BaseHealth(100);
      
      baseHealth.takeDamage(100);
      
      expect(baseHealth.currentHealth.value).toBe(0);
      expect(baseHealth.isDead).toBe(true);
    });

    it("体力を超えるダメージを受けても0で止まる", () => {
      const baseHealth = new BaseHealth(100);
      
      baseHealth.takeDamage(150);
      
      expect(baseHealth.currentHealth.value).toBe(0);
      expect(baseHealth.isDead).toBe(true);
    });

    it("0ダメージでは体力が変わらない", () => {
      const baseHealth = new BaseHealth(100);
      
      baseHealth.takeDamage(0);
      
      expect(baseHealth.currentHealth.value).toBe(100);
      expect(baseHealth.isDead).toBe(false);
    });

    it("負のダメージではエラー", () => {
      const baseHealth = new BaseHealth(100);
      
      expect(() => baseHealth.takeDamage(-10)).toThrow("ダメージは0以上である必要があります");
    });

    it("死亡状態でさらにダメージを受けても状態は変わらない", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(100); // 死亡
      
      baseHealth.takeDamage(50);
      
      expect(baseHealth.currentHealth.value).toBe(0);
      expect(baseHealth.isDead).toBe(true);
    });
  });

  describe("回復処理", () => {
    it("体力を回復できる", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(40); // 60まで減少
      
      baseHealth.heal(20);
      
      expect(baseHealth.currentHealth.value).toBe(80);
      expect(baseHealth.isDead).toBe(false);
    });

    it("最大体力を超えて回復はできない", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(20); // 80まで減少
      
      baseHealth.heal(30); // 110になろうとするが100で制限
      
      expect(baseHealth.currentHealth.value).toBe(100);
      expect(baseHealth.isDead).toBe(false);
    });

    it("0回復では体力が変わらない", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(30);
      
      baseHealth.heal(0);
      
      expect(baseHealth.currentHealth.value).toBe(70);
    });

    it("負の回復量ではエラー", () => {
      const baseHealth = new BaseHealth(100);
      
      expect(() => baseHealth.heal(-10)).toThrow("回復量は0以上である必要があります");
    });

    it("死亡状態から回復できる", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(100); // 死亡
      
      baseHealth.heal(50);
      
      expect(baseHealth.currentHealth.value).toBe(50);
      expect(baseHealth.isDead).toBe(false);
    });

    it("死亡状態から満タンまで回復できる", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(100); // 死亡
      
      baseHealth.heal(100);
      
      expect(baseHealth.currentHealth.value).toBe(100);
      expect(baseHealth.isDead).toBe(false);
    });
  });

  describe("リセット機能", () => {
    it("体力を初期値にリセットできる", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(60);
      
      baseHealth.reset();
      
      expect(baseHealth.currentHealth.value).toBe(100);
      expect(baseHealth.isDead).toBe(false);
    });

    it("死亡状態からリセットできる", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(100);
      
      baseHealth.reset();
      
      expect(baseHealth.currentHealth.value).toBe(100);
      expect(baseHealth.isDead).toBe(false);
    });
  });

  describe("体力割合の取得", () => {
    it("満タン時は100%", () => {
      const baseHealth = new BaseHealth(100);
      
      expect(baseHealth.getHealthPercentage()).toBe(100);
    });

    it("半分の体力時は50%", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(50);
      
      expect(baseHealth.getHealthPercentage()).toBe(50);
    });

    it("体力ゼロ時は0%", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(100);
      
      expect(baseHealth.getHealthPercentage()).toBe(0);
    });

    it("75%の体力", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(25);
      
      expect(baseHealth.getHealthPercentage()).toBe(75);
    });
  });

  describe("破壊判定", () => {
    it("体力が残っている場合は破壊されていない", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(50);
      
      expect(baseHealth.isDestroyed()).toBe(false);
    });

    it("体力がゼロの場合は破壊されている", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(100);
      
      expect(baseHealth.isDestroyed()).toBe(true);
    });

    it("isDeadとisDestroyedは同じ結果を返す", () => {
      const baseHealth = new BaseHealth(100);
      
      expect(baseHealth.isDead).toBe(baseHealth.isDestroyed());
      
      baseHealth.takeDamage(100);
      expect(baseHealth.isDead).toBe(baseHealth.isDestroyed());
    });
  });

  describe("状態判定", () => {
    it("危険な体力レベルの判定（25%以下）", () => {
      const baseHealth = new BaseHealth(100);
      
      baseHealth.takeDamage(75); // 25%
      expect(baseHealth.isDangerous()).toBe(true);
      
      baseHealth.heal(1); // 26%
      expect(baseHealth.isDangerous()).toBe(false);
    });

    it("警告レベルの体力判定（50%以下）", () => {
      const baseHealth = new BaseHealth(100);
      
      baseHealth.takeDamage(50); // 50%
      expect(baseHealth.isWarning()).toBe(true);
      
      baseHealth.heal(1); // 51%
      expect(baseHealth.isWarning()).toBe(false);
    });

    it("満タンの体力判定", () => {
      const baseHealth = new BaseHealth(100);
      
      expect(baseHealth.isFull()).toBe(true);
      
      baseHealth.takeDamage(1);
      expect(baseHealth.isFull()).toBe(false);
      
      baseHealth.heal(1);
      expect(baseHealth.isFull()).toBe(true);
    });
  });

  describe("HealthValueオブジェクトとの連携", () => {
    it("currentHealthはHealthValueインスタンス", () => {
      const baseHealth = new BaseHealth(100);
      
      expect(baseHealth.currentHealth).toBeInstanceOf(HealthValue);
    });

    it("HealthValueの機能を使用できる", () => {
      const baseHealth = new BaseHealth(100);
      baseHealth.takeDamage(25);
      
      expect(baseHealth.currentHealth.getPercentage()).toBe(75);
      expect(baseHealth.currentHealth.toStringWithMax()).toBe("75/100");
    });
  });

  describe("複数回のダメージと回復", () => {
    it("複数回のダメージを正しく処理する", () => {
      const baseHealth = new BaseHealth(100);
      
      baseHealth.takeDamage(20);
      expect(baseHealth.currentHealth.value).toBe(80);
      
      baseHealth.takeDamage(30);
      expect(baseHealth.currentHealth.value).toBe(50);
      
      baseHealth.takeDamage(10);
      expect(baseHealth.currentHealth.value).toBe(40);
    });

    it("ダメージと回復を交互に処理する", () => {
      const baseHealth = new BaseHealth(100);
      
      baseHealth.takeDamage(40); // 60
      baseHealth.heal(20); // 80
      baseHealth.takeDamage(30); // 50
      baseHealth.heal(10); // 60
      
      expect(baseHealth.currentHealth.value).toBe(60);
      expect(baseHealth.isDead).toBe(false);
    });
  });
});