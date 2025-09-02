import { describe, it, expect, beforeEach } from "bun:test";
import { ConsumeManaUseCase } from "../../../src/application/use-cases/consume-mana-use-case";
import { ManaPool } from "../../../src/domain/entities/mana-pool";
import { ManaTransaction } from "../../../src/domain/value-objects/mana-transaction";

describe("ConsumeManaUseCase", () => {
  let useCase: ConsumeManaUseCase;
  let manaPool: ManaPool;

  beforeEach(() => {
    // 魔力を50に設定
    manaPool = new ManaPool("test-pool", 10, 99);
    const transaction = new ManaTransaction(40, "generation", Date.now());
    manaPool.generateMana(transaction);
    
    useCase = new ConsumeManaUseCase();
  });

  describe("魔力消費", () => {
    it("正常に魔力を消費できる", async () => {
      const result = await useCase.execute({
        manaPool,
        amount: 20,
        reason: "card-play",
        cardId: "card-001"
      });

      expect(result.isSuccess).toBe(true);
      expect(result.consumedAmount).toBe(20);
      expect(result.remainingMana).toBe(30);
      expect(result.cardId).toBe("card-001");
      expect(manaPool.getCurrentMana()).toBe(30);
    });

    it("魔力不足の場合は消費できない", async () => {
      // まず30消費して残り20にする
      const result1 = await useCase.execute({
        manaPool,
        amount: 30,
        reason: "card-play",
        cardId: "card1"
      });
      expect(result1.isSuccess).toBe(true);
      expect(manaPool.getCurrentMana()).toBe(20);
      
      // 残り20で30を消費しようとする
      const result2 = await useCase.execute({
        manaPool,
        amount: 30,
        reason: "card-play", 
        cardId: "expensive-card"
      });

      expect(result2.isSuccess).toBe(false);
      expect(result2.error).toContain("魔力が不足");
      expect(result2.shortage).toBe(10); // 30 - 20 = 10不足
      expect(manaPool.getCurrentMana()).toBe(20); // 変更されない
    });

    it("0ポイント消費は何もしない", async () => {
      const result = await useCase.execute({
        manaPool,
        amount: 0,
        reason: "test",
        cardId: "free-card"
      });

      expect(result.isSuccess).toBe(true);
      expect(result.consumedAmount).toBe(0);
      expect(manaPool.getCurrentMana()).toBe(50);
    });

    it("ちょうど全魔力を消費できる", async () => {
      const result = await useCase.execute({
        manaPool,
        amount: 30, // 有効なカードコスト範囲内
        reason: "ultimate-card",
        cardId: "ultimate"
      });

      expect(result.isSuccess).toBe(true);
      expect(result.consumedAmount).toBe(30);
      expect(result.remainingMana).toBe(20);
      expect(manaPool.getCurrentMana()).toBe(20);
    });
  });

  describe("カードコスト検証", () => {
    it("有効なカードコスト範囲内で消費できる", async () => {
      // 最小コスト
      const minResult = await useCase.execute({
        manaPool,
        amount: 3,
        reason: "card-play",
        cardId: "min-cost-card"
      });
      expect(minResult.isSuccess).toBe(true);

      // 最大コスト
      const maxResult = await useCase.execute({
        manaPool,
        amount: 30,
        reason: "card-play",
        cardId: "max-cost-card"
      });
      expect(maxResult.isSuccess).toBe(true);
    });

    it("無効なカードコストでエラー", async () => {
      // 範囲外（小）
      const lowResult = await useCase.execute({
        manaPool,
        amount: 2,
        reason: "card-play",
        cardId: "invalid-low"
      });
      expect(lowResult.isSuccess).toBe(false);
      expect(lowResult.error).toContain("カードコストが無効");

      // 範囲外（大）
      const highResult = await useCase.execute({
        manaPool,
        amount: 31,
        reason: "card-play",
        cardId: "invalid-high"
      });
      expect(highResult.isSuccess).toBe(false);
      expect(highResult.error).toContain("カードコストが無効");
    });
  });

  describe("複数カード消費シミュレーション", () => {
    it("複数のカードコストを事前チェックできる", async () => {
      const result = await useCase.simulateMultipleConsumption({
        manaPool,
        cardCosts: [10, 15, 20, 30]
      });

      expect(result.isSuccess).toBe(true);
      expect(result.totalCost).toBe(75);
      expect(result.canConsumeAll).toBe(false);
      expect(result.maxAffordableCards).toBe(3);
      expect(result.affordableCards).toEqual([10, 15, 20]);
    });

    it("すべてのカードが消費可能な場合", async () => {
      const result = await useCase.simulateMultipleConsumption({
        manaPool,
        cardCosts: [10, 15, 20]
      });

      expect(result.isSuccess).toBe(true);
      expect(result.canConsumeAll).toBe(true);
      expect(result.maxAffordableCards).toBe(3);
    });
  });

  describe("UI連携情報", () => {
    it("カードグレーアウト情報を提供する", async () => {
      const result = await useCase.getCardAvailability({
        manaPool,
        cardCosts: [10, 30, 60]
      });

      expect(result.availableCards).toEqual([
        { cost: 10, available: true },
        { cost: 30, available: true },
        { cost: 60, available: false }
      ]);
      expect(result.greyedOutCards).toEqual([60]);
    });

    it("魔力不足時のメッセージを生成する", async () => {
      // まず30消費して残り20にする
      await useCase.execute({
        manaPool,
        amount: 30,
        reason: "card-play",
        cardId: "card1"
      });

      // 残り20で30を消費しようとする
      const result = await useCase.execute({
        manaPool,
        amount: 30,
        reason: "card-play",
        cardId: "expensive-card"
      });

      expect(result.isSuccess).toBe(false);
      expect(result.userMessage).toContain("魔力が10ポイント不足しています");
    });
  });

  describe("エラーハンドリング", () => {
    it("無効な魔力プールでエラー", async () => {
      const result = await useCase.execute({
        manaPool: null as any,
        amount: 10,
        reason: "test",
        cardId: "test"
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("魔力プールが無効");
    });

    it("負の消費量でエラー", async () => {
      const result = await useCase.execute({
        manaPool,
        amount: -10,
        reason: "test",
        cardId: "test"
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("消費量は0以上");
    });

    it("空のカードIDでエラー", async () => {
      const result = await useCase.execute({
        manaPool,
        amount: 10,
        reason: "test",
        cardId: ""
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("カードIDが無効");
    });

    it("空の理由でエラー", async () => {
      const result = await useCase.execute({
        manaPool,
        amount: 10,
        reason: "",
        cardId: "test"
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("消費理由が無効");
    });
  });
});