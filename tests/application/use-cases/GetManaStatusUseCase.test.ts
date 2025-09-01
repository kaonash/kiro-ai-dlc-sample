import { describe, it, expect, beforeEach } from "bun:test";
import { GetManaStatusUseCase } from "../../../src/application/use-cases/GetManaStatusUseCase";
import { ManaPool } from "../../../src/domain/entities/ManaPool";
import { ManaTransaction } from "../../../src/domain/value-objects/ManaTransaction";

describe("GetManaStatusUseCase", () => {
  let useCase: GetManaStatusUseCase;
  let manaPool: ManaPool;

  beforeEach(() => {
    manaPool = new ManaPool("test-pool", 30, 99);
    useCase = new GetManaStatusUseCase();
  });

  describe("魔力状態取得", () => {
    it("基本的な魔力状態を取得できる", async () => {
      const result = await useCase.execute({ manaPool });

      expect(result.isSuccess).toBe(true);
      expect(result.status).toEqual({
        poolId: "test-pool",
        current: 30,
        max: 99,
        percentage: expect.closeTo(30.3, 1),
        isAtMax: false,
        canGenerate: true,
        availableSpace: 69
      });
    });

    it("上限に達している場合の状態", async () => {
      // 上限まで魔力を増やす
      const transaction = new ManaTransaction(69, "generation", Date.now());
      manaPool.generateMana(transaction);

      const result = await useCase.execute({ manaPool });

      expect(result.isSuccess).toBe(true);
      expect(result.status?.current).toBe(99);
      expect(result.status?.isAtMax).toBe(true);
      expect(result.status?.canGenerate).toBe(false);
      expect(result.status?.availableSpace).toBe(0);
    });

    it("魔力が0の場合の状態", async () => {
      // 魔力を全て消費
      const transaction = new ManaTransaction(30, "consumption", Date.now());
      manaPool.consumeMana(transaction);

      const result = await useCase.execute({ manaPool });

      expect(result.isSuccess).toBe(true);
      expect(result.status?.current).toBe(0);
      expect(result.status?.percentage).toBe(0);
      expect(result.status?.canGenerate).toBe(true);
      expect(result.status?.availableSpace).toBe(99);
    });
  });

  describe("拡張状態情報", () => {
    it("次回生成予定時間を含む状態を取得できる", async () => {
      const currentGameTime = 5000;
      const lastGenerationTime = 3000;

      const result = await useCase.executeWithTiming({
        manaPool,
        currentGameTime,
        lastGenerationTime
      });

      expect(result.isSuccess).toBe(true);
      expect(result.status?.nextGenerationTime).toBe(4000); // 3000 + 1000
      expect(result.status?.timeUntilNextGeneration).toBe(-1000); // 既に生成可能
      expect(result.status?.canGenerateNow).toBe(true);
    });

    it("生成までの残り時間を正しく計算する", async () => {
      const currentGameTime = 3500;
      const lastGenerationTime = 3000;

      const result = await useCase.executeWithTiming({
        manaPool,
        currentGameTime,
        lastGenerationTime
      });

      expect(result.isSuccess).toBe(true);
      expect(result.status?.timeUntilNextGeneration).toBe(500); // 4000 - 3500
      expect(result.status?.canGenerateNow).toBe(false);
    });
  });

  describe("カード使用可能性情報", () => {
    it("指定されたカードコストでの使用可能性を取得できる", async () => {
      const cardCosts = [10, 20, 30, 40];

      const result = await useCase.executeWithCardCosts({
        manaPool,
        cardCosts
      });

      expect(result.isSuccess).toBe(true);
      expect(result.cardAvailability).toEqual([
        { cost: 10, available: true, shortage: 0 },
        { cost: 20, available: true, shortage: 0 },
        { cost: 30, available: true, shortage: 0 },
        { cost: 40, available: false, shortage: 10 }
      ]);
      expect(result.availableCardCount).toBe(3);
      expect(result.greyedOutCardCount).toBe(1);
    });

    it("すべてのカードが使用可能な場合", async () => {
      const cardCosts = [5, 10, 15, 25];

      const result = await useCase.executeWithCardCosts({
        manaPool,
        cardCosts
      });

      expect(result.isSuccess).toBe(true);
      expect(result.availableCardCount).toBe(4);
      expect(result.greyedOutCardCount).toBe(0);
    });

    it("すべてのカードが使用不可能な場合", async () => {
      // 魔力を全て消費
      const transaction = new ManaTransaction(30, "consumption", Date.now());
      manaPool.consumeMana(transaction);

      const cardCosts = [10, 20, 30];

      const result = await useCase.executeWithCardCosts({
        manaPool,
        cardCosts
      });

      expect(result.isSuccess).toBe(true);
      expect(result.availableCardCount).toBe(0);
      expect(result.greyedOutCardCount).toBe(3);
    });
  });

  describe("履歴情報", () => {
    it("魔力変動履歴を含む状態を取得できる", async () => {
      // いくつかの操作を実行
      const genTransaction = new ManaTransaction(10, "generation", 1000);
      manaPool.generateMana(genTransaction);

      const consTransaction = new ManaTransaction(5, "consumption", 2000);
      manaPool.consumeMana(consTransaction);

      const result = await useCase.executeWithHistory({ manaPool });

      expect(result.isSuccess).toBe(true);
      expect(result.status?.current).toBe(35); // 30 + 10 - 5
      expect(result.recentEvents).toHaveLength(2);
      expect(result.recentEvents?.[0].eventType).toBe("ManaGenerated");
      expect(result.recentEvents?.[1].eventType).toBe("ManaConsumed");
    });
  });

  describe("パフォーマンス情報", () => {
    it("魔力効率統計を取得できる", async () => {
      const result = await useCase.executeWithPerformanceStats({
        manaPool,
        sessionDuration: 180000, // 3分
        totalCardsPlayed: 12
      });

      expect(result.isSuccess).toBe(true);
      expect(result.performanceStats?.averageManaPerMinute).toBeCloseTo(10, 1); // 30/3
      expect(result.performanceStats?.averageManaPerCard).toBeCloseTo(2.5, 1); // 30/12
      expect(result.performanceStats?.manaEfficiency).toBeCloseTo(30.3, 1); // 30/99 * 100
    });
  });

  describe("エラーハンドリング", () => {
    it("無効な魔力プールでエラー", async () => {
      const result = await useCase.execute({ manaPool: null as any });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("魔力プールが無効");
    });

    it("無効な時間情報でエラー", async () => {
      const result = await useCase.executeWithTiming({
        manaPool,
        currentGameTime: -1000,
        lastGenerationTime: 0
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("時間情報が無効");
    });

    it("無効なカードコストでエラー", async () => {
      const result = await useCase.executeWithCardCosts({
        manaPool,
        cardCosts: [-10, 5]
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("無効なカードコスト");
    });
  });
});