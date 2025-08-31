import { beforeEach, describe, expect, it } from "bun:test";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { Card } from "../../../src/domain/entities/card.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";
import { LocalStorageCardLibraryRepository } from "../../../src/infrastructure/repositories/local-storage-card-library-repository.js";

// LocalStorageのモック
const mockLocalStorage = {
  data: new Map<string, string>(),
  getItem(key: string): string | null {
    return this.data.get(key) || null;
  },
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  },
  removeItem(key: string): void {
    this.data.delete(key);
  },
  clear(): void {
    this.data.clear();
  },
};

// グローバルのlocalStorageをモックで置き換え
(globalThis as any).localStorage = mockLocalStorage;

describe("LocalStorageCardLibraryRepository", () => {
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

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe("正常なケース", () => {
    it("空のカードライブラリを保存・読み込みできる", async () => {
      const repository = new LocalStorageCardLibraryRepository();
      const library = new CardLibrary();

      await repository.save(library);
      const loadedLibrary = await repository.load();

      expect(loadedLibrary.size).toBe(0);
      expect(loadedLibrary.isEmpty).toBe(true);
    });

    it("カードが含まれるライブラリを保存・読み込みできる", async () => {
      const repository = new LocalStorageCardLibraryRepository();
      const library = new CardLibrary();
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-002", "カード2", 4);

      library.discoverCard(card1);
      library.discoverCard(card2);

      await repository.save(library);
      const loadedLibrary = await repository.load();

      expect(loadedLibrary.size).toBe(2);
      expect(loadedLibrary.hasDiscovered(card1.id)).toBe(true);
      expect(loadedLibrary.hasDiscovered(card2.id)).toBe(true);
    });

    it("発見日時も正しく保存・復元される", async () => {
      const repository = new LocalStorageCardLibraryRepository();
      const library = new CardLibrary();
      const card = createTestCard("card-001", "カード1", 2);

      library.discoverCard(card);
      const originalDate = library.getDiscoveryDate(card.id);

      await repository.save(library);
      const loadedLibrary = await repository.load();

      const loadedDate = loadedLibrary.getDiscoveryDate(card.id);
      expect(loadedDate).toBeDefined();
      expect(loadedDate?.getTime()).toBe(originalDate?.getTime());
    });

    it("ライブラリの存在確認ができる", async () => {
      const repository = new LocalStorageCardLibraryRepository();

      expect(await repository.exists()).toBe(false);

      const library = new CardLibrary();
      await repository.save(library);

      expect(await repository.exists()).toBe(true);
    });

    it("ライブラリを削除できる", async () => {
      const repository = new LocalStorageCardLibraryRepository();
      const library = new CardLibrary();

      await repository.save(library);
      expect(await repository.exists()).toBe(true);

      await repository.delete();
      expect(await repository.exists()).toBe(false);
    });

    it("複数回保存しても正しく動作する", async () => {
      const repository = new LocalStorageCardLibraryRepository();
      const library = new CardLibrary();
      const card1 = createTestCard("card-001", "カード1", 2);
      const card2 = createTestCard("card-002", "カード2", 4);

      // 最初の保存
      library.discoverCard(card1);
      await repository.save(library);

      // 追加して再保存
      library.discoverCard(card2);
      await repository.save(library);

      const loadedLibrary = await repository.load();
      expect(loadedLibrary.size).toBe(2);
      expect(loadedLibrary.hasDiscovered(card1.id)).toBe(true);
      expect(loadedLibrary.hasDiscovered(card2.id)).toBe(true);
    });
  });

  describe("異常なケース", () => {
    it("存在しないライブラリを読み込むと空のライブラリが返される", async () => {
      const repository = new LocalStorageCardLibraryRepository();

      const loadedLibrary = await repository.load();

      expect(loadedLibrary.size).toBe(0);
      expect(loadedLibrary.isEmpty).toBe(true);
    });

    it("破損したデータがある場合は空のライブラリが返される", async () => {
      const repository = new LocalStorageCardLibraryRepository();

      // 破損したJSONデータを直接設定
      mockLocalStorage.setItem("card-library", "invalid json data");

      const loadedLibrary = await repository.load();

      expect(loadedLibrary.size).toBe(0);
      expect(loadedLibrary.isEmpty).toBe(true);
    });

    it("存在しないライブラリを削除してもエラーが発生しない", async () => {
      const repository = new LocalStorageCardLibraryRepository();

      await expect(repository.delete()).resolves.toBeUndefined();
    });
  });

  describe("データ形式", () => {
    it("保存されるデータが正しいJSON形式である", async () => {
      const repository = new LocalStorageCardLibraryRepository();
      const library = new CardLibrary();
      const card = createTestCard("card-001", "テストカード", 3);

      library.discoverCard(card);
      await repository.save(library);

      const savedData = mockLocalStorage.getItem("card-library");
      expect(savedData).toBeDefined();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData.discoveredCards).toBeDefined();
      expect(parsedData.discoveryDates).toBeDefined();
      expect(Array.isArray(parsedData.discoveredCards)).toBe(true);
    });

    it("カードデータが完全に保存される", async () => {
      const repository = new LocalStorageCardLibraryRepository();
      const library = new CardLibrary();
      const card = new Card(
        "card-001",
        "特殊カード",
        "特殊能力を持つカード",
        new CardCost(5),
        TowerType.MAGIC,
        SpecialAbility.FREEZE
      );

      library.discoverCard(card);
      await repository.save(library);
      const loadedLibrary = await repository.load();

      const loadedCard = loadedLibrary.getDiscoveredCard(card.id);
      expect(loadedCard).toBeDefined();
      expect(loadedCard?.name).toBe(card.name);
      expect(loadedCard?.description).toBe(card.description);
      expect(loadedCard?.cost.value).toBe(card.cost.value);
      expect(loadedCard?.towerType).toBe(card.towerType);
      expect(loadedCard?.specialAbility).toBe(card.specialAbility);
    });
  });
});
