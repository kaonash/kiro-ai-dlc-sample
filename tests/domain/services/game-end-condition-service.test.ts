import { describe, it, expect, beforeEach } from "bun:test";
import { GameEndConditionService } from "../../../src/domain/services/game-end-condition-service.js";
import { GameSession } from "../../../src/domain/entities/game-session.js";
import { GameTimer } from "../../../src/domain/entities/game-timer.js";
import { BaseHealth } from "../../../src/domain/entities/base-health.js";
import { GameScore } from "../../../src/domain/entities/game-score.js";
import { GameState } from "../../../src/domain/value-objects/game-state.js";
import { GameEndReason } from "../../../src/domain/value-objects/game-end-reason.js";
import { CardPool } from "../../../src/domain/entities/card-pool.js";
import { CardLibrary } from "../../../src/domain/entities/card-library.js";

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

describe("GameEndConditionService", () => {
  let service: GameEndConditionService;
  let mockTimeProvider: MockTimeProvider;
  let gameSession: GameSession;
  let timer: GameTimer;
  let baseHealth: BaseHealth;
  let gameScore: GameScore;

  beforeEach(() => {
    service = new GameEndConditionService();
    mockTimeProvider = new MockTimeProvider();
    mockTimeProvider.setCurrentTime(1000);

    // GameSessionの作成に必要なオブジェクトを準備
    const cardPool = new CardPool();
    const cardLibrary = new CardLibrary();
    
    // 基本的なGameSessionを作成（既存の実装を使用）
    gameSession = new GameSession("test-session", cardPool, cardLibrary);
    
    // 新しいコンポーネントを作成
    timer = new GameTimer(180, mockTimeProvider);
    baseHealth = new BaseHealth(100);
    gameScore = new GameScore();
  });

  describe("終了条件チェック", () => {
    it("時間切れの場合はTimeUpを返す", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.running());
      
      expect(reason?.isTimeUp()).toBe(true);
    });

    it("基地破壊の場合はPlayerDeathを返す", () => {
      timer.start();
      baseHealth.takeDamage(100); // 基地破壊
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.running());
      
      expect(reason?.isPlayerDeath()).toBe(true);
    });

    it("時間切れと基地破壊が同時の場合はTimeUpを優先する", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      baseHealth.takeDamage(100); // 基地破壊
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.running());
      
      expect(reason?.isTimeUp()).toBe(true);
      expect(reason?.isPlayerDeath()).toBe(false);
    });

    it("ゲームが実行中でない場合はnullを返す", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.paused());
      
      expect(reason).toBeNull();
    });

    it("終了条件が満たされていない場合はnullを返す", () => {
      timer.start();
      mockTimeProvider.advanceTime(90000); // 90秒経過（まだ時間切れではない）
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.running());
      
      expect(reason).toBeNull();
    });
  });

  describe("ゲーム終了判定", () => {
    it("時間切れの場合はtrueを返す", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      
      const shouldEnd = service.shouldEndGame(timer, baseHealth, GameState.running());
      
      expect(shouldEnd).toBe(true);
    });

    it("基地破壊の場合はtrueを返す", () => {
      timer.start();
      baseHealth.takeDamage(100); // 基地破壊
      
      const shouldEnd = service.shouldEndGame(timer, baseHealth, GameState.running());
      
      expect(shouldEnd).toBe(true);
    });

    it("終了条件が満たされていない場合はfalseを返す", () => {
      timer.start();
      mockTimeProvider.advanceTime(90000); // 90秒経過
      
      const shouldEnd = service.shouldEndGame(timer, baseHealth, GameState.running());
      
      expect(shouldEnd).toBe(false);
    });

    it("ゲームが実行中でない場合はfalseを返す", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      
      const shouldEnd = service.shouldEndGame(timer, baseHealth, GameState.completed());
      
      expect(shouldEnd).toBe(false);
    });
  });

  describe("優先度設定のカスタマイズ", () => {
    it("カスタム優先度でサービスを作成できる", () => {
      const customService = new GameEndConditionService(false); // 基地破壊を優先
      
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      baseHealth.takeDamage(100); // 基地破壊
      
      const reason = customService.checkEndCondition(timer, baseHealth, GameState.running());
      
      expect(reason?.isPlayerDeath()).toBe(true);
      expect(reason?.isTimeUp()).toBe(false);
    });

    it("デフォルトでは時間切れが優先される", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      baseHealth.takeDamage(100); // 基地破壊
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.running());
      
      expect(reason?.isTimeUp()).toBe(true);
    });
  });

  describe("エッジケース", () => {
    it("タイマーが開始されていない場合", () => {
      // タイマーを開始しない
      baseHealth.takeDamage(100); // 基地破壊
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.running());
      
      expect(reason?.isPlayerDeath()).toBe(true);
    });

    it("基地体力が満タンで時間切れの場合", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      // 基地体力は満タンのまま
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.running());
      
      expect(reason?.isTimeUp()).toBe(true);
    });

    it("時間が残っていて基地体力が1の場合", () => {
      timer.start();
      mockTimeProvider.advanceTime(90000); // 90秒経過
      baseHealth.takeDamage(99); // 体力1まで減少
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.running());
      
      expect(reason).toBeNull(); // まだ終了条件は満たされていない
    });
  });

  describe("状態別の終了判定", () => {
    it("一時停止中は終了判定を行わない", () => {
      timer.start();
      timer.pause();
      mockTimeProvider.advanceTime(180000); // 180秒経過（一時停止中）
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.paused());
      
      expect(reason).toBeNull();
    });

    it("未開始状態では終了判定を行わない", () => {
      baseHealth.takeDamage(100); // 基地破壊
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.notStarted());
      
      expect(reason).toBeNull();
    });

    it("既に完了状態では終了判定を行わない", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.completed());
      
      expect(reason).toBeNull();
    });

    it("既にゲームオーバー状態では終了判定を行わない", () => {
      baseHealth.takeDamage(100); // 基地破壊
      
      const reason = service.checkEndCondition(timer, baseHealth, GameState.gameOver());
      
      expect(reason).toBeNull();
    });
  });

  describe("複数回の終了条件チェック", () => {
    it("連続して同じ結果を返す", () => {
      timer.start();
      mockTimeProvider.advanceTime(180000); // 180秒経過
      
      const reason1 = service.checkEndCondition(timer, baseHealth, GameState.running());
      const reason2 = service.checkEndCondition(timer, baseHealth, GameState.running());
      const reason3 = service.checkEndCondition(timer, baseHealth, GameState.running());
      
      expect(reason1?.isTimeUp()).toBe(true);
      expect(reason2?.isTimeUp()).toBe(true);
      expect(reason3?.isTimeUp()).toBe(true);
    });

    it("条件が変化した場合は異なる結果を返す", () => {
      timer.start();
      mockTimeProvider.advanceTime(90000); // 90秒経過
      
      const reason1 = service.checkEndCondition(timer, baseHealth, GameState.running());
      expect(reason1).toBeNull();
      
      baseHealth.takeDamage(100); // 基地破壊
      const reason2 = service.checkEndCondition(timer, baseHealth, GameState.running());
      expect(reason2?.isPlayerDeath()).toBe(true);
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量の終了条件チェックでもパフォーマンスが維持される", () => {
      timer.start();
      
      const startTime = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        service.checkEndCondition(timer, baseHealth, GameState.running());
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 100ms以内
    });
  });
});