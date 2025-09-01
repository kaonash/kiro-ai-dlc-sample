import { describe, it, expect, beforeEach } from 'bun:test';
import { EnemySpawningService } from '../../../src/domain/services/enemy-spawning-service';
import { EnemyType } from '../../../src/domain/value-objects/enemy-type';
import { Position } from '../../../src/domain/value-objects/position';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';

describe('EnemySpawningService', () => {
  let spawningService: EnemySpawningService;
  let movementPath: MovementPath;

  beforeEach(() => {
    spawningService = new EnemySpawningService();
    const pathPoints = [
      new Position(0, 100),
      new Position(200, 100),
      new Position(400, 200),
      new Position(600, 200),
      new Position(800, 300)
    ];
    movementPath = new MovementPath(pathPoints);
  });

  describe('spawnEnemy', () => {
    it('should create enemy with correct type and path', () => {
      const spawnPoint = new Position(0, 100);
      const enemy = spawningService.spawnEnemy('test-enemy-1', EnemyType.BASIC, spawnPoint, movementPath);
      
      expect(enemy.id).toBe('test-enemy-1');
      expect(enemy.type).toBe(EnemyType.BASIC);
      expect(enemy.movementPath).toBe(movementPath);
      expect(enemy.currentPosition.equals(spawnPoint)).toBe(true);
    });

    it('should create enemy with type-specific stats', () => {
      const spawnPoint = new Position(0, 100);
      const basicEnemy = spawningService.spawnEnemy('basic-1', EnemyType.BASIC, spawnPoint, movementPath);
      const bossEnemy = spawningService.spawnEnemy('boss-1', EnemyType.BOSS, spawnPoint, movementPath);
      
      expect(basicEnemy.maxHealth).toBe(100);
      expect(basicEnemy.attackPower).toBe(50);
      expect(basicEnemy.movementSpeed).toBe(100);
      
      expect(bossEnemy.maxHealth).toBe(300);
      expect(bossEnemy.attackPower).toBe(100);
      expect(bossEnemy.movementSpeed).toBe(60);
    });

    it('should create enemy with current spawn time', () => {
      const beforeSpawn = Date.now();
      const spawnPoint = new Position(0, 100);
      const enemy = spawningService.spawnEnemy('test-enemy-1', EnemyType.BASIC, spawnPoint, movementPath);
      const afterSpawn = Date.now();
      
      expect(enemy.spawnTime.getTime()).toBeGreaterThanOrEqual(beforeSpawn);
      expect(enemy.spawnTime.getTime()).toBeLessThanOrEqual(afterSpawn);
    });

    it('should create alive enemy', () => {
      const spawnPoint = new Position(0, 100);
      const enemy = spawningService.spawnEnemy('test-enemy-1', EnemyType.BASIC, spawnPoint, movementPath);
      
      expect(enemy.isAlive).toBe(true);
      expect(enemy.currentHealth).toBe(enemy.maxHealth);
    });

    it('should handle different enemy types', () => {
      const spawnPoint = new Position(0, 100);
      
      const basicEnemy = spawningService.spawnEnemy('basic-1', EnemyType.BASIC, spawnPoint, movementPath);
      const rangedEnemy = spawningService.spawnEnemy('ranged-1', EnemyType.RANGED, spawnPoint, movementPath);
      const fastEnemy = spawningService.spawnEnemy('fast-1', EnemyType.FAST, spawnPoint, movementPath);
      const enhancedEnemy = spawningService.spawnEnemy('enhanced-1', EnemyType.ENHANCED, spawnPoint, movementPath);
      const bossEnemy = spawningService.spawnEnemy('boss-1', EnemyType.BOSS, spawnPoint, movementPath);
      
      expect(basicEnemy.type).toBe(EnemyType.BASIC);
      expect(rangedEnemy.type).toBe(EnemyType.RANGED);
      expect(fastEnemy.type).toBe(EnemyType.FAST);
      expect(enhancedEnemy.type).toBe(EnemyType.ENHANCED);
      expect(bossEnemy.type).toBe(EnemyType.BOSS);
    });
  });

  describe('selectSpawnPoint', () => {
    it('should return first point when only one available', () => {
      const availablePoints = [new Position(0, 100)];
      const selectedPoint = spawningService.selectSpawnPoint(availablePoints);
      
      expect(selectedPoint.equals(availablePoints[0])).toBe(true);
    });

    it('should return one of the available points', () => {
      const availablePoints = [
        new Position(0, 100),
        new Position(0, 200),
        new Position(0, 300)
      ];
      const selectedPoint = spawningService.selectSpawnPoint(availablePoints);
      
      expect(availablePoints.some(point => point.equals(selectedPoint))).toBe(true);
    });

    it('should throw error for empty points array', () => {
      expect(() => spawningService.selectSpawnPoint([])).toThrow('No spawn points available');
    });

    it('should distribute selection across multiple calls', () => {
      const availablePoints = [
        new Position(0, 100),
        new Position(0, 200),
        new Position(0, 300)
      ];
      
      const selectedPoints = new Set<string>();
      
      // Select many times to test distribution
      for (let i = 0; i < 30; i++) {
        const point = spawningService.selectSpawnPoint(availablePoints);
        selectedPoints.add(`${point.x},${point.y}`);
      }
      
      // Should have selected from multiple points (with high probability)
      expect(selectedPoints.size).toBeGreaterThan(1);
    });
  });

  describe('createEnemyWithStats', () => {
    it('should create enemy with correct base stats', () => {
      const enemy = spawningService.createEnemyWithStats('test-1', EnemyType.BASIC, movementPath);
      
      expect(enemy.maxHealth).toBe(100);
      expect(enemy.attackPower).toBe(50);
      expect(enemy.movementSpeed).toBe(100);
    });

    it('should create enemy with different stats for different types', () => {
      const basicEnemy = spawningService.createEnemyWithStats('basic-1', EnemyType.BASIC, movementPath);
      const fastEnemy = spawningService.createEnemyWithStats('fast-1', EnemyType.FAST, movementPath);
      
      expect(basicEnemy.maxHealth).toBe(100);
      expect(basicEnemy.movementSpeed).toBe(100);
      
      expect(fastEnemy.maxHealth).toBe(60);
      expect(fastEnemy.movementSpeed).toBe(150);
    });

    it('should create enemy at spawn point of path', () => {
      const enemy = spawningService.createEnemyWithStats('test-1', EnemyType.BASIC, movementPath);
      
      expect(enemy.currentPosition.equals(movementPath.spawnPoint)).toBe(true);
    });
  });

  describe('spawnEnemyAtRandomPoint', () => {
    it('should spawn enemy at one of the available points', () => {
      const availablePoints = [
        new Position(0, 100),
        new Position(0, 200),
        new Position(0, 300)
      ];
      
      const enemy = spawningService.spawnEnemyAtRandomPoint('test-1', EnemyType.BASIC, availablePoints, movementPath);
      
      expect(availablePoints.some(point => point.equals(enemy.currentPosition))).toBe(true);
    });

    it('should create valid enemy', () => {
      const availablePoints = [new Position(0, 100)];
      const enemy = spawningService.spawnEnemyAtRandomPoint('test-1', EnemyType.BASIC, availablePoints, movementPath);
      
      expect(enemy.id).toBe('test-1');
      expect(enemy.type).toBe(EnemyType.BASIC);
      expect(enemy.isAlive).toBe(true);
    });
  });

  describe('generateEnemyId', () => {
    it('should generate unique IDs', () => {
      const id1 = spawningService.generateEnemyId('wave', 1);
      const id2 = spawningService.generateEnemyId('wave', 1);
      
      expect(id1).not.toBe(id2);
    });

    it('should include prefix and wave number', () => {
      const id = spawningService.generateEnemyId('test-wave', 5);
      
      expect(id).toContain('test-wave');
      expect(id).toContain('5');
    });

    it('should generate different IDs for different waves', () => {
      const id1 = spawningService.generateEnemyId('wave', 1);
      const id2 = spawningService.generateEnemyId('wave', 2);
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('getSpawnStatistics', () => {
    it('should return initial statistics', () => {
      const stats = spawningService.getSpawnStatistics();
      
      expect(stats.totalSpawned).toBe(0);
      expect(stats.spawnedByType.size).toBe(0);
    });

    it('should track spawned enemies', () => {
      const spawnPoint = new Position(0, 100);
      
      spawningService.spawnEnemy('enemy-1', EnemyType.BASIC, spawnPoint, movementPath);
      spawningService.spawnEnemy('enemy-2', EnemyType.BASIC, spawnPoint, movementPath);
      spawningService.spawnEnemy('enemy-3', EnemyType.FAST, spawnPoint, movementPath);
      
      const stats = spawningService.getSpawnStatistics();
      
      expect(stats.totalSpawned).toBe(3);
      expect(stats.spawnedByType.get(EnemyType.BASIC)).toBe(2);
      expect(stats.spawnedByType.get(EnemyType.FAST)).toBe(1);
    });
  });

  describe('resetStatistics', () => {
    it('should reset spawn statistics', () => {
      const spawnPoint = new Position(0, 100);
      
      // Spawn some enemies
      spawningService.spawnEnemy('enemy-1', EnemyType.BASIC, spawnPoint, movementPath);
      spawningService.spawnEnemy('enemy-2', EnemyType.FAST, spawnPoint, movementPath);
      
      spawningService.resetStatistics();
      
      const stats = spawningService.getSpawnStatistics();
      expect(stats.totalSpawned).toBe(0);
      expect(stats.spawnedByType.size).toBe(0);
    });
  });
});