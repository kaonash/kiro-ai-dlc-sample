import { describe, it, expect, mock } from "bun:test";
import { UIManager } from "../../../src/domain/entities/ui-manager";

// Mock UI components
const createMockHeaderUI = () => ({
  updateTimer: mock(() => {}),
  updateScore: mock(() => {}),
  updateHealth: mock(() => {}),
  render: mock(() => {}),
});

const createMockHandUI = () => ({
  updateHand: mock(() => {}),
  updateMana: mock(() => {}),
  selectCard: mock(() => {}),
  render: mock(() => {}),
});

const createMockGameFieldUI = () => ({
  updateEnemies: mock(() => {}),
  updateTowers: mock(() => {}),
  render: mock(() => {}),
});

const createMockTooltipUI = () => ({
  show: mock(() => {}),
  hide: mock(() => {}),
  render: mock(() => {}),
});

describe("UIManager", () => {
  it("should create UI manager with components", () => {
    const headerUI = createMockHeaderUI();
    const handUI = createMockHandUI();
    const gameFieldUI = createMockGameFieldUI();
    const tooltipUI = createMockTooltipUI();

    const uiManager = new UIManager(headerUI, handUI, gameFieldUI, tooltipUI);

    expect(uiManager.headerUI).toBe(headerUI);
    expect(uiManager.handUI).toBe(handUI);
    expect(uiManager.gameFieldUI).toBe(gameFieldUI);
    expect(uiManager.tooltipUI).toBe(tooltipUI);
  });

  it("should update game state", () => {
    const headerUI = createMockHeaderUI();
    const handUI = createMockHandUI();
    const gameFieldUI = createMockGameFieldUI();
    const tooltipUI = createMockTooltipUI();

    const uiManager = new UIManager(headerUI, handUI, gameFieldUI, tooltipUI);

    const gameState = {
      timeRemaining: 120,
      score: 1500,
      health: 80,
      maxHealth: 100,
    };

    uiManager.updateGameState(gameState);

    expect(headerUI.updateTimer).toHaveBeenCalledWith(120);
    expect(headerUI.updateScore).toHaveBeenCalledWith(1500);
    expect(headerUI.updateHealth).toHaveBeenCalledWith(80, 100);
  });

  it("should update hand state", () => {
    const headerUI = createMockHeaderUI();
    const handUI = createMockHandUI();
    const gameFieldUI = createMockGameFieldUI();
    const tooltipUI = createMockTooltipUI();

    const uiManager = new UIManager(headerUI, handUI, gameFieldUI, tooltipUI);

    const handState = {
      cards: [
        { id: "card1", name: "Tower A", cost: 3 },
        { id: "card2", name: "Tower B", cost: 5 },
      ],
      currentMana: 7,
      maxMana: 10,
    };

    uiManager.updateHandState(handState);

    expect(handUI.updateHand).toHaveBeenCalledWith(handState.cards);
    expect(handUI.updateMana).toHaveBeenCalledWith(7, 10);
  });

  it("should show tooltip", () => {
    const headerUI = createMockHeaderUI();
    const handUI = createMockHandUI();
    const gameFieldUI = createMockGameFieldUI();
    const tooltipUI = createMockTooltipUI();

    const uiManager = new UIManager(headerUI, handUI, gameFieldUI, tooltipUI);

    const content = "Tower damage: 50";
    const position = { x: 100, y: 200 };

    uiManager.showTooltip(content, position);

    expect(tooltipUI.show).toHaveBeenCalledWith(content, position);
  });

  it("should hide tooltip", () => {
    const headerUI = createMockHeaderUI();
    const handUI = createMockHandUI();
    const gameFieldUI = createMockGameFieldUI();
    const tooltipUI = createMockTooltipUI();

    const uiManager = new UIManager(headerUI, handUI, gameFieldUI, tooltipUI);

    uiManager.hideTooltip();

    expect(tooltipUI.hide).toHaveBeenCalled();
  });

  it("should update enemies", () => {
    const headerUI = createMockHeaderUI();
    const handUI = createMockHandUI();
    const gameFieldUI = createMockGameFieldUI();
    const tooltipUI = createMockTooltipUI();

    const uiManager = new UIManager(headerUI, handUI, gameFieldUI, tooltipUI);

    const enemies = [
      { id: "enemy1", position: { x: 100, y: 200 }, health: 50 },
      { id: "enemy2", position: { x: 150, y: 250 }, health: 75 },
    ];

    uiManager.updateEnemies(enemies);

    expect(gameFieldUI.updateEnemies).toHaveBeenCalledWith(enemies);
  });

  it("should update towers", () => {
    const headerUI = createMockHeaderUI();
    const handUI = createMockHandUI();
    const gameFieldUI = createMockGameFieldUI();
    const tooltipUI = createMockTooltipUI();

    const uiManager = new UIManager(headerUI, handUI, gameFieldUI, tooltipUI);

    const towers = [
      { id: "tower1", position: { x: 200, y: 300 }, type: "archer" },
      { id: "tower2", position: { x: 400, y: 350 }, type: "cannon" },
    ];

    uiManager.updateTowers(towers);

    expect(gameFieldUI.updateTowers).toHaveBeenCalledWith(towers);
  });

  it("should render all UI components", () => {
    const headerUI = createMockHeaderUI();
    const handUI = createMockHandUI();
    const gameFieldUI = createMockGameFieldUI();
    const tooltipUI = createMockTooltipUI();

    const uiManager = new UIManager(headerUI, handUI, gameFieldUI, tooltipUI);

    const mockContext = {} as CanvasRenderingContext2D;
    const deltaTime = 16.67;

    uiManager.render(mockContext, deltaTime);

    expect(headerUI.render).toHaveBeenCalledWith(mockContext, deltaTime);
    expect(handUI.render).toHaveBeenCalledWith(mockContext, deltaTime);
    expect(gameFieldUI.render).toHaveBeenCalledWith(mockContext, deltaTime);
    expect(tooltipUI.render).toHaveBeenCalledWith(mockContext, deltaTime);
  });
});