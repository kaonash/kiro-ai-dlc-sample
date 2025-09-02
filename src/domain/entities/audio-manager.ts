/**
 * 音響ファイル情報
 */
export interface AudioAsset {
  id: string;
  url: string;
  volume: number;
  loop: boolean;
  preload: boolean;
}

/**
 * 音響再生設定
 */
export interface PlaybackConfig {
  volume?: number;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  delay?: number;
}

/**
 * 音響管理エンティティ
 * BGM・効果音の読み込み・再生・制御を管理
 */
export class AudioManager {
  private readonly audioContext: AudioContext | null = null;
  private readonly audioBuffers = new Map<string, AudioBuffer>();
  private readonly audioSources = new Map<string, AudioBufferSourceNode>();
  private readonly gainNodes = new Map<string, GainNode>();
  
  private _masterVolume = 1.0;
  private _bgmVolume = 0.7;
  private _sfxVolume = 0.8;
  private _isMuted = false;
  private _isInitialized = false;

  // プリセット音響ファイル
  private readonly presetAudio: Record<string, AudioAsset> = {
    // BGM
    mainTheme: {
      id: 'main-theme',
      url: '/audio/bgm/main-theme.mp3',
      volume: 0.6,
      loop: true,
      preload: true,
    },
    battleTheme: {
      id: 'battle-theme',
      url: '/audio/bgm/battle-theme.mp3',
      volume: 0.7,
      loop: true,
      preload: true,
    },
    
    // 効果音
    cardPlay: {
      id: 'card-play',
      url: '/audio/sfx/card-play.wav',
      volume: 0.8,
      loop: false,
      preload: true,
    },
    towerPlace: {
      id: 'tower-place',
      url: '/audio/sfx/tower-place.wav',
      volume: 0.9,
      loop: false,
      preload: true,
    },
    enemyHit: {
      id: 'enemy-hit',
      url: '/audio/sfx/enemy-hit.wav',
      volume: 0.7,
      loop: false,
      preload: true,
    },
    enemyDestroy: {
      id: 'enemy-destroy',
      url: '/audio/sfx/enemy-destroy.wav',
      volume: 0.8,
      loop: false,
      preload: true,
    },
    waveStart: {
      id: 'wave-start',
      url: '/audio/sfx/wave-start.wav',
      volume: 0.9,
      loop: false,
      preload: true,
    },
    gameOver: {
      id: 'game-over',
      url: '/audio/sfx/game-over.wav',
      volume: 0.8,
      loop: false,
      preload: true,
    },
    victory: {
      id: 'victory',
      url: '/audio/sfx/victory.wav',
      volume: 0.9,
      loop: false,
      preload: true,
    },
  };

  constructor() {
    // Web Audio APIが利用可能かチェック
    if (typeof AudioContext !== 'undefined') {
      try {
        this.audioContext = new AudioContext();
      } catch (error) {
        console.warn('AudioContext creation failed:', error);
      }
    }
  }

  /**
   * 初期化状態
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * マスターボリューム
   */
  get masterVolume(): number {
    return this._masterVolume;
  }

  set masterVolume(volume: number) {
    this._masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  /**
   * BGMボリューム
   */
  get bgmVolume(): number {
    return this._bgmVolume;
  }

  set bgmVolume(volume: number) {
    this._bgmVolume = Math.max(0, Math.min(1, volume));
    this.updateBgmVolumes();
  }

  /**
   * 効果音ボリューム
   */
  get sfxVolume(): number {
    return this._sfxVolume;
  }

  set sfxVolume(volume: number) {
    this._sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateSfxVolumes();
  }

  /**
   * ミュート状態
   */
  get isMuted(): boolean {
    return this._isMuted;
  }

  set isMuted(muted: boolean) {
    this._isMuted = muted;
    this.updateAllVolumes();
  }

  /**
   * 音響システムを初期化
   */
  async initialize(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext is not available');
    }

    try {
      // AudioContextを再開（ユーザーインタラクション後に必要）
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // プリセット音響ファイルを読み込み
      await this.loadPresetAudio();

      this._isInitialized = true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      throw error;
    }
  }

