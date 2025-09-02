import type { Enemy } from "../entities/enemy";
import type { EnemyType } from "../value-objects/enemy-type";

/**
 * 基地攻撃処理を担当するドメインサービス
 */
export class BaseAttackService {
  private damageMultiplier = 1.0;
  private totalAttacks = 0;
  private totalDamageDealt = 0;
  private attacksByType: Map<EnemyType, number> = new Map();

  /**
   * 基地攻撃を処理する
   * @param enemies 敵の配列
   * @returns 基地に与えられた総ダメージ
   */
  processBaseAttacks(enemies: Enemy[]): number {
    let totalDamage = 0;

    const enemiesAtBase = enemies.filter((enemy) => enemy.isAlive && enemy.isAtBase());

    for (const enemy of enemiesAtBase) {
      const damage = this.calculateBaseDamage(enemy);
      totalDamage += damage;

      // 統計情報を更新
      this.updateAttackStatistics(enemy, damage);

      // 敵を基地攻撃後に除去
      this.removeEnemyAfterAttack(enemy);
    }

    return totalDamage;
  }

  /**
   * 基地ダメージを計算する
   * @param enemy 攻撃する敵
   * @returns 基地に与えるダメージ
   */
  calculateBaseDamage(enemy: Enemy): number {
    if (!enemy.isAlive) {
      return 0;
    }

    const baseDamage = enemy.attackBase();
    return Math.round(baseDamage * this.damageMultiplier);
  }

  /**
   * 基地攻撃後に敵を除去する
   * @param enemy 除去する敵
   */
  removeEnemyAfterAttack(enemy: Enemy): void {
    enemy.destroy();
  }

  /**
   * 攻撃統計情報を更新する
   * @param enemy 攻撃した敵
   * @param damage 与えたダメージ
   */
  private updateAttackStatistics(enemy: Enemy, damage: number): void {
    this.totalAttacks++;
    this.totalDamageDealt += damage;

    const currentCount = this.attacksByType.get(enemy.type) || 0;
    this.attacksByType.set(enemy.type, currentCount + 1);
  }

  /**
   * 複数の敵による基地攻撃を一括処理する
   * @param enemyGroups 敵グループの配列
   * @returns 各グループの攻撃ダメージの配列
   */
  processMultipleBaseAttacks(enemyGroups: Enemy[][]): number[] {
    return enemyGroups.map((enemies) => this.processBaseAttacks(enemies));
  }

  /**
   * 基地攻撃の予測ダメージを計算する
   * @param enemies 敵の配列
   * @returns 予測される総ダメージ
   */
  predictBaseDamage(enemies: Enemy[]): number {
    let totalPredictedDamage = 0;

    const enemiesAtBase = enemies.filter((enemy) => enemy.isAlive && enemy.isAtBase());

    for (const enemy of enemiesAtBase) {
      totalPredictedDamage += this.calculateBaseDamage(enemy);
    }

    return totalPredictedDamage;
  }

  /**
   * 基地攻撃の脅威レベルを評価する
   * @param enemies 敵の配列
   * @returns 脅威レベル（0-10）
   */
  evaluateThreatLevel(enemies: Enemy[]): number {
    const aliveEnemies = enemies.filter((enemy) => enemy.isAlive);

    if (aliveEnemies.length === 0) {
      return 0;
    }

    const enemiesAtBase = aliveEnemies.filter((enemy) => enemy.isAtBase());
    const enemiesNearBase = aliveEnemies.filter(
      (enemy) => enemy.pathProgress > 0.8 && !enemy.isAtBase()
    );

    // 基地にいる敵は最高脅威
    let threatScore = enemiesAtBase.length * 3;

    // 基地近くの敵は中程度の脅威
    threatScore += enemiesNearBase.length * 2;

    // その他の敵は低脅威
    threatScore += (aliveEnemies.length - enemiesAtBase.length - enemiesNearBase.length) * 1;

    // 0-10の範囲にスケール
    return Math.min(10, Math.round((threatScore / aliveEnemies.length) * 2));
  }

