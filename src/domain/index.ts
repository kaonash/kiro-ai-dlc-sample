// エンティティ
export { GameSession } from "./entities/game-session.js";
export { GameTimer, type TimeProvider, SystemTimeProvider } from "./entities/game-timer.js";
export { BaseHealth } from "./entities/base-health.js";
export { GameScore } from "./entities/game-score.js";
export { Card } from "./entities/card.js";
export { CardLibrary } from "./entities/card-library.js";
export { CardPool } from "./entities/card-pool.js";
export { Hand } from "./entities/hand.js";

// 値オブジェクト
export { GameState } from "./value-objects/game-state.js";
export { TimeRemaining } from "./value-objects/time-remaining.js";
export { ScoreValue } from "./value-objects/score-value.js";
export { HealthValue } from "./value-objects/health-value.js";
export { GameEndReason } from "./value-objects/game-end-reason.js";
export { EnemyType } from "./value-objects/enemy-type.js";
export { CardCost } from "./value-objects/card-cost.js";
export { SpecialAbility } from "./value-objects/special-ability.js";
export { TowerType } from "./value-objects/tower-type.js";

// ドメインサービス
export { ScoreCalculationService, type ScoreMultipliers, type ScoreStatistics } from "./services/score-calculation-service.js";
export { GameEndConditionService } from "./services/game-end-condition-service.js";

// ドメインイベント
export {
  GameStartedEvent,
  GamePausedEvent,
  GameResumedEvent,
  GameCompletedEvent,
  GameOverEvent,
  GameEndedEvent,
  ScoreUpdatedEvent,
  HealthUpdatedEvent,
} from "./events/game-session-events.js";

// 型定義
export type { SessionStats } from "./entities/game-session.js";