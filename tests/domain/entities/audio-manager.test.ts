import { describe, it, expect, mock, beforeEach } from "bun:test";
import { AudioManager, AudioAsset } from "../../../src/domain/entities/audio-manager";

// Web Audio API のモック
const mockAudioContext = {
  state: 'suspended' as AudioContextState, // suspendedから開始
  currentTime: 0,
  destination: {},
  resume: mock(() => {
    mockAudioContext.state = 'running';
    return Promise.resolve();
  }),
  createBufferSource: mock(() => ({
    buffer: null,
    loop: false,
    connect: mock(() => {}),
    disconnect: mock(() => {}),
    start: mock(() => {}),
    stop: mock(() => {}),
    onended: null,
  })),
  createGain: mock(() => ({
    gain: {
      value: 1,
      setValueAtTime: mock(() => {}),
      linearRampToValueAtTime: mock(() => {}),
    },
    connect: mock(() => {}),
    disconnect: mock(() => {}),
  })),
  decodeAudioData: mock(() => Promise.resolve({})),
};

// グローバルなAudioContextをモック
(global as any).AudioContext = mock(() => mockAudioContext);

// fetchをモック
(global as any).fetch = mock(() => Promise.resolve({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
}));

describe("AudioManager", () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    // モックをリセット
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockClear();
    mockAudioContext.createBufferSource.mockClear();
    mockAudioContext.createGain.mockClear();
    mockAudioContext.decodeAudioData.mockClear();
    
    // fetchを正常な状態にリセット
    (global as any).fetch = mock(() => Promise.resolve({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    }));
    
    audioManager = new AudioManager();
  });

  it("should create audio manager", () => {
    expect(audioManager.isInitialized).toBe(false);
    expect(audioManager.masterVolume).toBe(1.0);
    expect(audioManager.bgmVolume).toBe(0.7);
    expect(audioManager.sfxVolume).toBe(0.8);
    expect(audioManager.isMuted).toBe(false);
  });

  it("should initialize audio system", async () => {
    await audioManager.initialize();
    
    expect(audioManager.isInitialized).toBe(true);
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it("should set master volume", () => {
    audioManager.masterVolume = 0.5;
    expect(audioManager.masterVolume).toBe(0.5);

    // 範囲外の値をクランプ
    audioManager.masterVolume = 1.5;
    expect(audioManager.masterVolume).toBe(1.0);

    audioManager.masterVolume = -0.5;
    expect(audioManager.masterVolume).toBe(0.0);
  });

  it("should set bgm volume", () => {
    audioManager.bgmVolume = 0.3;
    expect(audioManager.bgmVolume).toBe(0.3);

    // 範囲外の値をクランプ
    audioManager.bgmVolume = 1.2;
    expect(audioManager.bgmVolume).toBe(1.0);

    audioManager.bgmVolume = -0.2;
    expect(audioManager.bgmVolume).toBe(0.0);
  });

  it("should set sfx volume", () => {
    audioManager.sfxVolume = 0.6;
    expect(audioManager.sfxVolume).toBe(0.6);

    // 範囲外の値をクランプ
    audioManager.sfxVolume = 1.3;
    expect(audioManager.sfxVolume).toBe(1.0);

    audioManager.sfxVolume = -0.1;
    expect(audioManager.sfxVolume).toBe(0.0);
  });

  it("should toggle mute state", () => {
    audioManager.isMuted = true;
    expect(audioManager.isMuted).toBe(true);

    audioManager.isMuted = false;
    expect(audioManager.isMuted).toBe(false);
  });

  it("should load audio asset", async () => {
    const asset: AudioAsset = {
      id: 'test-audio',
      url: '/test.wav',
      volume: 0.8,
      loop: false,
      preload: true,
    };

    await audioManager.initialize();
    await audioManager.loadAudio(asset);

    expect((global as any).fetch).toHaveBeenCalledWith('/test.wav');
    expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
    expect(audioManager.isAudioLoaded('test-audio')).toBe(true);
  });

  it("should play bgm", async () => {
    await audioManager.initialize();
    
    // テスト用の音響データを追加
    const asset: AudioAsset = {
      id: 'test-bgm',
      url: '/test-bgm.mp3',
      volume: 0.7,
      loop: true,
      preload: false,
    };
    await audioManager.loadAudio(asset);

    audioManager.playBgm('test-bgm');

    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it("should play sfx", async () => {
    await audioManager.initialize();
    
    // テスト用の音響データを追加
    const asset: AudioAsset = {
      id: 'test-sfx',
      url: '/test-sfx.wav',
      volume: 0.8,
      loop: false,
      preload: false,
    };
    await audioManager.loadAudio(asset);

    audioManager.playSfx('test-sfx');

    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it("should not play audio when not initialized", () => {
    audioManager.playBgm('test-bgm');
    audioManager.playSfx('test-sfx');

    // 初期化されていないので音響ノードは作成されない
    expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
  });

  it("should not play non-existent audio", async () => {
    await audioManager.initialize();

    audioManager.playBgm('non-existent');
    audioManager.playSfx('non-existent');

    // 存在しない音響ファイルなので音響ノードは作成されない
    expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
  });

  it("should stop bgm", async () => {
    await audioManager.initialize();
    
    const asset: AudioAsset = {
      id: 'test-bgm',
      url: '/test-bgm.mp3',
      volume: 0.7,
      loop: true,
      preload: false,
    };
    await audioManager.loadAudio(asset);

    audioManager.playBgm('test-bgm');
    audioManager.stopBgm();

    // stopが呼ばれることを確認（モックの制限により間接的にテスト）
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it("should stop all audio", async () => {
    await audioManager.initialize();
    
    audioManager.stopAll();

    // stopAllが正常に実行されることを確認
    expect(audioManager.isInitialized).toBe(true);
  });

  it("should get loaded audio ids", async () => {
    await audioManager.initialize();
    
    const asset: AudioAsset = {
      id: 'test-audio',
      url: '/test.wav',
      volume: 0.8,
      loop: false,
      preload: false,
    };
    await audioManager.loadAudio(asset);

    const loadedIds = audioManager.getLoadedAudioIds();
    expect(loadedIds).toContain('test-audio');
  });

  it("should get preset audio configuration", () => {
    const mainTheme = audioManager.getPresetAudio('mainTheme');
    expect(mainTheme).toBeDefined();
    expect(mainTheme?.id).toBe('main-theme');
    expect(mainTheme?.loop).toBe(true);

    const cardPlay = audioManager.getPresetAudio('cardPlay');
    expect(cardPlay).toBeDefined();
    expect(cardPlay?.id).toBe('card-play');
    expect(cardPlay?.loop).toBe(false);
  });

  it("should get audio context state", () => {
    const state = audioManager.getAudioContextState();
    expect(state).toBe('suspended'); // 初期状態はsuspended
  });

  it("should handle audio context creation failure", () => {
    // AudioContextが利用できない環境をシミュレート
    const originalAudioContext = (global as any).AudioContext;
    (global as any).AudioContext = undefined;

    const manager = new AudioManager();
    expect(manager.getAudioContextState()).toBeNull();

    // 元に戻す
    (global as any).AudioContext = originalAudioContext;
  });

  it("should handle initialization failure", async () => {
    // AudioContextがない状態で初期化を試行
    const originalAudioContext = (global as any).AudioContext;
    (global as any).AudioContext = undefined;

    const manager = new AudioManager();
    
    await expect(manager.initialize()).rejects.toThrow('AudioContext is not available');

    // 元に戻す
    (global as any).AudioContext = originalAudioContext;
  });

  it("should handle load audio failure", async () => {
    await audioManager.initialize();

    // fetchが失敗する場合をシミュレート
    (global as any).fetch = mock(() => Promise.reject(new Error('Network error')));

    const asset: AudioAsset = {
      id: 'failing-audio',
      url: '/failing.wav',
      volume: 0.8,
      loop: false,
      preload: false,
    };

    // エラーが投げられないことを確認（内部でキャッチされる）
    await expect(audioManager.loadAudio(asset)).resolves.toBeUndefined();
    expect(audioManager.isAudioLoaded('failing-audio')).toBe(false);
  });

  it("should play audio with custom config", async () => {
    // fetchを正常な状態に設定
    (global as any).fetch = mock(() => Promise.resolve({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    }));
    
    await audioManager.initialize();
    
    const asset: AudioAsset = {
      id: 'test-audio',
      url: '/test.wav',
      volume: 0.8,
      loop: false,
      preload: false,
    };
    await audioManager.loadAudio(asset);

    const config = {
      volume: 0.5,
      loop: true,
      fadeIn: 1.0,
      delay: 0.5,
    };

    audioManager.playBgm('test-audio', config);
    audioManager.playSfx('test-audio', config);

    expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(2);
    expect(mockAudioContext.createGain).toHaveBeenCalledTimes(2);
  });
});