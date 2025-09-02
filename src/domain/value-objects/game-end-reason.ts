/**
 * ゲーム終了理由を表現する値オブジェクト
 */
export class GameEndReason {
  private constructor(private readonly _value: string) {}

  /**
   * 時間切れによる終了
   */
  static timeUp(): GameEndReason {
    return new GameEndReason("TimeUp");
  }

  /**
   * プレイヤー死亡による終了
   */
  static playerDeath(): GameEndReason {
    return new GameEndReason("PlayerDeath");
  }

  /**
   * ユーザー離脱による終了
   */
  static userQuit(): GameEndReason {
    return new GameEndReason("UserQuit");
  }

  /**
   * 時間切れかどうか
   */
  isTimeUp(): boolean {
    return this._value === "TimeUp";
  }

  /**
   * プレイヤー死亡かどうか
   */
  isPlayerDeath(): boolean {
    return this._value === "PlayerDeath";
  }

  /**
   * ユーザー離脱かどうか
   */
  isUserQuit(): boolean {
    return this._value === "UserQuit";
  }

  /**
   * 成功として扱われるかどうか
   */
  isSuccess(): boolean {
    return this.isTimeUp();
  }

  /**
   * 失敗として扱われるかどうか
   */
  isFailure(): boolean {
    return this.isPlayerDeath() || this.isUserQuit();
  }

  /**
   * 等価性の判定
   */
  equals(other: GameEndReason): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }

  /**
   * 表示用メッセージを取得
   */
  getDisplayMessage(language: "ja" | "en" = "ja"): string {
    const messages = {
      TimeUp: { ja: "時間切れ", en: "Time Up" },
      PlayerDeath: { ja: "基地破壊", en: "Base Destroyed" },
      UserQuit: { ja: "ゲーム中断", en: "Game Quit" },
    };

    return messages[this._value as keyof typeof messages][language];
  }

  /**
   * 詳細メッセージを取得
   */
  getDetailMessage(): string {
    const messages = {
      TimeUp: "3分間のゲーム時間が終了しました。お疲れ様でした！",
      PlayerDeath: "基地の体力がゼロになりました。次回はより戦略的に防御しましょう。",
      UserQuit: "ゲームが中断されました。またのプレイをお待ちしています。",
    };

    return messages[this._value as keyof typeof messages];
  }

  /**
   * 優先度を取得（数値が小さいほど高優先度）
   */
  getPriority(): number {
    const priorities = {
      TimeUp: 1,
      PlayerDeath: 2,
      UserQuit: 3,
    };

    return priorities[this._value as keyof typeof priorities];
  }

  /**
   * 指定された理由より高い優先度を持つかどうか
   */
  hasHigherPriorityThan(other: GameEndReason): boolean {
    return this.getPriority() < other.getPriority();
  }

  /**
   * 勝利統計に含まれるかどうか
   */
  countsAsWin(): boolean {
    return this.isTimeUp();
  }

  /**
   * 敗北統計に含まれるかどうか
   */
  countsAsLoss(): boolean {
    return this.isPlayerDeath();
  }

  /**
   * アイコンを取得
   */
  getIcon(): string {
    const icons = {
      TimeUp: "🏆",
      PlayerDeath: "💥",
      UserQuit: "🚪",
    };

    return icons[this._value as keyof typeof icons];
  }
}
