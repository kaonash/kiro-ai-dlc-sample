import { describe, it, expect, mock } from "bun:test";
import { HeaderUI } from "../../../src/infrastructure/ui/header-ui";
import { Rectangle } from "../../../src/domain/value-objects/rectangle";
import { RenderingService } from "../../../src/domain/services/rendering-service";

describe("HeaderUI", () => {
  const createMockRenderingService = (): RenderingService => ({
    renderText: mock(() => {}),
    renderRectangle: mock(() => {}),
    renderProgressBar: mock(() => {}),
    renderHealthBar: mock(() => {}),
    renderCircle: mock(() => {}),
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
  } as any);

  it("should create header UI with bounds", () => {
    const bounds = new Rectangle(0, 0, 800, 60);
    const renderingService = createMockRenderingService();

    const headerUI = new HeaderUI(bounds, renderingService);

    expect(headerUI.bounds).toBe(bounds);
  });

  it("should update timer", () => {
    const bounds = new Rectangle(0, 0, 800, 60);
    const renderingService = createMockRenderingService();
    const headerUI = new HeaderUI(bounds, renderingService);

    headerUI.updateTimer(120);

    expect(headerUI.timeRemaining).toBe(120);
  });

  it("should update score", () => {
    const bounds = new Rectangle(0, 0, 800, 60);
    const renderingService = createMockRenderingService();
    const headerUI = new HeaderUI(bounds, renderingService);

    headerUI.updateScore(1500);

    expect(headerUI.score).toBe(1500);
  });

  it("should update health", () => {
    const bounds = new Rectangle(0, 0, 800, 60);
    const renderingService = createMockRenderingService();
    const headerUI = new HeaderUI(bounds, renderingService);

    headerUI.updateHealth(75, 100);

    expect(headerUI.currentHealth).toBe(75);
    expect(headerUI.maxHealth).toBe(100);
  });

  it("should render header elements", () => {
    const bounds = new Rectangle(0, 0, 800, 60);
    const renderingService = createMockRenderingService();
    const headerUI = new HeaderUI(bounds, renderingService);
    const context = createMockContext();

    // Set some data to render
    headerUI.updateTimer(90);
    headerUI.updateScore(2500);
    headerUI.updateHealth(60, 100);

    headerUI.render(context, 16.67);

    // Should render multiple text elements (timer, score, health label, health text)
    expect(renderingService.renderText).toHaveBeenCalledTimes(4);

    // Should render health bar
    expect(renderingService.renderHealthBar).toHaveBeenCalledWith(
      context,
      60,
      100,
      expect.any(Object)
    );
  });

  it("should format timer correctly", () => {
    const bounds = new Rectangle(0, 0, 800, 60);
    const renderingService = createMockRenderingService();
    const headerUI = new HeaderUI(bounds, renderingService);

    expect(headerUI.formatTime(0)).toBe("0:00");
    expect(headerUI.formatTime(30)).toBe("0:30");
    expect(headerUI.formatTime(60)).toBe("1:00");
    expect(headerUI.formatTime(90)).toBe("1:30");
    expect(headerUI.formatTime(125)).toBe("2:05");
    expect(headerUI.formatTime(3661)).toBe("61:01");
  });

  it("should handle negative time", () => {
    const bounds = new Rectangle(0, 0, 800, 60);
    const renderingService = createMockRenderingService();
    const headerUI = new HeaderUI(bounds, renderingService);

    expect(headerUI.formatTime(-10)).toBe("0:00");
  });

  it("should calculate layout positions correctly", () => {
    const bounds = new Rectangle(10, 5, 800, 60);
    const renderingService = createMockRenderingService();
    const headerUI = new HeaderUI(bounds, renderingService);

    const layout = headerUI.getLayout();

    expect(layout.timerPosition.x).toBe(60); // bounds.x + 50
    expect(layout.timerPosition.y).toBe(35); // bounds.y + bounds.height / 2
    expect(layout.scorePosition.x).toBe(410); // bounds.x + bounds.width / 2
    expect(layout.healthBarBounds.x).toBe(610); // bounds.x + bounds.width - 200
    expect(layout.healthBarBounds.width).toBe(150);
  });

  it("should render with different health levels", () => {
    const bounds = new Rectangle(0, 0, 800, 60);
    const renderingService = createMockRenderingService();
    const headerUI = new HeaderUI(bounds, renderingService);
    const context = createMockContext();

    // Test full health
    headerUI.updateHealth(100, 100);
    headerUI.render(context, 16.67);

    // Test low health
    headerUI.updateHealth(15, 100);
    headerUI.render(context, 16.67);

    // Test zero health
    headerUI.updateHealth(0, 100);
    headerUI.render(context, 16.67);

    expect(renderingService.renderHealthBar).toHaveBeenCalledTimes(3);
  });

  it("should handle large scores", () => {
    const bounds = new Rectangle(0, 0, 800, 60);
    const renderingService = createMockRenderingService();
    const headerUI = new HeaderUI(bounds, renderingService);
    const context = createMockContext();

    headerUI.updateScore(1234567);
    headerUI.render(context, 16.67);

    expect(renderingService.renderText).toHaveBeenCalledWith(
      context,
      "Score: 1,234,567",
      expect.any(Object),
      expect.any(Object)
    );
  });
});