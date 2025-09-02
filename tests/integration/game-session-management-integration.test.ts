import { describe, it, expect, beforeEach } from "bun:test";
import { GameSession } from "../../src/domain/entities/game-session.js";
import { CardPool } from "../../src/domain/entities/card-pool.js";
import { CardLibrary } from "../../src/domain/entities/card-library.js";
import { Card } from "../../src/domain/entities/card.js";
import { CardCost } from "../../src/domain/value-objects/card-cost.js";
import { TowerType } from "../../src/domain/value-objects/tower-type.js";
import { SpecialAbility } from "../../src/domain/value-objects/special-ability.js";
import { EnemyType } from "../../src/domain/value-objects/enemy-type.js";
import { GameEndReason } from "../../src/domain/value-objects/game-end-reason.js";
import { StartGameSessionUseCase } from "../../src/application/use-cases/start-game-session-use-case.js";
import { UpdateGameSessionUseCase } from "../../src/application/use-cases/update-game-session-use-case.js";
import { EndGameSessionUseCase } from "../../src/application/use-cases/end-game-session-use-case.js";
import { GameEndConditionService } from "../../src/domain/services/game-end-condition-service.js";
import { ScoreCalculationService } from "../../src/domain/services/score-calculation-service.js";
import { InMemoryEventBus } from "../../src/infrastructure/events/in-memory-event-bus.js";

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

