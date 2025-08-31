import { describe, expect, it } from "bun:test";
import { JsonCardPoolRepository } from "../../../src/infrastructure/repositories/json-card-pool-repository.js";

describe("JsonCardPoolRepository", () => {
  describe("正常なケース", () => {
    it("カードプールを読み込みできる", async () => {
      const repository = new JsonCardPoolRepository();

      const cardPool = await repository.load();

      expect(cardPool.size).toBeGreaterThanOrEqual(30); // 最低30種類のカード
      expect(cardPool.isEmpty).toBe(false);
    });

    it("読み込まれたカードが有効な形式である", async () => {
      const repository = new JsonCardPoolRepository();

      const cardPool = await repository.load();
      const allCards = cardPool.getAllCards();

      expect(allCards.length).toBeGreaterThan(0);

      // 最初のカードをチェック
      const firstCard = allCards[0];
      expect(firstCard.id).toBeDefined();
      expect(firstCard.name).toBeDefined();
      expect(firstCard.description).toBeDefined();
      expect(firstCard.cost.value).toBeGreaterThan(0);
      expect(firstCard.cost.value).toBeLessThanOrEqual(10);
      expect(firstCard.towerType).toBeDefined();
      expect(firstCard.specialAbility).toBeDefined();
    });

    it("カードプールが利用可能である", async () => {
      const repository = new JsonCardPoolRepository();

      const isAvailable = await repository.isAvailable();

      expect(isAvailable).toBe(true);
    });

    it("異なるタワータイプのカードが含まれている", async () => {
      const repository = new JsonCardPoolRepository();

      const cardPool = await repository.load();
      const allCards = cardPool.getAllCards();
      const towerTypes = new Set(allCards.map((card) => card.towerType));

      expect(towerTypes.size).toBeGreaterThanOrEqual(5); // 最低5種類のタワータイプ
    });

    it("異なるコストのカードが含まれている", async () => {
      const repository = new JsonCardPoolRepository();

      const cardPool = await repository.load();
      const allCards = cardPool.getAllCards();
      const costs = new Set(allCards.map((card) => card.cost.value));

      expect(costs.size).toBeGreaterThanOrEqual(5); // 最低5種類のコスト
    });

    it("特殊能力を持つカードが含まれている", async () => {
      const repository = new JsonCardPoolRepository();

      const cardPool = await repository.load();
      const allCards = cardPool.getAllCards();
      const hasSpecialAbility = allCards.some((card) => card.specialAbility !== "NONE");

      expect(hasSpecialAbility).toBe(true);
    });

    it("カードIDが一意である", async () => {
      const repository = new JsonCardPoolRepository();

      const cardPool = await repository.load();
      const allCards = cardPool.getAllCards();
      const cardIds = allCards.map((card) => card.id);
      const uniqueIds = new Set(cardIds);

      expect(uniqueIds.size).toBe(cardIds.length);
    });
  });

  describe("データ品質", () => {
    it("すべてのカードに適切な名前が設定されている", async () => {
      const repository = new JsonCardPoolRepository();

      const cardPool = await repository.load();
      const allCards = cardPool.getAllCards();

      allCards.forEach((card) => {
        expect(card.name.trim()).not.toBe("");
        expect(card.name.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("すべてのカードに適切な説明が設定されている", async () => {
      const repository = new JsonCardPoolRepository();

      const cardPool = await repository.load();
      const allCards = cardPool.getAllCards();

      allCards.forEach((card) => {
        expect(card.description.trim()).not.toBe("");
        expect(card.description.length).toBeGreaterThan(5);
      });
    });

    it("コストバランスが適切である", async () => {
      const repository = new JsonCardPoolRepository();

      const cardPool = await repository.load();
      const allCards = cardPool.getAllCards();
      const costs = allCards.map((card) => card.cost.value);
      const averageCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;

      // 平均コストが3-7の範囲内であることを確認
      expect(averageCost).toBeGreaterThanOrEqual(3);
      expect(averageCost).toBeLessThanOrEqual(7);
    });
  });
});
