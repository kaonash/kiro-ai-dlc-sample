import { EnemyType } from "./enemy-type";

/**
 * 波の設定を表現する値オブジェクト
 */
export class WaveConfiguration {
  constructor(
    public readonly baseEnemyCount: number,
    public readonly enemyCountIncrement: number,
    public readonly spawnInterval: number
  ) {
    if (baseEnemyCount <= 0) {
      throw new Error("Base enemy count must be positive");
    }
    if (enemyCountIncrement < 0) {
      throw new Error("Enemy count increment must be non-negative");
    }
    if (spawnInterval <= 0) {
      throw new Error("Spawn interval must be positive");
    }
  }

  /**
   * 指定した波の敵数を計算する
   * @param waveNumber 波番号（1から開始）
   * @returns 波の敵数
   */
  getEnemyCountForWave(waveNumber: number): number {
    if (waveNumber < 1) {
      throw new Error("Wave number must be positive");
    }

    return this.baseEnemyCount + this.enemyCountIncrement * (waveNumber - 1);
  }

  /**
   * 指定した波の敵タイプ配列を生成する
   * @param waveNumber 波番号（1から開始）
   * @returns 敵タイプの配列
   */
  getEnemyTypesForWave(waveNumber: number): EnemyType[] {
    if (waveNumber < 1) {
      throw new Error("Wave number must be positive");
    }

    const enemyCount = this.getEnemyCountForWave(waveNumber);
    const distribution = this.getEnemyTypeDistribution(waveNumber);

    const enemyTypes: EnemyType[] = [];

    // 分布に基づいて敵タイプを生成
    for (const [enemyType, ratio] of distribution.entries()) {
      const count = Math.round(enemyCount * ratio);
      for (let i = 0; i < count; i++) {
        enemyTypes.push(enemyType);
      }
    }

    // 端数調整：目標数に満たない場合は基本敵で補完
    while (enemyTypes.length < enemyCount) {
      enemyTypes.push(EnemyType.BASIC);
    }

    // 端数調整：目標数を超えた場合は削除
    while (enemyTypes.length > enemyCount) {
      enemyTypes.pop();
    }

    // シャッフルして順序をランダム化
    return this.shuffleArray(enemyTypes);
  }

  /**
   * 指定した波の敵タイプ分布を取得する
   * @param waveNumber 波番号
   * @returns 敵タイプと出現率のマップ
   */
  getEnemyTypeDistribution(waveNumber: number): Map<EnemyType, number> {
    const distribution = new Map<EnemyType, number>();

    if (waveNumber <= 5) {
      // 波1-5: 基本敵中心
      distribution.set(EnemyType.BASIC, 0.8);
      distribution.set(EnemyType.FAST, 0.2);
    } else if (waveNumber <= 10) {
      // 波6-10: 遠距離敵追加
      distribution.set(EnemyType.BASIC, 0.6);
      distribution.set(EnemyType.RANGED, 0.2);
      distribution.set(EnemyType.FAST, 0.2);
    } else if (waveNumber <= 15) {
      // 波11-15: 強化敵追加
      distribution.set(EnemyType.BASIC, 0.4);
      distribution.set(EnemyType.RANGED, 0.3);
      distribution.set(EnemyType.FAST, 0.2);
      distribution.set(EnemyType.ENHANCED, 0.1);
    } else {
      // 波16+: ボス敵追加
      distribution.set(EnemyType.BASIC, 0.3);
      distribution.set(EnemyType.RANGED, 0.2);
      distribution.set(EnemyType.FAST, 0.2);
      distribution.set(EnemyType.ENHANCED, 0.2);
      distribution.set(EnemyType.BOSS, 0.1);
    }

    return distribution;
  }

  /**
   * 波間隔を取得する
   * @returns 波間隔（ミリ秒）
   */
  getWaveInterval(): number {
    return 5000; // 5秒（テスト用に短縮）
  }

  /**
   * 配列をシャッフルする
   * @param array シャッフル対象の配列
   * @returns シャッフル後の新しい配列
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * デフォルト設定を作成する
   * @returns デフォルトの波設定
   */
  static createDefault(): WaveConfiguration {
    return new WaveConfiguration(5, 2, 500); // 敵数5、増加2、生成間隔500ms
  }
}
