import { Enemy } from '../entities/enemy';
import { EnemyType } from '../value-objects/enemy-type';
import { Position } from '../value-objects/position';

/**
 * 敵へのダメージ処理を担当するドメインサービス
 */
export class EnemyDamageService {
  private damageMultiplier: number = 1.0;
  private totalDamageDealt: number = 0;
  private enemiesDestroyed: number = 0;
  private damageByType: Map<EnemyType, number> = new Map();

  /**
   * 敵にダメージを適用する
   * @param enemy 対象の敵
   * @param damage ダメージ量
   * @returns 敵が破壊された場合true
   */
  applyDamage(enemy: Enemy, damage: number): boolean {
    if (!enemy.isAlive || damage <= 0) {
      return false;
    }

    const actualDamage = this.calculateDamageWithMultiplier(damage);
    const wasAlive = enemy.isAlive;
    
    enemy.takeDamage(actualDamage);
    
    // 統計情報を更新
    this.updateDamageStatistics(enemy.type, actualDamage);
    
    // 敵が破壊されたかチェック
    const isDestroyed = wasAlive && !enemy.isAlive;
    if (isDestroyed) {
      this.enemiesDestroyed++;
    }
    
    return isDestroyed;
  }

  /**
   * 敵が破壊されているかチェックする
   * @param enemy 対象の敵
   * @returns 破壊されている場合true
   */
  isEnemyDestroyed(enemy: Enemy): boolean {
    return !enemy.isAlive;
  }

  /**
   * 敵の破壊処理を実行する
   * @param enemy 対象の敵
   */
  processEnemyDestruction(enemy: Enemy): void {
    if (enemy.isAlive) {
      enemy.destroy();
    }
  }

  /**
   * ダメージ倍率を適用してダメージを計算する
   * @param baseDamage 基本ダメージ
   * @returns 倍率適用後のダメージ
   */
  calculateDamageWithMultiplier(baseDamage: number): number {
    return Math.round(baseDamage * this.damageMultiplier);
  }

  /**
   * 範囲ダメージを適用する
   * @param enemies 対象の敵の配列
   * @param centerPosition 範囲の中心位置
   * @param range 範囲（ピクセル）
   * @param damage ダメージ量
   * @returns 破壊された敵の配列
   */
  applyAreaDamage(enemies: Enemy[], centerPosition: Position, range: number, damage: number): Enemy[] {
    const destroyedEnemies: Enemy[] = [];
    
    const enemiesInRange = enemies.filter(enemy => 
      enemy.isAlive && 
      enemy.currentPosition.distanceTo(centerPosition) <= range
    );

    for (const enemy of enemiesInRange) {
      const isDestroyed = this.applyDamage(enemy, damage);
      if (isDestroyed) {
        destroyedEnemies.push(enemy);
      }
    }

    return destroyedEnemies;
  }

  /**
   * 複数の敵に個別ダメージを適用する
   * @param damageTargets ダメージ対象の配列（敵とダメージのペア）
   * @returns 破壊された敵の配列
   */
  applyMultipleDamage(damageTargets: Array<{ enemy: Enemy; damage: number }>): Enemy[] {
    const destroyedEnemies: Enemy[] = [];
    
    for (const { enemy, damage } of damageTargets) {
      const isDestroyed = this.applyDamage(enemy, damage);
      if (isDestroyed) {
        destroyedEnemies.push(enemy);
      }
    }

    return destroyedEnemies;
  }

  /**
   * 敵の残り体力に基づいて必要ダメージを計算する
   * @param enemy 対象の敵
   * @returns 敵を破壊するのに必要なダメージ
   */
  calculateRequiredDamageToDestroy(enemy: Enemy): number {
    if (!enemy.isAlive) {
      return 0;
    }
    
    // 倍率を考慮した必要ダメージを逆算
    return Math.ceil(enemy.currentHealth / this.damageMultiplier);
  }

  /**
   * ダメージ統計情報を更新する
   * @param enemyType 敵タイプ
   * @param damage 与えたダメージ
   */
  private updateDamageStatistics(enemyType: EnemyType, damage: number): void {
    this.totalDamageDealt += damage;
    
    const currentDamage = this.damageByType.get(enemyType) || 0;
    this.damageByType.set(enemyType, currentDamage + damage);
  }

  /**
   * 敵の弱点を分析する
   * @param enemies 分析対象の敵の配列
   * @returns 弱点分析結果
   */
  analyzeEnemyWeaknesses(enemies: Enemy[]): {
    mostVulnerable: Enemy | null;
    leastVulnerable: Enemy | null;
    averageHealthPercentage: number;
    criticalHealthEnemies: Enemy[]; // 体力20%以下
  } {
    const aliveEnemies = enemies.filter(enemy => enemy.isAlive);
    
    if (aliveEnemies.length === 0) {
      return {
        mostVulnerable: null,
        leastVulnerable: null,
        averageHealthPercentage: 0,
        criticalHealthEnemies: []
      };
    }

    let mostVulnerable = aliveEnemies[0];
    let leastVulnerable = aliveEnemies[0];
    let totalHealthPercentage = 0;

    for (const enemy of aliveEnemies) {
      const healthPercentage = enemy.getHealthPercentage();
      totalHealthPercentage += healthPercentage;

      if (healthPercentage < mostVulnerable.getHealthPercentage()) {
        mostVulnerable = enemy;
      }
      if (healthPercentage > leastVulnerable.getHealthPercentage()) {
        leastVulnerable = enemy;
      }
    }

    const averageHealthPercentage = totalHealthPercentage / aliveEnemies.length;
    const criticalHealthEnemies = aliveEnemies.filter(enemy => 
      enemy.getHealthPercentage() <= 0.2
    );

    return {
      mostVulnerable,
      leastVulnerable,
      averageHealthPercentage: Math.round(averageHealthPercentage * 100) / 100,
      criticalHealthEnemies
    };
  }

