import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { HybridManaTimer } from "../../../src/infrastructure/timers/hybrid-mana-timer";

// モックのゲームセッション管理インターフェース
interface MockGameSessionManager {
  getElapsedGameTime(): number;
  isPaused(): boolean;
}

describe("HybridManaTimer - Simple Tests", () => {
  let timer: HybridManaTimer;
  let mockGameSession: MockGameSessionManager;

  beforeEach(() => {
    mockGameSession = {
      getElapsedGameTime: () => Date.now(),
      isPaused: () => false
    };

    timer = new HybridManaTimer(mockGameSession, 100);
  });

  afterEach(() => {
    timer.stop();
  });

  describe("基本機能", () => {
    it("タイマーを開始できる", () => {
      const callback = () => {};
      const result = timer.start(callback);
      
      expect(result.isSuccess).toBe(true);
      expect(timer.isRunning()).toBe(true);
    });

    it("タイマーを停止できる", () => {
      const callback = () => {};
      
      timer.start(callback);
      const result = timer.stop();
      
      expect(result.isSuccess).toBe(true);
      expect(timer.isRunning()).toBe(false);
    });

    it("間隔を設定できる", () => {
      const result = timer.setInterval(200);
      
      expect(result.isSuccess).toBe(true);
      expect(timer.getInterval()).toBe(200);
    });
  });

  describe("エラーハンドリング", () => {
    it("nullのコールバックでエラー", () => {
      const result = timer.start(null as any);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("コールバックが無効");
    });

    it("既に開始されているタイマーを再開始するとエラー", () => {
      const callback = () => {};
      
      timer.start(callback);
      const result = timer.start(callback);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("既に開始");
    });

    it("無効な間隔でエラー", () => {
      const result = timer.setInterval(0);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("間隔は正の値");
    });

    it("動作中は間隔を変更できない", () => {
      const callback = () => {};
      
      timer.start(callback);
      const result = timer.setInterval(200);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("動作中は間隔を変更できません");
    });
  });

  describe("一時停止制御", () => {
    it("一時停止状態を認識する", () => {
      mockGameSession.isPaused = () => true;
      
      const callback = () => {};
      const result = timer.start(callback);
      
      expect(result.isSuccess).toBe(true);
      expect(timer.isRunning()).toBe(true);
    });
  });
});