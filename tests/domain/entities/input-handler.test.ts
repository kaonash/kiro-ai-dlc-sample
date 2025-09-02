import { describe, it, expect, mock } from "bun:test";
import { InputHandler } from "../../../src/domain/entities/input-handler";
import { Position } from "../../../src/domain/value-objects/position";

describe("InputHandler", () => {
  const createMockCanvas = (): HTMLCanvasElement => ({
    width: 800,
    height: 600,
    getBoundingClientRect: mock(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })),
    addEventListener: mock(() => {}),
    removeEventListener: mock(() => {}),
  } as any);

  it("should create input handler with canvas", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    expect(inputHandler.canvas).toBe(canvas);
    expect(inputHandler.mousePosition.x).toBe(0);
    expect(inputHandler.mousePosition.y).toBe(0);
    expect(inputHandler.isDragging).toBe(false);
  });

  it("should convert screen position to world position", () => {
    const canvas = createMockCanvas();
    canvas.getBoundingClientRect = mock(() => ({
      left: 100,
      top: 50,
      width: 800,
      height: 600,
    }));

    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });
    const screenPosition = new Position(200, 150);

    const worldPosition = inputHandler.getWorldPosition(screenPosition);

    expect(worldPosition.x).toBe(100); // 200 - 100
    expect(worldPosition.y).toBe(100); // 150 - 50
  });

  it("should handle mouse move", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    const mockEvent = {
      clientX: 300,
      clientY: 200,
    } as MouseEvent;

    inputHandler.handleMouseMove(mockEvent);

    expect(inputHandler.mousePosition.x).toBe(300);
    expect(inputHandler.mousePosition.y).toBe(200);
  });

  it("should handle mouse down", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    const mockEvent = {
      clientX: 150,
      clientY: 100,
      button: 0, // left click
    } as MouseEvent;

    const onMouseDown = mock(() => {});
    inputHandler.onMouseDown = onMouseDown;

    inputHandler.handleMouseDown(mockEvent);

    expect(onMouseDown).toHaveBeenCalledWith(new Position(150, 100), 0);
  });

  it("should handle mouse up", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    const mockEvent = {
      clientX: 250,
      clientY: 300,
      button: 0,
    } as MouseEvent;

    const onMouseUp = mock(() => {});
    inputHandler.onMouseUp = onMouseUp;

    inputHandler.handleMouseUp(mockEvent);

    expect(onMouseUp).toHaveBeenCalledWith(new Position(250, 300), 0);
  });

  it("should handle drag start", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    const position = new Position(100, 200);
    const onDragStart = mock(() => {});
    inputHandler.onDragStart = onDragStart;

    inputHandler.handleDragStart(position);

    expect(inputHandler.isDragging).toBe(true);
    expect(inputHandler.dragStartPosition.equals(position)).toBe(true);
    expect(onDragStart).toHaveBeenCalledWith(position);
  });

  it("should handle drag end", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    // Start dragging first
    const startPosition = new Position(100, 200);
    inputHandler.handleDragStart(startPosition);

    const endPosition = new Position(150, 250);
    const onDragEnd = mock(() => {});
    inputHandler.onDragEnd = onDragEnd;

    inputHandler.handleDragEnd(endPosition);

    expect(inputHandler.isDragging).toBe(false);
    expect(onDragEnd).toHaveBeenCalledWith(startPosition, endPosition);
  });

  it("should not handle drag end if not dragging", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    const endPosition = new Position(150, 250);
    const onDragEnd = mock(() => {});
    inputHandler.onDragEnd = onDragEnd;

    inputHandler.handleDragEnd(endPosition);

    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it("should set hovered element", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    const mockElement = { id: "test-element" };
    inputHandler.setHoveredElement(mockElement);

    expect(inputHandler.hoveredElement).toBe(mockElement);
  });

  it("should clear hovered element", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    const mockElement = { id: "test-element" };
    inputHandler.setHoveredElement(mockElement);
    inputHandler.clearHoveredElement();

    expect(inputHandler.hoveredElement).toBeNull();
  });

  it("should handle keyboard events", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    const mockEvent = {
      key: "Escape",
      code: "Escape",
      preventDefault: mock(() => {}),
    } as KeyboardEvent;

    const onKeyDown = mock(() => {});
    inputHandler.onKeyDown = onKeyDown;

    inputHandler.handleKeyDown(mockEvent);

    expect(onKeyDown).toHaveBeenCalledWith("Escape", "Escape");
  });

  it("should enable and disable input", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    expect(inputHandler.isEnabled).toBe(true);

    inputHandler.disable();
    expect(inputHandler.isEnabled).toBe(false);

    inputHandler.enable();
    expect(inputHandler.isEnabled).toBe(true);
  });

  it("should not handle events when disabled", () => {
    const canvas = createMockCanvas();
    const inputHandler = new InputHandler(canvas, { setupEventListeners: false });

    inputHandler.disable();

    const mockEvent = {
      clientX: 300,
      clientY: 200,
    } as MouseEvent;

    const onMouseDown = mock(() => {});
    inputHandler.onMouseDown = onMouseDown;

    inputHandler.handleMouseDown(mockEvent);

    expect(onMouseDown).not.toHaveBeenCalled();
  });
});