  /**
   * ダメージ倍率を設定する
   * @param multiplier ダメージ倍率
   */
  setDamageMultiplier(multiplier: number): void {
    if (multiplier < 0) {
      throw new Error('Damage multiplier must be non-negative');
    }
    this.damageMultiplier = multiplier;
  }

  /**
   * 現在のダメージ倍率を取得する
   * @returns ダメージ倍率
   */
  getDamageMultiplier(): number {
    return this.damageMultiplier;
  }

  /**
   * ダメージ統計情報を取得する
   * @returns ダメージ統計情報
   */
  getDamageStatistics(): {
    totalDamageDealt: number;
    enemiesDestroyed: number;
    damageByType: Map<EnemyType, number>;
    averageDamagePerEnemy: number;
    destructionRate: number;
  } {
    const totalEnemiesEngaged = this.enemiesDestroyed + 
      Array.from(this.damageByType.values()).reduce((sum, damage) => sum + (damage > 0 ? 1 : 0), 0);
    
    const averageDamagePerEnemy = totalEnemiesEngaged > 0 
      ? Math.round((this.totalDamageDealt / totalEnemiesEngaged) * 100) / 100
      : 0;
    
    const destructionRate = totalEnemiesEngaged > 0
      ? Math.round((this.enemiesDestroyed / totalEnemiesEngaged) * 100) / 100
      : 0;

    return {
      totalDamageDealt: this.totalDamageDealt,
      enemiesDestroyed: this.enemiesDestroyed,
      damageByType: new Map(this.damageByType),
      averageDamagePerEnemy,
      destructionRate
    };
  }

  /**
   * 統計情報をリセットする
   */
  resetStatistics(): void {
    this.totalDamageDealt = 0;
    this.enemiesDestroyed = 0;
    this.damageByType.clear();
  }

  /**
   * 敵タイプ別のダメージ効率を計算する
   * @returns 敵タイプ別の効率分析
   */
  calculateDamageEfficiency(): Array<{
    enemyType: EnemyType;
    totalDamageDealt: number;
    averageDamagePerHit: number;
    damageToHealthRatio: number;
    efficiency: 'HIGH' | 'MEDIUM' | 'LOW';
  }> {
    const results: Array<{
      enemyType: EnemyType;
      totalDamageDealt: number;
      averageDamagePerHit: number;
      damageToHealthRatio: number;
      efficiency: 'HIGH' | 'MEDIUM' | 'LOW';
    }> = [];

    for (const [enemyType, totalDamage] of this.damageByType.entries()) {
      const enemyMaxHealth = enemyType.getBaseStats().health;
      const averageDamagePerHit = totalDamage; // 簡略化：1回の攻撃と仮定
      const damageToHealthRatio = totalDamage / enemyMaxHealth;
      
      let efficiency: 'HIGH' | 'MEDIUM' | 'LOW';
      if (damageToHealthRatio >= 1.0) {
        efficiency = 'HIGH';
      } else if (damageToHealthRatio >= 0.5) {
        efficiency = 'MEDIUM';
      } else {
        efficiency = 'LOW';
      }

      results.push({
        enemyType,
        totalDamageDealt: totalDamage,
        averageDamagePerHit: Math.round(averageDamagePerHit * 100) / 100,
        damageToHealthRatio: Math.round(damageToHealthRatio * 100) / 100,
        efficiency
      });
    }

    return results.sort((a, b) => b.totalDamageDealt - a.totalDamageDealt);
  }

  /**
   * 最適な攻撃対象を推奨する
   * @param enemies 候補の敵の配列
   * @param availableDamage 利用可能なダメージ
   * @returns 推奨攻撃対象
   */
  recommendAttackTarget(enemies: Enemy[], availableDamage: number): {
    primaryTarget: Enemy | null;
    alternativeTargets: Enemy[];
    reasoning: string;
  } {
    const aliveEnemies = enemies.filter(enemy => enemy.isAlive);
    
    if (aliveEnemies.length === 0) {
      return {
        primaryTarget: null,
        alternativeTargets: [],
        reasoning: '攻撃可能な敵がいません'
      };
    }

    const actualDamage = this.calculateDamageWithMultiplier(availableDamage);
    
    // 一撃で倒せる敵を優先
    const killableEnemies = aliveEnemies.filter(enemy => 
      enemy.currentHealth <= actualDamage
    );

    if (killableEnemies.length > 0) {
      // 最も価値の高い（攻撃力の高い）敵を選択
      const primaryTarget = killableEnemies.reduce((prev, current) => 
        current.attackPower > prev.attackPower ? current : prev
      );
      
      return {
        primaryTarget,
        alternativeTargets: killableEnemies.filter(e => e !== primaryTarget),
        reasoning: '一撃で倒せる敵の中で最も攻撃力が高い敵を推奨'
      };
    }

    // 一撃で倒せない場合は、最も体力の少ない敵を推奨
    const weakestEnemy = aliveEnemies.reduce((prev, current) => 
      current.currentHealth < prev.currentHealth ? current : prev
    );

    return {
      primaryTarget: weakestEnemy,
      alternativeTargets: aliveEnemies.filter(e => e !== weakestEnemy).slice(0, 3),
      reasoning: '最も体力の少ない敵を推奨（継続ダメージで撃破を狙う）'
    };
  }
}