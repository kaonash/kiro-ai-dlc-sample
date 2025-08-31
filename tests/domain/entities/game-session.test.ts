import { describe, expect, it } from "bun:test";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { Card } from "../../../src/domain/entities/card.js";
import { GameSession } from "../../../src/domain/entities/game-session.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

describe("GameSession", () => {
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
    it("ゲームセッションを作成できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();

      const session = new GameSession("session-001", cardPool, cardLibrary);

      expect(session.id).toBe("session-001");
      expect(session.hand.isEmpty).toBe(true);
      expect(session.isActive).toBe(false);
    });

    it("ゲームを開始して手札にカードを配布できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      session.startGame();

      expect(session.isActive).toBe(true);
      expect(session.hand.size).toBe(8);
      expect(session.hand.isFull).toBe(true);
    });

    it("手札のカードをプレイできる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      session.startGame();
      const handCards = session.hand.getCards();
      const cardToPlay = handCards[0];

      const playedCard = session.playCard(cardToPlay.id);

      expect(playedCard).toEqual(cardToPlay);
      expect(session.hand.size).toBe(7);
      expect(session.hand.hasCard(cardToPlay.id)).toBe(false);
    });

    it("カードをプレイするとライブラリに発見として記録される", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      session.startGame();
      const handCards = session.hand.getCards();
      const cardToPlay = handCards[0];

      session.playCard(cardToPlay.id);

      expect(cardLibrary.hasDiscovered(cardToPlay.id)).toBe(true);
    });

    it("ゲームを終了できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      session.startGame();
      session.endGame();

      expect(session.isActive).toBe(false);
    });

    it("ゲーム終了時に手札のすべてのカードがライブラリに記録される", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      session.startGame();
      const handCards = session.hand.getCards();
      session.endGame();

      handCards.forEach((card) => {
        expect(cardLibrary.hasDiscovered(card.id)).toBe(true);
      });
    });

    it("新しいゲームを開始できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      session.startGame();
      session.endGame();
      session.startNewGame();

      expect(session.isActive).toBe(true);
      expect(session.hand.size).toBe(8);
    });

    it("ゲームセッションの統計を取得できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      session.startGame();
      const handCards = session.hand.getCards();
      session.playCard(handCards[0].id);
      session.playCard(handCards[1].id);

      const stats = session.getSessionStats();
      expect(stats.cardsPlayed).toBe(2);
      expect(stats.cardsInHand).toBe(6);
      expect(stats.isActive).toBe(true);
    });
  });

  describe("異常なケース", () => {
    it("空のIDでゲームセッションを作成するとエラーが発生する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();

      expect(() => new GameSession("", cardPool, cardLibrary)).toThrow(
        "ゲームセッションIDは空であってはいけません"
      );
    });

    it("カードプールが小さすぎる場合、ゲーム開始でエラーが発生する", () => {
      const cards = createTestCards(5); // 8枚未満
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      expect(() => session.startGame()).toThrow("カードプールに十分なカードがありません");
    });

    it("既にアクティブなゲームを開始しようとするとエラーが発生する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      session.startGame();
      expect(() => session.startGame()).toThrow("ゲームは既にアクティブです");
    });

    it("非アクティブなゲームでカードをプレイしようとするとエラーが発生する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      expect(() => session.playCard("card-001")).toThrow("ゲームがアクティブではありません");
    });

    it("手札にないカードをプレイしようとするとエラーが発生する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      session.startGame();
      expect(() => session.playCard("non-existent")).toThrow("指定されたカードが手札にありません");
    });

    it("非アクティブなゲームを終了しようとするとエラーが発生する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      expect(() => session.endGame()).toThrow("ゲームがアクティブではありません");
    });
  });

  describe("集約の整合性", () => {
    it("手札とライブラリの状態が一貫している", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary);

      session.startGame();
      const initialHandSize = session.hand.size;
      const initialLibrarySize = cardLibrary.size;

      const handCards = session.hand.getCards();
      const cardToPlay = handCards[0];
      session.playCard(cardToPlay.id);

      expect(session.hand.size).toBe(initialHandSize - 1);
      expect(cardLibrary.size).toBe(initialLibrarySize + 1);
      expect(cardLibrary.hasDiscovered(cardToPlay.id)).toBe(true);
    });
  });
});
