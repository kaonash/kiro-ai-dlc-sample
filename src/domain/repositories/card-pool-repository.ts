import type { CardPool } from "../entities/card-pool.js";

/**
 * カードプールリポジトリインターフェース
 */
export interface ICardPoolRepository {
  /**
   * カードプールを読み込み
   */
  load(): Promise<CardPool>;

  /**
   * カードプールが利用可能かチェック
   */
  isAvailable(): Promise<boolean>;
}
