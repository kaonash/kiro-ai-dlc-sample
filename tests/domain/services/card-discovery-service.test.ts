import { describe, expect, it } from "bun:test";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { Card } from "../../../src/domain/entities/card.js";
import { CardDiscoveryService } from "../../../src/domain/services/card-discovery-service.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

describe("CardDiscoveryService", () => {
  const createTestCard = (
    id: string,
    name: string,
    cost: number,
    towerType: TowerType = TowerType.ARCHER
  ): Card => {
    return new Card(id, name, "テスト用カード", new CardCost(cost), towerType, SpecialAbility.NONE);
  };

  describe("正常なケース", () => {
    it("新しいカードを発見できる", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();
      const card = createTestCard("card-001", "新しいカード", 3);

      const result = service.discoverCard(card, library);

      expect(result.isNewDiscovery).toBe(true);
      expect(result.card).toEqual(card);
      expect(result.message).toContain("新しいカード");
      expect(library.hasDiscovered(card.id)).toBe(true);
    });

    it("既に発見済みのカードを再発見した場合", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();
      const card = createTestCard("card-001", "既存カード", 3);

      // 最初の発見
      library.discoverCard(card);

      // 再発見
      const result = service.discoverCard(card, library);

      expect(result.isNewDiscovery).toBe(false);
      expect(result.card).toEqual(card);
      expect(result.message).toContain("既に発見済み");
    });

    it("複数のカードを一括発見できる", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();
      const cards = [
        createTestCard("card-001", "カード1", 2),
        createTestCard("card-002", "カード2", 4),
        createTestCard("card-003", "カード3", 6),
      ];

      const results = service.discoverMultipleCards(cards, library);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.isNewDiscovery).toBe(true);
        expect(result.card).toEqual(cards[index]);
        expect(library.hasDiscovered(cards[index].id)).toBe(true);
      });
    });

    it("一部が既発見の複数カードを一括発見できる", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();
      const card1 = createTestCard("card-001", "既存カード", 2);
      const card2 = createTestCard("card-002", "新カード", 4);

      // card1を事前に発見
      library.discoverCard(card1);

      const results = service.discoverMultipleCards([card1, card2], library);

      expect(results).toHaveLength(2);
      expect(results[0].isNewDiscovery).toBe(false); // 既存
      expect(results[1].isNewDiscovery).toBe(true); // 新規
    });

    it("発見統計を取得できる", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();
      const cards = [
        createTestCard("card-001", "カード1", 2, TowerType.ARCHER),
        createTestCard("card-002", "カード2", 4, TowerType.CANNON),
        createTestCard("card-003", "カード3", 6, TowerType.MAGIC),
      ];

      cards.forEach((card) => service.discoverCard(card, library));

      const stats = service.getDiscoveryStatistics(library);

      expect(stats.totalDiscovered).toBe(3);
      expect(stats.byTowerType.get(TowerType.ARCHER)).toBe(1);
      expect(stats.byTowerType.get(TowerType.CANNON)).toBe(1);
      expect(stats.byTowerType.get(TowerType.MAGIC)).toBe(1);
      expect(stats.averageCost).toBe(4);
      expect(stats.costDistribution.low).toBe(1);
      expect(stats.costDistribution.medium).toBe(2);
      expect(stats.costDistribution.high).toBe(0);
    });

    it("発見推奨を取得できる", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();

      // 弓兵タイプのカードのみ発見済み
      const archerCard = createTestCard("card-001", "弓兵", 2, TowerType.ARCHER);
      service.discoverCard(archerCard, library);

      const recommendations = service.getDiscoveryRecommendations(library);

      expect(recommendations.length).toBeGreaterThan(0);
      // 未発見のタイプが推奨に含まれることを確認
      const undiscoveredTypes = recommendations.filter((rec) => rec.priority === 80);
      expect(undiscoveredTypes.length).toBe(7); // 弓兵以外の7タイプ
      expect(undiscoveredTypes.every((rec) => rec.towerType !== TowerType.ARCHER)).toBe(true);
      expect(recommendations.some((rec) => rec.towerType === TowerType.CANNON)).toBe(true);
      expect(recommendations.some((rec) => rec.towerType === TowerType.MAGIC)).toBe(true);
    });

    it("特殊能力付きカードの発見で追加情報を取得できる", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();
      const specialCard = new Card(
        "card-001",
        "特殊弓兵",
        "範囲攻撃を持つ弓兵",
        new CardCost(4),
        TowerType.ARCHER,
        SpecialAbility.SPLASH_DAMAGE
      );

      const result = service.discoverCard(specialCard, library);

      expect(result.isNewDiscovery).toBe(true);
      expect(result.specialAbilityInfo).toBeDefined();
      expect(result.specialAbilityInfo?.name).toBe("範囲ダメージ");
      expect(result.specialAbilityInfo?.description).toContain("周囲の敵");
    });
  });

  describe("異常なケース", () => {
    it("nullのカードで発見しようとするとエラーが発生する", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();

      expect(() => service.discoverCard(null as any, library)).toThrow(
        "カードが指定されていません"
      );
    });

    it("nullのライブラリで発見しようとするとエラーが発生する", () => {
      const service = new CardDiscoveryService();
      const card = createTestCard("card-001", "テストカード", 3);

      expect(() => service.discoverCard(card, null as any)).toThrow(
        "カードライブラリが指定されていません"
      );
    });

    it("空の配列で一括発見しても正常に処理される", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();

      const results = service.discoverMultipleCards([], library);

      expect(results).toHaveLength(0);
    });
  });

  describe("発見メッセージ", () => {
    it("低コストカードの発見で適切なメッセージが生成される", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();
      const lowCostCard = createTestCard("card-001", "安価な弓兵", 1);

      const result = service.discoverCard(lowCostCard, library);

      expect(result.message).toContain("使いやすい");
    });

    it("高コストカードの発見で適切なメッセージが生成される", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();
      const highCostCard = createTestCard("card-001", "強力な魔法使い", 9);

      const result = service.discoverCard(highCostCard, library);

      expect(result.message).toContain("強力");
    });

    it("特殊能力付きカードで特別なメッセージが生成される", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();
      const specialCard = new Card(
        "card-001",
        "特殊カード",
        "説明",
        new CardCost(5),
        TowerType.MAGIC,
        SpecialAbility.FREEZE
      );

      const result = service.discoverCard(specialCard, library);

      expect(result.message).toContain("特殊能力");
    });
  });

  describe("統計計算", () => {
    it("空のライブラリで統計を取得すると初期値が返される", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();

      const stats = service.getDiscoveryStatistics(library);

      expect(stats.totalDiscovered).toBe(0);
      expect(stats.averageCost).toBe(0);
      expect(stats.byTowerType.size).toBe(0);
      expect(stats.costDistribution.low).toBe(0);
      expect(stats.costDistribution.medium).toBe(0);
      expect(stats.costDistribution.high).toBe(0);
    });

    it("コスト分布が正しく計算される", () => {
      const library = new CardLibrary();
      const service = new CardDiscoveryService();
      const cards = [
        createTestCard("card-001", "低コスト", 2), // low
        createTestCard("card-002", "中コスト", 5), // medium
        createTestCard("card-003", "高コスト", 8), // high
        createTestCard("card-004", "低コスト2", 3), // low
      ];

      cards.forEach((card) => service.discoverCard(card, library));
      const stats = service.getDiscoveryStatistics(library);

      expect(stats.costDistribution.low).toBe(2);
      expect(stats.costDistribution.medium).toBe(1);
      expect(stats.costDistribution.high).toBe(1);
    });
  });
});
