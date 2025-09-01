import { ManaPool } from "../../domain/entities/ManaPool";
import { ManaGenerationService } from "../../domain/services/ManaGenerationService";
import { ManaValidationService } from "../../domain/services/ManaValidationService";

export interface GameSessionManager {
  getElapsedGameTime(): number;
  isPaused(): boolean;
}

export interface StartManaGenerationRequest {
  manaPool: ManaPool;
  gameSessionManager: GameSessionManager;
  lastGenerationTime: number;
}

export interface StartManaGenerationResponse {
  isSuccess: boolean;
  generatedAmount?: number;
  newLastGenerationTime?: number;
  error?: string;
}

export class StartManaGenerationUseCase {
  private readonly generationService: ManaGenerationService;
  private readonly validationService: ManaValidationService;

  constructor() {
    this.generationService = new ManaGenerationService();
    this.validationService = new ManaValidationService();
  }

  async execute(request: StartManaGenerationRequest): Promise<StartManaGenerationResponse> {
    try {
      // 入力検証
      const validationResult = this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          isSuccess: false,
          error: validationResult.errors.join(", ")
        };
      }

      const { manaPool, gameSessionManager, lastGenerationTime } = request;

      // ゲーム一時停止チェック
      if (gameSessionManager.isPaused()) {
        return {
          isSuccess: true,
          generatedAmount: 0,
          newLastGenerationTime: lastGenerationTime
        };
      }

      const currentGameTime = gameSessionManager.getElapsedGameTime();

      // 時間検証
      const timeValidation = this.validationService.validateGameTime(currentGameTime, lastGenerationTime);
      if (!timeValidation.isValid) {
        return {
          isSuccess: false,
          error: `時間が逆行しています: ${timeValidation.errors.join(", ")}`
        };
      }

      // 生成判定
      const shouldGenerate = this.generationService.shouldGenerateMana(lastGenerationTime, currentGameTime);
      if (!shouldGenerate.shouldGenerate) {
        return {
          isSuccess: true,
          generatedAmount: 0,
          newLastGenerationTime: lastGenerationTime
        };
      }

      // 魔力生成実行
      const generationResult = this.generationService.generateMana(
        manaPool,
        shouldGenerate.generationCount,
        currentGameTime
      );

      if (!generationResult.isSuccess) {
        return {
          isSuccess: false,
          error: generationResult.error
        };
      }

      // 次回生成時間計算
      const newLastGenerationTime = this.generationService.calculateNextGenerationTime(
        lastGenerationTime,
        shouldGenerate.generationCount
      );

      return {
        isSuccess: true,
        generatedAmount: generationResult.generatedAmount,
        newLastGenerationTime
      };

    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "魔力生成中に予期しないエラーが発生しました"
      };
    }
  }

  private validateRequest(request: StartManaGenerationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.manaPool) {
      errors.push("魔力プールが無効です");
    }

    if (!request.gameSessionManager) {
      errors.push("ゲームセッションマネージャーが無効です");
    }

    if (request.lastGenerationTime < 0) {
      errors.push("最終生成時間は0以上である必要があります");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}