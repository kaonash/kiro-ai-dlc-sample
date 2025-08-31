import type { Card } from "../../domain/entities/card.js";
import type { GameSession } from "../../domain/entities/game-session.js";
import type { ICardLibraryRepository } from "../../domain/repositories/card-library-repository.js";
import {
  CardPlayValidationService,
  type HandBalanceAnalysis,
  type PlayRecommendation,
  type PlayValidationResult,
} from "../../domain/services/card-play-validation-service.js";

/**
 * カードプレイユースケースの結果
 */
export interface PlayCardResult {
  success: boolean;
  playedCard?: Card;
  error?: string;
  warning?: string;
}

/**
 * プレイ推奨取得結果
 */
export interface PlayRecommendationsResult {
  success: boolean;
  recommendations?: PlayRecommendation[];
  error?: string;
}

/**
 * 手札バランス分析結果
 */
export interface HandBalanceResult {
  success: boolean;
  analysis?: HandBalanceAnalysis;
  error?: string;
}

/**
 * カードプレイ検証結果
 */
export interface CardPlayValidationResult {
  success: boolean;
  validation?: PlayValidationResult;
  error?: string;
}

/**
 * カードプレイユースケース
 */
export class PlayCardUseCase {
  private readonly cardLibraryRepository: ICardLibraryRepository;
  private readonly validationService: CardPlayValidationService;

  constructor(cardLibraryRepository: ICardLibraryRepository) {
    this.cardLibraryRepository = cardLibraryRepository;
    this.validationService = new CardPlayValidationService();
  }

  /**
   * カードをプレイする
   */
  async execute(gameSession: GameSession, cardId: string): Promise<PlayCardResult> {
    try {
      // 入力検証
      if (!gameSession) {
        return {
          success: false,
          error: "ゲームセッションが指定されていません",
        };
      }

      if (!cardId || cardId.trim() === "") {
        return {
          success: false,
          error: "カードIDが指定されていません",
        };
      }

      // ゲームセッションの状態確認
      if (!gameSession.isActive) {
        return {
          success: false,
          error: "ゲームがアクティブではありません",
        };
      }

      // カードプレイの検証
      const validation = this.validationService.validateCardPlay(cardId, gameSession.hand);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      // カードをプレイ
      let playedCard: Card;
      try {
        playedCard = gameSession.playCard(cardId);
      } catch (error) {
        return {
          success: false,
          error: `カードプレイに失敗しました: ${error}`,
        };
      }

      // ライブラリの保存を試行（失敗しても警告として扱う）
      let warning: string | undefined;
      try {
        // GameSessionが内部でライブラリを更新した後、明示的に保存を実行
        const cardLibrary = await this.cardLibraryRepository.load();
        await this.cardLibraryRepository.save(cardLibrary);
      } catch (error) {
        warning = `ライブラリの保存に失敗しました: ${error}`;
      }

      return {
        success: true,
        playedCard,
        warning,
      };
    } catch (error) {
      return {
        success: false,
        error: `予期しないエラーが発生しました: ${error}`,
      };
    }
  }

  /**
   * プレイ推奨を取得
   */
  async getPlayRecommendations(gameSession: GameSession): Promise<PlayRecommendationsResult> {
    try {
      if (!gameSession) {
        return {
          success: false,
          error: "ゲームセッションが指定されていません",
        };
      }

      const recommendations = this.validationService.getPlayRecommendations(gameSession.hand);

      return {
        success: true,
        recommendations,
      };
    } catch (error) {
      return {
        success: false,
        error: `推奨取得に失敗しました: ${error}`,
      };
    }
  }

  /**
   * 手札バランスを分析
   */
  async analyzeHandBalance(gameSession: GameSession): Promise<HandBalanceResult> {
    try {
      if (!gameSession) {
        return {
          success: false,
          error: "ゲームセッションが指定されていません",
        };
      }

      const analysis = this.validationService.analyzeHandBalance(gameSession.hand);

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      return {
        success: false,
        error: `バランス分析に失敗しました: ${error}`,
      };
    }
  }

  /**
   * カードプレイを検証
   */
  async validateCardPlay(
    gameSession: GameSession,
    cardId: string
  ): Promise<CardPlayValidationResult> {
    try {
      if (!gameSession) {
        return {
          success: false,
          error: "ゲームセッションが指定されていません",
        };
      }

      const validation = this.validationService.validateCardPlay(cardId, gameSession.hand);

      return {
        success: true,
        validation,
      };
    } catch (error) {
      return {
        success: false,
        error: `検証に失敗しました: ${error}`,
      };
    }
  }
}
