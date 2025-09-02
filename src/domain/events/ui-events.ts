import { Position } from "../value-objects/position";

/**
 * UIイベントの基底インターフェース
 */
export interface UIEvent {
  readonly type: string;
  readonly timestamp: number;
  readonly source?: string;
}

/**
 * カード関連イベント
 */
export interface CardSelectedEvent extends UIEvent {
  type: 'card-selected';
  cardIndex: number;
  cardId: string;
}

export interface CardDragStartEvent extends UIEvent {
  type: 'card-drag-start';
  cardIndex: number;
  cardId: string;
  startPosition: Position;
}

export interface CardDragEndEvent extends UIEvent {
  type: 'card-drag-end';
  cardIndex: number;
  cardId: string;
  endPosition: Position;
  isValidDrop: boolean;
}

export interface CardPlayedEvent extends UIEvent {
  type: 'card-played';
  cardId: string;
  position: Position;
  manaCost: number;
}

/**
 * タワー関連イベント
 */
export interface TowerSelectedEvent extends UIEvent {
  type: 'tower-selected';
  towerId: string;
  position: Position;
}

export interface TowerPlacedEvent extends UIEvent {
  type: 'tower-placed';
  towerId: string;
  position: Position;
  cardId: string;
}

export interface TowerUpgradedEvent extends UIEvent {
  type: 'tower-upgraded';
  towerId: string;
  newLevel: number;
  upgradeCost: number;
}

/**
 * 敵関連イベント
 */
export interface EnemySelectedEvent extends UIEvent {
  type: 'enemy-selected';
  enemyId: string;
  position: Position;
}

export interface EnemyHitEvent extends UIEvent {
  type: 'enemy-hit';
  enemyId: string;
  damage: number;
  position: Position;
  isCritical: boolean;
}

export interface EnemyDestroyedEvent extends UIEvent {
  type: 'enemy-destroyed';
  enemyId: string;
  position: Position;
  reward: number;
}

/**
 * ゲーム状態関連イベント
 */
export interface GameStartEvent extends UIEvent {
  type: 'game-start';
  difficulty: string;
}

export interface GamePauseEvent extends UIEvent {
  type: 'game-pause';
  isPaused: boolean;
}

export interface GameOverEvent extends UIEvent {
  type: 'game-over';
  isVictory: boolean;
  finalScore: number;
  survivedWaves: number;
}

export interface WaveStartEvent extends UIEvent {
  type: 'wave-start';
  waveNumber: number;
  enemyCount: number;
}

export interface WaveCompleteEvent extends UIEvent {
  type: 'wave-complete';
  waveNumber: number;
  bonus: number;
}

/**
 * UI操作関連イベント
 */
export interface ButtonClickEvent extends UIEvent {
  type: 'button-click';
  buttonId: string;
  position: Position;
}

export interface MenuOpenEvent extends UIEvent {
  type: 'menu-open';
  menuType: string;
}

export interface MenuCloseEvent extends UIEvent {
  type: 'menu-close';
  menuType: string;
}

export interface TooltipShowEvent extends UIEvent {
  type: 'tooltip-show';
  content: string;
  position: Position;
  targetId?: string;
}

export interface TooltipHideEvent extends UIEvent {
  type: 'tooltip-hide';
}

/**
 * 設定関連イベント
 */
export interface VolumeChangeEvent extends UIEvent {
  type: 'volume-change';
  volumeType: 'master' | 'bgm' | 'sfx';
  newVolume: number;
}

export interface SettingsChangeEvent extends UIEvent {
  type: 'settings-change';
  settingKey: string;
  newValue: any;
}

/**
 * 全UIイベントの統合型
 */
export type AllUIEvents = 
  | CardSelectedEvent
  | CardDragStartEvent
  | CardDragEndEvent
  | CardPlayedEvent
  | TowerSelectedEvent
  | TowerPlacedEvent
  | TowerUpgradedEvent
  | EnemySelectedEvent
  | EnemyHitEvent
  | EnemyDestroyedEvent
  | GameStartEvent
  | GamePauseEvent
  | GameOverEvent
  | WaveStartEvent
  | WaveCompleteEvent
  | ButtonClickEvent
  | MenuOpenEvent
  | MenuCloseEvent
  | TooltipShowEvent
  | TooltipHideEvent
  | VolumeChangeEvent
  | SettingsChangeEvent;

