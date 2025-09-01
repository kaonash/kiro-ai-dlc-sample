import { EnemyWave } from './enemy-wave';
import { Enemy } from './enemy';
import { WaveConfiguration } from '../value-objects/wave-configuration';
import { MovementPath } from '../value-objects/movement-path';

/**
 * 敵の波全体を統括管理する集約ルート
 */
export class WaveScheduler {
  public readonly waveInterval: number;
  
  private _currentWave: EnemyWave | null = null;
  private _waveNumber: number = 0;
  private _nextWaveTime: Date;
  private _isActive: boolean = false;

  constructor(
    private readonly waveConfiguration: WaveConfiguration,
    public readonly gameStartTime: Date
  ) {
    this.waveInterval = waveConfiguration.getWaveInterval();
    this._nextWaveTime = new Date(gameStartTime.getTime() + this.waveInterval);
  }

  // ゲッター
  get currentWave(): EnemyWave | null {
    return this._currentWave;
  }

  get waveNumber(): number {
    return this._waveNumber;
  }

  get nextWaveTime(): Date {
    return this._nextWaveTime;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * 波スケジューリングを開始する
   */
  startWaveScheduling(): void {
    this._isActive = true;
  }

  /**
   * 波スケジューリングを停止する
   */
  stopWaveScheduling(): void {
    this._isActive = false;
  }

  /**
   * 更新処理
   * @param currentTime 現在時刻
   * @param movementPath 移動パス
   */
  update(currentTime: Date, movementPath: MovementPath): void {
    if (!this._isActive) {
      return;
    }

    // 現在の波の敵生成処理
    if (this._currentWave && !this._currentWave.isComplete) {
      if (this._currentWave.canSpawnEnemy()) {
        this._currentWave.spawnNextEnemy(movementPath);
      }
      
      // 死亡した敵を除去
      this._currentWave.removeDeadEnemies();
    }

    // 次の波開始判定
    if (this.canStartNextWave(currentTime)) {
      this.startNextWave(movementPath);
    }
  }

  /**
   * 次波開始可能判定
   * @param currentTime 現在時刻（省略時は現在時刻を使用）
   * @returns 次の波を開始できる場合true
   */
  canStartNextWave(currentTime?: Date): boolean {
    if (!this._isActive) {
      return false;
    }

    const now = currentTime || new Date();

    // 現在の波が存在し、まだ完了していない場合は開始不可
    if (this._currentWave && !this._currentWave.isComplete) {
      return false;
    }

    // 波間隔が経過しているかチェック
    return now.getTime() >= this._nextWaveTime.getTime();
  }

  /**
   * 次の波を開始する
   * @param movementPath 移動パス
   * @returns 開始された波、開始できない場合はnull
   */
  startNextWave(movementPath: MovementPath): EnemyWave | null {
    if (!this.canStartNextWave()) {
      return null;
    }

    // 波番号を増加
    this._waveNumber++;

    // 新しい波を作成
    this._currentWave = new EnemyWave(this._waveNumber, this.waveConfiguration);

    // 次の波の時間を設定
    this._nextWaveTime = new Date(Date.now() + this.waveInterval);

    return this._currentWave;
  }

  /**
   * 全アクティブ敵を取得する
   * @returns アクティブな敵の配列
   */
  getAllActiveEnemies(): Enemy[] {
    if (!this._currentWave) {
      return [];
    }

    return this._currentWave.getAllAliveEnemies();
  }

  /**
   * 指定した敵を検索する
   * @param enemyId 敵ID
   * @returns 見つかった敵、見つからない場合はnull
   */
  findEnemyById(enemyId: string): Enemy | null {
    if (!this._currentWave) {
      return null;
    }

    return this._currentWave.enemies.find(enemy => enemy.id === enemyId) || null;
  }

  /**
   * 敵にダメージを与える
   * @param enemyId 敵ID
   * @param damage ダメージ量
   * @returns ダメージが適用された場合true
   */
  damageEnemy(enemyId: string, damage: number): boolean {
    const enemy = this.findEnemyById(enemyId);
    if (!enemy || !enemy.isAlive) {
      return false;
    }

    enemy.takeDamage(damage);
    return true;
  }

  /**
   * 基地に到達した敵を処理する
   * @returns 基地攻撃の総ダメージ
   */
  processBaseAttacks(): number {
    if (!this._currentWave) {
      return 0;
    }

    let totalDamage = 0;
    const enemiesAtBase = this._currentWave.enemies.filter(enemy => 
      enemy.isAlive && enemy.isAtBase()
    );

    for (const enemy of enemiesAtBase) {
      totalDamage += enemy.attackBase();
      enemy.destroy(); // 基地攻撃後は敵を破壊
    }

    // 基地に到達した敵を除去
    this._currentWave.removeEnemiesAtBase();

    return totalDamage;
  }

  /**
   * スケジューラーの統計情報を取得する
   * @returns スケジューラーの統計情報
   */
  getSchedulerStats(): {
    isActive: boolean;
    currentWaveNumber: number;
    totalActiveEnemies: number;
    nextWaveTime: Date;
    gameStartTime: Date;
    currentWaveStats?: {
      waveNumber: number;
      totalEnemyCount: number;
      spawnedCount: number;
      aliveCount: number;
      deadCount: number;
      atBaseCount: number;
      progress: number;
      isComplete: boolean;
    };
  } {
    const activeEnemies = this.getAllActiveEnemies();
    
    const stats = {
      isActive: this._isActive,
      currentWaveNumber: this._waveNumber,
      totalActiveEnemies: activeEnemies.length,
      nextWaveTime: this._nextWaveTime,
      gameStartTime: this.gameStartTime
    };

    if (this._currentWave) {
      return {
        ...stats,
        currentWaveStats: this._currentWave.getWaveStats()
      };
    }

    return stats;
  }

  /**
   * 現在の波を強制完了する（デバッグ用）
   */
  forceCompleteCurrentWave(): void {
    if (this._currentWave) {
      // すべての敵を破壊
      this._currentWave.enemies.forEach(enemy => enemy.destroy());
      this._currentWave.removeDeadEnemies();
    }
  }

  /**
   * スケジューラーをリセットする
   */
  reset(): void {
    this._currentWave = null;
    this._waveNumber = 0;
    this._nextWaveTime = new Date(this.gameStartTime.getTime() + this.waveInterval);
    this._isActive = false;
  }
}