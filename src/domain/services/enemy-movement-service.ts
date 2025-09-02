import type { Enemy } from "../entities/enemy";
import type { Position } from "../value-objects/position";

/**
 * 敵の移動処理を担当するドメインサービス
 */
export class EnemyMovementService {
  private totalUpdates = 0;
  private enemiesReachedBase = 0;
  private totalSpeedSum = 0;

  /**
   * 敵の移動を更新する
   * @param enemy 更新対象の敵
   * @param deltaTime 経過時間（ミリ秒）
   */
  updateEnemyMovement(enemy: Enemy, deltaTime: number): void {
    if (!enemy.isAlive || deltaTime <= 0) {
      return;
    }

    const wasAtBase = enemy.isAtBase();

    // 敵の移動処理を実行
    enemy.move(deltaTime);

    // 統計情報を更新
    this.totalUpdates++;
    this.totalSpeedSum += enemy.movementSpeed;

    // 基地到達判定
    if (!wasAtBase && enemy.isAtBase()) {
      this.enemiesReachedBase++;
    }
  }

  /**
   * 敵の次の位置を計算する
   * @param enemy 対象の敵
   * @param deltaTime 経過時間（ミリ秒）
   * @returns 次の位置
   */
  calculateNextPosition(enemy: Enemy, deltaTime: number): Position {
    if (!enemy.isAlive || deltaTime <= 0) {
      return enemy.currentPosition;
    }

    return enemy.movementPath.getNextPosition(enemy.pathProgress, enemy.movementSpeed, deltaTime);
  }

  /**
   * 敵が基地に到達したかチェックする
   * @param enemy 対象の敵
   * @returns 基地に到達している場合true
   */
  checkBaseReached(enemy: Enemy): boolean {
    return enemy.isAtBase();
  }

  /**
   * 複数の敵の移動を一括更新する
   * @param enemies 更新対象の敵の配列
   * @param deltaTime 経過時間（ミリ秒）
   */
  updateMultipleEnemies(enemies: Enemy[], deltaTime: number): void {
    for (const enemy of enemies) {
      this.updateEnemyMovement(enemy, deltaTime);
    }
  }

  /**
   * 敵の移動を効率的に更新する（バッチ処理）
   * @param enemies 更新対象の敵の配列
   * @param deltaTime 経過時間（ミリ秒）
   * @param maxUpdatesPerFrame フレームあたりの最大更新数
   */
  updateEnemiesBatch(enemies: Enemy[], deltaTime: number, maxUpdatesPerFrame = 50): void {
    const aliveEnemies = enemies.filter((enemy) => enemy.isAlive);
    const updateCount = Math.min(aliveEnemies.length, maxUpdatesPerFrame);

    for (let i = 0; i < updateCount; i++) {
      this.updateEnemyMovement(aliveEnemies[i], deltaTime);
    }
  }

  /**
   * 敵が基地に到達するまでの予想時間を計算する
   * @param enemy 対象の敵
   * @returns 基地到達までの時間（ミリ秒）
   */
  predictTimeToBase(enemy: Enemy): number {
    if (enemy.isAtBase()) {
      return 0;
    }

    const remainingDistance = enemy.movementPath.totalLength * (1 - enemy.pathProgress);
    return (remainingDistance / enemy.movementSpeed) * 1000; // 秒をミリ秒に変換
  }

  /**
   * 指定した位置に最も近い敵を検索する
   * @param enemies 検索対象の敵の配列
   * @param targetPosition 目標位置
   * @returns 最も近い敵、見つからない場合はnull
   */
  findNearestEnemy(enemies: Enemy[], targetPosition: Position): Enemy | null {
    const aliveEnemies = enemies.filter((enemy) => enemy.isAlive);

    if (aliveEnemies.length === 0) {
      return null;
    }

    let nearestEnemy = aliveEnemies[0];
    let nearestDistance = nearestEnemy.currentPosition.distanceTo(targetPosition);

    for (let i = 1; i < aliveEnemies.length; i++) {
      const distance = aliveEnemies[i].currentPosition.distanceTo(targetPosition);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = aliveEnemies[i];
      }
    }

    return nearestEnemy;
  }

  /**
   * 指定した範囲内の敵を取得する
   * @param enemies 検索対象の敵の配列
   * @param centerPosition 中心位置
   * @param range 範囲（ピクセル）
   * @returns 範囲内の敵の配列
   */
  getEnemiesInRange(enemies: Enemy[], centerPosition: Position, range: number): Enemy[] {
    return enemies.filter(
      (enemy) => enemy.isAlive && enemy.currentPosition.distanceTo(centerPosition) <= range
    );
  }

  /**
   * 移動統計情報を取得する
   * @returns 移動統計情報
   */
  getMovementStatistics(): {
    totalUpdates: number;
    enemiesReachedBase: number;
    averageSpeed: number;
  } {
    const averageSpeed = this.totalUpdates > 0 ? this.totalSpeedSum / this.totalUpdates : 0;

    return {
      totalUpdates: this.totalUpdates,
      enemiesReachedBase: this.enemiesReachedBase,
      averageSpeed: Math.round(averageSpeed * 100) / 100, // 小数点以下2桁で丸める
    };
  }

  /**
   * 統計情報をリセットする
   */
  resetStatistics(): void {
    this.totalUpdates = 0;
    this.enemiesReachedBase = 0;
    this.totalSpeedSum = 0;
  }

  /**
   * 敵の移動パフォーマンスを分析する
   * @param enemies 分析対象の敵の配列
   * @returns パフォーマンス分析結果
   */
  analyzeMovementPerformance(enemies: Enemy[]): {
    totalEnemies: number;
    movingEnemies: number;
    stuckEnemies: number;
    averageProgress: number;
    slowestEnemy: Enemy | null;
    fastestEnemy: Enemy | null;
  } {
    const aliveEnemies = enemies.filter((enemy) => enemy.isAlive);

    if (aliveEnemies.length === 0) {
      return {
        totalEnemies: 0,
        movingEnemies: 0,
        stuckEnemies: 0,
        averageProgress: 0,
        slowestEnemy: null,
        fastestEnemy: null,
      };
    }

    const movingEnemies = aliveEnemies.filter(
      (enemy) => enemy.pathProgress > 0 && enemy.pathProgress < 1
    );
    const stuckEnemies = aliveEnemies.filter((enemy) => enemy.pathProgress === 0);
    const totalProgress = aliveEnemies.reduce((sum, enemy) => sum + enemy.pathProgress, 0);
    const averageProgress = totalProgress / aliveEnemies.length;

    let slowestEnemy = aliveEnemies[0];
    let fastestEnemy = aliveEnemies[0];

    for (const enemy of aliveEnemies) {
      if (enemy.movementSpeed < slowestEnemy.movementSpeed) {
        slowestEnemy = enemy;
      }
      if (enemy.movementSpeed > fastestEnemy.movementSpeed) {
        fastestEnemy = enemy;
      }
    }

    return {
      totalEnemies: aliveEnemies.length,
      movingEnemies: movingEnemies.length,
      stuckEnemies: stuckEnemies.length,
      averageProgress: Math.round(averageProgress * 100) / 100,
      slowestEnemy,
      fastestEnemy,
    };
  }
}
