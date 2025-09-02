import { GameSession } from "../../domain/entities/game-session.js";
import { GameStartedEvent } from "../../domain/events/game-session-events.js";

/**
 * ゲームセッション開始リクエスト
 */
export interface StartGameSessionRequest {
  gameSession: GameSession;
  gameDuration: number;
  maxHealth: number;
}

/**
 * ゲームセッション開始レスポンス
 */
export interface StartGameSessionResponse {
  success: boolean;
  gameSession?: GameSession;
  error?: string;
}

/**
 * イベントバスインターフェース
 */
export interface EventBus {
  publish(eventName: string, event: any): Promise<void>;
}

/**
 * ゲームセッション開始ユースケース
 */
export class StartGameSessionUseCase {
  constructor(private readonly eventBus: EventBus) {}

  async execute(request: StartGameSessionRequest): Promise<StartGameSessionResponse> {
    try {
      // パラメータ検証
      if (!request.gameSession) {
        return {
          success: false,
          error: "ゲームセッションが指定されていません"
        };
      }

      if (request.gameDuration < 0 || request.maxHealth < 0) {
        return {
          success: false,
          error: "無効なパラメータが指定されました"
        };
      }

      // ゲームセッション開始
      request.gameSession.startGame();

      // イベント発行
      const event = new GameStartedEvent(
        request.gameSession.id,
        request.gameSession.startedAt!,
        request.maxHealth,
        request.gameDuration
      );

      await this.eventBus.publish("GameStartedEvent", event);

      return {
        success: true,
        gameSession: request.gameSession
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラーが発生しました"
      };
    }
  }
}