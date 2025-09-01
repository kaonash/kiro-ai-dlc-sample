import { describe, it, expect, beforeEach } from 'bun:test';
import { EnemyMovementService } from '../../../src/domain/services/enemy-movement-service';
import { Enemy } from '../../../src/domain/entities/enemy';
import { EnemyType } from '../../../src/domain/value-objects/enemy-type';
import { Position } from '../../../src/domain/value-objects/position';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';

describe('EnemyMovementService', () => {
  let movementService: EnemyMovementService;
  let movementPath: MovementPath;

  beforeEach(() => {
    movementService = new EnemyMovementService();
    const pathPoints = [
      new Position(0, 100),
      new Position(200, 100),
      new Position(400, 200),
      new Position(600, 200),
      new Position(800, 300)
    ];
    movementPath = new MovementPath(pathPoints);
  });

  describe('updateEnemyMovement', () => {
    it('should update enemy position based on movement speed', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      const initialPosition = enemy.currentPosition;
      
      movementService.updateEnemyMovement(enemy, 1000); // 1 second
      
      expect(enemy.currentPosition.equals(initialPosition)).toBe(false);
      expect(enemy.pathProgress).toBeGreaterThan(0);
    });

    it('should not move dead enemies', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.takeDamage(1000); // Kill the enemy
      
      const initialPosition = enemy.currentPosition;
      const initialProgress = enemy.pathProgress;
      
      movementService.updateEnemyMovement(enemy, 1000);
      
      expect(enemy.currentPosition.equals(initialPosition)).toBe(true);
      expect(enemy.pathProgress).toBe(initialProgress);
    });

    it('should handle zero delta time', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      const initialPosition = enemy.currentPosition;
      const initialProgress = enemy.pathProgress;
      
      movementService.updateEnemyMovement(enemy, 0);
      
      expect(enemy.currentPosition.equals(initialPosition)).toBe(true);
      expect(enemy.pathProgress).toBe(initialProgress);
    });

    it('should stop enemy at base when path is complete', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      movementService.updateEnemyMovement(enemy, 100000); // Very long time
      
      expect(enemy.pathProgress).toBe(1);
      expect(enemy.currentPosition.equals(movementPath.basePoint)).toBe(true);
    });

    it('should handle different enemy speeds correctly', () => {
      const basicEnemy = new Enemy('basic-1', EnemyType.BASIC, movementPath, new Date());
      const fastEnemy = new Enemy('fast-1', EnemyType.FAST, movementPath, new Date());
      
      movementService.updateEnemyMovement(basicEnemy, 1000);
      movementService.updateEnemyMovement(fastEnemy, 1000);
      
      // Fast enemy should have moved further
      expect(fastEnemy.pathProgress).toBeGreaterThan(basicEnemy.pathProgress);
    });
  });

  describe('calculateNextPosition', () => {
    it('should calculate correct next position', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      const nextPosition = movementService.calculateNextPosition(enemy, 1000);
      
      expect(nextPosition.x).toBeGreaterThan(enemy.currentPosition.x);
    });

    it('should return current position for dead enemy', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.takeDamage(1000); // Kill the enemy
      
      const nextPosition = movementService.calculateNextPosition(enemy, 1000);
      
      expect(nextPosition.equals(enemy.currentPosition)).toBe(true);
    });

    it('should not exceed base point', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      const nextPosition = movementService.calculateNextPosition(enemy, 100000);
      
      expect(nextPosition.equals(movementPath.basePoint)).toBe(true);
    });
  });

  describe('checkBaseReached', () => {
    it('should return false for enemy at spawn', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      expect(movementService.checkBaseReached(enemy)).toBe(false);
    });

    it('should return true for enemy at base', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.move(100000); // Move to base
      
      expect(movementService.checkBaseReached(enemy)).toBe(true);
    });

    it('should return true for enemy with progress >= 1', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.move(100000); // Move to base
      
      expect(movementService.checkBaseReached(enemy)).toBe(true);
    });
  });

  describe('updateMultipleEnemies', () => {
    it('should update all enemies in the array', () => {
      const enemies = [
        new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('enemy-2', EnemyType.FAST, movementPath, new Date()),
        new Enemy('enemy-3', EnemyType.ENHANCED, movementPath, new Date())
      ];
      
      movementService.updateMultipleEnemies(enemies, 1000);
      
      enemies.forEach(enemy => {
        expect(enemy.pathProgress).toBeGreaterThan(0);
      });
    });

    it('should handle empty enemy array', () => {
      expect(() => movementService.updateMultipleEnemies([], 1000)).not.toThrow();
    });

    it('should skip dead enemies', () => {
      const enemies = [
        new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('enemy-2', EnemyType.FAST, movementPath, new Date())
      ];
      
      enemies[1].takeDamage(1000); // Kill second enemy
      
      const initialProgress1 = enemies[0].pathProgress;
      const initialProgress2 = enemies[1].pathProgress;
      
      movementService.updateMultipleEnemies(enemies, 1000);
      
      expect(enemies[0].pathProgress).toBeGreaterThan(initialProgress1);
      expect(enemies[1].pathProgress).toBe(initialProgress2); // Should not change
    });
  });

  describe('getMovementStatistics', () => {
    it('should return initial statistics', () => {
      const stats = movementService.getMovementStatistics();
      
      expect(stats.totalUpdates).toBe(0);
      expect(stats.enemiesReachedBase).toBe(0);
      expect(stats.averageSpeed).toBe(0);
    });

    it('should track movement updates', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      movementService.updateEnemyMovement(enemy, 1000);
      movementService.updateEnemyMovement(enemy, 1000);
      
      const stats = movementService.getMovementStatistics();
      
      expect(stats.totalUpdates).toBe(2);
    });

    it('should track enemies that reached base', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      movementService.updateEnemyMovement(enemy, 100000); // Move to base
      
      const stats = movementService.getMovementStatistics();
      
      expect(stats.enemiesReachedBase).toBe(1);
    });
  });

  describe('resetStatistics', () => {
    it('should reset movement statistics', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      movementService.updateEnemyMovement(enemy, 1000);
      movementService.resetStatistics();
      
      const stats = movementService.getMovementStatistics();
      
      expect(stats.totalUpdates).toBe(0);
      expect(stats.enemiesReachedBase).toBe(0);
      expect(stats.averageSpeed).toBe(0);
    });
  });

  describe('predictTimeToBase', () => {
    it('should predict time for enemy to reach base', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      const timeToBase = movementService.predictTimeToBase(enemy);
      
      expect(timeToBase).toBeGreaterThan(0);
      expect(timeToBase).toBe(movementPath.getTotalTravelTime(enemy.movementSpeed));
    });

    it('should return 0 for enemy already at base', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.move(100000); // Move to base
      
      const timeToBase = movementService.predictTimeToBase(enemy);
      
      expect(timeToBase).toBe(0);
    });

    it('should calculate remaining time for partially moved enemy', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.move(1000); // Move partially
      
      const timeToBase = movementService.predictTimeToBase(enemy);
      const totalTime = movementPath.getTotalTravelTime(enemy.movementSpeed);
      
      expect(timeToBase).toBeLessThan(totalTime);
      expect(timeToBase).toBeGreaterThan(0);
    });
  });
});