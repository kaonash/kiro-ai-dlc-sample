import { Enemy } from "../entities/enemy";
import { EnemyType } from "../value-objects/enemy-type";
import type { MovementPath } from "../value-objects/movement-path";
import type { Position } from "../value-objects/position";

/**
 * 敵の生成処理を担当するドメインサービス
 */
export class EnemySpawningService {
  private spawnCounter = 0;
  private spawnStatistics: Map<EnemyType, number> = new Map();

  /**
   * 敵を生成する
   * @param enemyId 敵ID
   * @param type 敵タイプ
   * @param spawnPoint 生成位置
   * @param path 移動パス
   * @returns 生成された敵
   */
  spawnEnemy(enemyId: string, type: EnemyType, spawnPoint: Position, path: MovementPath): Enemy {
    const enemy = new Enemy(enemyId, type, path, new Date());

    // 統計情報を更新
    this.updateSpawnStatistics(type);

    return enemy;
  }

  /**
   * 利用可能な生成地点から一つを選択する
   * @param availablePoints 利用可能な生成地点の配列
   * @returns 選択された生成地点
   */
  selectSpawnPoint(availablePoints: Position[]): Position {
    if (availablePoints.length === 0) {
      throw new Error("No spawn points available");
    }

    if (availablePoints.length === 1) {
      return availablePoints[0];
    }

    // ランダムに選択
    const randomIndex = Math.floor(Math.random() * availablePoints.length);
    return availablePoints[randomIndex];
  }

  /**
   * 敵タイプに応じた敵インスタンスを生成する
   * @param enemyId 敵ID
   * @param type 敵タイプ
   * @param path 移動パス
   * @returns 生成された敵
   */
  createEnemyWithStats(enemyId: string, type: EnemyType, path: MovementPath): Enemy {
    return new Enemy(enemyId, type, path, new Date());
  }

  /**
   * ランダムな生成地点で敵を生成する
   * @param enemyId 敵ID
   * @param type 敵タイプ
   * @param availablePoints 利用可能な生成地点
   * @param path 移動パス
   * @returns 生成された敵
   */
  spawnEnemyAtRandomPoint(
    enemyId: string,
    type: EnemyType,
    availablePoints: Position[],
    path: MovementPath
  ): Enemy {
    const spawnPoint = this.selectSpawnPoint(availablePoints);
    return this.spawnEnemy(enemyId, type, spawnPoint, path);
  }

  /**
   * 敵IDを生成する
   * @param prefix プレフィックス
   * @param waveNumber 波番号
   * @returns 生成された敵ID
   */
  generateEnemyId(prefix: string, waveNumber: number): string {
    this.spawnCounter++;
    const timestamp = Date.now();
    return `${prefix}-${waveNumber}-${this.spawnCounter}-${timestamp}`;
  }

  /**
   * 複数の敵を一度に生成する
   * @param count 生成数
   * @param types 敵タイプの配列
   * @param availablePoints 利用可能な生成地点
   * @param path 移動パス
   * @param idPrefix ID のプレフィックス
   * @param waveNumber 波番号
   * @returns 生成された敵の配列
   */
  spawnMultipleEnemies(
    count: number,
    types: EnemyType[],
    availablePoints: Position[],
    path: MovementPath,
    idPrefix: string,
    waveNumber: number
  ): Enemy[] {
    if (count <= 0) {
      return [];
    }

    if (types.length === 0) {
      throw new Error("No enemy types provided");
    }

    const enemies: Enemy[] = [];

    for (let i = 0; i < count; i++) {
      const enemyType = types[i % types.length]; // 循環して敵タイプを選択
      const enemyId = this.generateEnemyId(idPrefix, waveNumber);
      const enemy = this.spawnEnemyAtRandomPoint(enemyId, enemyType, availablePoints, path);
      enemies.push(enemy);
    }

    return enemies;
  }

  /**
   * 生成統計情報を更新する
   * @param type 敵タイプ
   */
  private updateSpawnStatistics(type: EnemyType): void {
    const currentCount = this.spawnStatistics.get(type) || 0;
    this.spawnStatistics.set(type, currentCount + 1);
  }

  /**
   * 生成統計情報を取得する
   * @returns 生成統計情報
   */
  getSpawnStatistics(): {
    totalSpawned: number;
    spawnedByType: Map<EnemyType, number>;
  } {
    const totalSpawned = Array.from(this.spawnStatistics.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      totalSpawned,
      spawnedByType: new Map(this.spawnStatistics),
    };
  }

  /**
   * 統計情報をリセットする
   */
  resetStatistics(): void {
    this.spawnCounter = 0;
    this.spawnStatistics.clear();
  }

  /**
   * 敵タイプの分布に基づいて敵タイプを選択する
   * @param distribution 敵タイプの分布マップ
   * @returns 選択された敵タイプ
   */
  selectEnemyTypeByDistribution(distribution: Map<EnemyType, number>): EnemyType {
    if (distribution.size === 0) {
      throw new Error("No enemy type distribution provided");
    }

    // 累積確率を計算
    const cumulativeProbabilities: Array<{ type: EnemyType; probability: number }> = [];
    let cumulativeProbability = 0;

    for (const [type, probability] of distribution.entries()) {
      cumulativeProbability += probability;
      cumulativeProbabilities.push({ type, probability: cumulativeProbability });
    }

    // ランダム値を生成（0-1）
    const randomValue = Math.random();

    // 累積確率に基づいて敵タイプを選択
    for (const { type, probability } of cumulativeProbabilities) {
      if (randomValue <= probability) {
        return type;
      }
    }

    // フォールバック（通常は到達しない）
    return cumulativeProbabilities[cumulativeProbabilities.length - 1].type;
  }

  /**
   * 生成可能な敵タイプを検証する
   * @param type 敵タイプ
   * @returns 生成可能な場合true
   */
  canSpawnEnemyType(type: EnemyType): boolean {
    // 基本的にはすべての敵タイプが生成可能
    // 将来的には特定の条件（アンロック状態など）をチェックする可能性
    return EnemyType.getAllTypes().includes(type);
  }

  /**
   * 敵の生成コストを計算する（将来の拡張用）
   * @param type 敵タイプ
   * @returns 生成コスト
   */
  calculateSpawnCost(type: EnemyType): number {
    const stats = type.getBaseStats();
    // 基本的なコスト計算（ステータスの合計に基づく）
    return Math.round((stats.health + stats.attackPower + stats.movementSpeed) / 10);
  }
}
