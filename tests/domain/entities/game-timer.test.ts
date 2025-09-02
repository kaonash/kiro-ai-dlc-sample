import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameTimer } from "../../../src/domain/entities/game-timer.js";
import { TimeRemaining } from "../../../src/domain/value-objects/time-remaining.js";

// モックタイムプロバイダー
class MockTimeProvider {
  private currentTime = 0;

  getCurrentTime(): number {
    return this.currentTime;
  }

  setCurrentTime(time: number): void {
    this.currentTime = time;
  }

  advanceTime(milliseconds: number): void {
    this.currentTime += milliseconds;
  }
}

describe("GameTimer", () => {
  let mockTimeProvider: MockTimeProvider;
  let timer: GameTimer;

  beforeEach(() => {
    mockTimeProvider = new MockTimeProvider();
    mockTimeProvider.setCurrentTime(1000); // 1秒から開始
    timer = new GameTimer(180, mockTimeProvider);
  });

  describe("初期化", () => {
    it("指定された総時間で初期化される", () => {
      expect(timer.totalDuration).toBe(180);
      expect(timer.getRemainingSeconds()).toBe(180);
      expect(timer.isRunning).toBe(false);
      expect(timer.isPaused).toBe(false);
    });

    it("負の総時間では初期化できない", () => {
      expect(() => new GameTimer(-1, mockTimeProvider)).toThrow("総時間は0以上である必要があります");
    });

    it("0秒の総時間で初期化できる", () => {
      const zeroTimer = new GameTimer(0, mockTimeProvider);
      expect(zeroTimer.totalDuration).toBe(0);
      expect(zeroTimer.getRemainingSeconds()).toBe(0);
    });
  });

  describe("タイマー開始", () => {
    it("タイマーを開始できる", () => {
      timer.start();
      
      expect(timer.isRunning).toBe(true);
      expect(timer.isPaused).toBe(false);
      expect(timer.startTime).toBe(1000);
    });

    it("既に開始されているタイマーを再開始するとエラー", () => {
      timer.start();
      expect(() => timer.start()).toThrow("タイマーは既に開始されています");
    });

    it("一時停止されたタイマーを再開始するとエラー", () => {
      timer.start();
      timer.pause();
      expect(() => timer.start()).toThrow("タイマーは既に開始されています");
    });
  });

  describe("タイマー一時停止", () => {
    it("実行中のタイマーを一時停止できる", () => {
      timer.start();
      mockTimeProvider.advanceTime(5000); // 5秒経過
      
      timer.pause();
      
      expect(timer.isRunning).toBe(false);
      expect(timer.isPaused).toBe(true);
      expect(timer.pausedTime).toBe(5000);
    });

    it("開始されていないタイマーを一時停止するとエラー", () => {
      expect(() => timer.pause()).toThrow("タイマーが開始されていません");
    });

    it("既に一時停止されているタイマーを再度一時停止するとエラー", () => {
      timer.start();
      timer.pause();
      expect(() => timer.pause()).toThrow("タイマーは既に一時停止されています");
    });
  });

  describe("タイマー再開", () => {
    it("一時停止されたタイマーを再開できる", () => {
      timer.start();
      mockTimeProvider.advanceTime(5000); // 5秒経過
      timer.pause();
      
      mockTimeProvider.advanceTime(2000); // 一時停止中に2秒経過
      timer.resume();
      
      expect(timer.isRunning).toBe(true);
      expect(timer.isPaused).toBe(false);
    });

    it("開始されていないタイマーを再開するとエラー", () => {
      expect(() => timer.resume()).toThrow("タイマーが一時停止されていません");
    });

    it("実行中のタイマーを再開するとエラー", () => {
      timer.start();
      expect(() => timer.resume()).toThrow("タイマーが一時停止されていません");
    });
  });

  describe("タイマー停止", () => {
    it("実行中のタイマーを停止できる", () => {
      timer.start();
      timer.stop();
      
      expect(timer.isRunning).toBe(false);
      expect(timer.isPaused).toBe(false);
    });

    it("一時停止中のタイマーを停止できる", () => {
      timer.start();
      timer.pause();
      timer.stop();
      
      expect(timer.isRunning).toBe(false);
      expect(timer.isPaused).toBe(false);
    });

    it("停止されたタイマーを再度停止してもエラーにならない", () => {
      timer.start();
      timer.stop();
      expect(() => timer.stop()).not.toThrow();
    });
  });

  describe("時間計算", () => {
    it("実行中の残り時間を正しく計算する", () => {
      timer.start();
      mockTimeProvider.advanceTime(30000); // 30秒経過
      
      expect(timer.getRemainingSeconds()).toBe(150);
    });

    it("一時停止中は時間が進まない", () => {
      timer.start();
      mockTimeProvider.advanceTime(30000); // 30秒経過
      timer.pause();
      mockTimeProvider.advanceTime(10000); // 一時停止中に10秒経過
      
      expect(timer.getRemainingSeconds()).toBe(150);
    });

    it("再開後は正しく時間が進む", () => {
      timer.start();
      mockTimeProvider.advanceTime(30000); // 30秒経過
      timer.pause();
      mockTimeProvider.advanceTime(10000); // 一時停止中に10秒経過
      timer.resume();
      mockTimeProvider.advanceTime(20000); // 再開後20秒経過
      
      expect(timer.getRemainingSeconds()).toBe(130); // 180 - 30 - 20 = 130
    });

    it("時間切れの場合は0を返す", () => {
      timer.start();
      mockTimeProvider.advanceTime(200000); // 200秒経過（総時間を超過）
      
      expect(timer.getRemainingSeconds()).toBe(0);
    });
  });

  describe("進捗率計算", () => {
    it("開始時の進捗率は0%", () => {
      timer.start();
      expect(timer.getProgressPercentage()).toBe(0);
    });

    it("半分経過時の進捗率は50%", () => {
      timer.start();
      mockTimeProvider.advanceTime(90000); // 90秒経過
      expect(timer.getProgressPercentage()).toBe(50);
    });

    it("終了時の進捗率は100%", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      expect(timer.getProgressPercentage()).toBe(100);
    });

    it("時間超過時の進捗率は100%", () => {
      timer.start();
      mockTimeProvider.advanceTime(200000); // 200秒経過
      expect(timer.getProgressPercentage()).toBe(100);
    });
  });

  describe("時間切れ判定", () => {
    it("時間が残っている場合はfalse", () => {
      timer.start();
      mockTimeProvider.advanceTime(30000); // 30秒経過
      expect(timer.isTimeUp()).toBe(false);
    });

    it("時間切れの場合はtrue", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      expect(timer.isTimeUp()).toBe(true);
    });

    it("時間超過の場合もtrue", () => {
      timer.start();
      mockTimeProvider.advanceTime(200000); // 200秒経過
      expect(timer.isTimeUp()).toBe(true);
    });

    it("開始されていない場合はfalse", () => {
      expect(timer.isTimeUp()).toBe(false);
    });
  });

  describe("TimeRemainingオブジェクトの取得", () => {
    it("残り時間をTimeRemainingオブジェクトとして取得できる", () => {
      timer.start();
      mockTimeProvider.advanceTime(30000); // 30秒経過
      
      const remaining = timer.getTimeRemaining();
      expect(remaining).toBeInstanceOf(TimeRemaining);
      expect(remaining.seconds).toBe(150);
    });

    it("時間切れの場合は0秒のTimeRemainingを返す", () => {
      timer.start();
      mockTimeProvider.advanceTime(200000); // 200秒経過
      
      const remaining = timer.getTimeRemaining();
      expect(remaining.seconds).toBe(0);
    });
  });

  describe("経過時間の取得", () => {
    it("実行中の経過時間を取得できる", () => {
      timer.start();
      mockTimeProvider.advanceTime(45000); // 45秒経過
      
      expect(timer.getElapsedSeconds()).toBe(45);
    });

    it("一時停止中は経過時間が止まる", () => {
      timer.start();
      mockTimeProvider.advanceTime(30000); // 30秒経過
      timer.pause();
      mockTimeProvider.advanceTime(10000); // 一時停止中に10秒経過
      
      expect(timer.getElapsedSeconds()).toBe(30);
    });

    it("再開後は正しく経過時間が計算される", () => {
      timer.start();
      mockTimeProvider.advanceTime(30000); // 30秒経過
      timer.pause();
      mockTimeProvider.advanceTime(10000); // 一時停止中に10秒経過
      timer.resume();
      mockTimeProvider.advanceTime(15000); // 再開後15秒経過
      
      expect(timer.getElapsedSeconds()).toBe(45); // 30 + 15 = 45
    });

    it("開始されていない場合は0を返す", () => {
      expect(timer.getElapsedSeconds()).toBe(0);
    });
  });

  describe("リセット機能", () => {
    it("タイマーをリセットできる", () => {
      timer.start();
      mockTimeProvider.advanceTime(30000); // 30秒経過
      timer.pause();
      
      timer.reset();
      
      expect(timer.isRunning).toBe(false);
      expect(timer.isPaused).toBe(false);
      expect(timer.getRemainingSeconds()).toBe(180);
      expect(timer.getElapsedSeconds()).toBe(0);
    });

    it("リセット後は再度開始できる", () => {
      timer.start();
      mockTimeProvider.advanceTime(30000);
      timer.reset();
      
      timer.start();
      expect(timer.isRunning).toBe(true);
      expect(timer.getRemainingSeconds()).toBe(180);
    });
  });
});