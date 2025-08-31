import { describe, expect, it } from "bun:test";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { Card } from "../../../src/domain/entities/card.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

describe("CardPool", () => {
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

  const createTestCards = (count: number): Card[] => {
    const cards: Card[] = [];
    for (let i = 1; i <= count; i++) {
      cards.push(
        createTestCard(`card-${i.toString().padStart(3, "0")}`, `カード${i}`, (i % 10) + 1)
      );
    }
    return cards;
  };

  describe("正常なケース", () => {
    it("空のカードプールを作成できる", () => {
      const pool = new CardPool([]);
      expect(pool.size).toBe(0);
      expect(pool.isEmpty).toBe(true);
    });

    it("カードリストでカードプールを作成できる", () => {
      const cards = createTestCards(5);
      const pool = new CardPool(cards);

      expect(pool.size).toBe(5);
      expect(pool.isEmpty).toBe(false);
    });

    it("カードプールからランダムにカードを選択できる", () => {
      const cards = createTestCards(10);
      const pool = new CardPool(cards);

      const selectedCards = pool.selectRandomCards(3);

      expect(selectedCards).toHaveLength(3);
      // 選択されたカードがすべて異なることを確認
      const cardIds = selectedCards.map((card) => card.id);
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(3);
      // 選択されたカードがすべてプール内のカードであることを確認
      selectedCards.forEach((card) => {
        expect(cards.some((poolCard) => poolCard.equals(card))).toBe(true);
      });
    });

    it("プールサイズと同じ数のカードを選択できる", () => {
      const cards = createTestCards(5);
      const pool = new CardPool(cards);

      const selectedCards = pool.selectRandomCards(5);

      expect(selectedCards).toHaveLength(5);
    });

    it("指定されたIDのカードを取得できる", () => {
      const cards = createTestCards(5);
      const pool = new CardPool(cards);

      const foundCard = pool.getCard("card-003");
      expect(foundCard).toBeDefined();
      expect(foundCard?.id).toBe("card-003");
    });

    it("すべてのカードを取得できる", () => {
      const cards = createTestCards(3);
      const pool = new CardPool(cards);

      const allCards = pool.getAllCards();
      expect(allCards).toHaveLength(3);
      expect(allCards).toEqual(cards);
    });

    it("カードがプールに存在するかチェックできる", () => {
      const cards = createTestCards(5);
      const pool = new CardPool(cards);

      expect(pool.hasCard("card-003")).toBe(true);
      expect(pool.hasCard("card-999")).toBe(false);
    });
  });

  describe("異常なケース", () => {
    it("プールサイズを超える数のカードを選択しようとするとエラーが発生する", () => {
      const cards = createTestCards(5);
      const pool = new CardPool(cards);

      expect(() => pool.selectRandomCards(6)).toThrow(
        "選択するカード数がプールサイズを超えています"
      );
    });

    it("0枚のカードを選択しようとするとエラーが発生する", () => {
      const cards = createTestCards(5);
      const pool = new CardPool(cards);

      expect(() => pool.selectRandomCards(0)).toThrow(
        "選択するカード数は1以上である必要があります"
      );
    });

    it("負の数のカードを選択しようとするとエラーが発生する", () => {
      const cards = createTestCards(5);
      const pool = new CardPool(cards);

      expect(() => pool.selectRandomCards(-1)).toThrow(
        "選択するカード数は1以上である必要があります"
      );
    });

    it("空のプールからカードを選択しようとするとエラーが発生する", () => {
      const pool = new CardPool([]);

      expect(() => pool.selectRandomCards(1)).toThrow(
        "選択するカード数がプールサイズを超えています"
      );
    });

    it("存在しないカードを取得しようとするとundefinedが返される", () => {
      const cards = createTestCards(5);
      const pool = new CardPool(cards);

      const foundCard = pool.getCard("non-existent");
      expect(foundCard).toBeUndefined();
    });
  });

  describe("重複カードの処理", () => {
    it("重複するIDのカードがある場合、後のカードで上書きされる", () => {
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-001", "カード1更新版", 3);
      const pool = new CardPool([card1, card2]);

      expect(pool.size).toBe(1);
      const foundCard = pool.getCard("card-001");
      expect(foundCard?.name).toBe("カード1更新版");
    });
  });

  describe("ランダム選択の一意性", () => {
    it("複数回実行しても重複のないカードが選択される", () => {
      const cards = createTestCards(30);
      const pool = new CardPool(cards);

      // 複数回実行してすべて重複がないことを確認
      for (let i = 0; i < 10; i++) {
        const selectedCards = pool.selectRandomCards(8);
        const cardIds = selectedCards.map((card) => card.id);
        const uniqueIds = new Set(cardIds);
        expect(uniqueIds.size).toBe(8);
      }
    });
  });
});
