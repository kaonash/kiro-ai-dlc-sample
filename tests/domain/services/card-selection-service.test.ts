import { describe, expect, it } from "bun:test";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { Card } from "../../../src/domain/entities/card.js";
import { CardSelectionService } from "../../../src/domain/services/card-selection-service.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

describe("CardSelectionService", () => {
  const createTestCard = (
    id: string,
    name: string,
    cost: number,
    towerType: TowerType = TowerType.ARCHER
  ): Card => {
    return new Card(id, name, "テスト用カード", new CardCost(cost), towerType, SpecialAbility.NONE);
  };

  const createBalancedCardPool = (): CardPool => {
    const cards: Card[] = [
      // 低コストカード (1-3)
      createTestCard("low-001", "弱い弓兵", 1, TowerType.ARCHER),
      createTestCard("low-002", "基本弓兵", 2, TowerType.ARCHER),
      createTestCard("low-003", "改良弓兵", 3, TowerType.ARCHER),
      createTestCard("low-004", "弱い魔法使い", 1, TowerType.MAGIC),
      createTestCard("low-005", "基本魔法使い", 2, TowerType.MAGIC),

      // 中コストカード (4-6)
      createTestCard("mid-001", "強化弓兵", 4, TowerType.ARCHER),
      createTestCard("mid-002", "大砲", 5, TowerType.CANNON),
      createTestCard("mid-003", "氷魔法使い", 4, TowerType.ICE),
      createTestCard("mid-004", "炎魔法使い", 5, TowerType.FIRE),
      createTestCard("mid-005", "雷魔法使い", 6, TowerType.LIGHTNING),

      // 高コストカード (7-10)
      createTestCard("high-001", "エリート弓兵", 7, TowerType.ARCHER),
      createTestCard("high-002", "重大砲", 8, TowerType.CANNON),
      createTestCard("high-003", "毒魔法使い", 9, TowerType.POISON),
      createTestCard("high-004", "支援タワー", 10, TowerType.SUPPORT),
      createTestCard("high-005", "究極魔法使い", 10, TowerType.MAGIC),
    ];
    return new CardPool(cards);
  };

  describe("正常なケース", () => {
    it("バランスの取れた手札を選択できる", () => {
      const cardPool = createBalancedCardPool();
      const service = new CardSelectionService();

      const selectedCards = service.selectBalancedHand(cardPool);

      expect(selectedCards).toHaveLength(8);

      // 重複がないことを確認
      const cardIds = selectedCards.map((card) => card.id);
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(8);
    });

    it("コストバランスが適切に取れている", () => {
      const cardPool = createBalancedCardPool();
      const service = new CardSelectionService();

      const selectedCards = service.selectBalancedHand(cardPool);
      const costs = selectedCards.map((card) => card.cost.value);
      const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
      const averageCost = totalCost / selectedCards.length;

      // 平均コストが3-7の範囲内であることを確認（バランスの取れた選択）
      expect(averageCost).toBeGreaterThanOrEqual(3);
      expect(averageCost).toBeLessThanOrEqual(7);
    });

    it("タワータイプの多様性が確保されている", () => {
      const cardPool = createBalancedCardPool();
      const service = new CardSelectionService();

      const selectedCards = service.selectBalancedHand(cardPool);
      const towerTypes = selectedCards.map((card) => card.towerType);
      const uniqueTypes = new Set(towerTypes);

      // 少なくとも3種類以上のタワータイプが含まれることを確認
      expect(uniqueTypes.size).toBeGreaterThanOrEqual(3);
    });

    it("戦略的価値の分析ができる", () => {
      const cardPool = createBalancedCardPool();
      const service = new CardSelectionService();

      const selectedCards = service.selectBalancedHand(cardPool);
      const analysis = service.analyzeStrategicValue(selectedCards);

      expect(analysis.totalCards).toBe(8);
      expect(analysis.averageCost).toBeGreaterThan(0);
      expect(analysis.costDistribution.low).toBeGreaterThanOrEqual(0);
      expect(analysis.costDistribution.medium).toBeGreaterThanOrEqual(0);
      expect(analysis.costDistribution.high).toBeGreaterThanOrEqual(0);
      expect(analysis.typeDistribution.size).toBeGreaterThan(0);
    });

    it("コスト制約付きでカードを選択できる", () => {
      const cardPool = createBalancedCardPool();
      const service = new CardSelectionService();

      const selectedCards = service.selectCardsWithCostConstraint(cardPool, 5, 30);

      expect(selectedCards).toHaveLength(5);
      const totalCost = selectedCards.reduce((sum, card) => sum + card.cost.value, 0);
      expect(totalCost).toBeLessThanOrEqual(30);
    });

    it("タワータイプ制約付きでカードを選択できる", () => {
      const cardPool = createBalancedCardPool();
      const service = new CardSelectionService();

      const selectedCards = service.selectCardsByType(cardPool, TowerType.ARCHER, 3);

      expect(selectedCards).toHaveLength(3);
      selectedCards.forEach((card) => {
        expect(card.towerType).toBe(TowerType.ARCHER);
      });
    });
  });

  describe("異常なケース", () => {
    it("空のカードプールでエラーが発生する", () => {
      const emptyPool = new CardPool([]);
      const service = new CardSelectionService();

      expect(() => service.selectBalancedHand(emptyPool)).toThrow("カードプールが空です");
    });

    it("カードプールが小さすぎる場合エラーが発生する", () => {
      const cards = [
        createTestCard("card-001", "カード1", 1),
        createTestCard("card-002", "カード2", 2),
      ];
      const smallPool = new CardPool(cards);
      const service = new CardSelectionService();

      expect(() => service.selectBalancedHand(smallPool)).toThrow(
        "カードプールに十分なカードがありません"
      );
    });

    it("コスト制約が不可能な場合エラーが発生する", () => {
      const cardPool = createBalancedCardPool();
      const service = new CardSelectionService();

      expect(() => service.selectCardsWithCostConstraint(cardPool, 8, 5)).toThrow(
        "指定されたコスト制約では十分なカードを選択できません"
      );
    });

    it("指定されたタワータイプのカードが不足している場合エラーが発生する", () => {
      const cardPool = createBalancedCardPool();
      const service = new CardSelectionService();

      expect(() => service.selectCardsByType(cardPool, TowerType.SUPPORT, 5)).toThrow(
        "指定されたタワータイプのカードが不足しています"
      );
    });
  });

  describe("エッジケース", () => {
    it("ちょうど8枚のカードプールで正常に動作する", () => {
      const cards = Array.from({ length: 8 }, (_, i) =>
        createTestCard(`card-${i + 1}`, `カード${i + 1}`, (i % 10) + 1)
      );
      const exactPool = new CardPool(cards);
      const service = new CardSelectionService();

      const selectedCards = service.selectBalancedHand(exactPool);
      expect(selectedCards).toHaveLength(8);
    });

    it("すべて同じコストのカードでも選択できる", () => {
      const cards = Array.from({ length: 10 }, (_, i) =>
        createTestCard(`card-${i + 1}`, `カード${i + 1}`, 5)
      );
      const uniformPool = new CardPool(cards);
      const service = new CardSelectionService();

      const selectedCards = service.selectBalancedHand(uniformPool);
      expect(selectedCards).toHaveLength(8);
      selectedCards.forEach((card) => {
        expect(card.cost.value).toBe(5);
      });
    });
  });
});
