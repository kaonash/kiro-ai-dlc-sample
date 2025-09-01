import { WaveScheduler } from '../../domain/entities/wave-scheduler';
import { EnemyMovementService } from '../../domain/services/enemy-movement-service';
import { BaseAttackService } from '../../domain/services/base-attack-service';
import { Position } from '../../domain/value-objects/position';

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
 * 敵更新結果の型定義
 */
export interface UpdateEnemiesResult {
  success: boolean;
  updatedEnemies: number;
  newEnemiesSpawned: number;
  baseDamage: number;
  enemiesDestroyed: number;
  updateTime: number;
  error?: string;
}

/**
 * 更新統計情報の型定義
 */
export interface UpdateStatistics {
  totalUpdates: number;
  averageUpdateTime: number;
  totalEnemiesProcessed: number;
  totalBaseDamage: number;
  totalEnemiesDestroyed: number;
  performanceMetrics: {
    minUpdateTime: number;
    maxUpdateTime: number;
    averageEnemiesPerUpdate: number;
  };
}

/**
 * 更新予測情報の型定義
 */
export interface UpdatePrediction {
  estimatedEnemies: number;
  estimatedUpdateTime: number;
  recommendedDeltaTime: number;
  performanceWarnings: string[];
}

/**
 * 更新条件検証結果の型定義
 */
export interface UpdateValidation {
  canUpdate: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 敵更新ユースケース
 */
export class UpdateEnemiesUseCase {
  private updateCount: number = 0;
  private totalUpdateTime: number = 0;
  private totalEnemiesProcessed: number = 0;
  private totalBaseDamage: number = 0;
  private totalEnemiesDestroyed: number = 0;
  private updateTimes: number[] = [];

  constructor(
    private readonly enemyMovementService: EnemyMovementService,
    private readonly baseAttackService: BaseAttackService,
    private readonly gameSessionService: IGameSessionService,
    private readonly uiFeedbackService: IUIFeedbackService
  ) {}

  /**
   * 敵を更新する
   * @param waveScheduler 波スケジューラー
   * @param deltaTime 経過時間（ミリ秒）
   * @param movementPath 移動パス（敵生成用）
   * @returns 更新結果
   */
  async execute(waveScheduler: WaveScheduler, deltaTime: number, movementPath?: any): Promise<UpdateEnemiesResult> {
    const startTime = Date.now();
    
    try {
      // 前提条件をチェック
      if (!this.gameSessionService.isGameActive()) {
        return {
          success: false,
          updatedEnemies: 0,
          newEnemiesSpawned: 0,
          baseDamage: 0,
          enemiesDestroyed: 0,
          updateTime: 0,
          error: 'ゲームがアクティブではありません'
        };
      }

      let updatedEnemies = 0;
      let newEnemiesSpawned = 0;
      let enemiesDestroyed = 0;

      // 波スケジューラーを更新（新しい敵の生成を含む）
      const currentTime = new Date(this.gameSessionService.getGameTime());
      
      // WaveScheduler の update メソッドを呼び出して敵生成を処理
      if (movementPath) {
        waveScheduler.update(currentTime, movementPath);
      }

      // アクティブな敵を取得
      const activeEnemies = waveScheduler.getAllActiveEnemies();
      
      // 敵の移動を更新
      for (const enemy of activeEnemies) {
        if (enemy.isAlive) {
          const oldPosition = enemy.currentPosition;
          this.enemyMovementService.updateEnemyMovement(enemy, deltaTime);
          updatedEnemies++;

          // UI更新
          try {
            if (!enemy.currentPosition.equals(oldPosition)) {
              this.uiFeedbackService.updateEnemyPosition(enemy.id, enemy.currentPosition);
            }
            this.uiFeedbackService.updateEnemyHealth(enemy.id, enemy.getHealthPercentage());
          } catch (error) {
            console.warn('Failed to update enemy UI:', error);
          }
        }
      }

      // 基地攻撃を処理
      const baseDamage = waveScheduler.processBaseAttacks();
      if (baseDamage > 0) {
        this.gameSessionService.reducePlayerHealth(baseDamage);
      }

      // 死亡した敵をUIから除去
      const deadEnemies = activeEnemies.filter(enemy => !enemy.isAlive);
      for (const enemy of deadEnemies) {
        try {
          this.uiFeedbackService.removeEnemyDisplay(enemy.id);
          enemiesDestroyed++;
        } catch (error) {
          console.warn('Failed to remove enemy from UI:', error);
        }
      }

      // 統計情報を更新
      const updateTime = Date.now() - startTime;
      this.updateStatistics(updatedEnemies, baseDamage, enemiesDestroyed, updateTime);

      return {
        success: true,
        updatedEnemies,
        newEnemiesSpawned,
        baseDamage,
        enemiesDestroyed,
        updateTime
      };
    } catch (error) {
      return {
        success: false,
        updatedEnemies: 0,
        newEnemiesSpawned: 0,
        baseDamage: 0,
        enemiesDestroyed: 0,
        updateTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
      };
    }
  }

