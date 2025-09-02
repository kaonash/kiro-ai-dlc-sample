import { describe, it, expect, beforeEach } from "bun:test";
import { StartGameSessionUseCase } from "../../../src/application/use-cases/start-game-session-use-case.js";
import { GameSession } from "../../../src/domain/entities/game-session.js";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { Card } from "../../../src/domain/entities/card.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { InMemoryEventBus } from "../../../src/infrastructure/events/in-memory-event-bus.js";

// モックタイムプロバイダー
class MockTimeProvider {
  private currentTime = 0;

  getCurrentTime(): number {
    return this.currentTime;
  }

  setCurrentTime(time: number): void {
    this.currentTime = time;
  }

  advanceTime(milliseconds: number): void {
    this.currentTime += milliseconds;
  }
}

describe("StartGameSessionUseCase", () => {
  let useCase: StartGameSessionUseCase;
  let eventBus: InMemoryEventBus;
  let mockTimeProvider: MockTimeProvider;
  let cardPool: CardPool;
  let cardLibrary: CardLibrary;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
    mockTimeProvider = new MockTimeProvider();
    mockTimeProvider.setCurrentTime(1000);
    useCase = new StartGameSessionUseCase(eventBus);

    // テスト用カードの作成
    const cards = createTestCards(30);
    cardPool = new CardPool(cards);
    cardLibrary = new CardLibrary();
  });

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
    it("ゲームセッションを開始できる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      const result = await useCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      expect(result.success).toBe(true);
      expect(result.gameSession).toBe(gameSession);
      expect(gameSession.isActive).toBe(true);
      expect(gameSession.state.isRunning()).toBe(true);
      expect(gameSession.timer.isRunning).toBe(true);
      expect(gameSession.baseHealth.currentHealth.value).toBe(100);
    });

    it("GameStartedEventが発行される", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      const events: any[] = [];
      
      eventBus.subscribe("GameStartedEvent", (event) => {
        events.push(event);
      });

      await useCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      expect(events).toHaveLength(1);
      expect(events[0].sessionId).toBe("session-001");
      expect(events[0].initialHealth).toBe(100);
      expect(events[0].gameDuration).toBe(180);
    });

    it("カスタム設定でゲームセッションを開始できる", async () => {
      const gameSession = new GameSession("session-002", cardPool, cardLibrary, 300, 150, mockTimeProvider);

      const result = await useCase.execute({
        gameSession,
        gameDuration: 300,
        maxHealth: 150
      });

      expect(result.success).toBe(true);
      expect(gameSession.timer.totalDuration).toBe(300);
      expect(gameSession.baseHealth.maxHealth).toBe(150);
    });

    it("ゲーム開始後の統計情報が正しい", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      await useCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      const stats = gameSession.getSessionStats();
      expect(stats.isActive).toBe(true);
      expect(stats.cardsInHand).toBe(8);
      expect(stats.cardsPlayed).toBe(0);
      expect(stats.currentScore).toBe(0);
      expect(stats.currentHealth).toBe(100);
      expect(stats.remainingTime).toBe(180);
      expect(stats.gameState).toBe("Running");
    });
  });

  describe("異常なケース", () => {
    it("既にアクティブなゲームセッションを開始するとエラー", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame(); // 既に開始済み

      const result = await useCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("ゲームは既にアクティブです");
    });

    it("カードプールが不十分な場合はエラー", async () => {
      const smallCards = createTestCards(5); // 8枚未満
      const smallCardPool = new CardPool(smallCards);
      const gameSession = new GameSession("session-001", smallCardPool, cardLibrary, 180, 100, mockTimeProvider);

      const result = await useCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("カードプールに十分なカードがありません");
    });

    it("無効なパラメータでエラー", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      const result = await useCase.execute({
        gameSession,
        gameDuration: -1, // 無効な値
        maxHealth: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("無効なパラメータ");
    });

    it("ゲームセッションがnullの場合はエラー", async () => {
      const result = await useCase.execute({
        gameSession: null as any,
        gameDuration: 180,
        maxHealth: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("ゲームセッションが指定されていません");
    });
  });

  describe("イベント処理", () => {
    it("複数のイベントリスナーが正しく呼ばれる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      const events1: any[] = [];
      const events2: any[] = [];
      
      eventBus.subscribe("GameStartedEvent", (event) => {
        events1.push(event);
      });
      
      eventBus.subscribe("GameStartedEvent", (event) => {
        events2.push(event);
      });

      await useCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(1);
      expect(events1[0].sessionId).toBe("session-001");
      expect(events2[0].sessionId).toBe("session-001");
    });

    it("エラー時はイベントが発行されない", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame(); // 既に開始済み
      
      const events: any[] = [];
      eventBus.subscribe("GameStartedEvent", (event) => {
        events.push(event);
      });

      await useCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量のゲームセッション開始でもパフォーマンスが維持される", async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const gameSession = new GameSession(`session-${i}`, cardPool, cardLibrary, 180, 100, mockTimeProvider);
        await useCase.execute({
          gameSession,
          gameDuration: 180,
          maxHealth: 100
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // 1秒以内
    });
  });

  describe("エッジケース", () => {
    it("ゲーム時間が0秒でも開始できる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 0, 100, mockTimeProvider);

      const result = await useCase.execute({
        gameSession,
        gameDuration: 0,
        maxHealth: 100
      });

      expect(result.success).toBe(true);
      expect(gameSession.timer.totalDuration).toBe(0);
    });

    it("最大体力が1でも開始できる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 1, mockTimeProvider);

      const result = await useCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 1
      });

      expect(result.success).toBe(true);
      expect(gameSession.baseHealth.maxHealth).toBe(1);
    });

    it("非常に長いゲーム時間でも開始できる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 86400, 100, mockTimeProvider); // 24時間

      const result = await useCase.execute({
        gameSession,
        gameDuration: 86400,
        maxHealth: 100
      });

      expect(result.success).toBe(true);
      expect(gameSession.timer.totalDuration).toBe(86400);
    });
  });
});