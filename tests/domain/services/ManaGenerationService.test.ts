import { describe, it, expect, beforeEach } from "bun:test";
import { ManaGenerationService } from "../../../src/domain/services/ManaGenerationService";
import { ManaPool } from "../../../src/domain/entities/ManaPool";

describe("ManaGenerationService", () => {
  let service: ManaGenerationService;
  let manaPool: ManaPool;

  beforeEach(() => {
    service = new ManaGenerationService();
    manaPool = new ManaPool("test-pool", 10, 99);
  });

  describe("魔力生成判定", () => {
    it("1秒経過していれば生成可能と判定する", () => {
      const lastGenerationTime = 1000;
      const currentGameTime = 2000;
      
      const result = service.shouldGenerateMana(lastGenerationTime, currentGameTime);
      expect(result.shouldGenerate).toBe(true);
      expect(result.generationCount).toBe(1);
    });

    it("複数秒経過していれば複数回生成可能と判定する", () => {
      const lastGenerationTime = 1000;
      const currentGameTime = 4500; // 3.5秒経過
      
      const result = service.shouldGenerateMana(lastGenerationTime, currentGameTime);
      expect(result.shouldGenerate).toBe(true);
      expect(result.generationCount).toBe(3); // 3回生成
    });

    it("1秒未満の場合は生成不可と判定する", () => {
      const lastGenerationTime = 1000;
      const currentGameTime = 1500; // 0.5秒経過
      
      const result = service.shouldGenerateMana(lastGenerationTime, currentGameTime);
      expect(result.shouldGenerate).toBe(false);
      expect(result.generationCount).toBe(0);
    });

    it("時間が逆行している場合は生成不可と判定する", () => {
      const lastGenerationTime = 2000;
      const currentGameTime = 1000;
      
      const result = service.shouldGenerateMana(lastGenerationTime, currentGameTime);
      expect(result.shouldGenerate).toBe(false);
      expect(result.generationCount).toBe(0);
    });

    it("ちょうど1秒の場合は生成可能と判定する", () => {
      const lastGenerationTime = 1000;
      const currentGameTime = 2000;
      
      const result = service.shouldGenerateMana(lastGenerationTime, currentGameTime);
      expect(result.shouldGenerate).toBe(true);
      expect(result.generationCount).toBe(1);
    });
  });

  describe("魔力生成実行", () => {
    it("正常に魔力を生成できる", () => {
      const currentGameTime = 5000;
      const result = service.generateMana(manaPool, 1, currentGameTime);
      
      expect(result.isSuccess).toBe(true);
      expect(result.generatedAmount).toBe(1);
      expect(manaPool.getCurrentMana()).toBe(11);
    });

    it("複数ポイントの魔力を生成できる", () => {
      const currentGameTime = 5000;
      const result = service.generateMana(manaPool, 5, currentGameTime);
      
      expect(result.isSuccess).toBe(true);
      expect(result.generatedAmount).toBe(5);
      expect(manaPool.getCurrentMana()).toBe(15);
    });

    it("上限を超える場合は上限でキャップされる", async () => {
      // 魔力を95まで増やす
      const { ManaTransaction } = await import("../../../src/domain/value-objects/ManaTransaction");
      const transaction = new ManaTransaction(85, "generation", 1000);
      manaPool.generateMana(transaction);
      
      const currentGameTime = 5000;
      const result = service.generateMana(manaPool, 10, currentGameTime);
      
      expect(result.isSuccess).toBe(true);
      expect(result.generatedAmount).toBe(4); // 実際に生成された量
      expect(manaPool.getCurrentMana()).toBe(99);
    });

    it("0ポイントの生成は何もしない", () => {
      const currentGameTime = 5000;
      const result = service.generateMana(manaPool, 0, currentGameTime);
      
      expect(result.isSuccess).toBe(true);
      expect(result.generatedAmount).toBe(0);
      expect(manaPool.getCurrentMana()).toBe(10);
    });

    it("負の値での生成はエラー", () => {
      const currentGameTime = 5000;
      const result = service.generateMana(manaPool, -1, currentGameTime);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("生成量は0以上である必要があります");
    });
  });

  describe("次回生成時間計算", () => {
    it("正しい次回生成時間を計算する", () => {
      const lastGenerationTime = 1000;
      const generationCount = 3;
      
      const nextTime = service.calculateNextGenerationTime(lastGenerationTime, generationCount);
      expect(nextTime).toBe(4000); // 1000 + (3 * 1000)
    });

    it("生成回数が0の場合は元の時間を返す", () => {
      const lastGenerationTime = 1000;
      const generationCount = 0;
      
      const nextTime = service.calculateNextGenerationTime(lastGenerationTime, generationCount);
      expect(nextTime).toBe(1000);
    });
  });

  describe("生成レート設定", () => {
    it("デフォルトの生成レートは1秒1ポイント", () => {
      expect(service.getGenerationRate()).toBe(1000); // 1000ms = 1秒
    });

    it("生成レートを変更できる", () => {
      service.setGenerationRate(500); // 0.5秒1ポイント
      expect(service.getGenerationRate()).toBe(500);
    });

    it("無効な生成レートはエラー", () => {
      expect(() => service.setGenerationRate(0)).toThrow("生成レートは正の値である必要があります");
      expect(() => service.setGenerationRate(-100)).toThrow("生成レートは正の値である必要があります");
    });
  });
});