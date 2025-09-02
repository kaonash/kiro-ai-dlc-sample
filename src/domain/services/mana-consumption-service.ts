import type { ManaPool } from "../entities/mana-pool";
import { ManaTransaction } from "../value-objects/mana-transaction";

export interface ConsumptionCheckResult {
  canConsume: boolean;
  currentMana: number;
  requiredMana: number;
  shortage?: number;
}

export interface ConsumptionResult {
  isSuccess: boolean;
  consumedAmount?: number;
  remainingMana?: number;
  error?: string;
}

export interface MultipleConsumptionResult {
  totalCost: number;
  canConsumeAll: boolean;
  maxAffordableCards: number;
  affordableCards: number[];
}

export interface ConsumptionHistoryEntry {
  amount: number;
  reason: string;
  timestamp: number;
}

export class ManaConsumptionService {
  private consumptionHistory: Map<string, ConsumptionHistoryEntry[]> = new Map();

  canConsumeMana(manaPool: ManaPool, amount: number): ConsumptionCheckResult {
    if (amount < 0) {
      throw new Error("消費量は0以上である必要があります");
    }

    const currentMana = manaPool.getCurrentMana();
    const canConsume = currentMana >= amount;

    const result: ConsumptionCheckResult = {
      canConsume,
      currentMana,
      requiredMana: amount,
    };

    if (!canConsume) {
      result.shortage = amount - currentMana;
    }

    return result;
  }

  consumeMana(
    manaPool: ManaPool,
    amount: number,
    reason: string,
    timestamp: number
  ): ConsumptionResult {
    if (amount < 0) {
      throw new Error("消費量は0以上である必要があります");
    }

    if (amount === 0) {
      return {
        isSuccess: true,
        consumedAmount: 0,
        remainingMana: manaPool.getCurrentMana(),
      };
    }

    const checkResult = this.canConsumeMana(manaPool, amount);
    if (!checkResult.canConsume) {
      return {
        isSuccess: false,
        error: "魔力が不足しています",
      };
    }

    try {
      const transaction = new ManaTransaction(amount, "consumption", timestamp);
      const result = manaPool.consumeMana(transaction);

      if (!result.isSuccess) {
        return {
          isSuccess: false,
          error: result.error,
        };
      }

      // 履歴に記録
      this.recordConsumption(manaPool.getId(), amount, reason, timestamp);

      return {
        isSuccess: true,
        consumedAmount: amount,
        remainingMana: manaPool.getCurrentMana(),
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "魔力消費中にエラーが発生しました",
      };
    }
  }

  simulateMultipleConsumption(manaPool: ManaPool, cardCosts: number[]): MultipleConsumptionResult {
    const totalCost = cardCosts.reduce((sum, cost) => sum + cost, 0);
    const currentMana = manaPool.getCurrentMana();
    const canConsumeAll = currentMana >= totalCost;

    // コストの小さい順にソートして、消費可能なカードを特定
    const sortedCosts = [...cardCosts].sort((a, b) => a - b);
    const affordableCards: number[] = [];
    let runningTotal = 0;

    for (const cost of sortedCosts) {
      if (runningTotal + cost <= currentMana) {
        affordableCards.push(cost);
        runningTotal += cost;
      } else {
        break;
      }
    }

    return {
      totalCost,
      canConsumeAll,
      maxAffordableCards: affordableCards.length,
      affordableCards,
    };
  }

  private recordConsumption(
    poolId: string,
    amount: number,
    reason: string,
    timestamp: number
  ): void {
    if (!this.consumptionHistory.has(poolId)) {
      this.consumptionHistory.set(poolId, []);
    }

    const history = this.consumptionHistory.get(poolId)!;
    history.push({ amount, reason, timestamp });
  }

  getConsumptionHistory(poolId: string): ConsumptionHistoryEntry[] {
    return this.consumptionHistory.get(poolId) || [];
  }

  clearConsumptionHistory(poolId: string): void {
    this.consumptionHistory.delete(poolId);
  }
}