import { describe, it, expect } from "bun:test";
import { GameEndReason } from "../../../src/domain/value-objects/game-end-reason.js";

describe("GameEndReason", () => {
  describe("終了理由の作成", () => {
    it("TimeUp理由を作成できる", () => {
      const reason = GameEndReason.timeUp();
      expect(reason.isTimeUp()).toBe(true);
      expect(reason.isPlayerDeath()).toBe(false);
      expect(reason.isUserQuit()).toBe(false);
    });

    it("PlayerDeath理由を作成できる", () => {
      const reason = GameEndReason.playerDeath();
      expect(reason.isTimeUp()).toBe(false);
      expect(reason.isPlayerDeath()).toBe(true);
      expect(reason.isUserQuit()).toBe(false);
    });

    it("UserQuit理由を作成できる", () => {
      const reason = GameEndReason.userQuit();
      expect(reason.isTimeUp()).toBe(false);
      expect(reason.isPlayerDeath()).toBe(false);
      expect(reason.isUserQuit()).toBe(true);
    });
  });

  describe("成功・失敗の判定", () => {
    it("TimeUpは成功として扱われる", () => {
      const reason = GameEndReason.timeUp();
      expect(reason.isSuccess()).toBe(true);
      expect(reason.isFailure()).toBe(false);
    });

    it("PlayerDeathは失敗として扱われる", () => {
      const reason = GameEndReason.playerDeath();
      expect(reason.isSuccess()).toBe(false);
      expect(reason.isFailure()).toBe(true);
    });

    it("UserQuitは失敗として扱われる", () => {
      const reason = GameEndReason.userQuit();
      expect(reason.isSuccess()).toBe(false);
      expect(reason.isFailure()).toBe(true);
    });
  });

  describe("等価性の検証", () => {
    it("同じ理由は等価である", () => {
      const reason1 = GameEndReason.timeUp();
      const reason2 = GameEndReason.timeUp();
      expect(reason1.equals(reason2)).toBe(true);
    });

    it("異なる理由は等価でない", () => {
      const timeUp = GameEndReason.timeUp();
      const playerDeath = GameEndReason.playerDeath();
      expect(timeUp.equals(playerDeath)).toBe(false);
    });
  });

  describe("文字列表現", () => {
    it("各理由の文字列表現が正しい", () => {
      expect(GameEndReason.timeUp().toString()).toBe("TimeUp");
      expect(GameEndReason.playerDeath().toString()).toBe("PlayerDeath");
      expect(GameEndReason.userQuit().toString()).toBe("UserQuit");
    });
  });

  describe("表示用メッセージ", () => {
    it("TimeUpの表示メッセージ", () => {
      const reason = GameEndReason.timeUp();
      expect(reason.getDisplayMessage()).toBe("時間切れ");
      expect(reason.getDisplayMessage("en")).toBe("Time Up");
    });

    it("PlayerDeathの表示メッセージ", () => {
      const reason = GameEndReason.playerDeath();
      expect(reason.getDisplayMessage()).toBe("基地破壊");
      expect(reason.getDisplayMessage("en")).toBe("Base Destroyed");
    });

    it("UserQuitの表示メッセージ", () => {
      const reason = GameEndReason.userQuit();
      expect(reason.getDisplayMessage()).toBe("ゲーム中断");
      expect(reason.getDisplayMessage("en")).toBe("Game Quit");
    });
  });

  describe("詳細メッセージ", () => {
    it("TimeUpの詳細メッセージ", () => {
      const reason = GameEndReason.timeUp();
      expect(reason.getDetailMessage()).toBe("3分間のゲーム時間が終了しました。お疲れ様でした！");
    });

    it("PlayerDeathの詳細メッセージ", () => {
      const reason = GameEndReason.playerDeath();
      expect(reason.getDetailMessage()).toBe("基地の体力がゼロになりました。次回はより戦略的に防御しましょう。");
    });

    it("UserQuitの詳細メッセージ", () => {
      const reason = GameEndReason.userQuit();
      expect(reason.getDetailMessage()).toBe("ゲームが中断されました。またのプレイをお待ちしています。");
    });
  });

  describe("優先度の比較", () => {
    it("TimeUpが最も高い優先度を持つ", () => {
      const timeUp = GameEndReason.timeUp();
      const playerDeath = GameEndReason.playerDeath();
      const userQuit = GameEndReason.userQuit();
      
      expect(timeUp.getPriority()).toBe(1);
      expect(playerDeath.getPriority()).toBe(2);
      expect(userQuit.getPriority()).toBe(3);
    });

    it("優先度による比較", () => {
      const timeUp = GameEndReason.timeUp();
      const playerDeath = GameEndReason.playerDeath();
      
      expect(timeUp.hasHigherPriorityThan(playerDeath)).toBe(true);
      expect(playerDeath.hasHigherPriorityThan(timeUp)).toBe(false);
    });

    it("同じ理由同士の優先度比較", () => {
      const timeUp1 = GameEndReason.timeUp();
      const timeUp2 = GameEndReason.timeUp();
      
      expect(timeUp1.hasHigherPriorityThan(timeUp2)).toBe(false);
    });
  });

  describe("統計情報", () => {
    it("TimeUpは勝利統計に含まれる", () => {
      const reason = GameEndReason.timeUp();
      expect(reason.countsAsWin()).toBe(true);
      expect(reason.countsAsLoss()).toBe(false);
    });

    it("PlayerDeathは敗北統計に含まれる", () => {
      const reason = GameEndReason.playerDeath();
      expect(reason.countsAsWin()).toBe(false);
      expect(reason.countsAsLoss()).toBe(true);
    });

    it("UserQuitは統計に含まれない", () => {
      const reason = GameEndReason.userQuit();
      expect(reason.countsAsWin()).toBe(false);
      expect(reason.countsAsLoss()).toBe(false);
    });
  });

  describe("アイコン表現", () => {
    it("各理由に対応するアイコンを取得", () => {
      expect(GameEndReason.timeUp().getIcon()).toBe("🏆");
      expect(GameEndReason.playerDeath().getIcon()).toBe("💥");
      expect(GameEndReason.userQuit().getIcon()).toBe("🚪");
    });
  });
});