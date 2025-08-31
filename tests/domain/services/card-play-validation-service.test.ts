import { describe, expect, it } from "bun:test";
import { Card } from "../../../src/domain/entities/card.js";
import { Hand } from "../../../src/domain/entities/hand.js";
import {
  CardPlayValidationService,
  PlayValidationResult,
} from "../../../src/domain/services/card-play-validation-service.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

describe("CardPlayValidationService", () => {
  const createTestCard = (
    id: string,
    name: string,
    cost: number,
    towerType: TowerType = TowerType.ARCHER
  ): Card => {
    return new Card(id, name, "テスト用カード", new CardCost(cost), towerType, SpecialAbility.NONE);
  };

  const createHandWithCards = (cards: Card[]): Hand => {
    const hand = new Hand();
    cards.forEach((card) => hand.addCard(card));
    return hand;
  };

  describe("正常なケース", () => {
    it("有効なカードプレイを検証できる", () => {
      const card = createTestCard("card-001", "弓兵カード", 2);
      const hand = createHandWithCards([card]);
      const service = new CardPlayValidationService();

      const result = service.validateCardPlay(card.id, hand);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.card).toEqual(card);
    });

    it("複数のカードがある手札で正しいカードを検証できる", () => {
      const card1 = createTestCard("card-001", "弓兵カード", 2);
      const card2 = createTestCard("card-002", "大砲カード", 5);
      const card3 = createTestCard("card-003", "魔法カード", 3);
      const hand = createHandWithCards([card1, card2, card3]);
      const service = new CardPlayValidationService();

      const result = service.validateCardPlay(card2.id, hand);

      expect(result.isValid).toBe(true);
      expect(result.card).toEqual(card2);
    });

    it("カードプレイの戦略的推奨を取得できる", () => {
      const lowCostCard = createTestCard("card-001", "弱い弓兵", 1);
      const mediumCostCard = createTestCard("card-002", "普通の大砲", 5);
      const highCostCard = createTestCard("card-003", "強い魔法使い", 8);
      const hand = createHandWithCards([lowCostCard, mediumCostCard, highCostCard]);
      const service = new CardPlayValidationService();

      const recommendations = service.getPlayRecommendations(hand);

      expect(recommendations).toHaveLength(3);
      expect(recommendations.some((rec) => rec.card.equals(lowCostCard))).toBe(true);
      expect(recommendations.some((rec) => rec.card.equals(mediumCostCard))).toBe(true);
      expect(recommendations.some((rec) => rec.card.equals(highCostCard))).toBe(true);
    });

    it("コスト効率の良いカードが高い優先度を持つ", () => {
      const lowCostCard = createTestCard("card-001", "効率的な弓兵", 2);
      const highCostCard = createTestCard("card-002", "高価な魔法使い", 9);
      const hand = createHandWithCards([lowCostCard, highCostCard]);
      const service = new CardPlayValidationService();

      const recommendations = service.getPlayRecommendations(hand);

      const lowCostRec = recommendations.find((rec) => rec.card.equals(lowCostCard));
      const highCostRec = recommendations.find((rec) => rec.card.equals(highCostCard));

      expect(lowCostRec?.priority).toBeGreaterThan(highCostRec?.priority || 0);
    });

    it("手札の戦略的バランスを分析できる", () => {
      const cards = [
        createTestCard("card-001", "弓兵", 2, TowerType.ARCHER),
        createTestCard("card-002", "大砲", 5, TowerType.CANNON),
        createTestCard("card-003", "魔法使い", 3, TowerType.MAGIC),
        createTestCard("card-004", "氷魔法使い", 4, TowerType.ICE),
      ];
      const hand = createHandWithCards(cards);
      const service = new CardPlayValidationService();

      const balance = service.analyzeHandBalance(hand);

      expect(balance.totalCards).toBe(4);
      expect(balance.averageCost).toBe(3.5);
      expect(balance.costSpread).toBeGreaterThan(0);
      expect(balance.typeVariety).toBe(4);
      expect(balance.strategicScore).toBeGreaterThan(0);
    });
  });

  describe("異常なケース", () => {
    it("存在しないカードIDで検証するとエラーが返される", () => {
      const card = createTestCard("card-001", "弓兵カード", 2);
      const hand = createHandWithCards([card]);
      const service = new CardPlayValidationService();

      const result = service.validateCardPlay("non-existent", hand);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("指定されたカードが手札にありません");
      expect(result.card).toBeUndefined();
    });

    it("空の手札で検証するとエラーが返される", () => {
      const hand = new Hand();
      const service = new CardPlayValidationService();

      const result = service.validateCardPlay("card-001", hand);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("手札が空です");
      expect(result.card).toBeUndefined();
    });

    it("空のカードIDで検証するとエラーが返される", () => {
      const card = createTestCard("card-001", "弓兵カード", 2);
      const hand = createHandWithCards([card]);
      const service = new CardPlayValidationService();

      const result = service.validateCardPlay("", hand);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("カードIDが指定されていません");
    });
  });

  describe("戦略的推奨", () => {
    it("空の手札では推奨が空配列になる", () => {
      const hand = new Hand();
      const service = new CardPlayValidationService();

      const recommendations = service.getPlayRecommendations(hand);

      expect(recommendations).toHaveLength(0);
    });

    it("同じコストのカードでも異なる推奨理由を持つ", () => {
      const archerCard = createTestCard("card-001", "弓兵", 3, TowerType.ARCHER);
      const cannonCard = createTestCard("card-002", "大砲", 3, TowerType.CANNON);
      const hand = createHandWithCards([archerCard, cannonCard]);
      const service = new CardPlayValidationService();

      const recommendations = service.getPlayRecommendations(hand);

      expect(recommendations).toHaveLength(2);
      const archerRec = recommendations.find((rec) => rec.card.equals(archerCard));
      const cannonRec = recommendations.find((rec) => rec.card.equals(cannonCard));

      expect(archerRec?.reason).toBeDefined();
      expect(cannonRec?.reason).toBeDefined();
      expect(archerRec?.reason).not.toBe(cannonRec?.reason);
    });

    it("特殊能力を持つカードが適切に評価される", () => {
      const normalCard = createTestCard("card-001", "普通の弓兵", 3);
      const specialCard = new Card(
        "card-002",
        "特殊弓兵",
        "範囲攻撃を持つ弓兵",
        new CardCost(3),
        TowerType.ARCHER,
        SpecialAbility.SPLASH_DAMAGE
      );
      const hand = createHandWithCards([normalCard, specialCard]);
      const service = new CardPlayValidationService();

      const recommendations = service.getPlayRecommendations(hand);

      const normalRec = recommendations.find((rec) => rec.card.equals(normalCard));
      const specialRec = recommendations.find((rec) => rec.card.equals(specialCard));

      // 特殊能力を持つカードの方が高い優先度を持つべき
      expect(specialRec?.priority).toBeGreaterThan(normalRec?.priority || 0);
    });
  });

  describe("手札バランス分析", () => {
    it("バランスの取れた手札で高いスコアを得る", () => {
      const balancedCards = [
        createTestCard("card-001", "低コスト1", 1, TowerType.ARCHER),
        createTestCard("card-002", "低コスト2", 2, TowerType.MAGIC),
        createTestCard("card-003", "中コスト1", 4, TowerType.CANNON),
        createTestCard("card-004", "中コスト2", 5, TowerType.ICE),
        createTestCard("card-005", "高コスト1", 8, TowerType.FIRE),
      ];
      const hand = createHandWithCards(balancedCards);
      const service = new CardPlayValidationService();

      const balance = service.analyzeHandBalance(hand);

      expect(balance.strategicScore).toBeGreaterThan(50); // 適度に高いスコア
    });

    it("偏った手札で低いスコアを得る", () => {
      const unbalancedCards = [
        createTestCard("card-001", "高コスト1", 9, TowerType.ARCHER),
        createTestCard("card-002", "高コスト2", 10, TowerType.ARCHER),
        createTestCard("card-003", "高コスト3", 8, TowerType.ARCHER),
      ];
      const hand = createHandWithCards(unbalancedCards);
      const service = new CardPlayValidationService();

      const balance = service.analyzeHandBalance(hand);

      expect(balance.strategicScore).toBeLessThan(50); // 低いスコア
    });
  });
});
