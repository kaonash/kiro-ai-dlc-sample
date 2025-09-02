import { describe, it, expect, mock } from "bun:test";
import { HandUI } from "../../../src/infrastructure/ui/hand-ui";
import { Rectangle } from "../../../src/domain/value-objects/rectangle";
import { Position } from "../../../src/domain/value-objects/position";
import { RenderingService } from "../../../src/domain/services/rendering-service";
import { Card } from "../../../src/domain/entities/ui-manager";

describe("HandUI", () => {
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

  const createTestCards = (): Card[] => [
    { id: "card1", name: "Archer Tower", cost: 2 },
    { id: "card2", name: "Cannon Tower", cost: 4 },
    { id: "card3", name: "Magic Tower", cost: 6 },
    { id: "card4", name: "Ice Tower", cost: 3 },
    { id: "card5", name: "Fire Tower", cost: 5 },
  ];

  it("should create hand UI with bounds", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();

    const handUI = new HandUI(bounds, renderingService);

    expect(handUI.bounds).toBe(bounds);
  });

  it("should update hand cards", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const cards = createTestCards();

    handUI.updateHand(cards);

    expect(handUI.cards).toEqual(cards);
  });

  it("should update mana", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);

    handUI.updateMana(7, 10);

    expect(handUI.currentMana).toBe(7);
    expect(handUI.maxMana).toBe(10);
  });

  it("should select card by index", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const cards = createTestCards();

    handUI.updateHand(cards);
    handUI.selectCard(2);

    expect(handUI.selectedCardIndex).toBe(2);
  });

  it("should not select invalid card index", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const cards = createTestCards();

    handUI.updateHand(cards);
    handUI.selectCard(10); // Invalid index

    expect(handUI.selectedCardIndex).toBe(-1);
  });

  it("should start card drag", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const cards = createTestCards();
    const position = new Position(100, 200);

    handUI.updateHand(cards);
    handUI.startCardDrag(cards[1], position);

    expect(handUI.isDragging).toBe(true);
    expect(handUI.draggedCard).toBe(cards[1]);
    expect(handUI.dragPosition.equals(position)).toBe(true);
  });

  it("should end card drag", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const cards = createTestCards();
    const position = new Position(100, 200);

    handUI.updateHand(cards);
    handUI.startCardDrag(cards[1], position);
    handUI.endCardDrag();

    expect(handUI.isDragging).toBe(false);
    expect(handUI.draggedCard).toBeNull();
  });

  it("should render hand elements", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const context = createMockContext();
    const cards = createTestCards();

    handUI.updateHand(cards);
    handUI.updateMana(5, 8);
    handUI.render(context, 16.67);

    // Should render background
    expect(renderingService.renderRectangle).toHaveBeenCalled();

    // Should render mana bar
    expect(renderingService.renderProgressBar).toHaveBeenCalled();

    // Should render text elements (mana label, mana text, card names, card costs)
    expect(renderingService.renderText).toHaveBeenCalled();
  });

  it("should calculate card positions correctly", () => {
    const bounds = new Rectangle(50, 500, 700, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const cards = createTestCards();

    handUI.updateHand(cards);
    const cardBounds = handUI.getCardBounds();

    expect(cardBounds).toHaveLength(5);
    
    // Cards should be positioned within bounds
    expect(cardBounds[0].x).toBeGreaterThanOrEqual(bounds.x);
    expect(cardBounds[0].x + cardBounds[0].width).toBeLessThanOrEqual(bounds.x + bounds.width);
    
    // Second card should be to the right of first card
    expect(cardBounds[1].x).toBeGreaterThan(cardBounds[0].x + cardBounds[0].width);
  });

  it("should identify affordable cards", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const cards = createTestCards();

    handUI.updateHand(cards);
    handUI.updateMana(4, 10);

    expect(handUI.canAffordCard(cards[0])).toBe(true); // cost 2
    expect(handUI.canAffordCard(cards[1])).toBe(true); // cost 4
    expect(handUI.canAffordCard(cards[2])).toBe(false); // cost 6
    expect(handUI.canAffordCard(cards[3])).toBe(true); // cost 3
    expect(handUI.canAffordCard(cards[4])).toBe(false); // cost 5
  });

  it("should find card at position", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const cards = createTestCards();

    handUI.updateHand(cards);
    const cardBounds = handUI.getCardBounds();
    
    // Test position within first card
    const position = new Position(
      cardBounds[0].x + cardBounds[0].width / 2,
      cardBounds[0].y + cardBounds[0].height / 2
    );

    const foundCard = handUI.getCardAtPosition(position);
    expect(foundCard).toBe(cards[0]);
  });

  it("should return null for position outside cards", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const cards = createTestCards();

    handUI.updateHand(cards);
    
    const position = new Position(1000, 1000); // Outside bounds
    const foundCard = handUI.getCardAtPosition(position);
    
    expect(foundCard).toBeNull();
  });

  it("should handle empty hand", () => {
    const bounds = new Rectangle(0, 500, 800, 100);
    const renderingService = createMockRenderingService();
    const handUI = new HandUI(bounds, renderingService);
    const context = createMockContext();

    handUI.updateHand([]);
    handUI.render(context, 16.67);

    // Should still render background and mana
    expect(renderingService.renderRectangle).toHaveBeenCalled();
    expect(renderingService.renderProgressBar).toHaveBeenCalled();
  });
});