/**
 * 時刻プロバイダーインターフェース
 * 時刻取得を抽象化してテスタビリティを向上させる
 */
export interface TimeProvider {
  /**
   * 現在時刻をミリ秒で取得する
   * @returns Unix時刻（ミリ秒）
   */
  getCurrentTime(): number;
}