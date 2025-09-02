import { describe, expect, it, beforeEach } from "bun:test";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { Card } from "../../../src/domain/entities/card.js";
import { GameSession } from "../../../src/domain/entities/game-session.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";
import { GameState } from "../../../src/domain/value-objects/game-state.js";
import { GameEndReason } from "../../../src/domain/value-objects/game-end-reason.js";
import { EnemyType } from "../../../src/domain/value-objects/enemy-type.js";

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

describe("GameSession", () => {
  let mockTimeProvider: MockTimeProvider;

  beforeEach(() => {
    mockTimeProvider = new MockTimeProvider();
    mockTimeProvider.setCurrentTime(1000);
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
    it("ゲームセッションを作成できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();

      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      expect(session.id).toBe("session-001");
      expect(session.hand.isEmpty).toBe(true);
      expect(session.isActive).toBe(false);
      expect(session.state.isNotStarted()).toBe(true);
      expect(session.timer.totalDuration).toBe(180);
      expect(session.baseHealth.maxHealth).toBe(100);
      expect(session.score.getTotalScore()).toBe(0);
    });

    it("ゲームを開始して手札にカードを配布できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();

      expect(session.isActive).toBe(true);
      expect(session.hand.size).toBe(8);
      expect(session.hand.isFull).toBe(true);
      expect(session.state.isRunning()).toBe(true);
      expect(session.timer.isRunning).toBe(true);
      expect(session.baseHealth.currentHealth.value).toBe(100);
      expect(session.startedAt).toBeInstanceOf(Date);
    });

    it("手札のカードをプレイできる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      const handCards = session.hand.getCards();
      const cardToPlay = handCards[0];

      const playedCard = session.playCard(cardToPlay.id);

      expect(playedCard).toEqual(cardToPlay);
      expect(session.hand.size).toBe(7);
      expect(session.hand.hasCard(cardToPlay.id)).toBe(false);
    });

    it("カードをプレイするとライブラリに発見として記録される", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      const handCards = session.hand.getCards();
      const cardToPlay = handCards[0];

      session.playCard(cardToPlay.id);

      expect(cardLibrary.hasDiscovered(cardToPlay.id)).toBe(true);
    });

    it("ゲームを終了できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      session.endGame();

      expect(session.isActive).toBe(false);
      expect(session.state.isGameOver()).toBe(true);
    });

    it("ゲーム終了時に手札のすべてのカードがライブラリに記録される", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      const handCards = session.hand.getCards();
      session.endGame();

      for (const card of handCards) {
        expect(cardLibrary.hasDiscovered(card.id)).toBe(true);
      }
    });

    it("新しいゲームを開始できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      session.endGame();
      session.startNewGame();

      expect(session.isActive).toBe(true);
      expect(session.hand.size).toBe(8);
      expect(session.state.isRunning()).toBe(true);
    });

    it("ゲームセッションの統計を取得できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      const handCards = session.hand.getCards();
      session.playCard(handCards[0].id);
      session.playCard(handCards[1].id);

      const stats = session.getSessionStats();
      expect(stats.cardsPlayed).toBe(2);
      expect(stats.cardsInHand).toBe(6);
      expect(stats.isActive).toBe(true);
      expect(stats.currentScore).toBe(0);
      expect(stats.currentHealth).toBe(100);
      expect(stats.healthPercentage).toBe(100);
      expect(stats.remainingTime).toBe(180);
      expect(stats.gameState).toBe("Running");
      expect(stats.enemiesDefeated).toBe(0);
    });
  });

  describe("異常なケース", () => {
    it("空のIDでゲームセッションを作成するとエラーが発生する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();

      expect(() => new GameSession("", cardPool, cardLibrary, 180, 100, mockTimeProvider)).toThrow(
        "ゲームセッションIDは空であってはいけません"
      );
    });

    it("カードプールが小さすぎる場合、ゲーム開始でエラーが発生する", () => {
      const cards = createTestCards(5); // 8枚未満
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      expect(() => session.startGame()).toThrow("カードプールに十分なカードがありません");
    });

    it("既にアクティブなゲームを開始しようとするとエラーが発生する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      expect(() => session.startGame()).toThrow("ゲームは既にアクティブです");
    });

    it("非アクティブなゲームでカードをプレイしようとするとエラーが発生する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      expect(() => session.playCard("card-001")).toThrow("ゲームがアクティブではありません");
    });

    it("手札にないカードをプレイしようとするとエラーが発生する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      expect(() => session.playCard("non-existent")).toThrow("指定されたカードが手札にありません");
    });

    it("非アクティブなゲームを終了しようとするとエラーが発生する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      expect(() => session.endGame()).toThrow("ゲームがアクティブではありません");
    });
  });

  describe("集約の整合性", () => {
    it("手札とライブラリの状態が一貫している", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      const initialHandSize = session.hand.size;
      const initialLibrarySize = cardLibrary.size;

      const handCards = session.hand.getCards();
      const cardToPlay = handCards[0];
      session.playCard(cardToPlay.id);

      expect(session.hand.size).toBe(initialHandSize - 1);
      expect(cardLibrary.size).toBe(initialLibrarySize + 1);
      expect(cardLibrary.hasDiscovered(cardToPlay.id)).toBe(true);
    });
  });

  // 新しいゲームセッション管理機能のテスト
  describe("ゲームセッション管理機能", () => {
    it("ゲームを一時停止できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      session.pause();

      expect(session.state.isPaused()).toBe(true);
      expect(session.timer.isPaused).toBe(true);
    });

    it("一時停止されたゲームを再開できる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      session.pause();
      session.resume();

      expect(session.state.isRunning()).toBe(true);
      expect(session.timer.isRunning).toBe(true);
    });

    it("敵撃破を処理してスコアが加算される", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      session.handleEnemyDefeated(EnemyType.normal());
      session.handleEnemyDefeated(EnemyType.elite());

      expect(session.score.getTotalScore()).toBe(40); // 10 + 30
      expect(session.score.getEnemyDefeatedCount()).toBe(2);
    });

    it("基地ダメージを処理して体力が減少する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      session.handleBaseDamaged(30);

      expect(session.baseHealth.currentHealth.value).toBe(70);
      expect(session.baseHealth.getHealthPercentage()).toBe(70);
    });

    it("時間切れでゲーム終了判定がtrueになる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      mockTimeProvider.advanceTime(180000); // 180秒経過

      expect(session.isGameOver()).toBe(true);
      expect(session.getEndReason()?.isTimeUp()).toBe(true);
    });

    it("基地破壊でゲーム終了判定がtrueになる", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      session.handleBaseDamaged(100); // 基地破壊

      expect(session.isGameOver()).toBe(true);
      expect(session.getEndReason()?.isPlayerDeath()).toBe(true);
    });

    it("ゲーム終了時に適切な状態に遷移する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      session.endGame(GameEndReason.timeUp());

      expect(session.state.isCompleted()).toBe(true);
      expect(session.isActive).toBe(false);
      expect(session.endedAt).toBeInstanceOf(Date);
    });

    it("非アクティブ状態では敵撃破やダメージ処理を無視する", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      // ゲームを開始せずに処理を試行
      session.handleEnemyDefeated(EnemyType.normal());
      session.handleBaseDamaged(30);

      expect(session.score.getTotalScore()).toBe(0);
      expect(session.baseHealth.currentHealth.value).toBe(100);
    });
  });

  describe("ゲームセッション管理のエラーケース", () => {
    it("実行中でないゲームを一時停止するとエラー", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      expect(() => session.pause()).toThrow("実行中のゲームのみ一時停止できます");
    });

    it("一時停止中でないゲームを再開するとエラー", () => {
      const cards = createTestCards(30);
      const cardPool = new CardPool(cards);
      const cardLibrary = new CardLibrary();
      const session = new GameSession("session-001", cardPool, cardLibrary, 180, 100, mockTimeProvider);

      session.startGame();
      expect(() => session.resume()).toThrow("一時停止中のゲームのみ再開できます");
    });
  });
});
