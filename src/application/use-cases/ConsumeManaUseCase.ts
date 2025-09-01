import { ManaPool } from "../../domain/entities/ManaPool";
import { ManaConsumptionService } from "../../domain/services/ManaConsumptionService";
import { ManaValidationService } from "../../domain/services/ManaValidationService";

export interface ConsumeManaRequest {
  manaPool: ManaPool;
  amount: number;
  reason: string;
  cardId: string;
}

export interface ConsumeManaResponse {
  isSuccess: boolean;
  consumedAmount?: number;
  remainingMana?: number;
  cardId?: string;
  shortage?: number;
  error?: string;
  userMessage?: string;
}

export interface MultipleConsumptionRequest {
  manaPool: ManaPool;
  cardCosts: number[];
}

export interface MultipleConsumptionResponse {
  isSuccess: boolean;
  totalCost?: number;
  canConsumeAll?: boolean;
  maxAffordableCards?: number;
  affordableCards?: number[];
  error?: string;
}

export interface CardAvailabilityRequest {
  manaPool: ManaPool;
  cardCosts: number[];
}

export interface CardAvailabilityResponse {
  availableCards: Array<{ cost: number; available: boolean }>;
  greyedOutCards: number[];
}

export class ConsumeManaUseCase {
  private readonly consumptionService: ManaConsumptionService;
  private readonly validationService: ManaValidationService;

  constructor() {
    this.consumptionService = new ManaConsumptionService();
    this.validationService = new ManaValidationService();
  }

  async execute(request: ConsumeManaRequest): Promise<ConsumeManaResponse> {
    try {
      // 入力検証
      const validationResult = this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          isSuccess: false,
          error: validationResult.errors.join(", ")
        };
      }

      const { manaPool, amount, reason, cardId } = request;

      // カードコスト検証
      if (amount > 0) {
        const costValidation = this.validationService.validateCardCost(amount);
        if (!costValidation.isValid) {
          return {
            isSuccess: false,
            error: `カードコストが無効です: ${costValidation.errors.join(", ")}`
          };
        }
      }

      // 消費可能性チェック
      const consumptionCheck = this.consumptionService.canConsumeMana(manaPool, amount);
      if (!consumptionCheck.canConsume) {
        return {
          isSuccess: false,
          error: "魔力が不足しています",
          shortage: consumptionCheck.shortage,
          userMessage: `魔力が${consumptionCheck.shortage}ポイント不足しています`
        };
      }

      // 魔力消費実行
      const consumptionResult = this.consumptionService.consumeMana(
        manaPool,
        amount,
        reason,
        Date.now()
      );

      if (!consumptionResult.isSuccess) {
        return {
          isSuccess: false,
          error: consumptionResult.error
        };
      }

      return {
        isSuccess: true,
        consumedAmount: consumptionResult.consumedAmount,
        remainingMana: consumptionResult.remainingMana,
        cardId
      };

    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "魔力消費中に予期しないエラーが発生しました"
      };
    }
  }

  async simulateMultipleConsumption(request: MultipleConsumptionRequest): Promise<MultipleConsumptionResponse> {
    try {
      if (!request.manaPool) {
        return {
          isSuccess: false,
          error: "魔力プールが無効です"
        };
      }

      const result = this.consumptionService.simulateMultipleConsumption(
        request.manaPool,
        request.cardCosts
      );

      return {
        isSuccess: true,
        ...result
      };

    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "複数消費シミュレーション中にエラーが発生しました"
      };
    }
  }

  async getCardAvailability(request: CardAvailabilityRequest): Promise<CardAvailabilityResponse> {
    const availableCards = request.cardCosts.map(cost => ({
      cost,
      available: request.manaPool.canConsume(cost)
    }));

    const greyedOutCards = request.cardCosts.filter(cost => !request.manaPool.canConsume(cost));

    return {
      availableCards,
      greyedOutCards
    };
  }

  private validateRequest(request: ConsumeManaRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.manaPool) {
      errors.push("魔力プールが無効です");
    }

    if (request.amount < 0) {
      errors.push("消費量は0以上である必要があります");
    }

    if (!request.cardId || request.cardId.trim() === "") {
      errors.push("カードIDが無効です");
    }

    if (!request.reason || request.reason.trim() === "") {
      errors.push("消費理由が無効です");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}