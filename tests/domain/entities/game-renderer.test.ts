import { describe, it, expect, mock } from "bun:test";
import { GameRenderer } from "../../../src/domain/entities/game-renderer";

describe("GameRenderer Basic", () => {
  it("should create renderer with valid canvas", () => {
    const mockContext = {
      clearRect: mock(() => {}),
      save: mock(() => {}),
      restore: mock(() => {}),
    } as any;

    const mockCanvas = {
      width: 800,
      height: 600,
      getContext: mock(() => mockContext),
    } as any;

    const renderer = new GameRenderer(mockCanvas);

    expect(renderer.canvas).toBe(mockCanvas);
    expect(renderer.context).toBe(mockContext);
    expect(renderer.isRunning).toBe(false);
  });

  it("should throw error if canvas context is null", () => {
    const mockCanvas = {
      width: 800,
      height: 600,
      getContext: mock(() => null),
    } as any;

    expect(() => new GameRenderer(mockCanvas)).toThrow("Failed to get 2D context from canvas");
  });

  it("should return viewport based on canvas size", () => {
    const mockContext = {
      clearRect: mock(() => {}),
      save: mock(() => {}),
      restore: mock(() => {}),
    } as any;

    const mockCanvas = {
      width: 1024,
      height: 768,
      getContext: mock(() => mockContext),
    } as any;

    const renderer = new GameRenderer(mockCanvas);
    const viewport = renderer.viewport;

    expect(viewport.x).toBe(0);
    expect(viewport.y).toBe(0);
    expect(viewport.width).toBe(1024);
    expect(viewport.height).toBe(768);
  });

  it("should resize canvas", () => {
    const mockContext = {
      clearRect: mock(() => {}),
      save: mock(() => {}),
      restore: mock(() => {}),
    } as any;

    const mockCanvas = {
      width: 800,
      height: 600,
      getContext: mock(() => mockContext),
    } as any;

    const renderer = new GameRenderer(mockCanvas);
    renderer.resize(1200, 900);

    expect(mockCanvas.width).toBe(1200);
    expect(mockCanvas.height).toBe(900);
  });

  it("should ensure minimum canvas size", () => {
    const mockContext = {
      clearRect: mock(() => {}),
      save: mock(() => {}),
      restore: mock(() => {}),
    } as any;

    const mockCanvas = {
      width: 800,
      height: 600,
      getContext: mock(() => mockContext),
    } as any;

    const renderer = new GameRenderer(mockCanvas);
    renderer.resize(50, 50);

    expect(mockCanvas.width).toBe(100);
    expect(mockCanvas.height).toBe(100);
  });
});