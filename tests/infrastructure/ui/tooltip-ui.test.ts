import { describe, it, expect, mock } from "bun:test";
import { TooltipUI } from "../../../src/infrastructure/ui/tooltip-ui";
import { Position } from "../../../src/domain/value-objects/position";
import { RenderingService } from "../../../src/domain/services/rendering-service";
import { AnimationService } from "../../../src/domain/services/animation-service";

describe("TooltipUI", () => {
  const createMockRenderingService = (): RenderingService => ({
    renderText: mock(() => {}),
    renderRectangle: mock(() => {}),
    renderProgressBar: mock(() => {}),
    renderHealthBar: mock(() => {}),
    renderCircle: mock(() => {}),
  } as any);

  const createMockAnimationService = (): AnimationService => ({
    createTween: mock(() => ({
      startTime: 0,
      duration: 200,
      startValue: 0,
      endValue: 1,
      easingFunction: (t: number) => t,
      getCurrentValue: mock(() => 1),
      isComplete: mock(() => true),
      getProgress: mock(() => 1),
    })),
    updateAnimation: mock(() => 1),
    easeInOut: (t: number) => t,
    easeIn: (t: number) => t,
    easeOut: (t: number) => t,
    bounce: (t: number) => t,
    elastic: (t: number) => t,
    linear: (t: number) => t,
    createSequence: mock(() => []),
    createParallel: mock(() => []),
    interpolate: mock(() => 0),
  } as any);

  const createMockContext = (): CanvasRenderingContext2D => ({
    fillStyle: "",
    strokeStyle: "",
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    fillRect: mock(() => {}),
    strokeRect: mock(() => {}),
    fillText: mock(() => {}),
    strokeText: mock(() => {}),
    save: mock(() => {}),
    restore: mock(() => {}),
    measureText: mock(() => ({ width: 100 })),
    canvas: {
      width: 800,
      height: 600,
    },
  } as any);

  it("should create tooltip UI", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();

    const tooltipUI = new TooltipUI(renderingService, animationService);

    expect(tooltipUI.isVisible).toBe(false);
  });

  it("should show tooltip", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const tooltipUI = new TooltipUI(renderingService, animationService);

    const content = "Archer Tower\nDamage: 25\nRange: 80";
    const position = new Position(200, 150);

    tooltipUI.show(content, position);

    expect(tooltipUI.isVisible).toBe(true);
    expect(tooltipUI.content).toBe(content);
    expect(tooltipUI.position.equals(position)).toBe(true);
  });

  it("should hide tooltip", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    // アニメーション完了時にisCompleteがtrueを返すようにモック設定
    const mockAnimation = {
      startTime: 0,
      duration: 150,
      startValue: 1,
      endValue: 0,
      easingFunction: (t: number) => t,
      getCurrentValue: mock(() => 0),
      isComplete: mock(() => true),
      getProgress: mock(() => 1),
    };
    animationService.createTween = mock(() => mockAnimation);
    animationService.updateAnimation = mock(() => 0);

    const tooltipUI = new TooltipUI(renderingService, animationService);

    tooltipUI.show("Test content", new Position(100, 100));
    tooltipUI.hide();
    tooltipUI.update(16.67); // アニメーション更新でisVisibleがfalseになる

    expect(tooltipUI.isVisible).toBe(false);
  });

  it("should update animation", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const tooltipUI = new TooltipUI(renderingService, animationService);

    tooltipUI.show("Test content", new Position(100, 100));
    tooltipUI.update(16.67);

    expect(animationService.updateAnimation).toHaveBeenCalled();
  });

  it("should render tooltip when visible", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    // アニメーション更新で適切なアルファ値を返すようにモック設定
    animationService.updateAnimation = mock(() => 0.8);
    
    const tooltipUI = new TooltipUI(renderingService, animationService);
    const context = createMockContext();

    tooltipUI.show("Test content", new Position(100, 100));
    tooltipUI.update(16.67); // アルファ値を更新
    tooltipUI.render(context, 16.67);

    expect(renderingService.renderRectangle).toHaveBeenCalled();
    expect(renderingService.renderText).toHaveBeenCalled();
  });

  it("should not render when not visible", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const tooltipUI = new TooltipUI(renderingService, animationService);
    const context = createMockContext();

    tooltipUI.render(context, 16.67);

    expect(renderingService.renderRectangle).not.toHaveBeenCalled();
    expect(renderingService.renderText).not.toHaveBeenCalled();
  });

  it("should handle multiline content", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const tooltipUI = new TooltipUI(renderingService, animationService);

    const content = "Line 1\nLine 2\nLine 3";
    const lines = tooltipUI.parseContent(content);

    expect(lines).toEqual(["Line 1", "Line 2", "Line 3"]);
  });

  it("should calculate tooltip bounds correctly", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const tooltipUI = new TooltipUI(renderingService, animationService);
    const context = createMockContext();

    const content = "Test\nContent";
    const position = new Position(200, 150);

    tooltipUI.show(content, position);
    const bounds = tooltipUI.calculateBounds(context);

    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });

  it("should adjust position to stay within screen bounds", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const tooltipUI = new TooltipUI(renderingService, animationService);

    const screenBounds = { width: 800, height: 600 };
    const tooltipBounds = { width: 150, height: 80 };

    // Position near right edge
    const position1 = new Position(750, 300);
    const adjusted1 = tooltipUI.adjustPosition(position1, tooltipBounds, screenBounds);
    expect(adjusted1.x).toBeLessThan(position1.x);

    // Position near bottom edge
    const position2 = new Position(400, 580);
    const adjusted2 = tooltipUI.adjustPosition(position2, tooltipBounds, screenBounds);
    expect(adjusted2.y).toBeLessThan(position2.y);
  });

  it("should handle empty content", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const tooltipUI = new TooltipUI(renderingService, animationService);

    tooltipUI.show("", new Position(100, 100));

    expect(tooltipUI.isVisible).toBe(false);
  });

  it("should handle show/hide animation", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const tooltipUI = new TooltipUI(renderingService, animationService);

    // Show should create fade-in animation
    tooltipUI.show("Test", new Position(100, 100));
    expect(animationService.createTween).toHaveBeenCalledWith(
      expect.any(Number),
      0,
      1,
      200,
      expect.any(Function)
    );

    // Reset mock call count
    animationService.createTween.mockClear();

    // Hide should create fade-out animation
    tooltipUI.hide();
    expect(animationService.createTween).toHaveBeenCalledWith(
      expect.any(Number),
      0, // 初期値は0（まだアニメーション更新されていないため）
      0,
      150,
      expect.any(Function)
    );
  });
});