  /**
   * パフォーマンス最適化された更新
   * @param waveScheduler 波スケジューラー
   * @param deltaTime 経過時間（ミリ秒）
   * @param maxUpdates フレームあたりの最大更新数
   * @returns 更新結果
   */
  async optimizeUpdate(
    waveScheduler: WaveScheduler, 
    deltaTime: number, 
    maxUpdates: number = 50
  ): Promise<UpdateEnemiesResult> {
    const startTime = Date.now();
    
    try {
      if (!this.gameSessionService.isGameActive()) {
        return {
          success: false,
          updatedEnemies: 0,
          newEnemiesSpawned: 0,
          baseDamage: 0,
          enemiesDestroyed: 0,
          updateTime: 0,
          error: 'ゲームがアクティブではありません'
        };
      }

      const activeEnemies = waveScheduler.getAllActiveEnemies();
      const enemiesToUpdate = activeEnemies.slice(0, maxUpdates);
      
      let updatedEnemies = 0;
      let enemiesDestroyed = 0;

      // 制限された数の敵のみ更新
      for (const enemy of enemiesToUpdate) {
        if (enemy.isAlive) {
          this.enemyMovementService.updateEnemyMovement(enemy, deltaTime);
          updatedEnemies++;

          try {
            this.uiFeedbackService.updateEnemyPosition(enemy.id, enemy.currentPosition);
            this.uiFeedbackService.updateEnemyHealth(enemy.id, enemy.getHealthPercentage());
          } catch (error) {
            console.warn('Failed to update enemy UI:', error);
          }
        }
      }

      // 基地攻撃処理
      const baseDamage = waveScheduler.processBaseAttacks();
      if (baseDamage > 0) {
        this.gameSessionService.reducePlayerHealth(baseDamage);
      }

      const updateTime = Date.now() - startTime;
      this.updateStatistics(updatedEnemies, baseDamage, enemiesDestroyed, updateTime);

      return {
        success: true,
        updatedEnemies,
        newEnemiesSpawned: 0,
        baseDamage,
        enemiesDestroyed,
        updateTime
      };
    } catch (error) {
      return {
        success: false,
        updatedEnemies: 0,
        newEnemiesSpawned: 0,
        baseDamage: 0,
        enemiesDestroyed: 0,
        updateTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
      };
    }
  }

