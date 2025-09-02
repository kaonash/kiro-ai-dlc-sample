import type { WaveScheduler } from "../../domain/entities/wave-scheduler";
import type { MovementPath } from "../../domain/value-objects/movement-path";
import type { Position } from "../../domain/value-objects/position";

/**
 * ゲームセッションサービスのインターフェース
 */
export interface IGameSessionService {
  isGameActive(): boolean;
  getGameTime(): number;
  getPlayerHealth(): number;
  reducePlayerHealth(damage: number): void;
}

/**
 * UIフィードバックサービスのインターフェース
 */
export interface IUIFeedbackService {
  showWaveStartNotification(waveNumber: number): void;
  displayEnemy(enemy: any): void;
  updateEnemyPosition(enemyId: string, position: Position): void;
  updateEnemyHealth(enemyId: string, healthPercentage: number): void;
  removeEnemyDisplay(enemyId: string): void;
}

/**
 * 波開始結果の型定義
 */
export interface StartWaveResult {
  success: boolean;
  waveNumber?: number;
  enemyCount?: number;
  message?: string;
  error?: string;
}

/**
 * 前提条件検証結果の型定義
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 波プレビュー情報の型定義
 */
export interface WavePreview {
  nextWaveNumber: number;
  estimatedEnemyCount: number;
  canStart: boolean;
  timeUntilStart: number;
  reason?: string;
}

/**
 * 波開始ユースケース
 */
export class StartWaveUseCase {
  constructor(
    private readonly gameSessionService: IGameSessionService,
    private readonly uiFeedbackService: IUIFeedbackService
  ) {}

  /**
   * 波を開始する
   * @param waveScheduler 波スケジューラー
   * @param movementPath 移動パス
   * @returns 波開始結果
   */
  async execute(
    waveScheduler: WaveScheduler,
    movementPath: MovementPath
  ): Promise<StartWaveResult> {
    try {
      // 前提条件を検証
      const validation = await this.validatePreconditions(waveScheduler);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors[0],
        };
      }

      // 波を開始
      const wave = waveScheduler.startNextWave(movementPath);
      if (!wave) {
        return {
          success: false,
          error: "次の波を開始できません",
        };
      }

      // UI通知を送信（エラーが発生しても処理を継続）
      try {
        this.uiFeedbackService.showWaveStartNotification(wave.waveNumber);
      } catch (error) {
        console.warn("UI notification failed:", error);
      }

