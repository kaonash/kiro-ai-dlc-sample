import { ScoreValue } from "../value-objects/score-value.js";
import { EnemyType } from "../value-objects/enemy-type.js";

/**
 * ゲームスコアエンティティ
 * ゲームスコアと撃破統計を管理する
 */
export class GameScore {
  private _totalScore: ScoreValue;
  private _enemiesDefeated: number;
  private _normalEnemyCount: number;
  private _eliteEnemyCount: number;
  private _bossEnemyCount: number;

  constructor() {
    this._totalScore = new ScoreValue(0);
    this._enemiesDefeated = 0;
    this._normalEnemyCount = 0;
    this._eliteEnemyCount = 0;
    this._bossEnemyCount = 0;
  }

  /**
   * 総スコア
   */
  get totalScore(): ScoreValue {
    return this._totalScore;
  }

  /**
   * 撃破した敵の数
   */
  get enemiesDefeated(): number {
    return this._enemiesDefeated;
  }

  /**
   * 通常敵撃破数
   */
  get normalEnemyCount(): number {
    return this._normalEnemyCount;
  }

  /**
   * 強化敵撃破数
   */
  get eliteEnemyCount(): number {
    return this._eliteEnemyCount;
  }

  /**
   * ボス敵撃破数
   */
  get bossEnemyCount(): number {
    return this._bossEnemyCount;
  }

  /**
   * 敵タイプに応じてスコアを加算する
   */
  addScore(enemyType: EnemyType): void {
    const points = this.getScoreForEnemyType(enemyType);
    this._totalScore = this._totalScore.add(points);
    this._enemiesDefeated++;

    // 敵タイプ別の撃破数を更新
    if (enemyType.isNormal()) {
      this._normalEnemyCount++;
    } else if (enemyType.isElite()) {
      this._eliteEnemyCount++;
    } else if (enemyType.isBoss()) {
      this._bossEnemyCount++;
    }
  }

  /**
   * スコアをリセットする
   */
  reset(): void {
    this._totalScore = new ScoreValue(0);
    this._enemiesDefeated = 0;
    this._normalEnemyCount = 0;
    this._eliteEnemyCount = 0;
    this._bossEnemyCount = 0;
  }

  /**
   * 総スコアを取得する
   */
  getTotalScore(): number {
    return this._totalScore.value;
  }

  /**
   * 撃破敵数を取得する
   */
  getEnemyDefeatedCount(): number {
    return this._enemiesDefeated;
  }

  /**
   * 敵タイプに対応するスコアを取得する（内部用）
   */
  private getScoreForEnemyType(enemyType: EnemyType): number {
    if (enemyType.isNormal()) {
      return 10;
    }
    if (enemyType.isElite()) {
      return 30;
    }
    if (enemyType.isBoss()) {
      return 100;
    }
    
    // 未知の敵タイプの場合は0点
    return 0;
  }
}