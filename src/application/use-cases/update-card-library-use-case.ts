import type { Card } from "../../domain/entities/card.js";
import type { ICardLibraryRepository } from "../../domain/repositories/card-library-repository.js";
import {
  type CardDiscoveryResult,
  CardDiscoveryService,
  type DiscoveryRecommendation,
  type DiscoveryStatistics,
} from "../../domain/services/card-discovery-service.js";

/**
 * カード発見結果
 */
export interface DiscoverCardResult {
  success: boolean;
  discoveryResult?: CardDiscoveryResult;
  error?: string;
}

/**
 * 複数カード発見結果
 */
export interface DiscoverMultipleCardsResult {
  success: boolean;
  discoveryResults?: CardDiscoveryResult[];
  error?: string;
}

/**
 * 発見統計取得結果
 */
export interface DiscoveryStatisticsResult {
  success: boolean;
  statistics?: DiscoveryStatistics;
  error?: string;
}

/**
 * 発見推奨取得結果
 */
export interface DiscoveryRecommendationsResult {
  success: boolean;
  recommendations?: DiscoveryRecommendation[];
  error?: string;
}

/**
 * ライブラリクリア結果
 */
export interface ClearLibraryResult {
  success: boolean;
  error?: string;
}

/**
 * カードライブラリ更新ユースケース
 */
export class UpdateCardLibraryUseCase {
  private readonly cardLibraryRepository: ICardLibraryRepository;
  private readonly discoveryService: CardDiscoveryService;

  constructor(cardLibraryRepository: ICardLibraryRepository) {
    this.cardLibraryRepository = cardLibraryRepository;
    this.discoveryService = new CardDiscoveryService();
  }

  /**
   * カードを発見してライブラリに追加
   */
  async discoverCard(card: Card): Promise<DiscoverCardResult> {
    try {
      if (!card) {
        return {
          success: false,
          error: "カードが指定されていません",
        };
      }

      // ライブラリを読み込み
      let library;
      try {
        library = await this.cardLibraryRepository.load();
      } catch (error) {
        return {
          success: false,
          error: `ライブラリの読み込みに失敗しました: ${error}`,
        };
      }

      // カードを発見
      const discoveryResult = this.discoveryService.discoverCard(card, library);

      // ライブラリを保存
      try {
        await this.cardLibraryRepository.save(library);
      } catch (error) {
        return {
          success: false,
          error: `ライブラリの保存に失敗しました: ${error}`,
        };
      }

      return {
        success: true,
        discoveryResult,
      };
    } catch (error) {
      return {
        success: false,
        error: `予期しないエラーが発生しました: ${error}`,
      };
    }
  }

  /**
   * 複数のカードを一括発見
   */
  async discoverMultipleCards(cards: Card[]): Promise<DiscoverMultipleCardsResult> {
    try {
      if (!cards || cards.length === 0) {
        return {
          success: true,
          discoveryResults: [],
        };
      }

      // ライブラリを読み込み
      let library;
      try {
        library = await this.cardLibraryRepository.load();
      } catch (error) {
        return {
          success: false,
          error: `ライブラリの読み込みに失敗しました: ${error}`,
        };
      }

      // 複数のカードを発見
      const discoveryResults = this.discoveryService.discoverMultipleCards(cards, library);

      // ライブラリを保存
      try {
        await this.cardLibraryRepository.save(library);
      } catch (error) {
        return {
          success: false,
          error: `ライブラリの保存に失敗しました: ${error}`,
        };
      }

      return {
        success: true,
        discoveryResults,
      };
    } catch (error) {
      return {
        success: false,
        error: `予期しないエラーが発生しました: ${error}`,
      };
    }
  }

  /**
   * 発見統計を取得
   */
  async getDiscoveryStatistics(): Promise<DiscoveryStatisticsResult> {
    try {
      // ライブラリを読み込み
      let library;
      try {
        library = await this.cardLibraryRepository.load();
      } catch (error) {
        return {
          success: false,
          error: `統計の取得に失敗しました: ${error}`,
        };
      }

      const statistics = this.discoveryService.getDiscoveryStatistics(library);

      return {
        success: true,
        statistics,
      };
    } catch (error) {
      return {
        success: false,
        error: `統計の取得に失敗しました: ${error}`,
      };
    }
  }

  /**
   * 発見推奨を取得
   */
  async getDiscoveryRecommendations(): Promise<DiscoveryRecommendationsResult> {
    try {
      // ライブラリを読み込み
      let library;
      try {
        library = await this.cardLibraryRepository.load();
      } catch (error) {
        return {
          success: false,
          error: `推奨の取得に失敗しました: ${error}`,
        };
      }

      const recommendations = this.discoveryService.getDiscoveryRecommendations(library);

      return {
        success: true,
        recommendations,
      };
    } catch (error) {
      return {
        success: false,
        error: `推奨の取得に失敗しました: ${error}`,
      };
    }
  }

  /**
   * ライブラリをクリア
   */
  async clearLibrary(): Promise<ClearLibraryResult> {
    try {
      // ライブラリを削除
      await this.cardLibraryRepository.delete();

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `ライブラリのクリアに失敗しました: ${error}`,
      };
    }
  }
}