/**
 * イベントハンドラー型
 */
export type UIEventHandler<T extends UIEvent = UIEvent> = (event: T) => void;

/**
 * イベントファクトリー関数
 */
export class UIEventFactory {
  /**
   * カード選択イベントを作成
   */
  static createCardSelected(cardIndex: number, cardId: string, source?: string): CardSelectedEvent {
    return {
      type: 'card-selected',
      timestamp: performance.now(),
      source,
      cardIndex,
      cardId,
    };
  }

  /**
   * カードドラッグ開始イベントを作成
   */
  static createCardDragStart(
    cardIndex: number,
    cardId: string,
    startPosition: Position,
    source?: string
  ): CardDragStartEvent {
    return {
      type: 'card-drag-start',
      timestamp: performance.now(),
      source,
      cardIndex,
      cardId,
      startPosition,
    };
  }

  /**
   * カードドラッグ終了イベントを作成
   */
  static createCardDragEnd(
    cardIndex: number,
    cardId: string,
    endPosition: Position,
    isValidDrop: boolean,
    source?: string
  ): CardDragEndEvent {
    return {
      type: 'card-drag-end',
      timestamp: performance.now(),
      source,
      cardIndex,
      cardId,
      endPosition,
      isValidDrop,
    };
  }

  /**
   * カード使用イベントを作成
   */
  static createCardPlayed(
    cardId: string,
    position: Position,
    manaCost: number,
    source?: string
  ): CardPlayedEvent {
    return {
      type: 'card-played',
      timestamp: performance.now(),
      source,
      cardId,
      position,
      manaCost,
    };
  }

  /**
   * タワー設置イベントを作成
   */
  static createTowerPlaced(
    towerId: string,
    position: Position,
    cardId: string,
    source?: string
  ): TowerPlacedEvent {
    return {
      type: 'tower-placed',
      timestamp: performance.now(),
      source,
      towerId,
      position,
      cardId,
    };
  }

  /**
   * 敵ヒットイベントを作成
   */
  static createEnemyHit(
    enemyId: string,
    damage: number,
    position: Position,
    isCritical: boolean,
    source?: string
  ): EnemyHitEvent {
    return {
      type: 'enemy-hit',
      timestamp: performance.now(),
      source,
      enemyId,
      damage,
      position,
      isCritical,
    };
  }

  /**
   * 敵撃破イベントを作成
   */
  static createEnemyDestroyed(
    enemyId: string,
    position: Position,
    reward: number,
    source?: string
  ): EnemyDestroyedEvent {
    return {
      type: 'enemy-destroyed',
      timestamp: performance.now(),
      source,
      enemyId,
      position,
      reward,
    };
  }

  /**
   * ゲーム開始イベントを作成
   */
  static createGameStart(difficulty: string, source?: string): GameStartEvent {
    return {
      type: 'game-start',
      timestamp: performance.now(),
      source,
      difficulty,
    };
  }

  /**
   * ゲームオーバーイベントを作成
   */
  static createGameOver(
    isVictory: boolean,
    finalScore: number,
    survivedWaves: number,
    source?: string
  ): GameOverEvent {
    return {
      type: 'game-over',
      timestamp: performance.now(),
      source,
      isVictory,
      finalScore,
      survivedWaves,
    };
  }

  /**
   * ツールチップ表示イベントを作成
   */
  static createTooltipShow(
    content: string,
    position: Position,
    targetId?: string,
    source?: string
  ): TooltipShowEvent {
    return {
      type: 'tooltip-show',
      timestamp: performance.now(),
      source,
      content,
      position,
      targetId,
    };
  }

  /**
   * ツールチップ非表示イベントを作成
   */
  static createTooltipHide(source?: string): TooltipHideEvent {
    return {
      type: 'tooltip-hide',
      timestamp: performance.now(),
      source,
    };
  }

  /**
   * ボリューム変更イベントを作成
   */
  static createVolumeChange(
    volumeType: 'master' | 'bgm' | 'sfx',
    newVolume: number,
    source?: string
  ): VolumeChangeEvent {
    return {
      type: 'volume-change',
      timestamp: performance.now(),
      source,
      volumeType,
      newVolume,
    };
  }
}