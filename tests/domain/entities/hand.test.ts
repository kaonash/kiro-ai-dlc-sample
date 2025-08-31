import { describe, expect, it } from "bun:test";
import { Card } from "../../../src/domain/entities/card.js";
import { Hand } from "../../../src/domain/entities/hand.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

describe("Hand", () => {
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
    it("空の手札を作成できる", () => {
      const hand = new Hand();
      expect(hand.size).toBe(0);
      expect(hand.isEmpty).toBe(true);
      expect(hand.isFull).toBe(false);
    });

    it("カードを手札に追加できる", () => {
      const hand = new Hand();
      const card = createTestCard("card-001", "テストカード", 2);

      hand.addCard(card);

      expect(hand.size).toBe(1);
      expect(hand.isEmpty).toBe(false);
      expect(hand.hasCard(card.id)).toBe(true);
    });

    it("複数のカードを手札に追加できる", () => {
      const hand = new Hand();
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-002", "カード2", 3);

      hand.addCard(card1);
      hand.addCard(card2);

      expect(hand.size).toBe(2);
      expect(hand.hasCard(card1.id)).toBe(true);
      expect(hand.hasCard(card2.id)).toBe(true);
    });

    it("手札からカードを削除できる", () => {
      const hand = new Hand();
      const card = createTestCard("card-001", "テストカード", 2);

      hand.addCard(card);
      const removedCard = hand.removeCard(card.id);

      expect(removedCard).toEqual(card);
      expect(hand.size).toBe(0);
      expect(hand.hasCard(card.id)).toBe(false);
    });

    it("手札の最大サイズ（8枚）まで追加できる", () => {
      const hand = new Hand();

      for (let i = 1; i <= 8; i++) {
        const card = createTestCard(`card-${i.toString().padStart(3, "0")}`, `カード${i}`, i);
        hand.addCard(card);
      }

      expect(hand.size).toBe(8);
      expect(hand.isFull).toBe(true);
    });

    it("手札のカード一覧を取得できる", () => {
      const hand = new Hand();
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-002", "カード2", 3);

      hand.addCard(card1);
      hand.addCard(card2);

      const cards = hand.getCards();
      expect(cards).toHaveLength(2);
      expect(cards).toContain(card1);
      expect(cards).toContain(card2);
    });

    it("IDでカードを取得できる", () => {
      const hand = new Hand();
      const card = createTestCard("card-001", "テストカード", 2);

      hand.addCard(card);
      const foundCard = hand.getCard(card.id);

      expect(foundCard).toEqual(card);
    });
  });

  describe("異常なケース", () => {
    it("手札が満杯の時にカードを追加するとエラーが発生する", () => {
      const hand = new Hand();

      // 8枚まで追加
      for (let i = 1; i <= 8; i++) {
        const card = createTestCard(`card-${i.toString().padStart(3, "0")}`, `カード${i}`, i);
        hand.addCard(card);
      }

      // 9枚目を追加しようとするとエラー
      const extraCard = createTestCard("card-009", "余分なカード", 1);
      expect(() => hand.addCard(extraCard)).toThrow("手札が満杯です");
    });

    it("同じカードを重複して追加するとエラーが発生する", () => {
      const hand = new Hand();
      const card = createTestCard("card-001", "テストカード", 2);

      hand.addCard(card);
      expect(() => hand.addCard(card)).toThrow("同じカードが既に手札にあります");
    });

    it("存在しないカードを削除しようとするとエラーが発生する", () => {
      const hand = new Hand();
      expect(() => hand.removeCard("non-existent")).toThrow("指定されたカードが手札にありません");
    });

    it("存在しないカードを取得しようとするとundefinedが返される", () => {
      const hand = new Hand();
      const foundCard = hand.getCard("non-existent");
      expect(foundCard).toBeUndefined();
    });
  });

  describe("手札のクリア", () => {
    it("手札をクリアできる", () => {
      const hand = new Hand();
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-002", "カード2", 3);

      hand.addCard(card1);
      hand.addCard(card2);
      hand.clear();

      expect(hand.size).toBe(0);
      expect(hand.isEmpty).toBe(true);
      expect(hand.hasCard(card1.id)).toBe(false);
      expect(hand.hasCard(card2.id)).toBe(false);
    });
  });
});
