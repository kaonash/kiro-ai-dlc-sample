import { WaveScheduler } from '../../domain/entities/wave-scheduler';
import { Enemy } from '../../domain/entities/enemy';
import { EnemyDamageService } from '../../domain/services/enemy-damage-service';
import { Position } from '../../domain/value-objects/position';

/**
 * タワー戦闘サービスのインターフェース
 */
export interface ITowerCombatService {
  getEnemiesInRange(position: Position, range: number): Enemy[];
  notifyEnemyDestroyed(enemyId: string): void;
  getTargetableEnemies(): Enemy[];
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
 * ダメージ処理結果の型定義
 */
export interface DamageResult {
  success: boolean;
  damageApplied: number;
  enemyDestroyed: boolean;
  remainingHealth: number;
  error?: string;
}

/**
 * 範囲ダメージ結果の型定義
 */
export interface AreaDamageResult {
  success: boolean;
  affectedEnemies: number;
  enemiesDestroyed: number;
  totalDamageDealt: number;
  destroyedEnemyIds: string[];
  error?: string;
}

/**
 * ダメージ統計情報の型定義
 */
export interface DamageStatistics {
  totalDamageDealt: number;
  enemiesDestroyed: number;
  totalDamageRequests: number;
  averageDamagePerRequest: number;
  damageEfficiency: number;
  overkillDamage: number;
}

/**
 * ダメージ予測結果の型定義
 */
export interface DamagePrediction {
  willDestroy: boolean;
  remainingHealth: number;
  healthPercentageAfter: number;
  overkillAmount: number;
  error?: string;
}

/**
 * ダメージ最適化推奨の型定義
 */
export interface DamageOptimization {
  recommendations: Array<{
    enemyId: string;
    recommendedDamage: number;
    reason: string;
    priority: number;
  }>;
  totalDamageToDistribute: number;
  estimatedKills: number;
  efficiency: number;
}

/**
 * ダメージ検証結果の型定義
 */
export interface DamageValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 敵ダメージ処理ユースケース
 */
export class ProcessEnemyDamageUseCase {
  private totalDamageDealt: number = 0;
  private enemiesDestroyed: number = 0;
  private totalDamageRequests: number = 0;
  private overkillDamage: number = 0;

  constructor(
    private readonly enemyDamageService: EnemyDamageService,
    private readonly towerCombatService: ITowerCombatService,
    private readonly uiFeedbackService: IUIFeedbackService
  ) {}

  /**
   * 敵にダメージを与える
   * @param enemyId 敵ID
   * @param damage ダメージ量
   * @param waveScheduler 波スケジューラー
   * @returns ダメージ処理結果
   */
  async execute(enemyId: string, damage: number, waveScheduler: WaveScheduler): Promise<DamageResult> {
    try {
      this.totalDamageRequests++;

      // 敵を検索
      const enemy = waveScheduler.findEnemyById(enemyId);
      if (!enemy) {
        return {
          success: false,
          damageApplied: 0,
          enemyDestroyed: false,
          remainingHealth: 0,
          error: `敵が見つかりません: ${enemyId}`
        };
      }

      // 死亡している敵には何もしない
      if (!enemy.isAlive) {
        return {
          success: true,
          damageApplied: 0,
          enemyDestroyed: false,
          remainingHealth: 0
        };
      }

      // オーバーキルダメージを計算
      const actualDamage = Math.min(damage, enemy.currentHealth);
      const overkill = Math.max(0, damage - enemy.currentHealth);
      this.overkillDamage += overkill;

      // ダメージを適用
      const wasDestroyed = this.enemyDamageService.applyDamage(enemy, damage);
      
      this.totalDamageDealt += actualDamage;
      if (wasDestroyed) {
        this.enemiesDestroyed++;
      }

      // UI更新
      try {
        if (enemy.isAlive) {
          this.uiFeedbackService.updateEnemyHealth(enemyId, enemy.getHealthPercentage());
        } else {
          this.uiFeedbackService.removeEnemyDisplay(enemyId);
          // タワー戦闘システムに通知
          this.towerCombatService.notifyEnemyDestroyed(enemyId);
        }
      } catch (error) {
        console.warn('Failed to update UI after damage:', error);
      }

      return {
        success: true,
        damageApplied: actualDamage,
        enemyDestroyed: wasDestroyed,
        remainingHealth: enemy.currentHealth
      };
    } catch (error) {
      return {
        success: false,
        damageApplied: 0,
        enemyDestroyed: false,
        remainingHealth: 0,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
      };
    }
  }

