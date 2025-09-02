import { describe, it, expect } from "bun:test";
import {
  GameStartedEvent,
  GamePausedEvent,
  GameResumedEvent,
  GameCompletedEvent,
  GameOverEvent,
  GameEndedEvent,
  ScoreUpdatedEvent,
  HealthUpdatedEvent,
} from "../../../src/domain/events/game-session-events.js";
import { GameEndReason } from "../../../src/domain/value-objects/game-end-reason.js";
import { EnemyType } from "../../../src/domain/value-objects/enemy-type.js";

describe("GameSessionEvents", () => {
  describe("GameStartedEvent", () => {
    it("ゲーム開始イベントを作成できる", () => {
      const event = new GameStartedEvent(
        "session-123",
        new Date("2024-01-01T10:00:00Z"),
        100,
        180
      );

      expect(event.sessionId).toBe("session-123");
      expect(event.startedAt).toEqual(new Date("2024-01-01T10:00:00Z"));
      expect(event.initialHealth).toBe(100);
      expect(event.gameDuration).toBe(180);
    });

    it("無効なパラメータでエラーになる", () => {
      expect(() => new GameStartedEvent("", new Date(), 100, 180))
        .toThrow("セッションIDは空であってはいけません");
      
      expect(() => new GameStartedEvent("session-123", new Date(), -1, 180))
        .toThrow("初期体力は0以上である必要があります");
      
      expect(() => new GameStartedEvent("session-123", new Date(), 100, -1))
        .toThrow("ゲーム時間は0以上である必要があります");
    });
  });

  describe("GamePausedEvent", () => {
    it("ゲーム一時停止イベントを作成できる", () => {
      const event = new GamePausedEvent(
        "session-123",
        new Date("2024-01-01T10:05:00Z"),
        120
      );

      expect(event.sessionId).toBe("session-123");
      expect(event.pausedAt).toEqual(new Date("2024-01-01T10:05:00Z"));
      expect(event.remainingTime).toBe(120);
    });

    it("無効なパラメータでエラーになる", () => {
      expect(() => new GamePausedEvent("", new Date(), 120))
        .toThrow("セッションIDは空であってはいけません");
      
      expect(() => new GamePausedEvent("session-123", new Date(), -1))
        .toThrow("残り時間は0以上である必要があります");
    });
  });

  describe("GameResumedEvent", () => {
    it("ゲーム再開イベントを作成できる", () => {
      const event = new GameResumedEvent(
        "session-123",
        new Date("2024-01-01T10:07:00Z"),
        120
      );

      expect(event.sessionId).toBe("session-123");
      expect(event.resumedAt).toEqual(new Date("2024-01-01T10:07:00Z"));
      expect(event.remainingTime).toBe(120);
    });
  });

  describe("GameCompletedEvent", () => {
    it("ゲーム完了イベントを作成できる", () => {
      const event = new GameCompletedEvent(
        "session-123",
        new Date("2024-01-01T10:03:00Z"),
        1500,
        25,
        180
      );

      expect(event.sessionId).toBe("session-123");
      expect(event.completedAt).toEqual(new Date("2024-01-01T10:03:00Z"));
      expect(event.finalScore).toBe(1500);
      expect(event.enemiesDefeated).toBe(25);
      expect(event.survivalTime).toBe(180);
    });

    it("無効なパラメータでエラーになる", () => {
      expect(() => new GameCompletedEvent("", new Date(), 1500, 25, 180))
        .toThrow("セッションIDは空であってはいけません");
      
      expect(() => new GameCompletedEvent("session-123", new Date(), -1, 25, 180))
        .toThrow("最終スコアは0以上である必要があります");
      
      expect(() => new GameCompletedEvent("session-123", new Date(), 1500, -1, 180))
        .toThrow("撃破敵数は0以上である必要があります");
      
      expect(() => new GameCompletedEvent("session-123", new Date(), 1500, 25, -1))
        .toThrow("生存時間は0以上である必要があります");
    });
  });

  describe("GameOverEvent", () => {
    it("ゲームオーバーイベントを作成できる", () => {
      const event = new GameOverEvent(
        "session-123",
        new Date("2024-01-01T10:02:30Z"),
        800,
        15,
        150
      );

      expect(event.sessionId).toBe("session-123");
      expect(event.gameOverAt).toEqual(new Date("2024-01-01T10:02:30Z"));
      expect(event.finalScore).toBe(800);
      expect(event.enemiesDefeated).toBe(15);
      expect(event.survivalTime).toBe(150);
    });
  });

  describe("GameEndedEvent", () => {
    it("ゲーム終了イベントを作成できる", () => {
      const event = new GameEndedEvent(
        "session-123",
        GameEndReason.timeUp(),
        new Date("2024-01-01T10:03:00Z")
      );

      expect(event.sessionId).toBe("session-123");
      expect(event.endReason.isTimeUp()).toBe(true);
      expect(event.endedAt).toEqual(new Date("2024-01-01T10:03:00Z"));
    });

    it("異なる終了理由でイベントを作成できる", () => {
      const playerDeathEvent = new GameEndedEvent(
        "session-456",
        GameEndReason.playerDeath(),
        new Date()
      );

      const userQuitEvent = new GameEndedEvent(
        "session-789",
        GameEndReason.userQuit(),
        new Date()
      );

      expect(playerDeathEvent.endReason.isPlayerDeath()).toBe(true);
      expect(userQuitEvent.endReason.isUserQuit()).toBe(true);
    });
  });

  describe("ScoreUpdatedEvent", () => {
    it("スコア更新イベントを作成できる", () => {
      const event = new ScoreUpdatedEvent(
        "session-123",
        1530,
        30,
        EnemyType.elite()
      );

      expect(event.sessionId).toBe("session-123");
      expect(event.newScore).toBe(1530);
      expect(event.addedPoints).toBe(30);
      expect(event.enemyType.isElite()).toBe(true);
    });

    it("無効なパラメータでエラーになる", () => {
      expect(() => new ScoreUpdatedEvent("", 1530, 30, EnemyType.elite()))
        .toThrow("セッションIDは空であってはいけません");
      
      expect(() => new ScoreUpdatedEvent("session-123", -1, 30, EnemyType.elite()))
        .toThrow("新しいスコアは0以上である必要があります");
      
      expect(() => new ScoreUpdatedEvent("session-123", 1530, -1, EnemyType.elite()))
        .toThrow("加算ポイントは0以上である必要があります");
    });

    it("異なる敵タイプでイベントを作成できる", () => {
      const normalEvent = new ScoreUpdatedEvent("session-123", 10, 10, EnemyType.normal());
      const eliteEvent = new ScoreUpdatedEvent("session-123", 40, 30, EnemyType.elite());
      const bossEvent = new ScoreUpdatedEvent("session-123", 140, 100, EnemyType.boss());

      expect(normalEvent.enemyType.isNormal()).toBe(true);
      expect(eliteEvent.enemyType.isElite()).toBe(true);
      expect(bossEvent.enemyType.isBoss()).toBe(true);
    });
  });

  describe("HealthUpdatedEvent", () => {
    it("体力更新イベントを作成できる", () => {
      const event = new HealthUpdatedEvent(
        "session-123",
        70,
        30,
        70
      );

      expect(event.sessionId).toBe("session-123");
      expect(event.newHealth).toBe(70);
      expect(event.damage).toBe(30);
      expect(event.healthPercentage).toBe(70);
    });

    it("無効なパラメータでエラーになる", () => {
      expect(() => new HealthUpdatedEvent("", 70, 30, 70))
        .toThrow("セッションIDは空であってはいけません");
      
      expect(() => new HealthUpdatedEvent("session-123", -1, 30, 70))
        .toThrow("新しい体力は0以上である必要があります");
      
      expect(() => new HealthUpdatedEvent("session-123", 70, -1, 70))
        .toThrow("ダメージは0以上である必要があります");
      
      expect(() => new HealthUpdatedEvent("session-123", 70, 30, -1))
        .toThrow("体力割合は0以上である必要があります");
      
      expect(() => new HealthUpdatedEvent("session-123", 70, 30, 101))
        .toThrow("体力割合は100以下である必要があります");
    });

    it("体力ゼロのイベントを作成できる", () => {
      const event = new HealthUpdatedEvent("session-123", 0, 100, 0);
      
      expect(event.newHealth).toBe(0);
      expect(event.healthPercentage).toBe(0);
    });

    it("満タン体力のイベントを作成できる", () => {
      const event = new HealthUpdatedEvent("session-123", 100, 0, 100);
      
      expect(event.newHealth).toBe(100);
      expect(event.healthPercentage).toBe(100);
    });
  });

  describe("イベントの等価性", () => {
    it("同じ内容のGameStartedEventは等価", () => {
      const date = new Date("2024-01-01T10:00:00Z");
      const event1 = new GameStartedEvent("session-123", date, 100, 180);
      const event2 = new GameStartedEvent("session-123", date, 100, 180);
      
      expect(event1.sessionId).toBe(event2.sessionId);
      expect(event1.startedAt).toEqual(event2.startedAt);
    });

    it("異なる内容のイベントは非等価", () => {
      const event1 = new GameStartedEvent("session-123", new Date(), 100, 180);
      const event2 = new GameStartedEvent("session-456", new Date(), 100, 180);
      
      expect(event1.sessionId).not.toBe(event2.sessionId);
    });
  });

  describe("イベントのシリアライゼーション", () => {
    it("GameStartedEventをJSONにシリアライズできる", () => {
      const event = new GameStartedEvent(
        "session-123",
        new Date("2024-01-01T10:00:00Z"),
        100,
        180
      );

      const json = JSON.stringify(event);
      const parsed = JSON.parse(json);

      expect(parsed.sessionId).toBe("session-123");
      expect(parsed.initialHealth).toBe(100);
      expect(parsed.gameDuration).toBe(180);
    });

    it("ScoreUpdatedEventをJSONにシリアライズできる", () => {
      const event = new ScoreUpdatedEvent(
        "session-123",
        1530,
        30,
        EnemyType.elite()
      );

      const json = JSON.stringify(event);
      const parsed = JSON.parse(json);

      expect(parsed.sessionId).toBe("session-123");
      expect(parsed.newScore).toBe(1530);
      expect(parsed.addedPoints).toBe(30);
    });
  });
});