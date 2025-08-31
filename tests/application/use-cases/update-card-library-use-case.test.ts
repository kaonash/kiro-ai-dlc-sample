import { beforeEach, describe, expect, it } from "bun:test";
import { UpdateCardLibraryUseCase } from "../../../src/application/use-cases/update-card-library-use-case.js";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { Card } from "../../../src/domain/entities/card.js";
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

describe("UpdateCardLibraryUseCase", () => {
  const createTestCard = (
    id: string,
    name: string,
    cost: number,
    towerType: TowerType = TowerType.ARCHER
  ): Card => {
    return new Card(id, name, "テスト用カード", new CardCost(cost), towerType, SpecialAbility.NONE);
  };

  let cardLibraryRepository: MockCardLibraryRepository;
  let useCase: UpdateCardLibraryUseCase;

  beforeEach(() => {
    const cardLibrary = new CardLibrary();
    cardLibraryRepository = new MockCardLibraryRepository(cardLibrary);
    useCase = new UpdateCardLibraryUseCase(cardLibraryRepository);
  });

  describe("正常なケース", () => {
    it("新しいカードを発見してライブラリに追加できる", async () => {
      const card = createTestCard("card-001", "新しいカード", 3);

      const result = await useCase.discoverCard(card);

      expect(result.success).toBe(true);
      expect(result.discoveryResult?.isNewDiscovery).toBe(true);
      expect(result.discoveryResult?.card).toEqual(card);
      expect(result.error).toBeUndefined();

      // ライブラリに保存されていることを確認
      const library = await cardLibraryRepository.load();
      expect(library.hasDiscovered(card.id)).toBe(true);
    });

    it("既に発見済みのカードを再発見できる", async () => {
      const card = createTestCard("card-001", "既存カード", 3);

      // 最初の発見
      await useCase.discoverCard(card);

      // 再発見
      const result = await useCase.discoverCard(card);

      expect(result.success).toBe(true);
      expect(result.discoveryResult?.isNewDiscovery).toBe(false);
      expect(result.discoveryResult?.card).toEqual(card);
    });

    it("複数のカードを一括発見できる", async () => {
      const cards = [
        createTestCard("card-001", "カード1", 2),
        createTestCard("card-002", "カード2", 4),
        createTestCard("card-003", "カード3", 6),
      ];

      const result = await useCase.discoverMultipleCards(cards);

      expect(result.success).toBe(true);
      expect(result.discoveryResults).toHaveLength(3);
      expect(result.discoveryResults?.every((r) => r.isNewDiscovery)).toBe(true);
      expect(result.error).toBeUndefined();

      // すべてのカードがライブラリに保存されていることを確認
      const library = await cardLibraryRepository.load();
      cards.forEach((card) => {
        expect(library.hasDiscovered(card.id)).toBe(true);
      });
    });

    it("発見統計を取得できる", async () => {
      const cards = [
        createTestCard("card-001", "弓兵", 2, TowerType.ARCHER),
        createTestCard("card-002", "大砲", 5, TowerType.CANNON),
        createTestCard("card-003", "魔法使い", 3, TowerType.MAGIC),
      ];

      // カードを発見
      await useCase.discoverMultipleCards(cards);

      const result = await useCase.getDiscoveryStatistics();

      expect(result.success).toBe(true);
      expect(result.statistics?.totalDiscovered).toBe(3);
      expect(result.statistics?.byTowerType.get(TowerType.ARCHER)).toBe(1);
      expect(result.statistics?.byTowerType.get(TowerType.CANNON)).toBe(1);
      expect(result.statistics?.byTowerType.get(TowerType.MAGIC)).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it("発見推奨を取得できる", async () => {
      const archerCard = createTestCard("card-001", "弓兵", 2, TowerType.ARCHER);

      // 弓兵カードのみ発見
      await useCase.discoverCard(archerCard);

      const result = await useCase.getDiscoveryRecommendations();

      expect(result.success).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations!.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it("ライブラリをクリアできる", async () => {
      const card = createTestCard("card-001", "テストカード", 3);

      // カードを発見
      await useCase.discoverCard(card);

      // ライブラリをクリア
      const result = await useCase.clearLibrary();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // ライブラリが空になっていることを確認
      const library = await cardLibraryRepository.load();
      expect(library.isEmpty).toBe(true);
    });

    it("特殊能力付きカードの発見で詳細情報を取得できる", async () => {
      const specialCard = new Card(
        "card-001",
        "特殊弓兵",
        "範囲攻撃を持つ弓兵",
        new CardCost(4),
        TowerType.ARCHER,
        SpecialAbility.SPLASH_DAMAGE
      );

      const result = await useCase.discoverCard(specialCard);

      expect(result.success).toBe(true);
      expect(result.discoveryResult?.specialAbilityInfo).toBeDefined();
      expect(result.discoveryResult?.specialAbilityInfo?.name).toBe("範囲ダメージ");
    });
  });

  describe("異常なケース", () => {
    it("nullのカードで発見しようとするとエラーが発生する", async () => {
      const result = await useCase.discoverCard(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain("カードが指定されていません");
      expect(result.discoveryResult).toBeUndefined();
    });

    it("空の配列で一括発見しても正常に処理される", async () => {
      const result = await useCase.discoverMultipleCards([]);

      expect(result.success).toBe(true);
      expect(result.discoveryResults).toHaveLength(0);
    });

    it("ライブラリの読み込みに失敗した場合エラーが発生する", async () => {
      const failingRepository = {
        async save(): Promise<void> {},
        async load(): Promise<CardLibrary> {
          throw new Error("読み込みエラー");
        },
        async exists(): Promise<boolean> {
          return false;
        },
        async delete(): Promise<void> {},
      };

      useCase = new UpdateCardLibraryUseCase(failingRepository);
      const card = createTestCard("card-001", "テストカード", 3);

      const result = await useCase.discoverCard(card);

      expect(result.success).toBe(false);
      expect(result.error).toContain("ライブラリの読み込みに失敗しました");
    });

    it("ライブラリの保存に失敗した場合エラーが発生する", async () => {
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

      useCase = new UpdateCardLibraryUseCase(failingRepository);
      const card = createTestCard("card-001", "テストカード", 3);

      const result = await useCase.discoverCard(card);

      expect(result.success).toBe(false);
      expect(result.error).toContain("ライブラリの保存に失敗しました");
    });

    it("統計取得時にライブラリの読み込みに失敗した場合エラーが発生する", async () => {
      const failingRepository = {
        async save(): Promise<void> {},
        async load(): Promise<CardLibrary> {
          throw new Error("読み込みエラー");
        },
        async exists(): Promise<boolean> {
          return false;
        },
        async delete(): Promise<void> {},
      };

      useCase = new UpdateCardLibraryUseCase(failingRepository);

      const result = await useCase.getDiscoveryStatistics();

      expect(result.success).toBe(false);
      expect(result.error).toContain("統計の取得に失敗しました");
    });
  });

  describe("データ整合性", () => {
    it("同じカードを複数回発見しても重複しない", async () => {
      const card = createTestCard("card-001", "テストカード", 3);

      await useCase.discoverCard(card);
      await useCase.discoverCard(card);
      await useCase.discoverCard(card);

      const library = await cardLibraryRepository.load();
      expect(library.size).toBe(1);
      expect(library.hasDiscovered(card.id)).toBe(true);
    });

    it("一括発見で重複があっても正しく処理される", async () => {
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-002", "カード2", 4);
      const cards = [card1, card2, card1]; // card1が重複

      const result = await useCase.discoverMultipleCards(cards);

      expect(result.success).toBe(true);
      expect(result.discoveryResults).toHaveLength(3);

      const library = await cardLibraryRepository.load();
      expect(library.size).toBe(2); // 重複は除かれる
    });
  });

  describe("パフォーマンス", () => {
    it("大量のカードを一括発見できる", async () => {
      const cards: Card[] = [];
      for (let i = 1; i <= 100; i++) {
        cards.push(
          createTestCard(`card-${i.toString().padStart(3, "0")}`, `カード${i}`, (i % 10) + 1)
        );
      }

      const result = await useCase.discoverMultipleCards(cards);

      expect(result.success).toBe(true);
      expect(result.discoveryResults).toHaveLength(100);

      const library = await cardLibraryRepository.load();
      expect(library.size).toBe(100);
    });
  });
});
