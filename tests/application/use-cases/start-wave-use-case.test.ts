import { describe, it, expect, beforeEach } from 'bun:test';
import { StartWaveUseCase } from '../../../src/application/use-cases/start-wave-use-case';
import { WaveScheduler } from '../../../src/domain/entities/wave-scheduler';
import { WaveConfiguration } from '../../../src/domain/value-objects/wave-configuration';
import { Position } from '../../../src/domain/value-objects/position';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';

// モックインターフェース
interface MockGameSessionService {
  isGameActive(): boolean;
  getGameTime(): number;
  getPlayerHealth(): number;
  reducePlayerHealth(damage: number): void;
}

interface MockUIFeedbackService {
  showWaveStartNotification(waveNumber: number): void;
  displayEnemy(enemy: any): void;
  updateEnemyPosition(enemyId: string, position: Position): void;
  updateEnemyHealth(enemyId: string, healthPercentage: number): void;
  removeEnemyDisplay(enemyId: string): void;
}

describe('StartWaveUseCase', () => {
  let useCase: StartWaveUseCase;
  let waveScheduler: WaveScheduler;
  let movementPath: MovementPath;
  let mockGameSessionService: MockGameSessionService;
  let mockUIFeedbackService: MockUIFeedbackService;

  beforeEach(() => {
    const waveConfiguration = new WaveConfiguration(10, 5, 1000);
    const gameStartTime = new Date();
    waveScheduler = new WaveScheduler(waveConfiguration, gameStartTime);

    const pathPoints = [
      new Position(0, 100),
      new Position(200, 100),
      new Position(400, 200),
      new Position(600, 200),
      new Position(800, 300)
    ];
    movementPath = new MovementPath(pathPoints);

    mockGameSessionService = {
      isGameActive: () => true,
      getGameTime: () => Date.now(),
      getPlayerHealth: () => 1000,
      reducePlayerHealth: (damage: number) => {}
    };

    mockUIFeedbackService = {
      showWaveStartNotification: (waveNumber: number) => {},
      displayEnemy: (enemy: any) => {},
      updateEnemyPosition: (enemyId: string, position: Position) => {},
      updateEnemyHealth: (enemyId: string, healthPercentage: number) => {},
      removeEnemyDisplay: (enemyId: string) => {}
    };

    useCase = new StartWaveUseCase(
      mockGameSessionService,
      mockUIFeedbackService
    );
  });

  describe('execute', () => {
    it('should start wave when conditions are met', async () => {
      waveScheduler.startWaveScheduling();
      
      let notificationShown = false;
      mockUIFeedbackService.showWaveStartNotification = (waveNumber: number) => {
        notificationShown = true;
        expect(waveNumber).toBe(1);
      };

      const result = await useCase.execute(waveScheduler, movementPath);

      expect(result.success).toBe(true);
      expect(result.waveNumber).toBe(1);
      expect(result.message).toBe('波1が開始されました');
      expect(notificationShown).toBe(true);
    });

    it('should fail when game is not active', async () => {
      mockGameSessionService.isGameActive = () => false;
      waveScheduler.startWaveScheduling();

      const result = await useCase.execute(waveScheduler, movementPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ゲームがアクティブではありません');
    });

    it('should fail when wave scheduler is not active', async () => {
      // Don't start wave scheduling

      const result = await useCase.execute(waveScheduler, movementPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('波スケジューラーがアクティブではありません');
    });

    it('should fail when cannot start next wave', async () => {
      waveScheduler.startWaveScheduling();
      
      // Start a wave first
      waveScheduler.startNextWave(movementPath);

      const result = await useCase.execute(waveScheduler, movementPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('次の波を開始できません');
    });

    it('should handle UI notification errors gracefully', async () => {
      waveScheduler.startWaveScheduling();
      
      mockUIFeedbackService.showWaveStartNotification = (waveNumber: number) => {
        throw new Error('UI Error');
      };

      const result = await useCase.execute(waveScheduler, movementPath);

      // Should still succeed even if UI notification fails
      expect(result.success).toBe(true);
      expect(result.waveNumber).toBe(1);
    });

    it('should return correct wave information', async () => {
      waveScheduler.startWaveScheduling();

      const result = await useCase.execute(waveScheduler, movementPath);

      expect(result.success).toBe(true);
      expect(result.waveNumber).toBe(1);
      expect(result.enemyCount).toBe(10); // Base enemy count
      expect(result.message).toBe('波1が開始されました');
    });

    it('should handle multiple wave starts correctly', async () => {
      waveScheduler.startWaveScheduling();

      // Start first wave
      const result1 = await useCase.execute(waveScheduler, movementPath);
      expect(result1.success).toBe(true);
      expect(result1.waveNumber).toBe(1);

      // Complete first wave
      const currentWave = waveScheduler.currentWave!;
      for (let i = 0; i < currentWave.totalEnemyCount; i++) {
        const enemy = currentWave.spawnNextEnemy(movementPath);
        if (enemy) {
          enemy.takeDamage(1000); // Kill enemy
        }
      }

      // Try to start second wave (should fail due to timing)
      const result2 = await useCase.execute(waveScheduler, movementPath);
      expect(result2.success).toBe(false);
    });
  });

  describe('validatePreconditions', () => {
    it('should validate all preconditions successfully', async () => {
      waveScheduler.startWaveScheduling();

      const result = await useCase.validatePreconditions(waveScheduler);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect inactive game session', async () => {
      mockGameSessionService.isGameActive = () => false;
      waveScheduler.startWaveScheduling();

      const result = await useCase.validatePreconditions(waveScheduler);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ゲームがアクティブではありません');
    });

    it('should detect inactive wave scheduler', async () => {
      // Don't start wave scheduling

      const result = await useCase.validatePreconditions(waveScheduler);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('波スケジューラーがアクティブではありません');
    });

    it('should detect when next wave cannot be started', async () => {
      waveScheduler.startWaveScheduling();
      waveScheduler.startNextWave(movementPath); // Start a wave

      const result = await useCase.validatePreconditions(waveScheduler);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('次の波を開始できません');
    });
  });

  describe('getWavePreview', () => {
    it('should return wave preview information', async () => {
      waveScheduler.startWaveScheduling();

      const preview = await useCase.getWavePreview(waveScheduler);

      expect(preview.nextWaveNumber).toBe(1);
      expect(preview.estimatedEnemyCount).toBe(10);
      expect(preview.canStart).toBe(true);
      expect(preview.timeUntilStart).toBeGreaterThanOrEqual(0);
    });

    it('should indicate when wave cannot start', async () => {
      // Don't start wave scheduling

      const preview = await useCase.getWavePreview(waveScheduler);

      expect(preview.canStart).toBe(false);
      expect(preview.reason).toBe('波スケジューラーがアクティブではありません');
    });

    it('should calculate time until next wave correctly', async () => {
      waveScheduler.startWaveScheduling();
      waveScheduler.startNextWave(movementPath); // Start first wave

      const preview = await useCase.getWavePreview(waveScheduler);

      expect(preview.nextWaveNumber).toBe(2);
      expect(preview.timeUntilStart).toBeGreaterThan(0);
      expect(preview.canStart).toBe(false);
    });
  });

  describe('forceStartWave', () => {
    it('should force start wave ignoring timing constraints', async () => {
      waveScheduler.startWaveScheduling();
      waveScheduler.startNextWave(movementPath); // Start first wave

      let notificationShown = false;
      mockUIFeedbackService.showWaveStartNotification = (waveNumber: number) => {
        notificationShown = true;
        expect(waveNumber).toBe(2);
      };

      const result = await useCase.forceStartWave(waveScheduler, movementPath);

      expect(result.success).toBe(true);
      expect(result.waveNumber).toBe(2);
      expect(notificationShown).toBe(true);
    });

    it('should fail when game is not active', async () => {
      mockGameSessionService.isGameActive = () => false;

      const result = await useCase.forceStartWave(waveScheduler, movementPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ゲームがアクティブではありません');
    });
  });
});