  /**
   * ダメージ倍率を設定する
   * @param multiplier ダメージ倍率
   */
  setDamageMultiplier(multiplier: number): void {
    if (multiplier < 0) {
      throw new Error("Damage multiplier must be non-negative");
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
   * 攻撃統計情報を取得する
   * @returns 攻撃統計情報
   */
  getAttackStatistics(): {
    totalAttacks: number;
    totalDamageDealt: number;
    attacksByType: Map<EnemyType, number>;
    averageDamagePerAttack: number;
  } {
    const averageDamagePerAttack =
      this.totalAttacks > 0
        ? Math.round((this.totalDamageDealt / this.totalAttacks) * 100) / 100
        : 0;

    return {
      totalAttacks: this.totalAttacks,
      totalDamageDealt: this.totalDamageDealt,
      attacksByType: new Map(this.attacksByType),
      averageDamagePerAttack,
    };
  }

  /**
   * 統計情報をリセットする
   */
  resetStatistics(): void {
    this.totalAttacks = 0;
    this.totalDamageDealt = 0;
    this.attacksByType.clear();
  }

  /**
   * 敵タイプ別の攻撃効率を分析する
   * @returns 敵タイプ別の分析結果
   */
  analyzeAttackEfficiency(): Array<{
    enemyType: EnemyType;
    attackCount: number;
    totalDamage: number;
    averageDamage: number;
    efficiency: number; // ダメージ/攻撃力の比率
  }> {
    const results: Array<{
      enemyType: EnemyType;
      attackCount: number;
      totalDamage: number;
      averageDamage: number;
      efficiency: number;
    }> = [];

    for (const [enemyType, attackCount] of this.attacksByType.entries()) {
      const baseAttackPower = enemyType.getBaseStats().attackPower;
      const totalDamage = attackCount * Math.round(baseAttackPower * this.damageMultiplier);
      const averageDamage = totalDamage / attackCount;
      const efficiency = averageDamage / baseAttackPower;

      results.push({
        enemyType,
        attackCount,
        totalDamage,
        averageDamage: Math.round(averageDamage * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
      });
    }

    return results.sort((a, b) => b.totalDamage - a.totalDamage);
  }

  /**
   * 基地防御の推奨事項を生成する
   * @param enemies 現在の敵の配列
   * @returns 防御推奨事項
   */
  generateDefenseRecommendations(enemies: Enemy[]): {
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    recommendations: string[];
    estimatedDamage: number;
    timeToImpact: number; // 最初の敵が基地に到達するまでの時間（ミリ秒）
  } {
    const aliveEnemies = enemies.filter((enemy) => enemy.isAlive);
    const enemiesAtBase = aliveEnemies.filter((enemy) => enemy.isAtBase());
    const estimatedDamage = this.predictBaseDamage(enemies);

    // 最も基地に近い敵の到達時間を計算
    let timeToImpact = Number.POSITIVE_INFINITY;
    for (const enemy of aliveEnemies) {
      if (!enemy.isAtBase()) {
        const remainingDistance = enemy.movementPath.totalLength * (1 - enemy.pathProgress);
        const timeToBase = (remainingDistance / enemy.movementSpeed) * 1000;
        timeToImpact = Math.min(timeToImpact, timeToBase);
      }
    }

    if (timeToImpact === Number.POSITIVE_INFINITY) {
      timeToImpact = 0;
    }

    const recommendations: string[] = [];
    let priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

    if (enemiesAtBase.length > 0) {
      priority = "CRITICAL";
      recommendations.push("敵が基地を攻撃中！即座に対処が必要");
    } else if (estimatedDamage > 200) {
      priority = "HIGH";
      recommendations.push("高ダメージの敵が接近中");
      recommendations.push("強力な防御手段を準備");
    } else if (estimatedDamage > 100) {
      priority = "MEDIUM";
      recommendations.push("中程度の脅威が検出");
      recommendations.push("防御態勢を整える");
    } else if (aliveEnemies.length > 0) {
      priority = "LOW";
      recommendations.push("軽微な脅威を監視中");
    }

    if (timeToImpact < 5000 && timeToImpact > 0) {
      recommendations.push("5秒以内に敵が到達予定");
    }

    return {
      priority,
      recommendations,
      estimatedDamage,
      timeToImpact: Math.round(timeToImpact),
    };
  }
}
