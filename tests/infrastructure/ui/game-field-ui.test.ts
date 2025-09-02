import { describe, it, expect, mock } from "bun:test";
import { GameFieldUI } from "../../../src/infrastructure/ui/game-field-ui";
import { Rectangle } from "../../../src/domain/value-objects/rectangle";
import { Position } from "../../../src/domain/value-objects/position";
import { RenderingService } from "../../../src/domain/services/rendering-service";
import { Enemy, Tower } from "../../../src/domain/entities/ui-manager";

describe("GameFieldUI", () => {
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
    beginPath: mock(() => {}),
    arc: mock(() => {}),
    fill: mock(() => {}),
    stroke: mock(() => {}),
    setLineDash: mock(() => {}),
    moveTo: mock(() => {}),
    lineTo: mock(() => {}),
  } as any);

  const createTestEnemies = (): Enemy[] => [
    { id: "enemy1", position: new Position(100, 200), health: 80 },
    { id: "enemy2", position: new Position(200, 250), health: 60 },
    { id: "enemy3", position: new Position(300, 180), health: 100 },
  ];

  const createTestTowers = (): Tower[] => [
    { id: "tower1", position: new Position(150, 150), type: "archer" },
    { id: "tower2", position: new Position(250, 300), type: "cannon" },
    { id: "tower3", position: new Position(350, 200), type: "magic" },
  ];

  it("should create game field UI with bounds", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();

    const gameFieldUI = new GameFieldUI(bounds, renderingService);

    expect(gameFieldUI.bounds).toBe(bounds);
  });

  it("should update enemies", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const enemies = createTestEnemies();

    gameFieldUI.updateEnemies(enemies);

    expect(gameFieldUI.enemies).toEqual(enemies);
  });

  it("should update towers", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const towers = createTestTowers();

    gameFieldUI.updateTowers(towers);

    expect(gameFieldUI.towers).toEqual(towers);
  });

  it("should show tower range", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const tower = createTestTowers()[0];

    gameFieldUI.showTowerRange(tower);

    expect(gameFieldUI.selectedTower).toBe(tower);
    expect(gameFieldUI.showRange).toBe(true);
  });

  it("should hide tower range", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const tower = createTestTowers()[0];

    gameFieldUI.showTowerRange(tower);
    gameFieldUI.hideTowerRange();

    expect(gameFieldUI.selectedTower).toBeNull();
    expect(gameFieldUI.showRange).toBe(false);
  });

  it("should render game field elements", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const context = createMockContext();
    const enemies = createTestEnemies();
    const towers = createTestTowers();

    gameFieldUI.updateEnemies(enemies);
    gameFieldUI.updateTowers(towers);
    gameFieldUI.render(context, 16.67);

    // Should render background
    expect(renderingService.renderRectangle).toHaveBeenCalled();

    // Should render enemies as circles
    expect(renderingService.renderCircle).toHaveBeenCalled();

    // Should render towers as rectangles
    expect(renderingService.renderRectangle).toHaveBeenCalled();
  });

  it("should render tower range when shown", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const context = createMockContext();
    const tower = createTestTowers()[0];

    gameFieldUI.showTowerRange(tower);
    gameFieldUI.render(context, 16.67);

    // Should render range circle
    expect(renderingService.renderCircle).toHaveBeenCalled();
  });

  it("should find tower at position", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const towers = createTestTowers();

    gameFieldUI.updateTowers(towers);

    const position = new Position(150, 150); // Tower1 position
    const foundTower = gameFieldUI.getTowerAtPosition(position);

    expect(foundTower).toBe(towers[0]);
  });

  it("should return null for position without tower", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const towers = createTestTowers();

    gameFieldUI.updateTowers(towers);

    const position = new Position(500, 500); // Empty position
    const foundTower = gameFieldUI.getTowerAtPosition(position);

    expect(foundTower).toBeNull();
  });

  it("should find enemy at position", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const enemies = createTestEnemies();

    gameFieldUI.updateEnemies(enemies);

    const position = new Position(100, 200); // Enemy1 position
    const foundEnemy = gameFieldUI.getEnemyAtPosition(position);

    expect(foundEnemy).toBe(enemies[0]);
  });

  it("should check if position is valid for tower placement", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const towers = createTestTowers();

    gameFieldUI.updateTowers(towers);

    // Position without existing tower should be valid
    const validPosition = new Position(400, 300);
    expect(gameFieldUI.isValidTowerPosition(validPosition)).toBe(true);

    // Position with existing tower should be invalid
    const invalidPosition = new Position(150, 150);
    expect(gameFieldUI.isValidTowerPosition(invalidPosition)).toBe(false);

    // Position outside bounds should be invalid
    const outsidePosition = new Position(-10, -10);
    expect(gameFieldUI.isValidTowerPosition(outsidePosition)).toBe(false);
  });

  it("should handle empty enemies and towers", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);
    const context = createMockContext();

    gameFieldUI.updateEnemies([]);
    gameFieldUI.updateTowers([]);
    gameFieldUI.render(context, 16.67);

    // Should still render background
    expect(renderingService.renderRectangle).toHaveBeenCalled();
  });

  it("should get tower range radius", () => {
    const bounds = new Rectangle(0, 60, 800, 440);
    const renderingService = createMockRenderingService();
    const gameFieldUI = new GameFieldUI(bounds, renderingService);

    expect(gameFieldUI.getTowerRange("archer")).toBe(80);
    expect(gameFieldUI.getTowerRange("cannon")).toBe(60);
    expect(gameFieldUI.getTowerRange("magic")).toBe(100);
    expect(gameFieldUI.getTowerRange("unknown")).toBe(50); // default
  });
});