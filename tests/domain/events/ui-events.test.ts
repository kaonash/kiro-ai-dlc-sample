import { describe, it, expect } from "bun:test";
import { UIEventFactory } from "../../../src/domain/events/ui-events";
import { Position } from "../../../src/domain/value-objects/position";

describe("UIEvents", () => {
  describe("UIEventFactory", () => {
    it("should create card selected event", () => {
      const event = UIEventFactory.createCardSelected(0, 'archer-card', 'hand-ui');

      expect(event.type).toBe('card-selected');
      expect(event.cardIndex).toBe(0);
      expect(event.cardId).toBe('archer-card');
      expect(event.source).toBe('hand-ui');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it("should create card drag start event", () => {
      const position = new Position(100, 200);
      const event = UIEventFactory.createCardDragStart(1, 'mage-card', position, 'hand-ui');

      expect(event.type).toBe('card-drag-start');
      expect(event.cardIndex).toBe(1);
      expect(event.cardId).toBe('mage-card');
      expect(event.startPosition.equals(position)).toBe(true);
      expect(event.source).toBe('hand-ui');
    });

    it("should create card drag end event", () => {
      const position = new Position(300, 400);
      const event = UIEventFactory.createCardDragEnd(1, 'mage-card', position, true, 'hand-ui');

      expect(event.type).toBe('card-drag-end');
      expect(event.cardIndex).toBe(1);
      expect(event.cardId).toBe('mage-card');
      expect(event.endPosition.equals(position)).toBe(true);
      expect(event.isValidDrop).toBe(true);
      expect(event.source).toBe('hand-ui');
    });

    it("should create card played event", () => {
      const position = new Position(250, 350);
      const event = UIEventFactory.createCardPlayed('archer-card', position, 3, 'game-field');

      expect(event.type).toBe('card-played');
      expect(event.cardId).toBe('archer-card');
      expect(event.position.equals(position)).toBe(true);
      expect(event.manaCost).toBe(3);
      expect(event.source).toBe('game-field');
    });

    it("should create tower placed event", () => {
      const position = new Position(150, 250);
      const event = UIEventFactory.createTowerPlaced('tower-1', position, 'archer-card', 'game-field');

      expect(event.type).toBe('tower-placed');
      expect(event.towerId).toBe('tower-1');
      expect(event.position.equals(position)).toBe(true);
      expect(event.cardId).toBe('archer-card');
      expect(event.source).toBe('game-field');
    });

    it("should create enemy hit event", () => {
      const position = new Position(200, 300);
      const event = UIEventFactory.createEnemyHit('enemy-1', 25, position, false, 'tower-1');

      expect(event.type).toBe('enemy-hit');
      expect(event.enemyId).toBe('enemy-1');
      expect(event.damage).toBe(25);
      expect(event.position.equals(position)).toBe(true);
      expect(event.isCritical).toBe(false);
      expect(event.source).toBe('tower-1');
    });

    it("should create enemy destroyed event", () => {
      const position = new Position(180, 280);
      const event = UIEventFactory.createEnemyDestroyed('enemy-1', position, 10, 'tower-1');

      expect(event.type).toBe('enemy-destroyed');
      expect(event.enemyId).toBe('enemy-1');
      expect(event.position.equals(position)).toBe(true);
      expect(event.reward).toBe(10);
      expect(event.source).toBe('tower-1');
    });

    it("should create game start event", () => {
      const event = UIEventFactory.createGameStart('normal', 'game-manager');

      expect(event.type).toBe('game-start');
      expect(event.difficulty).toBe('normal');
      expect(event.source).toBe('game-manager');
    });

    it("should create game over event", () => {
      const event = UIEventFactory.createGameOver(true, 1500, 5, 'game-manager');

      expect(event.type).toBe('game-over');
      expect(event.isVictory).toBe(true);
      expect(event.finalScore).toBe(1500);
      expect(event.survivedWaves).toBe(5);
      expect(event.source).toBe('game-manager');
    });

    it("should create tooltip show event", () => {
      const position = new Position(120, 80);
      const event = UIEventFactory.createTooltipShow('Archer Tower', position, 'tower-1', 'ui-manager');

      expect(event.type).toBe('tooltip-show');
      expect(event.content).toBe('Archer Tower');
      expect(event.position.equals(position)).toBe(true);
      expect(event.targetId).toBe('tower-1');
      expect(event.source).toBe('ui-manager');
    });

    it("should create tooltip hide event", () => {
      const event = UIEventFactory.createTooltipHide('ui-manager');

      expect(event.type).toBe('tooltip-hide');
      expect(event.source).toBe('ui-manager');
    });

    it("should create volume change event", () => {
      const event = UIEventFactory.createVolumeChange('bgm', 0.7, 'settings-ui');

      expect(event.type).toBe('volume-change');
      expect(event.volumeType).toBe('bgm');
      expect(event.newVolume).toBe(0.7);
      expect(event.source).toBe('settings-ui');
    });

    it("should create events without source", () => {
      const event = UIEventFactory.createCardSelected(0, 'test-card');

      expect(event.type).toBe('card-selected');
      expect(event.cardIndex).toBe(0);
      expect(event.cardId).toBe('test-card');
      expect(event.source).toBeUndefined();
    });

    it("should create events with current timestamp", () => {
      const beforeTime = performance.now();
      const event = UIEventFactory.createGameStart('easy');
      const afterTime = performance.now();

      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(event.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("should create critical hit event", () => {
      const position = new Position(200, 300);
      const event = UIEventFactory.createEnemyHit('enemy-2', 50, position, true, 'tower-2');

      expect(event.type).toBe('enemy-hit');
      expect(event.damage).toBe(50);
      expect(event.isCritical).toBe(true);
    });

    it("should create invalid drop event", () => {
      const position = new Position(50, 50);
      const event = UIEventFactory.createCardDragEnd(0, 'card-1', position, false);

      expect(event.type).toBe('card-drag-end');
      expect(event.isValidDrop).toBe(false);
    });

    it("should create defeat game over event", () => {
      const event = UIEventFactory.createGameOver(false, 800, 3);

      expect(event.type).toBe('game-over');
      expect(event.isVictory).toBe(false);
      expect(event.finalScore).toBe(800);
      expect(event.survivedWaves).toBe(3);
    });
  });
});