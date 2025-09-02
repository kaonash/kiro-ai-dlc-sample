import { describe, it, expect, beforeEach } from "bun:test";
import { UpdateGameSessionUseCase } from "../../../src/application/use-cases/update-game-session-use-case.js";
import { GameSession } from "../../../src/domain/entities/game-session.js";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { Card } from "../../../src/domain/entities/card.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { EnemyType } from "../../../src/domain/value-objects/enemy-type.js";
import { GameEndConditionService } from "../../../src/domain/services/game-end-condition-service.js";
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

describe("UpdateGameSessionUseCase", () => {
  let useCase: UpdateGameSessionUseCase;
  let eventBus: InMemoryEventBus;
  let endConditionService: GameEndConditionService;
  let mockTimeProvider: MockTimeProvider;
  let cardPool: CardPool;
  let cardLibrary: CardLibrary;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
    endConditionService = new GameEndConditionService();
    mockTimeProvider = new MockTimeProvider();
    mockTimeProvider.setCurrentTime(1000);
    useCase = new UpdateGameSessionUseCase(eventBus, endConditionService);

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

  describe("敵撃破処理", () => {
    it("敵撃破でスコアが更新される", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const events: any[] = [];
      eventBus.subscribe("ScoreUpdatedEvent", (event) => {
        events.push(event);
      });

      const result = await useCase.execute({
        gameSession,
        updateType: "enemyDefeated",
        enemyType: EnemyType.normal()
      });

      expect(result.success).toBe(true);
      expect(gameSession.score.getTotalScore()).toBe(10);
      expect(gameSession.score.getEnemyDefeatedCount()).toBe(1);
      expect(events).toHaveLength(1);
      expect(events[0].newScore).toBe(10);
      expect(events[0].addedPoints).toBe(10);
    });

    it("複数の敵撃破でスコアが累積される", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      await useCase.execute({
        gameSession,
        updateType: "enemyDefeated",
        enemyType: EnemyType.normal()
      });

      await useCase.execute({
        gameSession,
        updateType: "enemyDefeated",
        enemyType: EnemyType.elite()
      });

      expect(gameSession.score.getTotalScore()).toBe(40); // 10 + 30
      expect(gameSession.score.getEnemyDefeatedCount()).toBe(2);
    });

    it("非アクティブなゲームでは敵撃破を無視する", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      // ゲームを開始しない

      const result = await useCase.execute({
        gameSession,
        updateType: "enemyDefeated",
        enemyType: EnemyType.normal()
      });

      expect(result.success).toBe(true);
      expect(gameSession.score.getTotalScore()).toBe(0);
    });
  });

  describe("基地ダメージ処理", () => {
    it("基地ダメージで体力が減少する", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const events: any[] = [];
      eventBus.subscribe("HealthUpdatedEvent", (event) => {
        events.push(event);
      });

      const result = await useCase.execute({
        gameSession,
        updateType: "baseDamaged",
        damage: 30
      });

      expect(result.success).toBe(true);
      expect(gameSession.baseHealth.currentHealth.value).toBe(70);
      expect(events).toHaveLength(1);
      expect(events[0].newHealth).toBe(70);
      expect(events[0].damage).toBe(30);
      expect(events[0].healthPercentage).toBe(70);
    });

    it("基地破壊でゲームオーバーになる", async () => {
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
        updateType: "baseDamaged",
        damage: 100
      });

      expect(result.success).toBe(true);
      expect(gameSession.baseHealth.currentHealth.value).toBe(0);
      expect(gameSession.state.isGameOver()).toBe(true);
      expect(gameSession.isActive).toBe(false);
      expect(gameOverEvents).toHaveLength(1);
      expect(gameEndedEvents).toHaveLength(1);
    });
  });

  describe("タイマー更新処理", () => {
    it("タイマー更新で残り時間が変化する", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();
      mockTimeProvider.advanceTime(30000); // 30秒経過

      const result = await useCase.execute({
        gameSession,
        updateType: "timerUpdate"
      });

      expect(result.success).toBe(true);
      expect(gameSession.timer.getRemainingSeconds()).toBe(150);
    });

    it("時間切れでゲーム完了になる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();
      mockTimeProvider.advanceTime(180000); // 180秒経過

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
        updateType: "timerUpdate"
      });

      expect(result.success).toBe(true);
      expect(gameSession.timer.isTimeUp()).toBe(true);
      expect(gameSession.state.isCompleted()).toBe(true);
      expect(gameSession.isActive).toBe(false);
      expect(gameCompletedEvents).toHaveLength(1);
      expect(gameEndedEvents).toHaveLength(1);
    });
  });

  describe("ゲーム一時停止・再開", () => {
    it("ゲームを一時停止できる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const events: any[] = [];
      eventBus.subscribe("GamePausedEvent", (event) => {
        events.push(event);
      });

      const result = await useCase.execute({
        gameSession,
        updateType: "pause"
      });

      expect(result.success).toBe(true);
      expect(gameSession.state.isPaused()).toBe(true);
      expect(gameSession.timer.isPaused).toBe(true);
      expect(events).toHaveLength(1);
    });

    it("ゲームを再開できる", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();
      gameSession.pause();

      const events: any[] = [];
      eventBus.subscribe("GameResumedEvent", (event) => {
        events.push(event);
      });

      const result = await useCase.execute({
        gameSession,
        updateType: "resume"
      });

      expect(result.success).toBe(true);
      expect(gameSession.state.isRunning()).toBe(true);
      expect(gameSession.timer.isRunning).toBe(true);
      expect(events).toHaveLength(1);
    });
  });

  describe("異常なケース", () => {
    it("無効な更新タイプでエラー", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const result = await useCase.execute({
        gameSession,
        updateType: "invalid" as any
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("無効な更新タイプ");
    });

    it("ゲームセッションがnullの場合はエラー", async () => {
      const result = await useCase.execute({
        gameSession: null as any,
        updateType: "timerUpdate"
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("ゲームセッションが指定されていません");
    });

    it("敵撃破で敵タイプが指定されていない場合はエラー", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const result = await useCase.execute({
        gameSession,
        updateType: "enemyDefeated"
        // enemyTypeが未指定
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("敵タイプが指定されていません");
    });

    it("基地ダメージでダメージ量が指定されていない場合はエラー", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const result = await useCase.execute({
        gameSession,
        updateType: "baseDamaged"
        // damageが未指定
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("ダメージ量が指定されていません");
    });

    it("実行中でないゲームを一時停止するとエラー", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      // ゲームを開始しない

      const result = await useCase.execute({
        gameSession,
        updateType: "pause"
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("実行中のゲームのみ一時停止できます");
    });
  });

  describe("終了条件の優先度", () => {
    it("時間切れと基地破壊が同時の場合は時間切れが優先される", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();
      
      // 基地を破壊寸前まで削る
      gameSession.handleBaseDamaged(99);
      
      // 時間切れにする
      mockTimeProvider.advanceTime(180000);

      const gameCompletedEvents: any[] = [];
      const gameOverEvents: any[] = [];
      eventBus.subscribe("GameCompletedEvent", (event) => {
        gameCompletedEvents.push(event);
      });
      eventBus.subscribe("GameOverEvent", (event) => {
        gameOverEvents.push(event);
      });

      // 基地に最後のダメージを与える（時間切れと同時）
      await useCase.execute({
        gameSession,
        updateType: "baseDamaged",
        damage: 1
      });

      // 時間切れが優先されるべき
      expect(gameCompletedEvents).toHaveLength(1);
      expect(gameOverEvents).toHaveLength(0);
      expect(gameSession.state.isCompleted()).toBe(true);
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量の更新処理でもパフォーマンスが維持される", async () => {
      const gameSession = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);
      gameSession.startGame();

      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        await useCase.execute({
          gameSession,
          updateType: "enemyDefeated",
          enemyType: EnemyType.normal()
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(gameSession.score.getTotalScore()).toBe(10000);
      expect(duration).toBeLessThan(1000); // 1秒以内
    });
  });
});