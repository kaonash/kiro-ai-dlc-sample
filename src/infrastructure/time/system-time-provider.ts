import type { TimeProvider } from "./time-provider.js";

/**
 * システム時刻プロバイダー
 * Date.now()を使用して実際のシステム時刻を提供する
 */
export class SystemTimeProvider implements TimeProvider {
  /**
   * 現在のシステム時刻をミリ秒で取得する
   * @returns Unix時刻（ミリ秒）
   */
  getCurrentTime(): number {
    return Date.now();
  }
}