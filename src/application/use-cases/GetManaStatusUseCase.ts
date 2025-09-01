import { ManaPool } from "../../domain/entities/ManaPool";
import { ManaValidationService } from "../../domain/services/ManaValidationService";
import { DomainEvent } from "../../domain/events/ManaEvents";

export interface GetManaStatusRequest {
  manaPool: ManaPool;
}

export interface ManaStatusInfo {
  poolId: string;
  current: number;
  max: number;
  percentage: number;
  isAtMax: boolean;
  canGenerate: boolean;
  availableSpace: number;
  nextGenerationTime?: number;
  timeUntilNextGeneration?: number;
  canGenerateNow?: boolean;
}

export interface GetManaStatusResponse {
  isSuccess: boolean;
  status?: ManaStatusInfo;
  error?: string;
}

export interface GetManaStatusWithTimingRequest extends GetManaStatusRequest {
  currentGameTime: number;
  lastGenerationTime: number;
}

export interface GetManaStatusWithCardCostsRequest extends GetManaStatusRequest {
  cardCosts: number[];
}

export interface CardAvailabilityInfo {
  cost: number;
  available: boolean;
  shortage: number;
}

export interface GetManaStatusWithCardCostsResponse extends GetManaStatusResponse {
  cardAvailability?: CardAvailabilityInfo[];
  availableCardCount?: number;
  greyedOutCardCount?: number;
}

export interface GetManaStatusWithHistoryRequest extends GetManaStatusRequest {}

export interface GetManaStatusWithHistoryResponse extends GetManaStatusResponse {
  recentEvents?: DomainEvent[];
}

export interface GetManaStatusWithPerformanceRequest extends GetManaStatusRequest {
  sessionDuration: number;
  totalCardsPlayed: number;
}

export interface PerformanceStats {
  averageManaPerMinute: number;
  averageManaPerCard: number;
  manaEfficiency: number;
}

export interface GetManaStatusWithPerformanceResponse extends GetManaStatusResponse {
  performanceStats?: PerformanceStats;
}

export class GetManaStatusUseCase {
  private readonly validationService: ManaValidationService;

  constructor() {
    this.validationService = new ManaValidationService();
  }

  async execute(request: GetManaStatusRequest): Promise<GetManaStatusResponse> {
    try {
      if (!request.manaPool) {
        return {
          isSuccess: false,
          error: "魔力プールが無効です"
        };
      }

      const manaPool = request.manaPool;
      const basicStatus = manaPool.getStatus();

      const status: ManaStatusInfo = {
        poolId: manaPool.getId(),
        current: basicStatus.current,
        max: basicStatus.max,
        percentage: basicStatus.percentage,
        isAtMax: basicStatus.isAtMax,
        canGenerate: !basicStatus.isAtMax,
        availableSpace: basicStatus.max - basicStatus.current
      };

      return {
        isSuccess: true,
        status
      };

    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "魔力状態取得中にエラーが発生しました"
      };
    }
  }

  async executeWithTiming(request: GetManaStatusWithTimingRequest): Promise<GetManaStatusResponse> {
    try {
      // 時間情報の検証
      if (request.currentGameTime < 0 || request.lastGenerationTime < 0) {
        return {
          isSuccess: false,
          error: "時間情報が無効です"
        };
      }

      const baseResult = await this.execute(request);
      if (!baseResult.isSuccess || !baseResult.status) {
        return baseResult;
      }

      // 次回生成時間の計算
      const nextGenerationTime = request.lastGenerationTime + 1000; // 1秒後
      const timeUntilNextGeneration = nextGenerationTime - request.currentGameTime;
      const canGenerateNow = timeUntilNextGeneration <= 0;

      baseResult.status.nextGenerationTime = nextGenerationTime;
      baseResult.status.timeUntilNextGeneration = timeUntilNextGeneration;
      baseResult.status.canGenerateNow = canGenerateNow;

      return baseResult;

    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "タイミング付き魔力状態取得中にエラーが発生しました"
      };
    }
  }

  async executeWithCardCosts(request: GetManaStatusWithCardCostsRequest): Promise<GetManaStatusWithCardCostsResponse> {
    try {
      // カードコストの検証
      const invalidCosts = request.cardCosts.filter(cost => cost < 0);
      if (invalidCosts.length > 0) {
        return {
          isSuccess: false,
          error: `無効なカードコストが含まれています: ${invalidCosts.join(", ")}`
        };
      }

      const baseResult = await this.execute(request);
      if (!baseResult.isSuccess) {
        return baseResult;
      }

      const manaPool = request.manaPool;
      const cardAvailability: CardAvailabilityInfo[] = request.cardCosts.map(cost => {
        const canConsume = manaPool.canConsume(cost);
        return {
          cost,
          available: canConsume,
          shortage: canConsume ? 0 : cost - manaPool.getCurrentMana()
        };
      });

      const availableCardCount = cardAvailability.filter(card => card.available).length;
      const greyedOutCardCount = cardAvailability.filter(card => !card.available).length;

      return {
        ...baseResult,
        cardAvailability,
        availableCardCount,
        greyedOutCardCount
      };

    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "カードコスト付き魔力状態取得中にエラーが発生しました"
      };
    }
  }

  async executeWithHistory(request: GetManaStatusWithHistoryRequest): Promise<GetManaStatusWithHistoryResponse> {
    try {
      const baseResult = await this.execute(request);
      if (!baseResult.isSuccess) {
        return baseResult;
      }

      const recentEvents = request.manaPool.getDomainEvents();

      return {
        ...baseResult,
        recentEvents
      };

    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "履歴付き魔力状態取得中にエラーが発生しました"
      };
    }
  }

  async executeWithPerformanceStats(request: GetManaStatusWithPerformanceRequest): Promise<GetManaStatusWithPerformanceResponse> {
    try {
      const baseResult = await this.execute(request);
      if (!baseResult.isSuccess || !baseResult.status) {
        return baseResult;
      }

      const sessionMinutes = request.sessionDuration / 60000; // ミリ秒を分に変換
      const currentMana = baseResult.status.current;

      const performanceStats: PerformanceStats = {
        averageManaPerMinute: sessionMinutes > 0 ? currentMana / sessionMinutes : 0,
        averageManaPerCard: request.totalCardsPlayed > 0 ? currentMana / request.totalCardsPlayed : 0,
        manaEfficiency: (currentMana / baseResult.status.max) * 100
      };

      return {
        ...baseResult,
        performanceStats
      };

    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "パフォーマンス統計付き魔力状態取得中にエラーが発生しました"
      };
    }
  }
}