describe("ゲームセッション管理統合テスト", () => {
  let mockTimeProvider: MockTimeProvider;
  let eventBus: InMemoryEventBus;
  let endConditionService: GameEndConditionService;
  let scoreCalculationService: ScoreCalculationService;
  let startGameUseCase: StartGameSessionUseCase;
  let updateGameUseCase: UpdateGameSessionUseCase;
  let endGameUseCase: EndGameSessionUseCase;
  let cardPool: CardPool;
  let cardLibrary: CardLibrary;

  beforeEach(() => {
    mockTimeProvider = new MockTimeProvider();
    mockTimeProvider.setCurrentTime(1000);
    eventBus = new InMemoryEventBus();
    endConditionService = new GameEndConditionService();
    scoreCalculationService = new ScoreCalculationService();
    
    startGameUseCase = new StartGameSessionUseCase(eventBus);
    updateGameUseCase = new UpdateGameSessionUseCase(eventBus, endConditionService);
    endGameUseCase = new EndGameSessionUseCase(eventBus);

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

  describe("完全なゲームフロー", () => {
    it("ゲーム開始から時間切れ終了まで", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      
      // イベント収集
      const events: { type: string; event: any }[] = [];
      eventBus.subscribe("GameStartedEvent", (event) => {
        events.push({ type: "GameStartedEvent", event });
      });
      eventBus.subscribe("ScoreUpdatedEvent", (event) => {
        events.push({ type: "ScoreUpdatedEvent", event });
      });
      eventBus.subscribe("GameCompletedEvent", (event) => {
        events.push({ type: "GameCompletedEvent", event });
      });
      eventBus.subscribe("GameEndedEvent", (event) => {
        events.push({ type: "GameEndedEvent", event });
      });

      // 1. ゲーム開始
      const startResult = await startGameUseCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      expect(startResult.success).toBe(true);
      expect(gameSession.isActive).toBe(true);
      expect(gameSession.state.isRunning()).toBe(true);

      // 2. 敵撃破でスコア獲得
      await updateGameUseCase.execute({
        gameSession,
        updateType: "enemyDefeated",
        enemyType: EnemyType.normal()
      });

      await updateGameUseCase.execute({
        gameSession,
        updateType: "enemyDefeated",
        enemyType: EnemyType.elite()
      });

      expect(gameSession.score.getTotalScore()).toBe(40);

      // 3. 時間経過
      mockTimeProvider.advanceTime(90000); // 90秒経過

      await updateGameUseCase.execute({
        gameSession,
        updateType: "timerUpdate"
      });

      expect(gameSession.timer.getRemainingSeconds()).toBe(90);

      // 4. さらに時間経過して終了
      mockTimeProvider.advanceTime(90000); // さらに90秒経過（合計180秒）

      const updateResult = await updateGameUseCase.execute({
        gameSession,
        updateType: "timerUpdate"
      });

      expect(updateResult.gameEnded).toBe(true);
      expect(gameSession.state.isCompleted()).toBe(true);
      expect(gameSession.isActive).toBe(false);

      // イベントの確認
      expect(events).toHaveLength(5);
      expect(events[0].type).toBe("GameStartedEvent");
      expect(events[1].type).toBe("ScoreUpdatedEvent");
      expect(events[2].type).toBe("ScoreUpdatedEvent");
      expect(events[3].type).toBe("GameCompletedEvent");
      expect(events[4].type).toBe("GameEndedEvent");
    });

    it("ゲーム開始から基地破壊終了まで", async () => {
      const gameSession = new GameSession("session-002", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      
      // イベント収集
      const events: { type: string; event: any }[] = [];
      eventBus.subscribe("GameStartedEvent", (event) => {
        events.push({ type: "GameStartedEvent", event });
      });
      eventBus.subscribe("HealthUpdatedEvent", (event) => {
        events.push({ type: "HealthUpdatedEvent", event });
      });
      eventBus.subscribe("GameOverEvent", (event) => {
        events.push({ type: "GameOverEvent", event });
      });
      eventBus.subscribe("GameEndedEvent", (event) => {
        events.push({ type: "GameEndedEvent", event });
      });

      // 1. ゲーム開始
      await startGameUseCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      // 2. 基地にダメージ
      await updateGameUseCase.execute({
        gameSession,
        updateType: "baseDamaged",
        damage: 60
      });

      expect(gameSession.baseHealth.currentHealth.value).toBe(40);

      // 3. 基地破壊
      const updateResult = await updateGameUseCase.execute({
        gameSession,
        updateType: "baseDamaged",
        damage: 40
      });

      expect(updateResult.gameEnded).toBe(true);
      expect(gameSession.state.isGameOver()).toBe(true);
      expect(gameSession.isActive).toBe(false);

      // イベントの確認
      expect(events).toHaveLength(5);
      expect(events[0].type).toBe("GameStartedEvent");
      expect(events[1].type).toBe("HealthUpdatedEvent");
      expect(events[2].type).toBe("HealthUpdatedEvent");
      expect(events[3].type).toBe("GameOverEvent");
      expect(events[4].type).toBe("GameEndedEvent");
    });

    it("一時停止・再開を含むゲームフロー", async () => {
      const gameSession = new GameSession("session-003", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      
      // イベント収集
      const events: { type: string; event: any }[] = [];
      eventBus.subscribe("GamePausedEvent", (event) => {
        events.push({ type: "GamePausedEvent", event });
      });
      eventBus.subscribe("GameResumedEvent", (event) => {
        events.push({ type: "GameResumedEvent", event });
      });

      // 1. ゲーム開始
      await startGameUseCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      // 2. 時間経過
      mockTimeProvider.advanceTime(60000); // 60秒経過

      // 3. 一時停止
      await updateGameUseCase.execute({
        gameSession,
        updateType: "pause"
      });

      expect(gameSession.state.isPaused()).toBe(true);

      // 4. 一時停止中に時間経過（ゲーム時間は進まない）
      mockTimeProvider.advanceTime(30000); // 30秒経過

      // 5. 再開
      await updateGameUseCase.execute({
        gameSession,
        updateType: "resume"
      });

      expect(gameSession.state.isRunning()).toBe(true);

      // 6. さらに時間経過
      mockTimeProvider.advanceTime(60000); // 60秒経過

      await updateGameUseCase.execute({
        gameSession,
        updateType: "timerUpdate"
      });

      // 一時停止中の30秒は含まれないため、残り時間は60秒
      expect(gameSession.timer.getRemainingSeconds()).toBe(60);

      // イベントの確認
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe("GamePausedEvent");
      expect(events[1].type).toBe("GameResumedEvent");
    });
  });

  describe("複雑なゲームシナリオ", () => {
    it("カードプレイと敵撃破を組み合わせたシナリオ", async () => {
      const gameSession = new GameSession("session-004", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      
      // ゲーム開始
      await startGameUseCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      // カードをプレイ
      const handCards = gameSession.hand.getCards();
      gameSession.playCard(handCards[0].id);
      gameSession.playCard(handCards[1].id);

      // 敵を撃破
      await updateGameUseCase.execute({
        gameSession,
        updateType: "enemyDefeated",
        enemyType: EnemyType.boss()
      });

      // 基地にダメージ
      await updateGameUseCase.execute({
        gameSession,
        updateType: "baseDamaged",
        damage: 25
      });

      // 統計確認
      const stats = gameSession.getSessionStats();
      expect(stats.cardsPlayed).toBe(2);
      expect(stats.cardsInHand).toBe(6);
      expect(stats.currentScore).toBe(100);
      expect(stats.currentHealth).toBe(75);
      expect(stats.enemiesDefeated).toBe(1);

      // ゲーム終了
      await endGameUseCase.execute({
        gameSession,
        reason: GameEndReason.userQuit()
      });

      expect(gameSession.isActive).toBe(false);
      expect(cardLibrary.size).toBe(8); // 手札8枚がすべてライブラリに記録
    });

    it("大量の敵撃破とスコア計算", async () => {
      const gameSession = new GameSession("session-005", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      
      await startGameUseCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      // 大量の敵を撃破
      for (let i = 0; i < 50; i++) {
        await updateGameUseCase.execute({
          gameSession,
          updateType: "enemyDefeated",
          enemyType: EnemyType.normal()
        });
      }

      for (let i = 0; i < 20; i++) {
        await updateGameUseCase.execute({
          gameSession,
          updateType: "enemyDefeated",
          enemyType: EnemyType.elite()
        });
      }

      for (let i = 0; i < 5; i++) {
        await updateGameUseCase.execute({
          gameSession,
          updateType: "enemyDefeated",
          enemyType: EnemyType.boss()
        });
      }

      // スコア確認
      const expectedScore = (50 * 10) + (20 * 30) + (5 * 100); // 500 + 600 + 500 = 1600
      expect(gameSession.score.getTotalScore()).toBe(expectedScore);
      expect(gameSession.score.getEnemyDefeatedCount()).toBe(75);

      // 時間切れで終了
      mockTimeProvider.advanceTime(180000);
      const updateResult = await updateGameUseCase.execute({
        gameSession,
        updateType: "timerUpdate"
      });

      expect(updateResult.gameEnded).toBe(true);
      expect(gameSession.state.isCompleted()).toBe(true);
    });
  });

  describe("エラーハンドリング統合テスト", () => {
    it("無効な操作の連続でもシステムが安定している", async () => {
      const gameSession = new GameSession("session-006", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      
      // ゲーム開始前の無効な操作
      let result = await updateGameUseCase.execute({
        gameSession,
        updateType: "pause"
      });
      expect(result.success).toBe(false);

      result = await endGameUseCase.execute({
        gameSession,
        reason: GameEndReason.timeUp()
      });
      expect(result.success).toBe(false);

      // ゲーム開始
      await startGameUseCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });

      // 重複開始の試行
      result = await startGameUseCase.execute({
        gameSession,
        gameDuration: 180,
        maxHealth: 100
      });
      expect(result.success).toBe(false);

      // 無効なパラメータでの更新
      result = await updateGameUseCase.execute({
        gameSession,
        updateType: "enemyDefeated"
        // enemyTypeが未指定
      });
      expect(result.success).toBe(false);

      // ゲームは正常に動作し続ける
      result = await updateGameUseCase.execute({
        gameSession,
        updateType: "enemyDefeated",
        enemyType: EnemyType.normal()
      });
      expect(result.success).toBe(true);
      expect(gameSession.score.getTotalScore()).toBe(10);
    });
  });

  describe("パフォーマンス統合テスト", () => {
    it("長時間のゲームセッションでもパフォーマンスが維持される", async () => {
      const gameSession = new GameSession("session-007", cardPool, cardLibrary, 3600, 1000, mockTimeProvider); // 1時間、体力1000
      
      await startGameUseCase.execute({
        gameSession,
        gameDuration: 3600,
        maxHealth: 1000
      });

      const startTime = Date.now();

      // 大量の操作を実行
      for (let i = 0; i < 1000; i++) {
        await updateGameUseCase.execute({
          gameSession,
          updateType: "enemyDefeated",
          enemyType: EnemyType.normal()
        });

        if (i % 100 === 0) {
          await updateGameUseCase.execute({
            gameSession,
            updateType: "baseDamaged",
            damage: 1
          });
        }

        mockTimeProvider.advanceTime(1000); // 1秒ずつ進める
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(gameSession.score.getTotalScore()).toBe(10000);
      expect(gameSession.baseHealth.currentHealth.value).toBe(990);
      expect(duration).toBeLessThan(5000); // 5秒以内
    });
  });

  describe("イベント統合テスト", () => {
    it("すべてのイベントが正しい順序で発行される", async () => {
      const gameSession = new GameSession("session-008", cardPool, cardLibrary, 60, 50, mockTimeProvider); // 短時間、低体力
      
      const events: { type: string; timestamp: number }[] = [];
      const eventTypes = [
        "GameStartedEvent",
        "ScoreUpdatedEvent", 
        "HealthUpdatedEvent",
        "GamePausedEvent",
        "GameResumedEvent",
        "GameOverEvent",
        "GameEndedEvent"
      ];

      for (const eventType of eventTypes) {
        eventBus.subscribe(eventType, () => {
          events.push({ type: eventType, timestamp: Date.now() });
        });
      }

      // ゲーム開始
      await startGameUseCase.execute({
        gameSession,
        gameDuration: 60,
        maxHealth: 50
      });

      // スコア獲得
      await updateGameUseCase.execute({
        gameSession,
        updateType: "enemyDefeated",
        enemyType: EnemyType.normal()
      });

      // ダメージ
      await updateGameUseCase.execute({
        gameSession,
        updateType: "baseDamaged",
        damage: 10
      });

      // 一時停止・再開
      await updateGameUseCase.execute({
        gameSession,
        updateType: "pause"
      });

      await updateGameUseCase.execute({
        gameSession,
        updateType: "resume"
      });

      // 基地破壊
      await updateGameUseCase.execute({
        gameSession,
        updateType: "baseDamaged",
        damage: 40
      });

      // イベントの順序確認
      expect(events).toHaveLength(7);
      expect(events[0].type).toBe("GameStartedEvent");
      expect(events[1].type).toBe("ScoreUpdatedEvent");
      expect(events[2].type).toBe("HealthUpdatedEvent");
      expect(events[3].type).toBe("GamePausedEvent");
      expect(events[4].type).toBe("GameResumedEvent");
      expect(events[5].type).toBe("HealthUpdatedEvent");
      expect(events[6].type).toBe("GameOverEvent");

      // タイムスタンプが昇順であることを確認
      for (let i = 1; i < events.length; i++) {
        expect(events[i].timestamp).toBeGreaterThanOrEqual(events[i - 1].timestamp);
      }
    });
  });
});