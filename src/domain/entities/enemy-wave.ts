import type { EnemyType } from "../value-objects/enemy-type";
import type { MovementPath } from "../value-objects/movement-path";
import type { WaveConfiguration } from "../value-objects/wave-configuration";
import { Enemy } from "./enemy";

/**
 * 一つの波に含まれる敵群を管理するエンティティ
 */
export class EnemyWave {
  public readonly totalEnemyCount: number;
  public readonly spawnInterval: number;

  private _enemies: Enemy[] = [];
  private _spawnedCount = 0;
  private _lastSpawnTime: Date;
  private _isComplete = false;
  private _enemyTypes: EnemyType[];
  private _nextEnemyIndex = 0;

  constructor(
    public readonly waveNumber: number,
    public readonly waveConfiguration: WaveConfiguration
  ) {
    this.totalEnemyCount = waveConfiguration.getEnemyCountForWave(waveNumber);
    this.spawnInterval = waveConfiguration.spawnInterval;
    this._lastSpawnTime = new Date();
    this._enemyTypes = waveConfiguration.getEnemyTypesForWave(waveNumber);
  }

  // ゲッター
  get enemies(): Enemy[] {
    return [...this._enemies];
  }

  get spawnedCount(): number {
    return this._spawnedCount;
  }

  get lastSpawnTime(): Date {
    return this._lastSpawnTime;
  }

  get isComplete(): boolean {
    return this._isComplete;
  }

  /**
   * 敵生成可能判定
   * @returns 敵を生成できる場合true
   */
  canSpawnEnemy(): boolean {
    // すべての敵を生成済みの場合は生成不可
    if (this._spawnedCount >= this.totalEnemyCount) {
      return false;
    }

    // 最初の敵は即座に生成可能
    if (this._spawnedCount === 0) {
      return true;
    }

    // 生成間隔が経過しているかチェック
    const timeSinceLastSpawn = Date.now() - this._lastSpawnTime.getTime();
    return timeSinceLastSpawn >= this.spawnInterval;
  }

  /**
   * 次の敵を生成する
   * @param movementPath 移動パス
   * @returns 生成された敵、生成できない場合はnull
   */
  spawnNextEnemy(movementPath: MovementPath): Enemy | null {
    if (!this.canSpawnEnemy()) {
      return null;
    }

    // 敵タイプを決定
    const enemyType = this._enemyTypes[this._nextEnemyIndex];

    // 敵を生成
    const enemyId = `wave-${this.waveNumber}-enemy-${this._spawnedCount + 1}`;
    const enemy = new Enemy(enemyId, enemyType, movementPath, new Date());

    // 波に追加
    this._enemies.push(enemy);
    this._spawnedCount++;
    this._nextEnemyIndex++;
    this._lastSpawnTime = new Date();

    return enemy;
  }

  /**
   * 生存している敵をすべて取得する
   * @returns 生存している敵の配列
   */
  getAllAliveEnemies(): Enemy[] {
    return this._enemies.filter((enemy) => enemy.isAlive);
  }

  /**
   * 波完了判定
   * @returns 波が完了している場合true
   */
  isWaveComplete(): boolean {
    // すべての敵が生成されていない場合は未完了
    if (this._spawnedCount < this.totalEnemyCount) {
      this._isComplete = false;
      return false;
    }

    // すべての敵が死亡または基地到達している場合は完了
    const allEnemiesGone = this._enemies.every((enemy) => !enemy.isAlive || enemy.isAtBase());

    this._isComplete = allEnemiesGone;
    return this._isComplete;
  }

  /**
   * 波進行度を取得する
   * @returns 進行度（0.0-1.0）
   */
  getProgress(): number {
    if (this.totalEnemyCount === 0) {
      return 1;
    }

    return this._spawnedCount / this.totalEnemyCount;
  }

  /**
   * 死亡した敵を波から除去する
   */
  removeDeadEnemies(): void {
    this._enemies = this._enemies.filter((enemy) => enemy.isAlive);
  }

  /**
   * 基地に到達した敵を波から除去する
   */
  removeEnemiesAtBase(): void {
    this._enemies = this._enemies.filter((enemy) => !enemy.isAtBase());
  }

  /**
   * 波内の敵数を取得する（生存・死亡問わず）
   * @returns 波内の敵数
   */
  getTotalEnemiesInWave(): number {
    return this._enemies.length;
  }

  /**
   * 波の残り敵数を取得する（生存している敵のみ）
   * @returns 残り敵数
   */
  getRemainingEnemyCount(): number {
    return this.getAllAliveEnemies().length;
  }

  /**
   * 波の統計情報を取得する
   * @returns 波の統計情報
   */
  getWaveStats(): {
    waveNumber: number;
    totalEnemyCount: number;
    spawnedCount: number;
    aliveCount: number;
    deadCount: number;
    atBaseCount: number;
    progress: number;
    isComplete: boolean;
  } {
    const aliveEnemies = this.getAllAliveEnemies();
    const deadEnemies = this._enemies.filter((enemy) => !enemy.isAlive);
    const atBaseEnemies = this._enemies.filter((enemy) => enemy.isAtBase());

    return {
      waveNumber: this.waveNumber,
      totalEnemyCount: this.totalEnemyCount,
      spawnedCount: this._spawnedCount,
      aliveCount: aliveEnemies.length,
      deadCount: deadEnemies.length,
      atBaseCount: atBaseEnemies.length,
      progress: this.getProgress(),
      isComplete: this.isWaveComplete(),
    };
  }
}
