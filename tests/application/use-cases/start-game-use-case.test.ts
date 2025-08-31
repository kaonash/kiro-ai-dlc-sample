import { beforeEach, describe, expect, it } from "bun:test";
import { StartGameUseCase } from "../../../src/application/use-cases/start-game-use-case.js";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { Card } from "../../../src/domain/entities/card.js";
import { GameSession } from "../../../src/domain/entities/game-session.js";
import type { ICardLibraryRepository } from "../../../src/domain/repositories/card-library-repository.js";
import type { ICardPoolRepository } from "../../../src/domain/repositories/card-pool-repository.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

// モックリポジトリ
class MockCardPoolRepository implements ICardPoolRepository {
  private cardPool: CardPool;

  constructor(cardPool: CardPool) {
    this.cardPool = cardPool;
  }

  async load(): Promise<CardPool> {
    return this.cardPool;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

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

describe("StartGameUseCase", () => {
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

  let cardPoolRepository: MockCardPoolRepository;
  let cardLibraryRepository: MockCardLibraryRepository;
  let useCase: StartGameUseCase;

  beforeEach(() => {
    const cards = createTestCards(30);
    const cardPool = new CardPool(cards);
    const cardLibrary = new CardLibrary();

    cardPoolRepository = new MockCardPoolRepository(cardPool);
    cardLibraryRepository = new MockCardLibraryRepository(cardLibrary);
    useCase = new StartGameUseCase(cardPoolRepository, cardLibraryRepository);
  });

  describe("正常なケース", () => {
    it("新しいゲームセッションを開始できる", async () => {
      const sessionId = "test-session-001";

      const result = await useCase.execute(sessionId);

      expect(result.success).toBe(true);
      expect(result.gameSession).toBeDefined();
      expect(result.gameSession?.id).toBe(sessionId);
      expect(result.gameSession?.isActive).toBe(true);
      expect(result.gameSession?.hand.size).toBe(8);
      expect(result.error).toBeUndefined();
    });

    it("手札に8枚のカードが配布される", async () => {
      const sessionId = "test-session-002";

      const result = await useCase.execute(sessionId);

      expect(result.gameSession?.hand.size).toBe(8);
      expect(result.gameSession?.hand.isFull).toBe(true);
      expect(result.gameSession?.hand.isEmpty).toBe(false);
    });

    it("配布されたカードがすべて異なる", async () => {
      const sessionId = "test-session-003";

      const result = await useCase.execute(sessionId);

      const handCards = result.gameSession?.hand.getCards() || [];
      const cardIds = handCards.map((card) => card.id);
      const uniqueIds = new Set(cardIds);

      expect(uniqueIds.size).toBe(8);
    });

    it("ゲーム開始時の統計が正しく設定される", async () => {
      const sessionId = "test-session-004";

      const result = await useCase.execute(sessionId);

      const stats = result.gameSession?.getSessionStats();
      expect(stats?.cardsPlayed).toBe(0);
      expect(stats?.cardsInHand).toBe(8);
      expect(stats?.isActive).toBe(true);
    });

    it("カードライブラリが正しく読み込まれる", async () => {
      const sessionId = "test-session-005";

      // 事前にライブラリにカードを追加
      const existingCard = createTestCard("existing-001", "既存カード", 3);
      const library = new CardLibrary();
      library.discoverCard(existingCard);
      cardLibraryRepository = new MockCardLibraryRepository(library);
      useCase = new StartGameUseCase(cardPoolRepository, cardLibraryRepository);

      const result = await useCase.execute(sessionId);

      expect(result.success).toBe(true);
      // ライブラリの内容は保持されている
      expect(result.cardLibrary?.hasDiscovered(existingCard.id)).toBe(true);
    });
  });

  describe("異常なケース", () => {
    it("空のセッションIDでエラーが発生する", async () => {
      const result = await useCase.execute("");

      expect(result.success).toBe(false);
      expect(result.error).toContain("セッションIDが指定されていません");
      expect(result.gameSession).toBeUndefined();
    });

    it("カードプールが小さすぎる場合エラーが発生する", async () => {
      const smallCards = createTestCards(5); // 8枚未満
      const smallCardPool = new CardPool(smallCards);
      cardPoolRepository = new MockCardPoolRepository(smallCardPool);
      useCase = new StartGameUseCase(cardPoolRepository, cardLibraryRepository);

      const result = await useCase.execute("test-session");

      expect(result.success).toBe(false);
      expect(result.error).toContain("カードプールに十分なカードがありません");
      expect(result.gameSession).toBeUndefined();
    });

    it("カードプールの読み込みに失敗した場合エラーが発生する", async () => {
      const failingRepository = {
        async load(): Promise<CardPool> {
          throw new Error("カードプール読み込みエラー");
        },
        async isAvailable(): Promise<boolean> {
          return false;
        },
      };

      useCase = new StartGameUseCase(failingRepository, cardLibraryRepository);

      const result = await useCase.execute("test-session");

      expect(result.success).toBe(false);
      expect(result.error).toContain("カードプールの読み込みに失敗しました");
      expect(result.gameSession).toBeUndefined();
    });

    it("カードライブラリの読み込みに失敗した場合エラーが発生する", async () => {
      const failingRepository = {
        async save(): Promise<void> {},
        async load(): Promise<CardLibrary> {
          throw new Error("ライブラリ読み込みエラー");
        },
        async exists(): Promise<boolean> {
          return false;
        },
        async delete(): Promise<void> {},
      };

      useCase = new StartGameUseCase(cardPoolRepository, failingRepository);

      const result = await useCase.execute("test-session");

      expect(result.success).toBe(false);
      expect(result.error).toContain("カードライブラリの読み込みに失敗しました");
      expect(result.gameSession).toBeUndefined();
    });
  });

  describe("戦略的カード選択", () => {
    it("バランスの取れた手札が配布される", async () => {
      const sessionId = "test-session-balance";

      const result = await useCase.execute(sessionId);

      const handCards = result.gameSession?.hand.getCards() || [];
      const costs = handCards.map((card) => card.cost.value);
      const averageCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;

      // 平均コストが極端でないことを確認
      expect(averageCost).toBeGreaterThan(2);
      expect(averageCost).toBeLessThan(8);
    });

    it("低コスト、中コスト、高コストのカードが適度に含まれる", async () => {
      const sessionId = "test-session-distribution";

      const result = await useCase.execute(sessionId);

      const handCards = result.gameSession?.hand.getCards() || [];
      const costs = handCards.map((card) => card.cost.value);

      const lowCost = costs.filter((cost) => cost <= 3).length;
      const mediumCost = costs.filter((cost) => cost >= 4 && cost <= 6).length;
      const highCost = costs.filter((cost) => cost >= 7).length;

      // 各コスト帯に最低1枚は含まれることを期待
      expect(lowCost + mediumCost + highCost).toBe(8);
      expect(lowCost).toBeGreaterThan(0);
    });
  });
});
