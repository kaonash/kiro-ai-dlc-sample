import { GameEndReason } from "../value-objects/game-end-reason.js";
import { EnemyType } from "../value-objects/enemy-type.js";

/**
 * ゲーム開始イベント
 */
export class GameStartedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly startedAt: Date,
    public readonly initialHealth: number,
    public readonly gameDuration: number
  ) {
    if (!sessionId.trim()) {
      throw new Error("セッションIDは空であってはいけません");
    }
    if (initialHealth < 0) {
      throw new Error("初期体力は0以上である必要があります");
    }
    if (gameDuration < 0) {
      throw new Error("ゲーム時間は0以上である必要があります");
    }
  }
}

/**
 * ゲーム一時停止イベント
 */
export class GamePausedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly pausedAt: Date,
    public readonly remainingTime: number
  ) {
    if (!sessionId.trim()) {
      throw new Error("セッションIDは空であってはいけません");
    }
    if (remainingTime < 0) {
      throw new Error("残り時間は0以上である必要があります");
    }
  }
}

/**
 * ゲーム再開イベント
 */
export class GameResumedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly resumedAt: Date,
    public readonly remainingTime: number
  ) {
    if (!sessionId.trim()) {
      throw new Error("セッションIDは空であってはいけません");
    }
    if (remainingTime < 0) {
      throw new Error("残り時間は0以上である必要があります");
    }
  }
}

/**
 * ゲーム完了イベント（時間切れ）
 */
export class GameCompletedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly completedAt: Date,
    public readonly finalScore: number,
    public readonly enemiesDefeated: number,
    public readonly survivalTime: number
  ) {
    if (!sessionId.trim()) {
      throw new Error("セッションIDは空であってはいけません");
    }
    if (finalScore < 0) {
      throw new Error("最終スコアは0以上である必要があります");
    }
    if (enemiesDefeated < 0) {
      throw new Error("撃破敵数は0以上である必要があります");
    }
    if (survivalTime < 0) {
      throw new Error("生存時間は0以上である必要があります");
    }
  }
}

/**
 * ゲームオーバーイベント（体力ゼロ）
 */
export class GameOverEvent {
  constructor(
    public readonly sessionId: string,
    public readonly gameOverAt: Date,
    public readonly finalScore: number,
    public readonly enemiesDefeated: number,
    public readonly survivalTime: number
  ) {
    if (!sessionId.trim()) {
      throw new Error("セッションIDは空であってはいけません");
    }
    if (finalScore < 0) {
      throw new Error("最終スコアは0以上である必要があります");
    }
    if (enemiesDefeated < 0) {
      throw new Error("撃破敵数は0以上である必要があります");
    }
    if (survivalTime < 0) {
      throw new Error("生存時間は0以上である必要があります");
    }
  }
}

/**
 * ゲーム終了イベント（クリーンアップトリガー）
 */
export class GameEndedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly endReason: GameEndReason,
    public readonly endedAt: Date
  ) {
    if (!sessionId.trim()) {
      throw new Error("セッションIDは空であってはいけません");
    }
  }
}

/**
 * スコア更新イベント
 */
export class ScoreUpdatedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly newScore: number,
    public readonly addedPoints: number,
    public readonly enemyType: EnemyType
  ) {
    if (!sessionId.trim()) {
      throw new Error("セッションIDは空であってはいけません");
    }
    if (newScore < 0) {
      throw new Error("新しいスコアは0以上である必要があります");
    }
    if (addedPoints < 0) {
      throw new Error("加算ポイントは0以上である必要があります");
    }
  }
}

/**
 * 体力更新イベント
 */
export class HealthUpdatedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly newHealth: number,
    public readonly damage: number,
    public readonly healthPercentage: number
  ) {
    if (!sessionId.trim()) {
      throw new Error("セッションIDは空であってはいけません");
    }
    if (newHealth < 0) {
      throw new Error("新しい体力は0以上である必要があります");
    }
    if (damage < 0) {
      throw new Error("ダメージは0以上である必要があります");
    }
    if (healthPercentage < 0) {
      throw new Error("体力割合は0以上である必要があります");
    }
    if (healthPercentage > 100) {
      throw new Error("体力割合は100以下である必要があります");
    }
  }
}