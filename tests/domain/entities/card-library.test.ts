import { describe, expect, it } from "bun:test";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { Card } from "../../../src/domain/entities/card.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

describe("CardLibrary", () => {
  const createTestCard = (id: string, name: string, cost: number): Card => {
    return new Card(
      id,
      name,
      "テスト用カード",
      new CardCost(cost),
      TowerType.ARCHER,
      SpecialAbility.NONE
    );
  };

  describe("正常なケース", () => {
    it("空のカードライブラリを作成できる", () => {
      const library = new CardLibrary();
      expect(library.size).toBe(0);
      expect(library.isEmpty).toBe(true);
    });

    it("カードを発見してライブラリに追加できる", () => {
      const library = new CardLibrary();
      const card = createTestCard("card-001", "テストカード", 2);

      library.discoverCard(card);

      expect(library.size).toBe(1);
      expect(library.isEmpty).toBe(false);
      expect(library.hasDiscovered(card.id)).toBe(true);
    });

    it("複数のカードを発見できる", () => {
      const library = new CardLibrary();
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-002", "カード2", 3);

      library.discoverCard(card1);
      library.discoverCard(card2);

      expect(library.size).toBe(2);
      expect(library.hasDiscovered(card1.id)).toBe(true);
      expect(library.hasDiscovered(card2.id)).toBe(true);
    });

    it("発見済みのカードを取得できる", () => {
      const library = new CardLibrary();
      const card = createTestCard("card-001", "テストカード", 2);

      library.discoverCard(card);
      const foundCard = library.getDiscoveredCard(card.id);

      expect(foundCard).toEqual(card);
    });

    it("発見済みのすべてのカードを取得できる", () => {
      const library = new CardLibrary();
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-002", "カード2", 3);

      library.discoverCard(card1);
      library.discoverCard(card2);

      const discoveredCards = library.getAllDiscoveredCards();
      expect(discoveredCards).toHaveLength(2);
      expect(discoveredCards).toContain(card1);
      expect(discoveredCards).toContain(card2);
    });

    it("カードの発見日時を記録できる", () => {
      const library = new CardLibrary();
      const card = createTestCard("card-001", "テストカード", 2);
      const beforeDiscover = new Date();

      library.discoverCard(card);

      const afterDiscover = new Date();
      const discoveryDate = library.getDiscoveryDate(card.id);

      expect(discoveryDate).toBeDefined();
      expect(discoveryDate!.getTime()).toBeGreaterThanOrEqual(beforeDiscover.getTime());
      expect(discoveryDate!.getTime()).toBeLessThanOrEqual(afterDiscover.getTime());
    });

    it("タワータイプ別に発見済みカードを取得できる", () => {
      const library = new CardLibrary();
      const archerCard = new Card(
        "card-001",
        "弓兵カード",
        "説明",
        new CardCost(2),
        TowerType.ARCHER,
        SpecialAbility.NONE
      );
      const cannonCard = new Card(
        "card-002",
        "大砲カード",
        "説明",
        new CardCost(4),
        TowerType.CANNON,
        SpecialAbility.NONE
      );

      library.discoverCard(archerCard);
      library.discoverCard(cannonCard);

      const archerCards = library.getDiscoveredCardsByType(TowerType.ARCHER);
      const cannonCards = library.getDiscoveredCardsByType(TowerType.CANNON);

      expect(archerCards).toHaveLength(1);
      expect(archerCards[0]).toEqual(archerCard);
      expect(cannonCards).toHaveLength(1);
      expect(cannonCards[0]).toEqual(cannonCard);
    });

    it("発見統計を取得できる", () => {
      const library = new CardLibrary();
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-002", "カード2", 3);

      library.discoverCard(card1);
      library.discoverCard(card2);

      const stats = library.getDiscoveryStats();
      expect(stats.totalDiscovered).toBe(2);
      expect(stats.discoveryRate).toBe(2); // 総カード数が不明なので発見数と同じ
    });
  });

  describe("異常なケース", () => {
    it("同じカードを重複して発見しても1つだけ記録される", () => {
      const library = new CardLibrary();
      const card = createTestCard("card-001", "テストカード", 2);

      library.discoverCard(card);
      library.discoverCard(card); // 重複発見

      expect(library.size).toBe(1);
      expect(library.hasDiscovered(card.id)).toBe(true);
    });

    it("存在しないカードを取得しようとするとundefinedが返される", () => {
      const library = new CardLibrary();
      const foundCard = library.getDiscoveredCard("non-existent");
      expect(foundCard).toBeUndefined();
    });

    it("発見していないカードの発見日時を取得するとundefinedが返される", () => {
      const library = new CardLibrary();
      const discoveryDate = library.getDiscoveryDate("non-existent");
      expect(discoveryDate).toBeUndefined();
    });

    it("存在しないタワータイプでフィルタリングすると空配列が返される", () => {
      const library = new CardLibrary();
      const card = createTestCard("card-001", "テストカード", 2);
      library.discoverCard(card);

      const cards = library.getDiscoveredCardsByType(TowerType.MAGIC);
      expect(cards).toHaveLength(0);
    });
  });

  describe("ライブラリのクリア", () => {
    it("ライブラリをクリアできる", () => {
      const library = new CardLibrary();
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-002", "カード2", 3);

      library.discoverCard(card1);
      library.discoverCard(card2);
      library.clear();

      expect(library.size).toBe(0);
      expect(library.isEmpty).toBe(true);
      expect(library.hasDiscovered(card1.id)).toBe(false);
      expect(library.hasDiscovered(card2.id)).toBe(false);
    });
  });
});
