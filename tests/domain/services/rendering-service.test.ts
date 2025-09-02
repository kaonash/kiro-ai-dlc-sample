import { describe, it, expect, mock } from "bun:test";
import { RenderingService } from "../../../src/domain/services/rendering-service";
import { Position } from "../../../src/domain/value-objects/position";
import { Color } from "../../../src/domain/value-objects/color";
import { Rectangle } from "../../../src/domain/value-objects/rectangle";

describe("RenderingService", () => {
  const createMockContext = (): CanvasRenderingContext2D => ({
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    fillRect: mock(() => {}),
    strokeRect: mock(() => {}),
    fillText: mock(() => {}),
    strokeText: mock(() => {}),
    beginPath: mock(() => {}),
    rect: mock(() => {}),
    fill: mock(() => {}),
    stroke: mock(() => {}),
    save: mock(() => {}),
    restore: mock(() => {}),
    translate: mock(() => {}),
    scale: mock(() => {}),
    rotate: mock(() => {}),
    drawImage: mock(() => {}),
    arc: mock(() => {}),
  } as any);

  describe("renderText", () => {
    it("should render text with basic style", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const position = new Position(100, 50);
      const style = {
        font: "16px Arial",
        color: Color.black(),
        align: "center" as CanvasTextAlign,
        baseline: "middle" as CanvasTextBaseline,
      };

      service.renderText(mockContext, "Hello World", position, style);

      expect(mockContext.font).toBe("16px Arial");
      expect(mockContext.fillStyle).toBe("rgba(0, 0, 0, 1)");
      expect(mockContext.textAlign).toBe("center");
      expect(mockContext.textBaseline).toBe("middle");
      expect(mockContext.fillText).toHaveBeenCalledWith("Hello World", 100, 50);
    });

    it("should render text with stroke", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const position = new Position(100, 50);
      const style = {
        font: "16px Arial",
        color: Color.white(),
        strokeColor: Color.black(),
        strokeWidth: 2,
      };

      service.renderText(mockContext, "Hello World", position, style);

      expect(mockContext.strokeStyle).toBe("rgba(0, 0, 0, 1)");
      expect(mockContext.lineWidth).toBe(2);
      expect(mockContext.strokeText).toHaveBeenCalledWith("Hello World", 100, 50);
      expect(mockContext.fillText).toHaveBeenCalledWith("Hello World", 100, 50);
    });
  });

  describe("renderHealthBar", () => {
    it("should render health bar with correct proportions", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const bounds = new Rectangle(10, 20, 100, 10);
      const current = 75;
      const max = 100;

      service.renderHealthBar(mockContext, current, max, bounds);

      // Background bar
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 100, 10);
      
      // Health bar (75% of width)
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 75, 10);
      
      // Border
      expect(mockContext.strokeRect).toHaveBeenCalledWith(10, 20, 100, 10);
    });

    it("should handle zero health", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const bounds = new Rectangle(10, 20, 100, 10);
      const current = 0;
      const max = 100;

      service.renderHealthBar(mockContext, current, max, bounds);

      // Should still render background and border, but no health bar
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 100, 10); // background
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 0, 10); // health (0 width)
      expect(mockContext.strokeRect).toHaveBeenCalledWith(10, 20, 100, 10); // border
    });

    it("should handle full health", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const bounds = new Rectangle(10, 20, 100, 10);
      const current = 100;
      const max = 100;

      service.renderHealthBar(mockContext, current, max, bounds);

      // Health bar should be full width
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 100, 10); // health (full width)
    });
  });

  describe("renderProgressBar", () => {
    it("should render progress bar with specified color", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const bounds = new Rectangle(10, 20, 200, 15);
      const progress = 0.6;
      const color = new Color(0, 255, 0);

      service.renderProgressBar(mockContext, progress, bounds, color);

      // Background
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 200, 15);
      
      // Progress (60% of width)
      expect(mockContext.fillStyle).toBe("rgba(0, 255, 0, 1)");
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 120, 15);
      
      // Border
      expect(mockContext.strokeRect).toHaveBeenCalledWith(10, 20, 200, 15);
    });

    it("should clamp progress to 0-1 range", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const bounds = new Rectangle(10, 20, 100, 10);
      const color = new Color(0, 0, 255); // blue

      service.renderProgressBar(mockContext, -0.5, bounds, color);
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 0, 10);

      const mockContext2 = createMockContext();
      service.renderProgressBar(mockContext2, 1.5, bounds, color);
      expect(mockContext2.fillRect).toHaveBeenCalledWith(10, 20, 100, 10);
    });
  });

  describe("renderRectangle", () => {
    it("should render filled rectangle", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const bounds = new Rectangle(10, 20, 100, 50);
      const color = new Color(255, 0, 0);

      service.renderRectangle(mockContext, bounds, color);

      expect(mockContext.fillStyle).toBe("rgba(255, 0, 0, 1)");
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 100, 50);
    });

    it("should render rectangle with stroke", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const bounds = new Rectangle(10, 20, 100, 50);
      const fillColor = new Color(255, 0, 0);
      const strokeColor = new Color(0, 0, 0);
      const strokeWidth = 2;

      service.renderRectangle(mockContext, bounds, fillColor, strokeColor, strokeWidth);

      expect(mockContext.fillStyle).toBe("rgba(255, 0, 0, 1)");
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 100, 50);
      expect(mockContext.strokeStyle).toBe("rgba(0, 0, 0, 1)");
      expect(mockContext.lineWidth).toBe(2);
      expect(mockContext.strokeRect).toHaveBeenCalledWith(10, 20, 100, 50);
    });
  });

  describe("renderCircle", () => {
    it("should render filled circle", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const center = new Position(50, 50);
      const radius = 25;
      const color = new Color(0, 255, 0);

      service.renderCircle(mockContext, center, radius, color);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.fillStyle).toBe("rgba(0, 255, 0, 1)");
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it("should render circle with stroke", () => {
      const mockContext = createMockContext();
      const service = new RenderingService();
      const center = new Position(50, 50);
      const radius = 25;
      const fillColor = new Color(0, 255, 0);
      const strokeColor = new Color(0, 0, 0);
      const strokeWidth = 3;

      service.renderCircle(mockContext, center, radius, fillColor, strokeColor, strokeWidth);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.fillStyle).toBe("rgba(0, 255, 0, 1)");
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.strokeStyle).toBe("rgba(0, 0, 0, 1)");
      expect(mockContext.lineWidth).toBe(3);
      expect(mockContext.stroke).toHaveBeenCalled();
    });
  });
});