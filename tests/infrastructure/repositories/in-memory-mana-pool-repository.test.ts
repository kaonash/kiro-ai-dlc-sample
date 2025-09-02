import { describe, it, expect, beforeEach } from "bun:test";
import { InMemoryManaPoolRepository } from "../../../src/infrastructure/repositories/in-memory-mana-pool-repository";
import { ManaPool } from "../../../src/domain/entities/mana-pool";

describe("InMemoryManaPoolRepository", () => {
  let repository: InMemoryManaPoolRepository;
  let manaPool: ManaPool;

  beforeEach(() => {
    repository = new InMemoryManaPoolRepository();
    manaPool = new ManaPool("test-pool-1", 30, 99);
  });

  describe("保存と取得", () => {
    it("魔力プールを保存できる", async () => {
      const result = await repository.save(manaPool);
      
      expect(result.isSuccess).toBe(true);
      expect(result.savedPool?.getId()).toBe("test-pool-1");
    });

    it("保存した魔力プールを取得できる", async () => {
      await repository.save(manaPool);
      
      const retrieved = await repository.findById("test-pool-1");
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.getId()).toBe("test-pool-1");
      expect(retrieved?.getCurrentMana()).toBe(30);
      expect(retrieved?.getMaxMana()).toBe(99);
    });

    it("存在しないIDで取得するとundefinedが返される", async () => {
      const retrieved = await repository.findById("non-existent");
      
      expect(retrieved).toBeUndefined();
    });

    it("同じIDで複数回保存すると上書きされる", async () => {
      await repository.save(manaPool);
      
      // 魔力を変更
      const { ManaTransaction } = await import("../../../src/domain/value-objects/mana-transaction");
      const transaction = new ManaTransaction(20, "generation", Date.now());
      manaPool.generateMana(transaction);
      
      await repository.save(manaPool);
      
      const retrieved = await repository.findById("test-pool-1");
      expect(retrieved?.getCurrentMana()).toBe(50); // 30 + 20
    });
  });

  describe("複数プール管理", () => {
    it("複数の魔力プールを保存・取得できる", async () => {
      const pool1 = new ManaPool("pool-1", 10, 50);
      const pool2 = new ManaPool("pool-2", 20, 80);
      const pool3 = new ManaPool("pool-3", 30, 99);
      
      await repository.save(pool1);
      await repository.save(pool2);
      await repository.save(pool3);
      
      const retrieved1 = await repository.findById("pool-1");
      const retrieved2 = await repository.findById("pool-2");
      const retrieved3 = await repository.findById("pool-3");
      
      expect(retrieved1?.getCurrentMana()).toBe(10);
      expect(retrieved2?.getCurrentMana()).toBe(20);
      expect(retrieved3?.getCurrentMana()).toBe(30);
    });

    it("すべての魔力プールを取得できる", async () => {
      const pool1 = new ManaPool("pool-1", 10, 50);
      const pool2 = new ManaPool("pool-2", 20, 80);
      
      await repository.save(pool1);
      await repository.save(pool2);
      
      const allPools = await repository.findAll();
      
      expect(allPools).toHaveLength(2);
      expect(allPools.map(p => p.getId())).toContain("pool-1");
      expect(allPools.map(p => p.getId())).toContain("pool-2");
    });

    it("空の場合はすべて取得で空配列が返される", async () => {
      const allPools = await repository.findAll();
      
      expect(allPools).toHaveLength(0);
    });
  });

  describe("削除", () => {
    it("魔力プールを削除できる", async () => {
      await repository.save(manaPool);
      
      const deleteResult = await repository.delete("test-pool-1");
      
      expect(deleteResult.isSuccess).toBe(true);
      
      const retrieved = await repository.findById("test-pool-1");
      expect(retrieved).toBeUndefined();
    });

    it("存在しないIDを削除しようとしてもエラーにならない", async () => {
      const deleteResult = await repository.delete("non-existent");
      
      expect(deleteResult.isSuccess).toBe(true);
    });

    it("すべての魔力プールを削除できる", async () => {
      const pool1 = new ManaPool("pool-1", 10, 50);
      const pool2 = new ManaPool("pool-2", 20, 80);
      
      await repository.save(pool1);
      await repository.save(pool2);
      
      const clearResult = await repository.clear();
      
      expect(clearResult.isSuccess).toBe(true);
      
      const allPools = await repository.findAll();
      expect(allPools).toHaveLength(0);
    });
  });

  describe("検索とフィルタリング", () => {
    beforeEach(async () => {
      const pool1 = new ManaPool("low-mana", 5, 50);
      const pool2 = new ManaPool("mid-mana", 25, 50);
      const pool3 = new ManaPool("high-mana", 45, 50);
      const pool4 = new ManaPool("max-mana", 99, 99);
      
      await repository.save(pool1);
      await repository.save(pool2);
      await repository.save(pool3);
      await repository.save(pool4);
    });

    it("魔力値でフィルタリングできる", async () => {
      const lowManaPools = await repository.findByManaRange(0, 20);
      
      expect(lowManaPools).toHaveLength(1);
      expect(lowManaPools[0].getId()).toBe("low-mana");
    });

    it("上限に達したプールを取得できる", async () => {
      const maxPools = await repository.findAtMaxCapacity();
      
      expect(maxPools).toHaveLength(1);
      expect(maxPools[0].getId()).toBe("max-mana");
    });

    it("魔力不足のプールを取得できる", async () => {
      const lowPools = await repository.findLowMana(20);
      
      expect(lowPools).toHaveLength(1);
      expect(lowPools[0].getId()).toBe("low-mana");
    });
  });

  describe("統計情報", () => {
    beforeEach(async () => {
      const pool1 = new ManaPool("pool-1", 10, 50);
      const pool2 = new ManaPool("pool-2", 30, 60);
      const pool3 = new ManaPool("pool-3", 50, 100);
      
      await repository.save(pool1);
      await repository.save(pool2);
      await repository.save(pool3);
    });

    it("統計情報を取得できる", async () => {
      const stats = await repository.getStatistics();
      
      expect(stats.totalPools).toBe(3);
      expect(stats.totalMana).toBe(90); // 10 + 30 + 50
      expect(stats.averageMana).toBeCloseTo(30, 1);
      expect(stats.totalCapacity).toBe(210); // 50 + 60 + 100
      expect(stats.averageCapacity).toBeCloseTo(70, 1);
    });

    it("空の場合の統計情報", async () => {
      await repository.clear();
      
      const stats = await repository.getStatistics();
      
      expect(stats.totalPools).toBe(0);
      expect(stats.totalMana).toBe(0);
      expect(stats.averageMana).toBe(0);
      expect(stats.totalCapacity).toBe(0);
      expect(stats.averageCapacity).toBe(0);
    });
  });

  describe("エラーハンドリング", () => {
    it("nullの魔力プールを保存しようとするとエラー", async () => {
      const result = await repository.save(null as any);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("魔力プールが無効");
    });

    it("空のIDで取得しようとするとundefined", async () => {
      const retrieved = await repository.findById("");
      
      expect(retrieved).toBeUndefined();
    });

    it("空のIDで削除しようとしてもエラーにならない", async () => {
      const result = await repository.delete("");
      
      expect(result.isSuccess).toBe(true);
    });
  });

  describe("パフォーマンス", () => {
    it("大量の魔力プールを効率的に処理できる", async () => {
      const pools: ManaPool[] = [];
      
      // 1000個の魔力プールを作成
      for (let i = 0; i < 1000; i++) {
        pools.push(new ManaPool(`pool-${i}`, i % 100, 99));
      }
      
      // 保存
      const startSave = Date.now();
      for (const pool of pools) {
        await repository.save(pool);
      }
      const saveDuration = Date.now() - startSave;
      
      // 取得
      const startRetrieve = Date.now();
      const allPools = await repository.findAll();
      const retrieveDuration = Date.now() - startRetrieve;
      
      expect(allPools).toHaveLength(1000);
      expect(saveDuration).toBeLessThan(1000); // 1秒以内
      expect(retrieveDuration).toBeLessThan(100); // 100ms以内
    });
  });
});