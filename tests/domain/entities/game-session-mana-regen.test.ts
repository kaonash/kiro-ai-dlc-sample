import { describe, it, expect, beforeEach } from "bun:test";
import { GameSession } from "../../../src/domain/entities/game-session.js";
import { JsonCardPoolRepository } from "../../../src/infrastructure/repositories/json-card-pool-repository.js";
import { LocalStorageCardLibraryRepository } from "../../../src/infrastructure/repositories/local-storage-card-library-repository.js";
import type { ICardPoolRepository } from "../../../src/domain/repositories/card-pool-repository.js";
import type { ICardLibraryRepository } from "../../../src/domain/repositories/card-library-repository.js";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { Card } from "../../../src/domain/entities/card.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";

class MockTimeProvider {
  private currentTime = 0;

  getCurrentTime(): number {
    return this.currentTime;
  }

  advance(milliseconds: number): void {
    this.currentTime += milliseconds;
  }
}

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
  private cardLibrary: CardLibrary;

  constructor(cardLibrary: CardLibrary) {
    this.cardLibrary = cardLibrary;
  }

  async load(): Promise<CardLibrary> {
    return this.cardLibrary;
  }

  async save(cardLibrary: CardLibrary): Promise<void> {
    this.cardLibrary = cardLibrary;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

describe("GameSession - マナ回復システム", () => {
  let gameSession: GameSession;
  let cardPoolRepo: MockCardPoolRepository;
  let cardLibraryRepo: MockCardLibraryRepository;
  let mockTimeProvider: MockTimeProvider;

  beforeEach(async () => {
    // テスト用のカードを作成
    const testCards = [
      new Card("card1", "テストカード1", "テスト用の弓兵タワー", new CardCost(2), TowerType.ARCHER, SpecialAbility.NONE),
      new Card("card2", "テストカード2", "テスト用の大砲タワー", new CardCost(3), TowerType.CANNON, SpecialAbility.NONE),
      new Card("card3", "テストカード3", "テスト用の魔法タワー", new CardCost(1), TowerType.MAGIC, SpecialAbility.NONE),
      new Card("card4", "テストカード4", "テスト用の氷タワー", new CardCost(4), TowerType.ICE, SpecialAbility.NONE),
      new Card("card5", "テストカード5", "テスト用の炎タワー", new CardCost(2), TowerType.FIRE, SpecialAbility.NONE),
      new Card("card6", "テストカード6", "テスト用の雷タワー", new CardCost(3), TowerType.LIGHTNING, SpecialAbility.NONE),
      new Card("card7", "テストカード7", "テスト用の毒タワー", new CardCost(1), TowerType.POISON, SpecialAbility.NONE),
      new Card("card8", "テストカード8", "テスト用の支援タワー", new CardCost(5), TowerType.SUPPORT, SpecialAbility.NONE),
    ];

    const cardPool = new CardPool(testCards);
    const cardLibrary = new CardLibrary();
    
    cardPoolRepo = new MockCardPoolRepository(cardPool);
    cardLibraryRepo = new MockCardLibraryRepository(cardLibrary);

    mockTimeProvider = new MockTimeProvider();
    gameSession = new GameSession("test-session", cardPool, cardLibrary, 180, 100, mockTimeProvider);
  });

  describe("マナ回復機能", () => {
    it("ゲーム開始時にマナが初期値に設定される", () => {
      gameSession.startGame();
      
      expect(gameSession.manaPool.getCurrentMana()).toBe(10);
      expect(gameSession.manaPool.getMaxMana()).toBe(100);
    });

    it("1秒経過でマナが1回復する", () => {
      gameSession.startGame();
      
      // マナを消費
      gameSession.manaPool.consumeMana(5);
      expect(gameSession.manaPool.getCurrentMana()).toBe(5);
      
      // 1秒経過
      gameSession.update(1000);
      
      expect(gameSession.manaPool.getCurrentMana()).toBe(6);
    });

    it("2秒経過でマナが2回復する", () => {
      gameSession.startGame();
      
      // マナを消費
      gameSession.manaPool.consumeMana(5);
      expect(gameSession.manaPool.getCurrentMana()).toBe(5);
      
      // 2秒経過
      gameSession.update(2000);
      
      expect(gameSession.manaPool.getCurrentMana()).toBe(7);
    });

    it("最大マナを超えて回復しない", () => {
      gameSession.startGame();
      
      // マナを最大まで回復させる
      gameSession.update(90000); // 90秒経過で90マナ回復（10 + 90 = 100）
      expect(gameSession.manaPool.getCurrentMana()).toBe(100);
      
      // さらに5秒経過（最大値なので回復しない）
      gameSession.update(5000);
      
      expect(gameSession.manaPool.getCurrentMana()).toBe(100);
    });

    it("小刻みな時間経過でも正しく回復する", () => {
      gameSession.startGame();
      
      // マナを消費
      gameSession.manaPool.consumeMana(5);
      expect(gameSession.manaPool.getCurrentMana()).toBe(5);
      
      // 0.5秒ずつ4回更新（合計2秒）
      gameSession.update(500);
      expect(gameSession.manaPool.getCurrentMana()).toBe(5); // まだ1秒未満
      
      gameSession.update(500);
      expect(gameSession.manaPool.getCurrentMana()).toBe(6); // 1秒経過
      
      gameSession.update(500);
      expect(gameSession.manaPool.getCurrentMana()).toBe(6); // まだ2秒未満
      
      gameSession.update(500);
      expect(gameSession.manaPool.getCurrentMana()).toBe(7); // 2秒経過
    });

    it("ゲームが一時停止中はマナが回復しない", () => {
      gameSession.startGame();
      
      // マナを消費
      gameSession.manaPool.consumeMana(3);
      expect(gameSession.manaPool.getCurrentMana()).toBe(7);
      
      // ゲームを一時停止
      gameSession.pause();
      
      // 2秒経過
      gameSession.update(2000);
      
      // 一時停止中なので回復しない
      expect(gameSession.manaPool.getCurrentMana()).toBe(7);
    });

    it("ゲーム再開後にマナ回復が再開される", () => {
      gameSession.startGame();
      
      // マナを消費
      gameSession.manaPool.consumeMana(3);
      expect(gameSession.manaPool.getCurrentMana()).toBe(7);
      
      // ゲームを一時停止
      gameSession.pause();
      gameSession.update(2000); // 一時停止中は回復しない
      expect(gameSession.manaPool.getCurrentMana()).toBe(7);
      
      // ゲームを再開
      gameSession.resume();
      
      // 1秒経過
      gameSession.update(1000);
      
      expect(gameSession.manaPool.getCurrentMana()).toBe(8);
    });

    it("ゲーム終了後はマナが回復しない", () => {
      gameSession.startGame();
      
      // マナを消費
      gameSession.manaPool.consumeMana(3);
      expect(gameSession.manaPool.getCurrentMana()).toBe(7);
      
      // ゲームを終了
      gameSession.endGame();
      
      // 2秒経過
      gameSession.update(2000);
      
      // ゲーム終了後なので回復しない
      expect(gameSession.manaPool.getCurrentMana()).toBe(7);
    });
  });
});