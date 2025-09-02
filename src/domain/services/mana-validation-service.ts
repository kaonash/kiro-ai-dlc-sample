import type { ManaPool } from "../entities/mana-pool";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ConsumptionValidationResult extends ValidationResult {
  canConsume?: boolean;
  shortage?: number;
}

export interface GenerationValidationResult extends ValidationResult {
  canGenerate?: boolean;
  actualAmount?: number;
}

export interface GameTimeValidationResult extends ValidationResult {
  timeDifference?: number;
}

export interface GenerationTimingValidationResult extends ValidationResult {
  shouldGenerate?: boolean;
  generationCount?: number;
}

export class ManaValidationService {
  private static readonly MIN_CARD_COST = 3;
  private static readonly MAX_CARD_COST = 30;

  validateManaPool(manaPool: ManaPool): ValidationResult {
    const errors: string[] = [];
    const currentMana = manaPool.getCurrentMana();
    const maxMana = manaPool.getMaxMana();

    if (currentMana < 0) {
      errors.push("魔力値が負の値です");
    }

    if (currentMana > maxMana) {
      errors.push("現在の魔力が上限を超えています");
    }

    if (maxMana <= 0) {
      errors.push("魔力上限が無効です");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateCardCost(cost: number): ValidationResult {
    const errors: string[] = [];

    if (cost < 0) {
      errors.push("カードコストが負の値です");
    }

    if (!Number.isInteger(cost)) {
      errors.push("カードコストは整数である必要があります");
    }

    if (cost < ManaValidationService.MIN_CARD_COST) {
      errors.push(`カードコストが最小値（${ManaValidationService.MIN_CARD_COST}）を下回っています`);
    }

    if (cost > ManaValidationService.MAX_CARD_COST) {
      errors.push(`カードコストが最大値（${ManaValidationService.MAX_CARD_COST}）を上回っています`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateConsumption(manaPool: ManaPool, amount: number): ConsumptionValidationResult {
    const errors: string[] = [];

    if (amount < 0) {
      errors.push("消費量は0以上である必要があります");
    }

    const currentMana = manaPool.getCurrentMana();
    const canConsume = currentMana >= amount;
    let shortage: number | undefined;

    if (!canConsume && amount >= 0) {
      shortage = amount - currentMana;
      errors.push(`魔力が不足しています（不足分: ${shortage}）`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      canConsume,
      shortage,
    };
  }

  validateGeneration(manaPool: ManaPool, amount: number): GenerationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (amount < 0) {
      errors.push("生成量は0以上である必要があります");
    }

    const currentMana = manaPool.getCurrentMana();
    const maxMana = manaPool.getMaxMana();
    const availableSpace = maxMana - currentMana;
    const actualAmount = Math.min(amount, availableSpace);

    if (amount > availableSpace && amount > 0) {
      warnings.push("生成量が上限でキャップされます");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canGenerate: amount >= 0,
      actualAmount,
    };
  }

  validateGameTime(currentTime: number, previousTime: number): GameTimeValidationResult {
    const errors: string[] = [];

    if (currentTime < 0 || previousTime < 0) {
      errors.push("ゲーム時間は0以上である必要があります");
    }

    if (currentTime < previousTime) {
      errors.push("ゲーム時間が逆行しています");
    }

    return {
      isValid: errors.length === 0,
      errors,
      timeDifference: currentTime - previousTime,
    };
  }

  validateGenerationTiming(
    lastGenerationTime: number,
    currentGameTime: number,
    pauseDuration = 0
  ): GenerationTimingValidationResult {
    const errors: string[] = [];

    // ゲーム時間の検証
    const timeValidation = this.validateGameTime(currentGameTime, lastGenerationTime);
    if (!timeValidation.isValid) {
      errors.push(...timeValidation.errors);
    }

    if (pauseDuration < 0) {
      errors.push("一時停止時間は0以上である必要があります");
    }

    // ゲーム時間ベースでの生成判定（一時停止を考慮）
    const effectiveTimeDifference = currentGameTime - lastGenerationTime;
    const generationInterval = 1000; // 1秒
    const generationCount = Math.floor(effectiveTimeDifference / generationInterval);
    const shouldGenerate = generationCount > 0;

    return {
      isValid: errors.length === 0,
      errors,
      shouldGenerate,
      generationCount,
    };
  }
}