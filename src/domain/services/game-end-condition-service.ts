import { GameTimer } from "../entities/game-timer.js";
import { BaseHealth } from "../entities/base-health.js";
import { GameState } from "../value-objects/game-state.js";
import { GameEndReason } from "../value-objects/game-end-reason.js";

/**
 * ゲーム終了条件サービス
 * ゲーム終了条件の判定を行う
 */
export class GameEndConditionService {
  private readonly _timeUpHasPriority: boolean;

  constructor(timeUpHasPriority = true) {
    this._timeUpHasPriority = timeUpHasPriority;
  }

  /**
   * 終了条件をチェックする
   * @param timer ゲームタイマー
   * @param baseHealth 基地体力
   * @param gameState ゲーム状態
   * @returns 終了理由（終了条件が満たされていない場合はnull）
   */
  checkEndCondition(
    timer: GameTimer,
    baseHealth: BaseHealth,
    gameState: GameState
  ): GameEndReason | null {
    // ゲームが実行中でない場合は終了判定を行わない
    if (!gameState.isRunning()) {
      return null;
    }

    const isTimeUp = timer.isTimeUp();
    const isBaseDestroyed = baseHealth.isDestroyed();

    // 両方の条件が満たされている場合は優先度に従って判定
    if (isTimeUp && isBaseDestroyed) {
      return this._timeUpHasPriority 
        ? GameEndReason.timeUp() 
        : GameEndReason.playerDeath();
    }

    // 時間切れのみ
    if (isTimeUp) {
      return GameEndReason.timeUp();
    }

    // 基地破壊のみ
    if (isBaseDestroyed) {
      return GameEndReason.playerDeath();
    }

    // 終了条件が満たされていない
    return null;
  }

  /**
   * ゲーム終了すべきかどうか判定する
   * @param timer ゲームタイマー
   * @param baseHealth 基地体力
   * @param gameState ゲーム状態
   * @returns ゲーム終了すべきかどうか
   */
  shouldEndGame(
    timer: GameTimer,
    baseHealth: BaseHealth,
    gameState: GameState
  ): boolean {
    const endReason = this.checkEndCondition(timer, baseHealth, gameState);
    return endReason !== null;
  }

  /**
   * 時間切れの優先度設定を取得する
   */
  get timeUpHasPriority(): boolean {
    return this._timeUpHasPriority;
  }
}