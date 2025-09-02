import { AudioManager, PlaybackConfig } from "../../domain/entities/audio-manager";

/**
 * 音響再生ユースケース
 * ゲーム内の音響再生を統一的に管理
 */
export class PlayAudioUseCase {
  private readonly audioManager: AudioManager;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  /**
   * ゲーム開始時の音響を再生
   */
  async playGameStart(): Promise<void> {
    if (!this.audioManager.isInitialized) {
      await this.audioManager.initialize();
    }

    // メインテーマBGMを再生
    this.audioManager.playBgm('mainTheme', {
      fadeIn: 2.0,
    });
  }

  /**
   * バトル開始時の音響を再生
   */
  playBattleStart(): void {
    // バトルテーマBGMに切り替え
    this.audioManager.stopBgm(1.0); // 1秒でフェードアウト
    
    setTimeout(() => {
      this.audioManager.playBgm('battleTheme', {
        fadeIn: 1.5,
      });
    }, 1000);

    // ウェーブ開始効果音
    this.audioManager.playSfx('waveStart');
  }

  /**
   * カード使用時の音響を再生
   */
  playCardUsed(): void {
    this.audioManager.playSfx('cardPlay', {
      volume: 0.9,
    });
  }

  /**
   * タワー設置時の音響を再生
   */
  playTowerPlaced(): void {
    this.audioManager.playSfx('towerPlace', {
      volume: 1.0,
    });
  }

  /**
   * 敵ヒット時の音響を再生
   */
  playEnemyHit(): void {
    this.audioManager.playSfx('enemyHit', {
      volume: 0.8,
    });
  }

  /**
   * 敵撃破時の音響を再生
   */
  playEnemyDestroyed(): void {
    this.audioManager.playSfx('enemyDestroy', {
      volume: 0.9,
    });
  }

  /**
   * ゲームオーバー時の音響を再生
   */
  playGameOver(): void {
    // BGMを停止
    this.audioManager.stopBgm(2.0);

    // ゲームオーバー効果音を遅延再生
    this.audioManager.playSfx('gameOver', {
      delay: 1.0,
      volume: 1.0,
    });
  }

  /**
   * 勝利時の音響を再生
   */
  playVictory(): void {
    // BGMを停止
    this.audioManager.stopBgm(1.5);

    // 勝利効果音を遅延再生
    this.audioManager.playSfx('victory', {
      delay: 0.5,
      volume: 1.0,
    });
  }

  /**
   * UI操作音を再生（汎用）
   */
  playUISound(soundId: string, config?: PlaybackConfig): void {
    this.audioManager.playSfx(soundId, config);
  }

  /**
   * BGMを変更
   */
  changeBgm(bgmId: string, config?: PlaybackConfig): void {
    const fadeOutTime = 1.0;
    this.audioManager.stopBgm(fadeOutTime);

    setTimeout(() => {
      this.audioManager.playBgm(bgmId, {
        fadeIn: 1.0,
        ...config,
      });
    }, fadeOutTime * 1000);
  }

  /**
   * 全音響を停止
   */
  stopAllAudio(): void {
    this.audioManager.stopAll();
  }

  /**
   * マスターボリュームを設定
   */
  setMasterVolume(volume: number): void {
    this.audioManager.masterVolume = volume;
  }

  /**
   * BGMボリュームを設定
   */
  setBgmVolume(volume: number): void {
    this.audioManager.bgmVolume = volume;
  }

  /**
   * 効果音ボリュームを設定
   */
  setSfxVolume(volume: number): void {
    this.audioManager.sfxVolume = volume;
  }

  /**
   * ミュート状態を切り替え
   */
  toggleMute(): boolean {
    this.audioManager.isMuted = !this.audioManager.isMuted;
    return this.audioManager.isMuted;
  }

  /**
   * 音響システムの状態を取得
   */
  getAudioStatus(): {
    isInitialized: boolean;
    isMuted: boolean;
    masterVolume: number;
    bgmVolume: number;
    sfxVolume: number;
    contextState: AudioContextState | null;
  } {
    return {
      isInitialized: this.audioManager.isInitialized,
      isMuted: this.audioManager.isMuted,
      masterVolume: this.audioManager.masterVolume,
      bgmVolume: this.audioManager.bgmVolume,
      sfxVolume: this.audioManager.sfxVolume,
      contextState: this.audioManager.getAudioContextState(),
    };
  }
}