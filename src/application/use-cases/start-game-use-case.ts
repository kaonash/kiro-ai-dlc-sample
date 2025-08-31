import type { CardLibrary } from "../../domain/entities/card-library.js";
import { GameSession } from "../../domain/entities/game-session.js";
import type { ICardLibraryRepository } from "../../domain/repositories/card-library-repository.js";
import type { ICardPoolRepository } from "../../domain/repositories/card-pool-repository.js";
import { CardSelectionService } from "../../domain/services/card-selection-service.js";

/**
 * ゲーム開始ユースケースの結果
 */
export interface StartGameResult {
  success: boolean;
  gameSession?: GameSession;
  cardLibrary?: CardLibrary;
  error?: string;
}

/**
 * ゲーム開始ユースケース
 */
export class StartGameUseCase {
  private readonly cardPoolRepository: ICardPoolRepository;
  private readonly cardLibraryRepository: ICardLibraryRepository;
  private readonly cardSelectionService: CardSelectionService;

  constructor(
    cardPoolRepository: ICardPoolRepository,
    cardLibraryRepository: ICardLibraryRepository
  ) {
    this.cardPoolRepository = cardPoolRepository;
    this.cardLibraryRepository = cardLibraryRepository;
    this.cardSelectionService = new CardSelectionService();
  }

  /**
   * ゲームを開始する
   */
  async execute(sessionId: string): Promise<StartGameResult> {
    try {
      // 入力検証
      if (!sessionId || sessionId.trim() === "") {
        return {
          success: false,
          error: "セッションIDが指定されていません",
        };
      }

      // カードプールを読み込み
      let cardPool;
      try {
        cardPool = await this.cardPoolRepository.load();
      } catch (error) {
        return {
          success: false,
          error: `カードプールの読み込みに失敗しました: ${error}`,
        };
      }

      // カードライブラリを読み込み
      let cardLibrary;
      try {
        cardLibrary = await this.cardLibraryRepository.load();
      } catch (error) {
        return {
          success: false,
          error: `カードライブラリの読み込みに失敗しました: ${error}`,
        };
      }

      // ゲームセッションを作成
      let gameSession;
      try {
        gameSession = new GameSession(sessionId, cardPool, cardLibrary);
      } catch (error) {
        return {
          success: false,
          error: `ゲームセッションの作成に失敗しました: ${error}`,
        };
      }

      // ゲームを開始（バランスの取れた手札を配布）
      try {
        gameSession.startGame();
      } catch (error) {
        return {
          success: false,
          error: `ゲームの開始に失敗しました: ${error}`,
        };
      }

      return {
        success: true,
        gameSession,
        cardLibrary,
      };
    } catch (error) {
      return {
        success: false,
        error: `予期しないエラーが発生しました: ${error}`,
      };
    }
  }
}
