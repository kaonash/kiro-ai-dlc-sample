import { GameSession } from "../../domain/entities/game-session.js";
import { EnemyType } from "../../domain/value-objects/enemy-type.js";
import { GameEndConditionService } from "../../domain/services/game-end-condition-service.js";
import {
  GamePausedEvent,
  GameResumedEvent,
  GameCompletedEvent,
  GameOverEvent,
  GameEndedEvent,
  ScoreUpdatedEvent,
  HealthUpdatedEvent,
} from "../../domain/events/game-session-events.js";

/**
 * ゲームセッション更新リクエスト
 */
export interface UpdateGameSessionRequest {
  gameSession: GameSession;
  updateType: "enemyDefeated" | "baseDamaged" | "timerUpdate" | "pause" | "resume";
  enemyType?: EnemyType;
  damage?: number;
}

/**
 * ゲームセッション更新レスポンス
 */
export interface UpdateGameSessionResponse {
  success: boolean;
  gameSession?: GameSession;
  gameEnded?: boolean;
  error?: string;
}

/**
 * イベントバスインターフェース
 */
export interface EventBus {
  publish(eventName: string, event: any): Promise<void>;
}

/**
 * ゲームセッション更新ユースケース
 */
export class UpdateGameSessionUseCase {
  constructor(
    private readonly eventBus: EventBus,
    private readonly endConditionService: GameEndConditionService
  ) {}

  async execute(request: UpdateGameSessionRequest): Promise<UpdateGameSessionResponse> {
    try {
      // パラメータ検証
      if (!request.gameSession) {
        return {
          success: false,
          error: "ゲームセッションが指定されていません"
        };
      }

      const { gameSession, updateType } = request;

      switch (updateType) {
        case "enemyDefeated":
          return await this.handleEnemyDefeated(gameSession, request.enemyType);
        
        case "baseDamaged":
          return await this.handleBaseDamaged(gameSession, request.damage);
        
        case "timerUpdate":
          return await this.handleTimerUpdate(gameSession);
        
        case "pause":
          return await this.handlePause(gameSession);
        
        case "resume":
          return await this.handleResume(gameSession);
        
        default:
          return {
            success: false,
            error: `無効な更新タイプ: ${updateType}`
          };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラーが発生しました"
      };
    }
  }

  private async handleEnemyDefeated(
    gameSession: GameSession, 
    enemyType?: EnemyType
  ): Promise<UpdateGameSessionResponse> {
    if (!enemyType) {
      return {
        success: false,
        error: "敵タイプが指定されていません"
      };
    }

    const previousScore = gameSession.score.getTotalScore();
    gameSession.handleEnemyDefeated(enemyType);
    const newScore = gameSession.score.getTotalScore();
    const addedPoints = newScore - previousScore;

    // スコア更新イベントを発行（アクティブな場合のみ）
    if (gameSession.state.isActive() && addedPoints > 0) {
      const event = new ScoreUpdatedEvent(
        gameSession.id,
        newScore,
        addedPoints,
        enemyType
      );
      await this.eventBus.publish("ScoreUpdatedEvent", event);
    }

    return {
      success: true,
      gameSession,
      gameEnded: false
    };
  }

  private async handleBaseDamaged(
    gameSession: GameSession, 
    damage?: number
  ): Promise<UpdateGameSessionResponse> {
    if (damage === undefined || damage < 0) {
      return {
        success: false,
        error: "ダメージ量が指定されていません"
      };
    }

    const previousHealth = gameSession.baseHealth.currentHealth.value;
    gameSession.handleBaseDamaged(damage);
    const newHealth = gameSession.baseHealth.currentHealth.value;

    // 体力更新イベントを発行（アクティブな場合のみ）
    if (gameSession.state.isActive()) {
      const event = new HealthUpdatedEvent(
        gameSession.id,
        newHealth,
        damage,
        gameSession.baseHealth.getHealthPercentage()
      );
      await this.eventBus.publish("HealthUpdatedEvent", event);
    }

    // 終了条件をチェック
    return await this.checkEndConditions(gameSession);
  }

  private async handleTimerUpdate(gameSession: GameSession): Promise<UpdateGameSessionResponse> {
    // タイマー更新は自動的に行われるため、終了条件のチェックのみ
    return await this.checkEndConditions(gameSession);
  }

  private async handlePause(gameSession: GameSession): Promise<UpdateGameSessionResponse> {
    gameSession.pause();

    const event = new GamePausedEvent(
      gameSession.id,
      new Date(),
      gameSession.timer.getRemainingSeconds()
    );
    await this.eventBus.publish("GamePausedEvent", event);

    return {
      success: true,
      gameSession,
      gameEnded: false
    };
  }

  private async handleResume(gameSession: GameSession): Promise<UpdateGameSessionResponse> {
    gameSession.resume();

    const event = new GameResumedEvent(
      gameSession.id,
      new Date(),
      gameSession.timer.getRemainingSeconds()
    );
    await this.eventBus.publish("GameResumedEvent", event);

    return {
      success: true,
      gameSession,
      gameEnded: false
    };
  }

  private async checkEndConditions(gameSession: GameSession): Promise<UpdateGameSessionResponse> {
    const endReason = this.endConditionService.checkEndCondition(
      gameSession.timer,
      gameSession.baseHealth,
      gameSession.state
    );

    if (endReason) {
      // ゲーム終了処理
      gameSession.endGame(endReason);

      // 終了イベントを発行
      if (endReason.isTimeUp()) {
        const event = new GameCompletedEvent(
          gameSession.id,
          gameSession.endedAt!,
          gameSession.score.getTotalScore(),
          gameSession.score.getEnemyDefeatedCount(),
          gameSession.timer.getElapsedSeconds()
        );
        await this.eventBus.publish("GameCompletedEvent", event);
      } else if (endReason.isPlayerDeath()) {
        const event = new GameOverEvent(
          gameSession.id,
          gameSession.endedAt!,
          gameSession.score.getTotalScore(),
          gameSession.score.getEnemyDefeatedCount(),
          gameSession.timer.getElapsedSeconds()
        );
        await this.eventBus.publish("GameOverEvent", event);
      }

      // 共通の終了イベント
      const endedEvent = new GameEndedEvent(
        gameSession.id,
        endReason,
        gameSession.endedAt!
      );
      await this.eventBus.publish("GameEndedEvent", endedEvent);

      return {
        success: true,
        gameSession,
        gameEnded: true
      };
    }

    return {
      success: true,
      gameSession,
      gameEnded: false
    };
  }
}