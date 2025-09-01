import { describe, it, expect, beforeEach } from 'bun:test';
import { EnemyWave } from '../../../src/domain/entities/enemy-wave';
import { Enemy } from '../../../src/domain/entities/enemy';
import { EnemyType } from '../../../src/domain/value-objects/enemy-type';
import { WaveConfiguration } from '../../../src/domain/value-objects/wave-configuration';
import { Position } from '../../../src/domain/value-objects/position';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';

describe('EnemyWave', () => {
  let waveConfiguration: WaveConfiguration;
  let movementPath: MovementPath;

  beforeEach(() => {
    waveConfiguration = new WaveConfiguration(10, 5, 1000);
    const pathPoints = [
      new Position(0, 100),
      new Position(200, 100),
      new Position(400, 200),
      new Position(600, 200),
      new Position(800, 300)
    ];
    movementPath = new MovementPath(pathPoints);
  });

  describe('constructor', () => {
    it('should create wave with valid parameters', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      expect(wave.waveNumber).toBe(1);
      expect(wave.enemies).toHaveLength(0);
      expect(wave.spawnedCount).toBe(0);
      expect(wave.totalEnemyCount).toBe(10);
      expect(wave.spawnInterval).toBe(1000);
      expect(wave.isComplete).toBe(false);
      expect(wave.waveConfiguration).toBe(waveConfiguration);
    });

    it('should calculate correct total enemy count for different waves', () => {
      const wave1 = new EnemyWave(1, waveConfiguration);
      const wave3 = new EnemyWave(3, waveConfiguration);
      const wave5 = new EnemyWave(5, waveConfiguration);
      
      expect(wave1.totalEnemyCount).toBe(10);
      expect(wave3.totalEnemyCount).toBe(20);
      expect(wave5.totalEnemyCount).toBe(30);
    });

    it('should initialize with current time as last spawn time', () => {
      const beforeCreate = Date.now();
      const wave = new EnemyWave(1, waveConfiguration);
      const afterCreate = Date.now();
      
      expect(wave.lastSpawnTime.getTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(wave.lastSpawnTime.getTime()).toBeLessThanOrEqual(afterCreate);
    });
  });

  describe('canSpawnEnemy', () => {
    it('should return true when no enemies have been spawned', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      expect(wave.canSpawnEnemy()).toBe(true);
    });

    it('should return false when all enemies have been spawned', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn all enemies using the proper method
      for (let i = 0; i < wave.totalEnemyCount; i++) {
        wave.spawnNextEnemy(movementPath);
      }
      
      expect(wave.canSpawnEnemy()).toBe(false);
    });

    it('should return false when spawn interval has not passed', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn one enemy (this will set lastSpawnTime to now)
      wave.spawnNextEnemy(movementPath);
      
      // Immediately try to spawn another - should fail due to interval
      expect(wave.canSpawnEnemy()).toBe(false);
    });

    it('should return true when spawn interval has passed', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn one enemy
      wave.spawnNextEnemy(movementPath);
      
      // Manually set last spawn time to past
      (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // 2 seconds ago
      
      expect(wave.canSpawnEnemy()).toBe(true);
    });
  });

  describe('spawnNextEnemy', () => {
    it('should return null when cannot spawn enemy', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Fill up the wave using proper method
      for (let i = 0; i < wave.totalEnemyCount; i++) {
        wave.spawnNextEnemy(movementPath);
      }
      
      const enemy = wave.spawnNextEnemy(movementPath);
      
      expect(enemy).toBeNull();
    });

    it('should create and return enemy when can spawn', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      const enemy = wave.spawnNextEnemy(movementPath);
      
      expect(enemy).not.toBeNull();
      expect(enemy!.id).toContain('wave-1-enemy-');
      expect(wave.enemies).toContain(enemy);
      expect(wave.spawnedCount).toBe(1);
    });

    it('should update last spawn time', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      const beforeSpawn = Date.now();
      
      wave.spawnNextEnemy(movementPath);
      
      const afterSpawn = Date.now();
      expect(wave.lastSpawnTime.getTime()).toBeGreaterThanOrEqual(beforeSpawn);
      expect(wave.lastSpawnTime.getTime()).toBeLessThanOrEqual(afterSpawn);
    });

    it('should create enemies with appropriate types for wave', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      const spawnedTypes = new Set<EnemyType>();
      
      // Spawn several enemies to see type distribution
      for (let i = 0; i < 5; i++) {
        const enemy = wave.spawnNextEnemy(movementPath);
        if (enemy) {
          spawnedTypes.add(enemy.type);
        }
      }
      
      // Wave 1 should only have BASIC and FAST enemies
      expect(spawnedTypes.has(EnemyType.BASIC) || spawnedTypes.has(EnemyType.FAST)).toBe(true);
      expect(spawnedTypes.has(EnemyType.RANGED)).toBe(false);
      expect(spawnedTypes.has(EnemyType.ENHANCED)).toBe(false);
      expect(spawnedTypes.has(EnemyType.BOSS)).toBe(false);
    });
  });

  describe('getAllAliveEnemies', () => {
    it('should return empty array when no enemies', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      const aliveEnemies = wave.getAllAliveEnemies();
      
      expect(aliveEnemies).toHaveLength(0);
    });

    it('should return all enemies when all are alive', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn some enemies with interval bypass
      const enemy1 = wave.spawnNextEnemy(movementPath);
      (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // Reset interval
      const enemy2 = wave.spawnNextEnemy(movementPath);
      
      const aliveEnemies = wave.getAllAliveEnemies();
      
      expect(aliveEnemies).toHaveLength(2);
      expect(aliveEnemies).toContain(enemy1);
      expect(aliveEnemies).toContain(enemy2);
    });

    it('should exclude dead enemies', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn some enemies with interval bypass
      const enemy1 = wave.spawnNextEnemy(movementPath);
      (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // Reset interval
      const enemy2 = wave.spawnNextEnemy(movementPath);
      
      // Kill one enemy
      enemy1!.takeDamage(1000);
      
      const aliveEnemies = wave.getAllAliveEnemies();
      
      expect(aliveEnemies).toHaveLength(1);
      expect(aliveEnemies).toContain(enemy2);
      expect(aliveEnemies).not.toContain(enemy1);
    });
  });

  describe('isWaveComplete', () => {
    it('should return false when not all enemies spawned', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      expect(wave.isWaveComplete()).toBe(false);
    });

    it('should return false when all spawned but some alive', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn all enemies by bypassing interval
      for (let i = 0; i < wave.totalEnemyCount; i++) {
        (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // Reset interval
        wave.spawnNextEnemy(movementPath);
      }
      
      expect(wave.isWaveComplete()).toBe(false);
    });

    it('should return true when all spawned and all dead', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn all enemies by bypassing interval
      const enemies = [];
      for (let i = 0; i < wave.totalEnemyCount; i++) {
        (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // Reset interval
        const enemy = wave.spawnNextEnemy(movementPath);
        if (enemy) enemies.push(enemy);
      }
      
      // Kill all enemies
      enemies.forEach(enemy => enemy.takeDamage(1000));
      
      expect(wave.isWaveComplete()).toBe(true);
      expect(wave.isComplete).toBe(true);
    });

    it('should return true when all spawned and all reached base', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn all enemies by bypassing interval
      const enemies = [];
      for (let i = 0; i < wave.totalEnemyCount; i++) {
        (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // Reset interval
        const enemy = wave.spawnNextEnemy(movementPath);
        if (enemy) enemies.push(enemy);
      }
      
      // Move all enemies to base
      enemies.forEach(enemy => {
        enemy.move(100000); // Move for a long time to reach base
      });
      
      expect(wave.isWaveComplete()).toBe(true);
    });
  });

  describe('getProgress', () => {
    it('should return 0 when no enemies spawned', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      expect(wave.getProgress()).toBe(0);
    });

    it('should return 0.5 when half enemies spawned', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn half the enemies by bypassing interval
      for (let i = 0; i < wave.totalEnemyCount / 2; i++) {
        (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // Reset interval
        wave.spawnNextEnemy(movementPath);
      }
      
      expect(wave.getProgress()).toBe(0.5);
    });

    it('should return 1 when all enemies spawned', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn all enemies by bypassing interval
      for (let i = 0; i < wave.totalEnemyCount; i++) {
        (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // Reset interval
        wave.spawnNextEnemy(movementPath);
      }
      
      expect(wave.getProgress()).toBe(1);
    });
  });

  describe('removeDeadEnemies', () => {
    it('should remove dead enemies from the wave', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn some enemies by bypassing interval
      const enemy1 = wave.spawnNextEnemy(movementPath);
      (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // Reset interval
      const enemy2 = wave.spawnNextEnemy(movementPath);
      (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // Reset interval
      const enemy3 = wave.spawnNextEnemy(movementPath);
      
      // Kill one enemy
      enemy2!.takeDamage(1000);
      
      expect(wave.enemies).toHaveLength(3);
      
      wave.removeDeadEnemies();
      
      expect(wave.enemies).toHaveLength(2);
      expect(wave.enemies).toContain(enemy1);
      expect(wave.enemies).toContain(enemy3);
      expect(wave.enemies).not.toContain(enemy2);
    });

    it('should not remove alive enemies', () => {
      const wave = new EnemyWave(1, waveConfiguration);
      
      // Spawn some enemies by bypassing interval
      const enemy1 = wave.spawnNextEnemy(movementPath);
      (wave as any)._lastSpawnTime = new Date(Date.now() - 2000); // Reset interval
      const enemy2 = wave.spawnNextEnemy(movementPath);
      
      wave.removeDeadEnemies();
      
      expect(wave.enemies).toHaveLength(2);
      expect(wave.enemies).toContain(enemy1);
      expect(wave.enemies).toContain(enemy2);
    });
  });
});