  /**
   * 更新統計情報を取得する
   * @returns 統計情報
   */
  async getUpdateStatistics(): Promise<UpdateStatistics> {
    const averageUpdateTime = this.updateCount > 0 ? this.totalUpdateTime / this.updateCount : 0;
    const averageEnemiesPerUpdate = this.updateCount > 0 ? this.totalEnemiesProcessed / this.updateCount : 0;
    
    const minUpdateTime = this.updateTimes.length > 0 ? Math.min(...this.updateTimes) : 0;
    const maxUpdateTime = this.updateTimes.length > 0 ? Math.max(...this.updateTimes) : 0;

    return {
      totalUpdates: this.updateCount,
      averageUpdateTime: Math.round(averageUpdateTime * 100) / 100,
      totalEnemiesProcessed: this.totalEnemiesProcessed,
      totalBaseDamage: this.totalBaseDamage,
      totalEnemiesDestroyed: this.totalEnemiesDestroyed,
      performanceMetrics: {
        minUpdateTime,
        maxUpdateTime,
        averageEnemiesPerUpdate: Math.round(averageEnemiesPerUpdate * 100) / 100
      }
    };
  }

  /**
   * 次回更新の予測を行う
   * @param waveScheduler 波スケジューラー
   * @returns 予測情報
   */
  async predictNextUpdate(waveScheduler: WaveScheduler): Promise<UpdatePrediction> {
    const activeEnemies = waveScheduler.getAllActiveEnemies();
    const estimatedEnemies = activeEnemies.length;
    
    // 過去の統計に基づいて更新時間を予測
    const stats = await this.getUpdateStatistics();
    const estimatedUpdateTime = stats.averageUpdateTime * (estimatedEnemies / Math.max(1, stats.performanceMetrics.averageEnemiesPerUpdate));
    
    // 推奨デルタタイム（60FPS基準）
    const recommendedDeltaTime = 16; // 16ms ≈ 60FPS
    
    const performanceWarnings: string[] = [];
    if (estimatedUpdateTime > 16) {
      performanceWarnings.push('更新時間が16msを超える可能性があります');
    }
    if (estimatedEnemies > 100) {
      performanceWarnings.push('敵数が多すぎる可能性があります');
    }

    return {
      estimatedEnemies,
      estimatedUpdateTime: Math.round(estimatedUpdateTime * 100) / 100,
      recommendedDeltaTime,
      performanceWarnings
    };
  }

  /**
   * 更新条件を検証する
   * @param waveScheduler 波スケジューラー
   * @returns 検証結果
   */
  async validateUpdateConditions(waveScheduler: WaveScheduler): Promise<UpdateValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本的な前提条件
    if (!this.gameSessionService.isGameActive()) {
      errors.push('ゲームがアクティブではありません');
    }

    if (this.gameSessionService.getPlayerHealth() <= 0) {
      errors.push('プレイヤーの体力が0です');
    }

    // パフォーマンス警告
    const activeEnemies = waveScheduler.getAllActiveEnemies();
    if (activeEnemies.length > 50) {
      warnings.push('敵数が多いためパフォーマンスに影響する可能性があります');
    }

    const stats = await this.getUpdateStatistics();
    if (stats.performanceMetrics.maxUpdateTime > 33) {
      warnings.push('更新時間が長すぎる可能性があります（30FPS以下）');
    }

    return {
      canUpdate: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 統計情報を更新する
   * @param enemiesProcessed 処理された敵数
   * @param baseDamage 基地ダメージ
   * @param enemiesDestroyed 破壊された敵数
   * @param updateTime 更新時間
   */
  private updateStatistics(
    enemiesProcessed: number, 
    baseDamage: number, 
    enemiesDestroyed: number, 
    updateTime: number
  ): void {
    this.updateCount++;
    this.totalUpdateTime += updateTime;
    this.totalEnemiesProcessed += enemiesProcessed;
    this.totalBaseDamage += baseDamage;
    this.totalEnemiesDestroyed += enemiesDestroyed;
    
    // 最新の100回分の更新時間を保持
    this.updateTimes.push(updateTime);
    if (this.updateTimes.length > 100) {
      this.updateTimes.shift();
    }
  }

  /**
   * 統計情報をリセットする
   */
  resetStatistics(): void {
    this.updateCount = 0;
    this.totalUpdateTime = 0;
    this.totalEnemiesProcessed = 0;
    this.totalBaseDamage = 0;
    this.totalEnemiesDestroyed = 0;
    this.updateTimes = [];
  }
}