  /**
   * 範囲ダメージを処理する
   * @param centerPosition 中心位置
   * @param range 範囲
   * @param damage ダメージ量
   * @param waveScheduler 波スケジューラー
   * @returns 範囲ダメージ結果
   */
  async executeAreaDamage(
    centerPosition: Position, 
    range: number, 
    damage: number, 
    waveScheduler: WaveScheduler
  ): Promise<AreaDamageResult> {
    try {
      const allEnemies = waveScheduler.getAllActiveEnemies();
      const destroyedEnemyIds: string[] = [];
      let affectedEnemies = 0;
      let enemiesDestroyed = 0;
      let totalDamageDealt = 0;

      // 範囲内の敵にダメージを適用
      const destroyedEnemies = this.enemyDamageService.applyAreaDamage(
        allEnemies, 
        centerPosition, 
        range, 
        damage
      );

      // 影響を受けた敵を特定
      for (const enemy of allEnemies) {
        if (enemy.currentPosition.distanceTo(centerPosition) <= range && enemy.isAlive) {
          affectedEnemies++;
          const actualDamage = Math.min(damage, enemy.currentHealth + damage);
          totalDamageDealt += actualDamage;
        }
      }

      // 破壊された敵の処理
      for (const enemy of destroyedEnemies) {
        destroyedEnemyIds.push(enemy.id);
        enemiesDestroyed++;
        
        try {
          this.uiFeedbackService.removeEnemyDisplay(enemy.id);
          this.towerCombatService.notifyEnemyDestroyed(enemy.id);
        } catch (error) {
          console.warn('Failed to update UI for destroyed enemy:', error);
        }
      }

      // 生存している敵のUI更新
      for (const enemy of allEnemies) {
        if (enemy.isAlive && enemy.currentPosition.distanceTo(centerPosition) <= range) {
          try {
            this.uiFeedbackService.updateEnemyHealth(enemy.id, enemy.getHealthPercentage());
          } catch (error) {
            console.warn('Failed to update enemy health UI:', error);
          }
        }
      }

      // 統計更新
      this.totalDamageRequests++;
      this.totalDamageDealt += totalDamageDealt;
      this.enemiesDestroyed += enemiesDestroyed;

      return {
        success: true,
        affectedEnemies,
        enemiesDestroyed,
        totalDamageDealt,
        destroyedEnemyIds
      };
    } catch (error) {
      return {
        success: false,
        affectedEnemies: 0,
        enemiesDestroyed: 0,
        totalDamageDealt: 0,
        destroyedEnemyIds: [],
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
      };
    }
  }

  /**
   * ダメージ統計情報を取得する
   * @returns 統計情報
   */
  async getDamageStatistics(): Promise<DamageStatistics> {
    const averageDamagePerRequest = this.totalDamageRequests > 0 
      ? this.totalDamageDealt / this.totalDamageRequests 
      : 0;
    
    const damageEfficiency = this.totalDamageDealt > 0 
      ? (this.totalDamageDealt - this.overkillDamage) / this.totalDamageDealt 
      : 1;

    return {
      totalDamageDealt: this.totalDamageDealt,
      enemiesDestroyed: this.enemiesDestroyed,
      totalDamageRequests: this.totalDamageRequests,
      averageDamagePerRequest: Math.round(averageDamagePerRequest * 100) / 100,
      damageEfficiency: Math.round(damageEfficiency * 100) / 100,
      overkillDamage: this.overkillDamage
    };
  }

  /**
   * ダメージの結果を予測する
   * @param enemyId 敵ID
   * @param damage ダメージ量
   * @param waveScheduler 波スケジューラー
   * @returns 予測結果
   */
  async predictDamageOutcome(enemyId: string, damage: number, waveScheduler: WaveScheduler): Promise<DamagePrediction> {
    const enemy = waveScheduler.findEnemyById(enemyId);
    if (!enemy) {
      return {
        willDestroy: false,
        remainingHealth: 0,
        healthPercentageAfter: 0,
        overkillAmount: 0,
        error: '敵が見つかりません'
      };
    }

    const actualDamage = this.enemyDamageService.calculateDamageWithMultiplier(damage);
    const remainingHealth = Math.max(0, enemy.currentHealth - actualDamage);
    const willDestroy = remainingHealth === 0;
    const healthPercentageAfter = remainingHealth / enemy.maxHealth;
    const overkillAmount = Math.max(0, actualDamage - enemy.currentHealth);

    return {
      willDestroy,
      remainingHealth,
      healthPercentageAfter: Math.round(healthPercentageAfter * 100) / 100,
      overkillAmount
    };
  }

