import { GameSession } from "../../domain/entities/game-session.js";
import { GameEndReason } from "../../domain/value-objects/game-end-reason.js";
import {
  GameCompletedEvent,
  GameOverEvent,
  GameEndedEvent,
} from "../../domain/events/game-session-events.js";

/**
 * ゲームセッション終了リクエスト
 */
export interface EndGameSessionRequest {
  gameSession: GameSession;
  reason: GameEndReason;
}

/**
 * ゲームセッション終了レスポンス
 */
export interface EndGameSessionResponse {
  success: boolean;
  gameSession?: GameSession;
  finalScore?: number;
  survivalTime?: number;
  enemiesDefeated?: number;
  error?: string;
}

/**
 * イベントバスインターフェース
 */
export interface EventBus {
  publish(eventName: string, event: any): Promise<void>;
}

/**
 * ゲームセッション終了ユースケース
 */
export class EndGameSessionUseCase {
  constructor(private readonly eventBus: EventBus) {}

  async execute(request: EndGameSessionRequest): Promise<EndGameSessionResponse> {
    try {
      // パラメータ検証
      if (!request.gameSession) {
        return {
          success: false,
          error: "ゲームセッションが指定されていません"
        };
      }

      if (!request.reason) {
        return {
          success: false,
          error: "終了理由が指定されていません"
        };
      }

      const { gameSession, reason } = request;

      // ゲームがアクティブかチェック
      if (!gameSession.isActive) {
        return {
          success: false,
          error: "ゲームがアクティブではありません"
        };
      }

      // 終了前の統計情報を取得
      const finalScore = gameSession.score.getTotalScore();
      const enemiesDefeated = gameSession.score.getEnemyDefeatedCount();
      const survivalTime = gameSession.timer.getElapsedSeconds();

      // ゲームセッション終了
      gameSession.endGame(reason);

      // 終了理由に応じたイベントを発行
      if (reason.isTimeUp()) {
        const event = new GameCompletedEvent(
          gameSession.id,
          gameSession.endedAt!,
          finalScore,
          enemiesDefeated,
          survivalTime
        );
        await this.eventBus.publish("GameCompletedEvent", event);
      } else if (reason.isPlayerDeath()) {
        const event = new GameOverEvent(
          gameSession.id,
          gameSession.endedAt!,
          finalScore,
          enemiesDefeated,
          survivalTime
        );
        await this.eventBus.publish("GameOverEvent", event);
      }

      // 共通の終了イベント
      const endedEvent = new GameEndedEvent(
        gameSession.id,
        reason,
        gameSession.endedAt!
      );
      await this.eventBus.publish("GameEndedEvent", endedEvent);

      return {
        success: true,
        gameSession,
        finalScore,
        survivalTime,
        enemiesDefeated
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラーが発生しました"
      };
    }
  }
}