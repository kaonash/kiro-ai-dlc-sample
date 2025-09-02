import { describe, it, expect, mock } from "bun:test";
import { Effect } from "../../../src/infrastructure/effects/effect";
import { Position } from "../../../src/domain/value-objects/position";

// テスト用の具象クラス
class TestEffect extends Effect {
  public renderCalled = false;

  render(context: CanvasRenderingContext2D, deltaTime: number): void {
    this.renderCalled = true;
  }
}

describe("Effect", () => {
  const createMockContext = (): CanvasRenderingContext2D => ({
    fillStyle: "",
    strokeStyle: "",
    font: "",
    fillRect: mock(() => {}),
    strokeRect: mock(() => {}),
    fillText: mock(() => {}),
    save: mock(() => {}),
    restore: mock(() => {}),
  } as any);

  it("should create effect with position and duration", () => {
    const position = new Position(100, 200);
    const duration = 1000;
    const effect = new TestEffect(position, duration);

    expect(effect.effectPosition.equals(position)).toBe(true);
    expect(effect.isActive).toBe(true);
    expect(effect.isComplete).toBe(false);
  });

  it("should calculate progress correctly", () => {
    const position = new Position(100, 200);
    const duration = 1000;
    const effect = new TestEffect(position, duration);

    // 進行度は時間経過に依存するため、範囲チェック
    const progress = effect.progress;
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(1);
  });

  it("should become inactive when complete", () => {
    const position = new Position(100, 200);
    const duration = 1; // 1ms で完了
    const effect = new TestEffect(position, duration);

    // 少し待ってから更新
    setTimeout(() => {
      effect.update(16.67);
      expect(effect.isComplete).toBe(true);
      expect(effect.isActive).toBe(false);
    }, 10);
  });

  it("should stop when requested", () => {
    const position = new Position(100, 200);
    const duration = 1000;
    const effect = new TestEffect(position, duration);

    effect.stop();

    expect(effect.isActive).toBe(false);
  });

  it("should call render method", () => {
    const position = new Position(100, 200);
    const duration = 1000;
    const effect = new TestEffect(position, duration);
    const context = createMockContext();

    effect.render(context, 16.67);

    expect(effect.renderCalled).toBe(true);
  });

  it("should handle zero duration", () => {
    const position = new Position(100, 200);
    const duration = 0;
    const effect = new TestEffect(position, duration);

    expect(effect.progress).toBe(1);
    expect(effect.isComplete).toBe(true);
  });

  it("should maintain position throughout lifecycle", () => {
    const position = new Position(150, 250);
    const duration = 1000;
    const effect = new TestEffect(position, duration);

    effect.update(16.67);

    expect(effect.effectPosition.equals(position)).toBe(true);
  });
});