  /**
   * ダメージ配分を最適化する
   * @param enemies 対象の敵配列
   * @param totalAvailableDamage 利用可能な総ダメージ
   * @returns 最適化推奨
   */
  async optimizeDamageApplication(enemies: Enemy[], totalAvailableDamage: number): Promise<DamageOptimization> {
    const recommendations: Array<{
      enemyId: string;
      recommendedDamage: number;
      reason: string;
      priority: number;
    }> = [];

    const aliveEnemies = enemies.filter(enemy => enemy.isAlive);
    let remainingDamage = totalAvailableDamage;
    let estimatedKills = 0;

    // 優先度順にソート（体力が少ない敵を優先）
    const sortedEnemies = aliveEnemies.sort((a, b) => a.currentHealth - b.currentHealth);

    for (const enemy of sortedEnemies) {
      if (remainingDamage <= 0) break;

      const requiredDamage = this.enemyDamageService.calculateRequiredDamageToDestroy(enemy);
      
      if (remainingDamage >= requiredDamage) {
        // 一撃で倒せる場合
        recommendations.push({
          enemyId: enemy.id,
          recommendedDamage: requiredDamage,
          reason: '一撃で撃破可能',
          priority: 1
        });
        remainingDamage -= requiredDamage;
        estimatedKills++;
      } else {
        // 部分ダメージの場合
        recommendations.push({
          enemyId: enemy.id,
          recommendedDamage: remainingDamage,
          reason: '可能な限りのダメージ',
          priority: 2
        });
        remainingDamage = 0;
      }
    }

    const efficiency = totalAvailableDamage > 0 
      ? (totalAvailableDamage - remainingDamage) / totalAvailableDamage 
      : 0;

    return {
      recommendations: recommendations.sort((a, b) => a.priority - b.priority),
      totalDamageToDistribute: totalAvailableDamage,
      estimatedKills,
      efficiency: Math.round(efficiency * 100) / 100
    };
  }

  /**
   * ダメージリクエストを検証する
   * @param enemyId 敵ID
   * @param damage ダメージ量
   * @param waveScheduler 波スケジューラー
   * @returns 検証結果
   */
  async validateDamageRequest(enemyId: string, damage: number, waveScheduler: WaveScheduler): Promise<DamageValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本的な検証
    if (damage <= 0) {
      errors.push('ダメージは正の値である必要があります');
    }

    if (!enemyId || enemyId.trim() === '') {
      errors.push('敵IDが無効です');
    }

    // 敵の存在確認
    const enemy = waveScheduler.findEnemyById(enemyId);
    if (!enemy) {
      errors.push('敵が見つかりません');
    } else {
      // 敵固有の検証
      if (!enemy.isAlive) {
        warnings.push('対象の敵は既に死亡しています');
      }

      if (damage > enemy.currentHealth * 2) {
        warnings.push('オーバーキルダメージが大きすぎます');
      }

      if (enemy.isAtBase()) {
        warnings.push('敵は既に基地に到達しています');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 統計情報をリセットする
   */
  resetStatistics(): void {
    this.totalDamageDealt = 0;
    this.enemiesDestroyed = 0;
    this.totalDamageRequests = 0;
    this.overkillDamage = 0;
  }

  /**
   * 敵の弱点分析を取得する
   * @param waveScheduler 波スケジューラー
   * @returns 弱点分析結果
   */
  async analyzeEnemyWeaknesses(waveScheduler: WaveScheduler): Promise<{
    mostVulnerable: Enemy | null;
    leastVulnerable: Enemy | null;
    averageHealthPercentage: number;
    criticalHealthEnemies: Enemy[];
    recommendedTargets: Enemy[];
  }> {
    const activeEnemies = waveScheduler.getAllActiveEnemies();
    const analysis = this.enemyDamageService.analyzeEnemyWeaknesses(activeEnemies);
    
    // 推奨ターゲットを決定（体力20%以下または高攻撃力）
    const recommendedTargets = activeEnemies.filter(enemy => 
      enemy.getHealthPercentage() <= 0.2 || enemy.attackPower >= 70
    ).slice(0, 5);

    return {
      ...analysis,
      recommendedTargets
    };
  }

  /**
   * ダメージ効率レポートを生成する
   * @returns 効率レポート
   */
  async generateEfficiencyReport(): Promise<{
    overallEfficiency: number;
    recommendations: string[];
    performanceMetrics: {
      damagePerRequest: number;
      killRate: number;
      overkillRate: number;
    };
  }> {
    const stats = await this.getDamageStatistics();
    const recommendations: string[] = [];

    // 効率分析
    if (stats.damageEfficiency < 0.8) {
      recommendations.push('オーバーキルダメージを減らすことで効率を改善できます');
    }

    if (stats.averageDamagePerRequest < 30) {
      recommendations.push('より高いダメージでの攻撃を検討してください');
    }

    const killRate = stats.totalDamageRequests > 0 ? stats.enemiesDestroyed / stats.totalDamageRequests : 0;
    if (killRate < 0.3) {
      recommendations.push('撃破率が低いです。弱い敵を優先的に狙ってください');
    }

    const overkillRate = stats.totalDamageDealt > 0 ? stats.overkillDamage / stats.totalDamageDealt : 0;

    return {
      overallEfficiency: stats.damageEfficiency,
      recommendations,
      performanceMetrics: {
        damagePerRequest: stats.averageDamagePerRequest,
        killRate: Math.round(killRate * 100) / 100,
        overkillRate: Math.round(overkillRate * 100) / 100
      }
    };
  }
}