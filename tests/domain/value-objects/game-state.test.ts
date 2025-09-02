import { describe, it, expect } from "bun:test";
import { GameState } from "../../../src/domain/value-objects/game-state.js";

describe("GameState", () => {
  describe("状態の作成", () => {
    it("NotStarted状態を作成できる", () => {
      const state = GameState.notStarted();
      expect(state.isNotStarted()).toBe(true);
      expect(state.isRunning()).toBe(false);
      expect(state.isPaused()).toBe(false);
      expect(state.isCompleted()).toBe(false);
      expect(state.isGameOver()).toBe(false);
    });

    it("Running状態を作成できる", () => {
      const state = GameState.running();
      expect(state.isNotStarted()).toBe(false);
      expect(state.isRunning()).toBe(true);
      expect(state.isPaused()).toBe(false);
      expect(state.isCompleted()).toBe(false);
      expect(state.isGameOver()).toBe(false);
    });

    it("Paused状態を作成できる", () => {
      const state = GameState.paused();
      expect(state.isNotStarted()).toBe(false);
      expect(state.isRunning()).toBe(false);
      expect(state.isPaused()).toBe(true);
      expect(state.isCompleted()).toBe(false);
      expect(state.isGameOver()).toBe(false);
    });

    it("Completed状態を作成できる", () => {
      const state = GameState.completed();
      expect(state.isNotStarted()).toBe(false);
      expect(state.isRunning()).toBe(false);
      expect(state.isPaused()).toBe(false);
      expect(state.isCompleted()).toBe(true);
      expect(state.isGameOver()).toBe(false);
    });

    it("GameOver状態を作成できる", () => {
      const state = GameState.gameOver();
      expect(state.isNotStarted()).toBe(false);
      expect(state.isRunning()).toBe(false);
      expect(state.isPaused()).toBe(false);
      expect(state.isCompleted()).toBe(false);
      expect(state.isGameOver()).toBe(true);
    });
  });

  describe("状態遷移の検証", () => {
    it("NotStartedからRunningに遷移できる", () => {
      const state = GameState.notStarted();
      expect(state.canTransitionTo(GameState.running())).toBe(true);
    });

    it("RunningからPausedに遷移できる", () => {
      const state = GameState.running();
      expect(state.canTransitionTo(GameState.paused())).toBe(true);
    });

    it("PausedからRunningに遷移できる", () => {
      const state = GameState.paused();
      expect(state.canTransitionTo(GameState.running())).toBe(true);
    });

    it("RunningからCompletedに遷移できる", () => {
      const state = GameState.running();
      expect(state.canTransitionTo(GameState.completed())).toBe(true);
    });

    it("RunningからGameOverに遷移できる", () => {
      const state = GameState.running();
      expect(state.canTransitionTo(GameState.gameOver())).toBe(true);
    });

    it("PausedからCompletedに遷移できる", () => {
      const state = GameState.paused();
      expect(state.canTransitionTo(GameState.completed())).toBe(true);
    });

    it("PausedからGameOverに遷移できる", () => {
      const state = GameState.paused();
      expect(state.canTransitionTo(GameState.gameOver())).toBe(true);
    });

    it("不正な遷移は拒否される", () => {
      const completed = GameState.completed();
      expect(completed.canTransitionTo(GameState.running())).toBe(false);
      expect(completed.canTransitionTo(GameState.paused())).toBe(false);

      const gameOver = GameState.gameOver();
      expect(gameOver.canTransitionTo(GameState.running())).toBe(false);
      expect(gameOver.canTransitionTo(GameState.paused())).toBe(false);
    });
  });

  describe("等価性の検証", () => {
    it("同じ状態は等価である", () => {
      const state1 = GameState.running();
      const state2 = GameState.running();
      expect(state1.equals(state2)).toBe(true);
    });

    it("異なる状態は等価でない", () => {
      const running = GameState.running();
      const paused = GameState.paused();
      expect(running.equals(paused)).toBe(false);
    });
  });

  describe("文字列表現", () => {
    it("各状態の文字列表現が正しい", () => {
      expect(GameState.notStarted().toString()).toBe("NotStarted");
      expect(GameState.running().toString()).toBe("Running");
      expect(GameState.paused().toString()).toBe("Paused");
      expect(GameState.completed().toString()).toBe("Completed");
      expect(GameState.gameOver().toString()).toBe("GameOver");
    });
  });

  describe("アクティブ状態の判定", () => {
    it("RunningとPausedはアクティブ状態", () => {
      expect(GameState.running().isActive()).toBe(true);
      expect(GameState.paused().isActive()).toBe(true);
    });

    it("NotStarted、Completed、GameOverは非アクティブ状態", () => {
      expect(GameState.notStarted().isActive()).toBe(false);
      expect(GameState.completed().isActive()).toBe(false);
      expect(GameState.gameOver().isActive()).toBe(false);
    });
  });

  describe("終了状態の判定", () => {
    it("CompletedとGameOverは終了状態", () => {
      expect(GameState.completed().isFinished()).toBe(true);
      expect(GameState.gameOver().isFinished()).toBe(true);
    });

    it("NotStarted、Running、Pausedは非終了状態", () => {
      expect(GameState.notStarted().isFinished()).toBe(false);
      expect(GameState.running().isFinished()).toBe(false);
      expect(GameState.paused().isFinished()).toBe(false);
    });
  });
});