      return {
        success: true,
        waveNumber: wave.waveNumber,
        enemyCount: wave.totalEnemyCount,
        message: `波${wave.waveNumber}が開始されました`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "予期しないエラーが発生しました",
      };
    }
  }

  /**
   * 前提条件を検証する
   * @param waveScheduler 波スケジューラー
   * @returns 検証結果
   */
  async validatePreconditions(waveScheduler: WaveScheduler): Promise<ValidationResult> {
    const errors: string[] = [];

    // ゲームがアクティブかチェック
    if (!this.gameSessionService.isGameActive()) {
      errors.push("ゲームがアクティブではありません");
    }

    // 波スケジューラーがアクティブかチェック
    if (!waveScheduler.isActive) {
      errors.push("波スケジューラーがアクティブではありません");
    }

    // 次の波を開始できるかチェック
    if (waveScheduler.isActive && !waveScheduler.canStartNextWave()) {
      errors.push("次の波を開始できません");
    }

    // プレイヤーの体力チェック
    if (this.gameSessionService.getPlayerHealth() <= 0) {
      errors.push("プレイヤーの体力が0です");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 波のプレビュー情報を取得する
   * @param waveScheduler 波スケジューラー
   * @returns 波プレビュー情報
   */
  async getWavePreview(waveScheduler: WaveScheduler): Promise<WavePreview> {
    const nextWaveNumber = waveScheduler.waveNumber + 1;
    const estimatedEnemyCount =
      waveScheduler.currentWave?.totalEnemyCount ||
      (waveScheduler.waveNumber === 0 ? 10 : 10 + (nextWaveNumber - 1) * 10);

    // 開始可能かチェック
    const validation = await this.validatePreconditions(waveScheduler);
    const canStart = validation.isValid;

    // 次の波までの時間を計算
    let timeUntilStart = 0;
    if (waveScheduler.isActive) {
      const currentTime = this.gameSessionService.getGameTime();
      timeUntilStart = Math.max(0, waveScheduler.nextWaveTime.getTime() - currentTime);
    }

    return {
      nextWaveNumber,
      estimatedEnemyCount,
      canStart,
      timeUntilStart,
      reason: canStart ? undefined : validation.errors[0],
    };
  }

  /**
   * 波を強制開始する（タイミング制約を無視）
   * @param waveScheduler 波スケジューラー
   * @param movementPath 移動パス
   * @returns 波開始結果
   */
  async forceStartWave(
    waveScheduler: WaveScheduler,
    movementPath: MovementPath
  ): Promise<StartWaveResult> {
    try {
      // 基本的な前提条件のみチェック
      if (!this.gameSessionService.isGameActive()) {
        return {
          success: false,
          error: "ゲームがアクティブではありません",
        };
      }

      if (this.gameSessionService.getPlayerHealth() <= 0) {
        return {
          success: false,
          error: "プレイヤーの体力が0です",
        };
      }

      // 波スケジューラーをアクティブにする（必要に応じて）
      if (!waveScheduler.isActive) {
        waveScheduler.startWaveScheduling();
      }

      // 現在の波を強制完了する（存在する場合）
      if (waveScheduler.currentWave && !waveScheduler.currentWave.isComplete) {
        waveScheduler.forceCompleteCurrentWave();
      }

      // 次の波時間を現在時刻に設定
      (waveScheduler as any)._nextWaveTime = new Date();

      // 波を開始
      const wave = waveScheduler.startNextWave(movementPath);
      if (!wave) {
        return {
          success: false,
          error: "波の強制開始に失敗しました",
        };
      }

      // UI通知を送信
      try {
        this.uiFeedbackService.showWaveStartNotification(wave.waveNumber);
      } catch (error) {
        console.warn("UI notification failed:", error);
      }

      return {
        success: true,
        waveNumber: wave.waveNumber,
        enemyCount: wave.totalEnemyCount,
        message: `波${wave.waveNumber}が強制開始されました`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "予期しないエラーが発生しました",
      };
    }
  }

  /**
   * 波開始の推奨事項を取得する
   * @param waveScheduler 波スケジューラー
   * @returns 推奨事項
   */
  async getStartRecommendations(waveScheduler: WaveScheduler): Promise<{
    shouldStart: boolean;
    recommendations: string[];
    warnings: string[];
  }> {
    const recommendations: string[] = [];
    const warnings: string[] = [];

    const validation = await this.validatePreconditions(waveScheduler);
    const shouldStart = validation.isValid;

    if (shouldStart) {
      recommendations.push("波を開始する準備が整いました");

      const playerHealth = this.gameSessionService.getPlayerHealth();
      if (playerHealth < 500) {
        warnings.push("プレイヤーの体力が低下しています");
      }

      const nextWaveNumber = waveScheduler.waveNumber + 1;
      if (nextWaveNumber > 10) {
        warnings.push("高難易度の波が開始されます");
      }
    } else {
      recommendations.push("波開始の前提条件を満たしてください");
      recommendations.push(...validation.errors.map((error) => `解決が必要: ${error}`));
    }

    return {
      shouldStart,
      recommendations,
      warnings,
    };
  }

  /**
   * 波開始の統計情報を取得する
   * @param waveScheduler 波スケジューラー
   * @returns 統計情報
   */
  async getStartStatistics(waveScheduler: WaveScheduler): Promise<{
    totalWavesStarted: number;
    currentWaveNumber: number;
    averageWaveInterval: number;
    gameElapsedTime: number;
    nextWaveETA: number;
  }> {
    const stats = waveScheduler.getSchedulerStats();
    const currentTime = this.gameSessionService.getGameTime();
    const gameElapsedTime = currentTime - waveScheduler.gameStartTime.getTime();
    const nextWaveETA = Math.max(0, waveScheduler.nextWaveTime.getTime() - currentTime);

    // 平均波間隔を計算（簡略化）
    const averageWaveInterval =
      stats.currentWaveNumber > 0 ? gameElapsedTime / stats.currentWaveNumber : 0;

    return {
      totalWavesStarted: stats.currentWaveNumber,
      currentWaveNumber: stats.currentWaveNumber,
      averageWaveInterval: Math.round(averageWaveInterval),
      gameElapsedTime: Math.round(gameElapsedTime),
      nextWaveETA: Math.round(nextWaveETA),
    };
  }
}
