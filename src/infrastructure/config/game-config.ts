import gameConfigData from '../../../config/game-config.json';

/**
 * ゲーム設定管理クラス
 * game-config.jsonから設定を読み込み、アプリケーション全体で使用可能にする
 */
export class GameConfig {
    private static instance: GameConfig;
    private config: typeof gameConfigData;

    private constructor() {
        this.config = gameConfigData;
    }

    /**
     * シングルトンインスタンスを取得
     */
    static getInstance(): GameConfig {
        if (!GameConfig.instance) {
            GameConfig.instance = new GameConfig();
        }
        return GameConfig.instance;
    }

    /**
     * デバッグ設定を取得
     */
    get debug() {
        return {
            enabled: this.config.debug.enabled,
            logLevel: this.config.debug.logLevel,
            showCardIds: this.config.debug.showCardIds,
            mockData: this.config.debug.mockData,
        };
    }

    /**
     * ゲーム基本設定を取得
     */
    get game() {
        return {
            name: this.config.game.name,
            version: this.config.game.version,
            maxPlayTime: this.config.game.maxPlayTime,
            description: this.config.game.description,
        };
    }

    /**
     * 手札設定を取得
     */
    get hand() {
        return {
            maxSize: this.config.hand.maxSize,
            initialSize: this.config.hand.initialSize,
        };
    }

    /**
     * マナ設定を取得
     */
    get mana() {
        return {
            initialMana: this.config.mana.initialMana,
            maxMana: this.config.mana.maxMana,
            regenAmount: this.config.mana.regenAmount,
            regenInterval: this.config.mana.regenInterval,
        };
    }

    /**
     * UI設定を取得
     */
    get ui() {
        return {
            animationDuration: this.config.ui.animationDuration,
            cardDisplayDelay: this.config.ui.cardDisplayDelay,
            feedbackDuration: this.config.ui.feedbackDuration,
            layout: this.config.ui.layout,
            header: this.config.ui.header,
            hand: this.config.ui.hand,
        };
    }

    /**
     * 全設定を取得（デバッグ用）
     */
    getAllConfig() {
        return this.config;
    }
}