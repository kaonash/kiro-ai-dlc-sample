import { describe, it, expect, beforeEach } from 'bun:test';
import { WaveScheduler } from '../../../src/domain/entities/wave-scheduler';
import { WaveConfiguration } from '../../../src/domain/value-objects/wave-configuration';
import { Position } from '../../../src/domain/value-objects/position';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';

describe('WaveScheduler', () => {
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
    it('should create scheduler with valid parameters', () => {
      const gameStartTime = new Date();
      const scheduler = new WaveScheduler(waveConfiguration, gameStartTime);
      
      expect(scheduler.currentWave).toBeNull();
      expect(scheduler.waveNumber).toBe(0);
      expect(scheduler.isActive).toBe(false);
      expect(scheduler.gameStartTime).toBe(gameStartTime);
    });

    it('should calculate next wave time correctly', () => {
      const gameStartTime = new Date();
      const scheduler = new WaveScheduler(waveConfiguration, gameStartTime);
      
      const expectedNextWaveTime = new Date(gameStartTime.getTime() + waveConfiguration.getWaveInterval());
      expect(scheduler.nextWaveTime.getTime()).toBe(expectedNextWaveTime.getTime());
    });
  });

  describe('startWaveScheduling', () => {
    it('should activate scheduler', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      
      scheduler.startWaveScheduling();
      
      expect(scheduler.isActive).toBe(true);
    });

    it('should be idempotent', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      
      scheduler.startWaveScheduling();
      scheduler.startWaveScheduling();
      
      expect(scheduler.isActive).toBe(true);
    });
  });

  describe('stopWaveScheduling', () => {
    it('should deactivate scheduler', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      scheduler.startWaveScheduling();
      
      scheduler.stopWaveScheduling();
      
      expect(scheduler.isActive).toBe(false);
    });

    it('should be idempotent', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      
      scheduler.stopWaveScheduling();
      scheduler.stopWaveScheduling();
      
      expect(scheduler.isActive).toBe(false);
    });
  });

  describe('canStartNextWave', () => {
    it('should return false when scheduler is not active', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      
      expect(scheduler.canStartNextWave()).toBe(false);
    });

    it('should return false when current wave is active', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      scheduler.startWaveScheduling();
      scheduler.startNextWave(movementPath);
      
      expect(scheduler.canStartNextWave()).toBe(false);
    });

    it('should return false when wave interval has not passed', () => {
      const gameStartTime = new Date(Date.now() - 10000); // 10 seconds ago
      const scheduler = new WaveScheduler(waveConfiguration, gameStartTime);
      scheduler.startWaveScheduling();
      
      expect(scheduler.canStartNextWave()).toBe(false);
    });

    it('should return true when wave interval has passed and no current wave', () => {
      const gameStartTime = new Date(Date.now() - 40000); // 40 seconds ago (> 30 second interval)
      const scheduler = new WaveScheduler(waveConfiguration, gameStartTime);
      scheduler.startWaveScheduling();
      
      expect(scheduler.canStartNextWave()).toBe(true);
    });

    it('should return true when current wave is complete', () => {
      const gameStartTime = new Date(Date.now() - 40000);
      const scheduler = new WaveScheduler(waveConfiguration, gameStartTime);
      scheduler.startWaveScheduling();
      scheduler.startNextWave(movementPath);
      
      // Complete the current wave by killing all enemies
      const currentWave = scheduler.currentWave!;
      for (let i = 0; i < currentWave.totalEnemyCount; i++) {
        const enemy = currentWave.spawnNextEnemy(movementPath);
        if (enemy) {
          enemy.takeDamage(1000); // Kill the enemy
        }
      }
      
      expect(scheduler.canStartNextWave()).toBe(true);
    });
  });

  describe('startNextWave', () => {
    it('should create and start new wave', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      scheduler.startWaveScheduling();
      scheduler.setNextWaveTime(new Date(Date.now() - 1000));
      
      const wave = scheduler.startNextWave(movementPath);
      
      expect(wave).not.toBeNull();
      expect(scheduler.currentWave).toBe(wave);
      expect(scheduler.waveNumber).toBe(1);
    });

    it('should increment wave number', () => {
      const gameStartTime = new Date(Date.now() - 40000);
      const scheduler = new WaveScheduler(waveConfiguration, gameStartTime);
      scheduler.startWaveScheduling();
      
      const wave1 = scheduler.startNextWave(movementPath);
      
      // Complete first wave
      for (let i = 0; i < wave1!.totalEnemyCount; i++) {
        const enemy = wave1!.spawnNextEnemy(movementPath);
        if (enemy) {
          enemy.takeDamage(1000);
        }
      }
      
      const wave2 = scheduler.startNextWave(movementPath);
      
      expect(scheduler.waveNumber).toBe(2);
      expect(wave2!.waveNumber).toBe(2);
    });

    it('should update next wave time', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      scheduler.startWaveScheduling();
      
      const beforeStart = Date.now();
      scheduler.startNextWave(movementPath);
      const afterStart = Date.now();
      
      const expectedNextWaveTime = beforeStart + waveConfiguration.getWaveInterval();
      expect(scheduler.nextWaveTime.getTime()).toBeGreaterThanOrEqual(expectedNextWaveTime);
      expect(scheduler.nextWaveTime.getTime()).toBeLessThanOrEqual(afterStart + waveConfiguration.getWaveInterval());
    });

    it('should return null when cannot start wave', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      // Don't start scheduling
      
      const wave = scheduler.startNextWave(movementPath);
      
      expect(wave).toBeNull();
    });
  });

  describe('update', () => {
    it('should not start wave when scheduler is inactive', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      
      scheduler.update(new Date(), movementPath);
      
      expect(scheduler.currentWave).toBeNull();
    });

    it('should start first wave when time has come', () => {
      const gameStartTime = new Date(Date.now() - 40000);
      const scheduler = new WaveScheduler(waveConfiguration, gameStartTime);
      scheduler.startWaveScheduling();
      
      scheduler.update(new Date(), movementPath);
      
      expect(scheduler.currentWave).not.toBeNull();
      expect(scheduler.waveNumber).toBe(1);
    });

    it('should spawn enemies in current wave', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      scheduler.startWaveScheduling();
      const wave = scheduler.startNextWave(movementPath);
      
      scheduler.update(new Date(), movementPath);
      
      expect(wave!.spawnedCount).toBeGreaterThan(0);
    });

    it('should start next wave when current wave is complete', () => {
      const gameStartTime = new Date(Date.now() - 40000);
      const scheduler = new WaveScheduler(waveConfiguration, gameStartTime);
      scheduler.startWaveScheduling();
      
      const wave1 = scheduler.startNextWave(movementPath);
      
      // Complete the wave
      for (let i = 0; i < wave1!.totalEnemyCount; i++) {
        const enemy = wave1!.spawnNextEnemy(movementPath);
        if (enemy) {
          enemy.takeDamage(1000);
        }
      }
      
      scheduler.update(new Date(), movementPath);
      
      expect(scheduler.waveNumber).toBe(2);
      expect(scheduler.currentWave!.waveNumber).toBe(2);
    });
  });

  describe('getAllActiveEnemies', () => {
    it('should return empty array when no current wave', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      
      const enemies = scheduler.getAllActiveEnemies();
      
      expect(enemies).toHaveLength(0);
    });

    it('should return enemies from current wave', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      scheduler.startWaveScheduling();
      const wave = scheduler.startNextWave(movementPath);
      
      // Spawn some enemies
      wave!.spawnNextEnemy(movementPath);
      wave!.spawnNextEnemy(movementPath);
      
      const enemies = scheduler.getAllActiveEnemies();
      
      expect(enemies).toHaveLength(2);
    });

    it('should only return alive enemies', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      scheduler.startWaveScheduling();
      const wave = scheduler.startNextWave(movementPath);
      
      // Spawn some enemies
      const enemy1 = wave!.spawnNextEnemy(movementPath);
      const enemy2 = wave!.spawnNextEnemy(movementPath);
      
      // Kill one enemy
      enemy1!.takeDamage(1000);
      
      const enemies = scheduler.getAllActiveEnemies();
      
      expect(enemies).toHaveLength(1);
      expect(enemies).toContain(enemy2);
    });
  });

  describe('getSchedulerStats', () => {
    it('should return correct stats', () => {
      const gameStartTime = new Date();
      const scheduler = new WaveScheduler(waveConfiguration, gameStartTime);
      scheduler.startWaveScheduling();
      
      const stats = scheduler.getSchedulerStats();
      
      expect(stats.isActive).toBe(true);
      expect(stats.currentWaveNumber).toBe(0);
      expect(stats.totalActiveEnemies).toBe(0);
      expect(stats.gameStartTime).toBe(gameStartTime);
    });

    it('should include current wave stats when wave exists', () => {
      const scheduler = new WaveScheduler(waveConfiguration, new Date());
      scheduler.startWaveScheduling();
      const wave = scheduler.startNextWave(movementPath);
      
      wave!.spawnNextEnemy(movementPath);
      wave!.spawnNextEnemy(movementPath);
      
      const stats = scheduler.getSchedulerStats();
      
      expect(stats.currentWaveNumber).toBe(1);
      expect(stats.totalActiveEnemies).toBe(2);
      expect(stats.currentWaveStats).toBeDefined();
      expect(stats.currentWaveStats!.spawnedCount).toBe(2);
    });
  });
});