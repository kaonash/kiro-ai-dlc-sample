import { describe, it, expect, beforeEach } from "bun:test";
import { ManaValidationService } from "../../../src/domain/services/mana-validation-service";
import { ManaPool } from "../../../src/domain/entities/mana-pool";

describe("ManaValidationService", () => {
  let service: ManaValidationService;
  let manaPool: ManaPool;

  beforeEach(() => {
    service = new ManaValidationService();
    manaPool = new ManaPool("test-pool", 50, 99);
  });

  describe("魔力プール検証", () => {
    it("有効な魔力プールを検証できる", () => {
      const result = service.validateManaPool(manaPool);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("上限を超えた魔力プールを検出する", () => {
      // 直接プロパティを変更してテスト（通常は起こらないが検証のため）
      const invalidPool = new ManaPool("test", 99, 99);
      // 強制的に上限を超えさせる（テスト用）
      (invalidPool as any).currentMana = 100;
      
      const result = service.validateManaPool(invalidPool);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("現在の魔力が上限を超えています");
    });

    it("負の魔力値を検出する", () => {
      // 強制的に負の値にする（テスト用）
      (manaPool as any).currentMana = -1;
      
      const result = service.validateManaPool(manaPool);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("魔力値が負の値です");
    });
  });

  describe("カードコスト検証", () => {
    it("有効なカードコストを検証できる", () => {
      const result = service.validateCardCost(15);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("範囲外のカードコストを検出する", () => {
      const lowResult = service.validateCardCost(2);
      expect(lowResult.isValid).toBe(false);
      expect(lowResult.errors).toContain("カードコストが最小値（3）を下回っています");
      
      const highResult = service.validateCardCost(31);
      expect(highResult.isValid).toBe(false);
      expect(highResult.errors).toContain("カードコストが最大値（30）を上回っています");
    });

    it("負のカードコストを検出する", () => {
      const result = service.validateCardCost(-5);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("カードコストが負の値です");
    });

    it("小数点のカードコストを検出する", () => {
      const result = service.validateCardCost(5.5);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("カードコストは整数である必要があります");
    });
  });

  describe("魔力消費可能性検証", () => {
    it("消費可能な場合の検証", () => {
      const result = service.validateConsumption(manaPool, 30);
      
      expect(result.isValid).toBe(true);
      expect(result.canConsume).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("消費不可能な場合の検証", () => {
      const result = service.validateConsumption(manaPool, 60);
      
      expect(result.isValid).toBe(false);
      expect(result.canConsume).toBe(false);
      expect(result.shortage).toBe(10);
      expect(result.errors).toContain("魔力が不足しています（不足分: 10）");
    });

    it("無効なコストでの消費検証", () => {
      const result = service.validateConsumption(manaPool, -10);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("消費量は0以上である必要があります");
    });
  });

  describe("魔力生成可能性検証", () => {
    it("生成可能な場合の検証", () => {
      const result = service.validateGeneration(manaPool, 20);
      
      expect(result.isValid).toBe(true);
      expect(result.canGenerate).toBe(true);
      expect(result.actualAmount).toBe(20);
    });

    it("上限を超える生成の検証", () => {
      const result = service.validateGeneration(manaPool, 60);
      
      expect(result.isValid).toBe(true);
      expect(result.canGenerate).toBe(true);
      expect(result.actualAmount).toBe(49); // 上限でキャップ
      expect(result.warnings).toContain("生成量が上限でキャップされます");
    });

    it("無効な生成量の検証", () => {
      const result = service.validateGeneration(manaPool, -5);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("生成量は0以上である必要があります");
    });
  });

  describe("ゲーム時間検証", () => {
    it("有効なゲーム時間を検証できる", () => {
      const result = service.validateGameTime(5000, 3000);
      
      expect(result.isValid).toBe(true);
      expect(result.timeDifference).toBe(2000);
    });

    it("時間の逆行を検出する", () => {
      const result = service.validateGameTime(3000, 5000);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("ゲーム時間が逆行しています");
    });

    it("負のゲーム時間を検出する", () => {
      const result = service.validateGameTime(-1000, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("ゲーム時間は0以上である必要があります");
    });
  });

  describe("一時停止バグ防止検証", () => {
    it("正常な魔力生成タイミングを検証する", () => {
      const lastGenerationTime = 1000;
      const currentGameTime = 2000;
      const pauseDuration = 0; // 一時停止なし
      
      const result = service.validateGenerationTiming(
        lastGenerationTime,
        currentGameTime,
        pauseDuration
      );
      
      expect(result.isValid).toBe(true);
      expect(result.shouldGenerate).toBe(true);
      expect(result.generationCount).toBe(1);
    });

    it("一時停止による不正な生成を防止する", () => {
      const lastGenerationTime = 1000;
      const currentGameTime = 1100; // 実時間では0.1秒経過
      const pauseDuration = 900; // 0.9秒一時停止
      
      const result = service.validateGenerationTiming(
        lastGenerationTime,
        currentGameTime,
        pauseDuration
      );
      
      expect(result.isValid).toBe(true);
      expect(result.shouldGenerate).toBe(false); // ゲーム時間では0.1秒しか経過していない
      expect(result.generationCount).toBe(0);
    });

    it("長時間一時停止後の正常な生成を許可する", () => {
      const lastGenerationTime = 1000;
      const currentGameTime = 4000; // ゲーム時間で3秒経過
      const pauseDuration = 5000; // 5秒一時停止（実時間では8秒経過）
      
      const result = service.validateGenerationTiming(
        lastGenerationTime,
        currentGameTime,
        pauseDuration
      );
      
      expect(result.isValid).toBe(true);
      expect(result.shouldGenerate).toBe(true);
      expect(result.generationCount).toBe(3); // ゲーム時間ベースで3回生成
    });
  });
});