  /**
   * 音響ファイルを読み込み
   */
  async loadAudio(asset: AudioAsset): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext is not initialized');
    }

    try {
      const response = await fetch(asset.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.audioBuffers.set(asset.id, audioBuffer);
    } catch (error) {
      console.error(`Failed to load audio: ${asset.id}`, error);
      // 開発環境では音響ファイルが存在しない可能性があるため、エラーを投げない
    }
  }

  /**
   * BGMを再生
   */
  playBgm(audioId: string, config: PlaybackConfig = {}): void {
    if (!this.isInitialized || !this.audioContext) return;

    // 既存のBGMを停止
    this.stopBgm();

    const audioBuffer = this.audioBuffers.get(audioId);
    if (!audioBuffer) {
      console.warn(`Audio not found: ${audioId}`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = audioBuffer;
    source.loop = config.loop ?? true;
    
    // ボリューム設定
    const volume = (config.volume ?? this.presetAudio[audioId]?.volume ?? 1.0) * 
                   this._bgmVolume * this._masterVolume;
    gainNode.gain.value = this._isMuted ? 0 : volume;

    // ノード接続
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // フェードイン
    if (config.fadeIn) {
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        this._isMuted ? 0 : volume,
        this.audioContext.currentTime + config.fadeIn
      );
    }

    // 再生開始
    const delay = config.delay ?? 0;
    source.start(this.audioContext.currentTime + delay);

    // 管理用に保存
    this.audioSources.set(`bgm-${audioId}`, source);
    this.gainNodes.set(`bgm-${audioId}`, gainNode);
  }

  /**
   * 効果音を再生
   */
  playSfx(audioId: string, config: PlaybackConfig = {}): void {
    if (!this.isInitialized || !this.audioContext) return;

    const audioBuffer = this.audioBuffers.get(audioId);
    if (!audioBuffer) {
      console.warn(`Audio not found: ${audioId}`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = audioBuffer;
    source.loop = config.loop ?? false;

    // ボリューム設定
    const volume = (config.volume ?? this.presetAudio[audioId]?.volume ?? 1.0) * 
                   this._sfxVolume * this._masterVolume;
    gainNode.gain.value = this._isMuted ? 0 : volume;

    // ノード接続
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 再生開始
    const delay = config.delay ?? 0;
    source.start(this.audioContext.currentTime + delay);

    // 再生終了後にクリーンアップ
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  }

  /**
   * BGMを停止
   */
  stopBgm(fadeOut?: number): void {
    if (!this.audioContext) return;

    for (const [key, source] of this.audioSources.entries()) {
      if (key.startsWith('bgm-')) {
        if (fadeOut) {
          const gainNode = this.gainNodes.get(key);
          if (gainNode) {
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeOut);
            setTimeout(() => {
              source.stop();
              this.cleanupAudioSource(key);
            }, fadeOut * 1000);
          }
        } else {
          source.stop();
          this.cleanupAudioSource(key);
        }
      }
    }
  }

  /**
   * 全ての音響を停止
   */
  stopAll(): void {
    if (!this.audioContext) return;

    for (const [key, source] of this.audioSources.entries()) {
      source.stop();
      this.cleanupAudioSource(key);
    }
  }

  /**
   * 音響ファイルが読み込まれているかチェック
   */
  isAudioLoaded(audioId: string): boolean {
    return this.audioBuffers.has(audioId);
  }

  /**
   * 読み込み済み音響ファイル一覧を取得
   */
  getLoadedAudioIds(): string[] {
    return Array.from(this.audioBuffers.keys());
  }

  /**
   * プリセット音響設定を取得
   */
  getPresetAudio(audioId: string): AudioAsset | undefined {
    return this.presetAudio[audioId];
  }

  /**
   * AudioContextの状態を取得
   */
  getAudioContextState(): AudioContextState | null {
    return this.audioContext?.state ?? null;
  }

  /**
   * プリセット音響ファイルを読み込み
   */
  private async loadPresetAudio(): Promise<void> {
    const loadPromises = Object.values(this.presetAudio)
      .filter(asset => asset.preload)
      .map(asset => this.loadAudio(asset));

    await Promise.allSettled(loadPromises);
  }

  /**
   * 全ボリュームを更新
   */
  private updateAllVolumes(): void {
    this.updateBgmVolumes();
    this.updateSfxVolumes();
  }

  /**
   * BGMボリュームを更新
   */
  private updateBgmVolumes(): void {
    for (const [key, gainNode] of this.gainNodes.entries()) {
      if (key.startsWith('bgm-')) {
        const audioId = key.replace('bgm-', '');
        const baseVolume = this.presetAudio[audioId]?.volume ?? 1.0;
        const volume = baseVolume * this._bgmVolume * this._masterVolume;
        gainNode.gain.value = this._isMuted ? 0 : volume;
      }
    }
  }

  /**
   * 効果音ボリュームを更新
   */
  private updateSfxVolumes(): void {
    // 効果音は通常短時間なので、再生中のもののみ更新
    // 新しい効果音は再生時に適切なボリュームが設定される
  }

  /**
   * 音響ソースをクリーンアップ
   */
  private cleanupAudioSource(key: string): void {
    const source = this.audioSources.get(key);
    const gainNode = this.gainNodes.get(key);

    if (source) {
      source.disconnect();
      this.audioSources.delete(key);
    }

    if (gainNode) {
      gainNode.disconnect();
      this.gainNodes.delete(key);
    }
  }
}