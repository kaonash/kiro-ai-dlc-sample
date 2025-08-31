import { beforeEach, describe, expect, it } from "bun:test";
import { PlayCardUseCase } from "../../../src/application/use-cases/play-card-use-case.js";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { Card } from "../../../src/domain/entities/card.js";
import { GameSession } from "../../../src/domain/entities/game-session.js";
import type { ICardLibraryRepository } from "../../../src/domain/repositories/card-library-repository.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

// モックリポジトリ
class MockCardLibraryRepository implements ICardLibraryRepository {
  private library: CardLibrary;

  constructor(library: CardLibrary) {
    this.library = library;
  }

  async save(library: CardLibrary): Promise<void> {
    this.library = library;
  }

  async load(): Promise<CardLibrary> {
    return this.library;
  }

  async exists(): Promise<boolean> {
    return true;
  }

  async delete(): Promise<void> {
    this.library = new CardLibrary();
  }
}

describe("PlayCardUseCase", () => {
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

  let gameSession: GameSession;
  let cardLibraryRepository: MockCardLibraryRepository;
  let useCase: PlayCardUseCase;

  beforeEach(() => {
    const cards = createTestCards(30);
    const cardPool = new CardPool(cards);
    const cardLibrary = new CardLibrary();

    gameSession = new GameSession("test-session", cardPool, cardLibrary);
    gameSession.startGame();

    cardLibraryRepository = new MockCardLibraryRepository(cardLibrary);
    useCase = new PlayCardUseCase(cardLibraryRepository);
  });

  describe("正常なケース", () => {
    it("有効なカードをプレイできる", async () => {
      const handCards = gameSession.hand.getCards();
      const cardToPlay = handCards[0];

      const result = await useCase.execute(gameSession, cardToPlay.id);

      expect(result.success).toBe(true);
      expect(result.playedCard).toEqual(cardToPlay);
      expect(result.error).toBeUndefined();
      expect(gameSession.hand.hasCard(cardToPlay.id)).toBe(false);
      expect(gameSession.cardsPlayed).toBe(1);
    });

    it("プレイしたカードがライブラリに記録される", async () => {
      const handCards = gameSession.hand.getCards();
      const cardToPlay = handCards[0];
      const initialLibrarySize = cardLibraryRepository.library.size;

      const result = await useCase.execute(gameSession, cardToPlay.id);

      expect(result.success).toBe(true);
      // ライブラリに保存されることを確認
      const updatedLibrary = await cardLibraryRepository.load();
      expect(updatedLibrary.hasDiscovered(cardToPlay.id)).toBe(true);
    });

    it("複数のカードを順次プレイできる", async () => {
      const handCards = gameSession.hand.getCards();
      const card1 = handCards[0];
      const card2 = handCards[1];

      const result1 = await useCase.execute(gameSession, card1.id);
      const result2 = await useCase.execute(gameSession, card2.id);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(gameSession.hand.size).toBe(6);
      expect(gameSession.cardsPlayed).toBe(2);
    });

    it("プレイ推奨情報を取得できる", async () => {
      const result = await useCase.getPlayRecommendations(gameSession);

      expect(result.success).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations?.length).toBe(8); // 手札のカード数
      expect(result.error).toBeUndefined();
    });

    it("手札バランス分析を取得できる", async () => {
      const result = await useCase.analyzeHandBalance(gameSession);

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis?.totalCards).toBe(8);
      expect(result.analysis?.averageCost).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it("カードプレイの検証ができる", async () => {
      const handCards = gameSession.hand.getCards();
      const validCardId = handCards[0].id;

      const result = await useCase.validateCardPlay(gameSession, validCardId);

      expect(result.success).toBe(true);
      expect(result.validation?.isValid).toBe(true);
      expect(result.validation?.card).toEqual(handCards[0]);
      expect(result.error).toBeUndefined();
    });
  });

  describe("異常なケース", () => {
    it("存在しないカードIDでエラーが発生する", async () => {
      const result = await useCase.execute(gameSession, "non-existent-card");

      expect(result.success).toBe(false);
      expect(result.error).toContain("指定されたカードが手札にありません");
      expect(result.playedCard).toBeUndefined();
    });

    it("空のカードIDでエラーが発生する", async () => {
      const result = await useCase.execute(gameSession, "");

      expect(result.success).toBe(false);
      expect(result.error).toContain("カードIDが指定されていません");
      expect(result.playedCard).toBeUndefined();
    });

    it("非アクティブなゲームセッションでエラーが発生する", async () => {
      gameSession.endGame();

      const result = await useCase.execute(gameSession, "any-card-id");

      expect(result.success).toBe(false);
      expect(result.error).toContain("ゲームがアクティブではありません");
      expect(result.playedCard).toBeUndefined();
    });

    it("nullのゲームセッションでエラーが発生する", async () => {
      const result = await useCase.execute(null as any, "card-id");

      expect(result.success).toBe(false);
      expect(result.error).toContain("ゲームセッションが指定されていません");
      expect(result.playedCard).toBeUndefined();
    });

    it("ライブラリの保存に失敗した場合でもカードプレイは成功する", async () => {
      const failingRepository = {
        async save(): Promise<void> {
          throw new Error("保存エラー");
        },
        async load(): Promise<CardLibrary> {
          return new CardLibrary();
        },
        async exists(): Promise<boolean> {
          return true;
        },
        async delete(): Promise<void> {},
      };

      useCase = new PlayCardUseCase(failingRepository);
      const handCards = gameSession.hand.getCards();
      const cardToPlay = handCards[0];

      const result = await useCase.execute(gameSession, cardToPlay.id);

      // カードプレイは成功するが、警告が含まれる
      expect(result.success).toBe(true);
      expect(result.playedCard).toEqual(cardToPlay);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain("ライブラリの保存に失敗しました");
    });
  });

  describe("検証機能", () => {
    it("無効なカードIDの検証でエラーが返される", async () => {
      const result = await useCase.validateCardPlay(gameSession, "invalid-card");

      expect(result.success).toBe(true);
      expect(result.validation?.isValid).toBe(false);
      expect(result.validation?.errors).toContain("指定されたカードが手札にありません");
    });

    it("空の手札での推奨取得で空配列が返される", async () => {
      // 手札を空にする
      const handCards = gameSession.hand.getCards();
      for (const card of handCards) {
        await useCase.execute(gameSession, card.id);
      }

      const result = await useCase.getPlayRecommendations(gameSession);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe("統計とバランス", () => {
    it("カードプレイ後の統計が正しく更新される", async () => {
      const handCards = gameSession.hand.getCards();
      const cardToPlay = handCards[0];

      await useCase.execute(gameSession, cardToPlay.id);

      const stats = gameSession.getSessionStats();
      expect(stats.cardsPlayed).toBe(1);
      expect(stats.cardsInHand).toBe(7);
      expect(stats.isActive).toBe(true);
    });

    it("手札バランス分析が正しく動作する", async () => {
      const result = await useCase.analyzeHandBalance(gameSession);

      expect(result.analysis?.totalCards).toBe(8);
      expect(result.analysis?.averageCost).toBeGreaterThan(0);
      expect(result.analysis?.typeVariety).toBeGreaterThan(0);
      expect(result.analysis?.strategicScore).toBeGreaterThanOrEqual(0);
      expect(result.analysis?.strategicScore).toBeLessThanOrEqual(100);
    });
  });
});
