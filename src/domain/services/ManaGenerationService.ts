import { ManaPool } from "../entities/ManaPool";
import { ManaTransaction } from "../value-objects/ManaTransaction";

export interface GenerationCheckResult {
  shouldGenerate: boolean;
  generationCount: number;
}

export interface GenerationResult {
  isSuccess: boolean;
  generatedAmount?: number;
  error?: string;
}

export class ManaGenerationService {
  private generationRate: number = 1000; // 1秒 = 1000ms

  shouldGenerateMana(lastGenerationTime: number, currentGameTime: number): GenerationCheckResult {
    if (currentGameTime < lastGenerationTime) {
      return { shouldGenerate: false, generationCount: 0 };
    }

    const timeDifference = currentGameTime - lastGenerationTime;
    const generationCount = Math.floor(timeDifference / this.generationRate);

    return {
      shouldGenerate: generationCount > 0,
      generationCount
    };
  }

  generateMana(manaPool: ManaPool, amount: number, timestamp: number): GenerationResult {
    if (amount < 0) {
      return {
        isSuccess: false,
        error: "生成量は0以上である必要があります"
      };
    }

    if (amount === 0) {
      return {
        isSuccess: true,
        generatedAmount: 0
      };
    }

    try {
      const transaction = new ManaTransaction(amount, "generation", timestamp);
      const result = manaPool.generateMana(transaction);

      if (!result.isSuccess) {
        return {
          isSuccess: false,
          error: result.error
        };
      }

      return {
        isSuccess: true,
        generatedAmount: result.actualAmount
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "魔力生成中にエラーが発生しました"
      };
    }
  }

  calculateNextGenerationTime(lastGenerationTime: number, generationCount: number): number {
    return lastGenerationTime + (generationCount * this.generationRate);
  }

  getGenerationRate(): number {
    return this.generationRate;
  }

  setGenerationRate(rate: number): void {
    if (rate <= 0) {
      throw new Error("生成レートは正の値である必要があります");
    }
    this.generationRate = rate;
  }
}