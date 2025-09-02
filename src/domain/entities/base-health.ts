import { HealthValue } from "../value-objects/health-value.js";

/**
 * 基地体力エンティティ
 * プレイヤーの基地体力を管理する
 */
export class BaseHealth {
  private readonly _maxHealth: number;
  private _currentHealth: HealthValue;
  private _isDead: boolean;

  constructor(maxHealth = 100) {
    if (maxHealth < 1) {
      throw new Error("最大体力は1以上である必要があります");
    }

    this._maxHealth = maxHealth;
    this._currentHealth = new HealthValue(maxHealth, maxHealth);
    this._isDead = false;
  }

  /**
   * 最大体力
   */
  get maxHealth(): number {
    return this._maxHealth;
  }

  /**
   * 現在の体力
   */
  get currentHealth(): HealthValue {
    return this._currentHealth;
  }

  /**
   * 死亡状態
   */
  get isDead(): boolean {
    return this._isDead;
  }

  /**
   * ダメージを受ける
   */
  takeDamage(amount: number): void {
    if (amount < 0) {
      throw new Error("ダメージは0以上である必要があります");
    }

    this._currentHealth = this._currentHealth.subtract(amount);
    this._isDead = this._currentHealth.isZero();
  }

  /**
   * 回復する
   */
  heal(amount: number): void {
    if (amount < 0) {
      throw new Error("回復量は0以上である必要があります");
    }

    this._currentHealth = this._currentHealth.add(amount);
    this._isDead = this._currentHealth.isZero();
  }

  /**
   * 体力を初期値にリセットする
   */
  reset(): void {
    this._currentHealth = new HealthValue(this._maxHealth, this._maxHealth);
    this._isDead = false;
  }

  /**
   * 体力の割合を取得する（0-100%）
   */
  getHealthPercentage(): number {
    return this._currentHealth.getPercentage();
  }

  /**
   * 基地破壊判定を行う
   */
  isDestroyed(): boolean {
    return this._isDead;
  }

  /**
   * 危険な体力レベルかどうか（25%以下）
   */
  isDangerous(): boolean {
    return this._currentHealth.isDangerous();
  }

  /**
   * 警告レベルの体力かどうか（50%以下）
   */
  isWarning(): boolean {
    return this._currentHealth.isWarning();
  }

  /**
   * 体力が満タンかどうか
   */
  isFull(): boolean {
    return this._currentHealth.isFull();
  }
}