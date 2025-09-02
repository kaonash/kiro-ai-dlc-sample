import { EnemyType } from "../value-objects/enemy-type.js";

/**
 * スコア倍率設定
 */
export interface ScoreMultipliers {
  normal: number;
  elite: number;
  boss: number;
}

/**
 * スコア統計情報
 */
export interface ScoreStatistics {
  normalCount: number;
  eliteCount: number;
  bossCount: number;
  normalScore: number;
  eliteScore: number;
  bossScore: number;
  totalScore: number;
}

/**
 * スコア計算サービス
 * 敵タイプ別のスコア計算を行う
 */
export class ScoreCalculationService {
  private readonly _baseScore: number;
  private readonly _multipliers: ScoreMultipliers;

  constructor(
    baseScore = 10,
    multipliers: ScoreMultipliers = {
      normal: 1.0,
      elite: 3.0,
      boss: 10.0
    }
  ) {
    if (baseScore < 0) {
      throw new Error("基本スコアは0以上である必要があります");
    }

    if (multipliers.normal < 0 || multipliers.elite < 0 || multipliers.boss < 0) {
      throw new Error("スコア倍率は0以上である必要があります");
    }

    this._baseScore = baseScore;
    this._multipliers = { ...multipliers };
  }

  /**
   * 敵タイプに応じたスコアを計算する
   */
  calculateScore(enemyType: EnemyType): number {
    const multiplier = this.getScoreMultiplier(enemyType);
    return Math.floor(this._baseScore * multiplier);
  }

  /**
   * 敵タイプの倍率を取得する
   */
  getScoreMultiplier(enemyType: EnemyType): number {
    if (enemyType.isNormal()) {
      return this._multipliers.normal;
    }
    if (enemyType.isElite()) {
      return this._multipliers.elite;
    }
    if (enemyType.isBoss()) {
      return this._multipliers.boss;
    }
    
    // 未知の敵タイプの場合は0倍率
    return 0;
  }

  /**
   * 複数の敵タイプのスコアを一括計算する
   */
  calculateBatchScore(enemyTypes: EnemyType[]): number[] {
    return enemyTypes.map(enemyType => this.calculateScore(enemyType));
  }

  /**
   * 複数の敵タイプの合計スコアを計算する
   */
  calculateTotalScore(enemyTypes: EnemyType[]): number {
    return enemyTypes.reduce((total, enemyType) => {
      return total + this.calculateScore(enemyType);
    }, 0);
  }

  /**
   * 敵タイプ別のスコア統計を計算する
   */
  calculateScoreStatistics(enemyTypes: EnemyType[]): ScoreStatistics {
    const stats: ScoreStatistics = {
      normalCount: 0,
      eliteCount: 0,
      bossCount: 0,
      normalScore: 0,
      eliteScore: 0,
      bossScore: 0,
      totalScore: 0
    };

    for (const enemyType of enemyTypes) {
      const score = this.calculateScore(enemyType);
      
      if (enemyType.isNormal()) {
        stats.normalCount++;
        stats.normalScore += score;
      } else if (enemyType.isElite()) {
        stats.eliteCount++;
        stats.eliteScore += score;
      } else if (enemyType.isBoss()) {
        stats.bossCount++;
        stats.bossScore += score;
      }
      
      stats.totalScore += score;
    }

    return stats;
  }

  /**
   * 現在の基本スコアを取得する
   */
  getBaseScore(): number {
    return this._baseScore;
  }

  /**
   * 現在の倍率設定を取得する
   */
  getMultipliers(): ScoreMultipliers {
    return { ...this._multipliers };
  }
}