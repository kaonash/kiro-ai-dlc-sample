import type { EnemyType } from "../value-objects/enemy-type";
import type { MovementPath } from "../value-objects/movement-path";
import type { Position } from "../value-objects/position";

/**
 * 個々の敵を表現するエンティティ
 */
export class Enemy {
  public readonly maxHealth: number;
  public readonly attackPower: number;
  public readonly movementSpeed: number;

  private _currentHealth: number;
  private _currentPosition: Position;
  private _pathProgress: number;
  private _isAlive: boolean;

  constructor(
    public readonly id: string,
    public readonly type: EnemyType,
    public readonly movementPath: MovementPath,
    public readonly spawnTime: Date
  ) {
    const stats = type.getBaseStats();
    this.maxHealth = stats.health;
    this.attackPower = stats.attackPower;
    this.movementSpeed = stats.movementSpeed;

    this._currentHealth = this.maxHealth;
    this._currentPosition = movementPath.spawnPoint;
    this._pathProgress = 0;
    this._isAlive = true;
  }

  // ゲッター
  get currentHealth(): number {
    return this._currentHealth;
  }

  get currentPosition(): Position {
    return this._currentPosition;
  }

  get pathProgress(): number {
    return this._pathProgress;
  }

  get isAlive(): boolean {
    return this._isAlive;
  }

  /**
   * ダメージを受ける
   * @param damage ダメージ量
   */
  takeDamage(damage: number): void {
    if (damage <= 0 || !this._isAlive) {
      return;
    }

    this._currentHealth = Math.max(0, this._currentHealth - damage);

    if (this._currentHealth === 0) {
      this._isAlive = false;
    }
  }

  /**
   * 移動処理
   * @param deltaTime 経過時間（ミリ秒）
   */
  move(deltaTime: number): void {
    if (!this._isAlive || deltaTime <= 0 || this._pathProgress >= 1) {
      return;
    }

    // 新しい位置を計算
    const newPosition = this.movementPath.getNextPosition(
      this._pathProgress,
      this.movementSpeed,
      deltaTime
    );

    // 新しい進行度を計算
    const moveDistance = this.movementSpeed * (deltaTime / 1000);
    const currentDistance = this.movementPath.totalLength * this._pathProgress;
    const newDistance = currentDistance + moveDistance;
    const newProgress = Math.min(1, this.movementPath.getProgressFromDistance(newDistance));

    this._currentPosition = newPosition;
    this._pathProgress = newProgress;
  }

  /**
   * 基地攻撃を実行する
   * @returns 攻撃力
   */
  attackBase(): number {
    return this.attackPower;
  }

  /**
   * 基地到達判定
   * @returns 基地に到達している場合true
   */
  isAtBase(): boolean {
    return this._pathProgress >= 1;
  }

  /**
   * 体力割合を取得する
   * @returns 体力割合（0.0-1.0）
   */
  getHealthPercentage(): number {
    return Math.round((this._currentHealth / this.maxHealth) * 100) / 100;
  }

  /**
   * 敵を破壊する
   */
  destroy(): void {
    this._isAlive = false;
    this._currentHealth = 0;
  }

  /**
   * 敵の年齢（生存時間）を取得する
   * @returns 生存時間（ミリ秒）
   */
  getAge(): number {
    return Date.now() - this.spawnTime.getTime();
  }
}
