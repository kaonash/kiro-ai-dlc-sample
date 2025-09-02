import { describe, it, expect, beforeEach } from "bun:test";
import { EndGameSessionUseCase } from "../../../src/application/use-cases/end-game-session-use-case.js";
import { GameSession } from "../../../src/domain/entities/game-session.js";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { Card } from "../../../src/domain/entities/card.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { GameEndReason } from "../../../src/domain/value-objects/game-end-reason.js";
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

describe("EndGameSessionUseCase", () => {
  let useCase: EndGameSessionUseCase;
  let eventBus: InMemoryEventBus;
  let mockTimeProvider: MockTimeProvider;
  let cardPool: CardPool;
  let cardLibrary: CardLibrary;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
    mockTimeProvider = new MockTimeProvider();
    mockTimeProvider.setCurrentTime(1000);
    useCase = new EndGameSessionUseCase(eventBus);

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
    it("時間切れでゲームを終了できる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const gameCompletedEvents: any[] = [];
      const gameEndedEvents: any[] = [];
      eventBus.subscribe("GameCompletedEvent", (event) => {
        gameCompletedEvents.push(event);
      });
      eventBus.subscribe("GameEndedEvent", (event) => {
        gameEndedEvents.push(event);
      });

      const result = await useCase.execute({
        gameSession,
        reason: GameEndReason.timeUp()
      });

      expect(result.success).toBe(true);
      expect(gameSession.isActive).toBe(false);
      expect(gameSession.state.isCompleted()).toBe(true);
      expect(gameSession.endedAt).toBeInstanceOf(Date);
      expect(gameCompletedEvents).toHaveLength(1);
      expect(gameEndedEvents).toHaveLength(1);
    });

    it("プレイヤー死亡でゲームを終了できる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const gameOverEvents: any[] = [];
      const gameEndedEvents: any[] = [];
      eventBus.subscribe("GameOverEvent", (event) => {
        gameOverEvents.push(event);
      });
      eventBus.subscribe("GameEndedEvent", (event) => {
        gameEndedEvents.push(event);
      });

      const result = await useCase.execute({
        gameSession,
        reason: GameEndReason.playerDeath()
      });

      expect(result.success).toBe(true);
      expect(gameSession.isActive).toBe(false);
      expect(gameSession.state.isGameOver()).toBe(true);
      expect(gameOverEvents).toHaveLength(1);
      expect(gameEndedEvents).toHaveLength(1);
    });

    it("ユーザー離脱でゲームを終了できる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const gameEndedEvents: any[] = [];
      eventBus.subscribe("GameEndedEvent", (event) => {
        gameEndedEvents.push(event);
      });

      const result = await useCase.execute({
        gameSession,
        reason: GameEndReason.userQuit()
      });

      expect(result.success).toBe(true);
      expect(gameSession.isActive).toBe(false);
      expect(gameSession.state.isGameOver()).toBe(true);
      expect(gameEndedEvents).toHaveLength(1);
    });

    it("ゲーム終了時に手札のカードがライブラリに記録される", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();
      const handCards = gameSession.hand.getCards();

      await useCase.execute({
        gameSession,
        reason: GameEndReason.timeUp()
      });

      for (const card of handCards) {
        expect(cardLibrary.hasDiscovered(card.id)).toBe(true);
      }
    });

    it("ゲーム終了時の統計情報が正しく記録される", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();
      
      // スコアと時間を進める
      gameSession.handleEnemyDefeated({ isNormal: () => true, isElite: () => false, isBoss: () => false } as any);
      mockTimeProvider.advanceTime(90000); // 90秒経過

      const gameCompletedEvents: any[] = [];
      eventBus.subscribe("GameCompletedEvent", (event) => {
        gameCompletedEvents.push(event);
      });

      await useCase.execute({
        gameSession,
        reason: GameEndReason.timeUp()
      });

      expect(gameCompletedEvents).toHaveLength(1);
      const event = gameCompletedEvents[0];
      expect(event.finalScore).toBe(10);
      expect(event.enemiesDefeated).toBe(1);
      expect(event.survivalTime).toBe(90);
    });
  });

  describe("異常なケース", () => {
    it("非アクティブなゲームを終了するとエラー", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      // ゲームを開始しない

      const result = await useCase.execute({
        gameSession,
        reason: GameEndReason.timeUp()
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("ゲームがアクティブではありません");
    });

    it("ゲームセッションがnullの場合はエラー", async () => {
      const result = await useCase.execute({
        gameSession: null as any,
        reason: GameEndReason.timeUp()
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("ゲームセッションが指定されていません");
    });

    it("終了理由がnullの場合はエラー", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const result = await useCase.execute({
        gameSession,
        reason: null as any
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("終了理由が指定されていません");
    });

    it("既に終了したゲームを再度終了するとエラー", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();
      gameSession.endGame(GameEndReason.timeUp());

      const result = await useCase.execute({
        gameSession,
        reason: GameEndReason.userQuit()
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("ゲームがアクティブではありません");
    });
  });

  describe("イベント処理", () => {
    it("時間切れ終了時に適切なイベントが発行される", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const allEvents: { type: string; event: any }[] = [];
      eventBus.subscribe("GameCompletedEvent", (event) => {
        allEvents.push({ type: "GameCompletedEvent", event });
      });
      eventBus.subscribe("GameEndedEvent", (event) => {
        allEvents.push({ type: "GameEndedEvent", event });
      });

      await useCase.execute({
        gameSession,
        reason: GameEndReason.timeUp()
      });

      expect(allEvents).toHaveLength(2);
      expect(allEvents[0].type).toBe("GameCompletedEvent");
      expect(allEvents[1].type).toBe("GameEndedEvent");
      expect(allEvents[1].event.endReason.isTimeUp()).toBe(true);
    });

    it("プレイヤー死亡終了時に適切なイベントが発行される", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const allEvents: { type: string; event: any }[] = [];
      eventBus.subscribe("GameOverEvent", (event) => {
        allEvents.push({ type: "GameOverEvent", event });
      });
      eventBus.subscribe("GameEndedEvent", (event) => {
        allEvents.push({ type: "GameEndedEvent", event });
      });

      await useCase.execute({
        gameSession,
        reason: GameEndReason.playerDeath()
      });

      expect(allEvents).toHaveLength(2);
      expect(allEvents[0].type).toBe("GameOverEvent");
      expect(allEvents[1].type).toBe("GameEndedEvent");
      expect(allEvents[1].event.endReason.isPlayerDeath()).toBe(true);
    });

    it("ユーザー離脱時はGameEndedEventのみ発行される", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const allEvents: { type: string; event: any }[] = [];
      eventBus.subscribe("GameCompletedEvent", (event) => {
        allEvents.push({ type: "GameCompletedEvent", event });
      });
      eventBus.subscribe("GameOverEvent", (event) => {
        allEvents.push({ type: "GameOverEvent", event });
      });
      eventBus.subscribe("GameEndedEvent", (event) => {
        allEvents.push({ type: "GameEndedEvent", event });
      });

      await useCase.execute({
        gameSession,
        reason: GameEndReason.userQuit()
      });

      expect(allEvents).toHaveLength(1);
      expect(allEvents[0].type).toBe("GameEndedEvent");
      expect(allEvents[0].event.endReason.isUserQuit()).toBe(true);
    });

    it("エラー時はイベントが発行されない", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      // ゲームを開始しない

      const events: any[] = [];
      eventBus.subscribe("GameEndedEvent", (event) => {
        events.push(event);
      });

      await useCase.execute({
        gameSession,
        reason: GameEndReason.timeUp()
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("一時停止中の終了", () => {
    it("一時停止中のゲームを終了できる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();
      gameSession.pause();

      const result = await useCase.execute({
        gameSession,
        reason: GameEndReason.userQuit()
      });

      expect(result.success).toBe(true);
      expect(gameSession.isActive).toBe(false);
      expect(gameSession.state.isGameOver()).toBe(true);
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量のゲーム終了処理でもパフォーマンスが維持される", async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const gameSession = new GameSession(`session-${i}`, cardPool, cardLibrary, 180, 100, mockTimeProvider);
        gameSession.startGame();
        
        await useCase.execute({
          gameSession,
          reason: GameEndReason.timeUp()
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // 1秒以内
    });
  });

  describe("統計情報の正確性", () => {
    it("複雑なゲーム状態での統計情報が正確", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();
      
      // 複数の敵を撃破
      gameSession.handleEnemyDefeated({ isNormal: () => true, isElite: () => false, isBoss: () => false } as any);
      gameSession.handleEnemyDefeated({ isNormal: () => false, isElite: () => true, isBoss: () => false } as any);
      gameSession.handleEnemyDefeated({ isNormal: () => false, isElite: () => false, isBoss: () => true } as any);
      
      // カードをプレイ
      const handCards = gameSession.hand.getCards();
      gameSession.playCard(handCards[0].id);
      gameSession.playCard(handCards[1].id);
      
      // 時間を進める
      mockTimeProvider.advanceTime(120000); // 120秒経過

      const gameCompletedEvents: any[] = [];
      eventBus.subscribe("GameCompletedEvent", (event) => {
        gameCompletedEvents.push(event);
      });

      await useCase.execute({
        gameSession,
        reason: GameEndReason.timeUp()
      });

      const event = gameCompletedEvents[0];
      expect(event.finalScore).toBe(140); // 10 + 30 + 100
      expect(event.enemiesDefeated).toBe(3);
      expect(event.survivalTime).toBe(120);
      
      const stats = gameSession.getSessionStats();
      expect(stats.cardsPlayed).toBe(2);
    });
  });
});