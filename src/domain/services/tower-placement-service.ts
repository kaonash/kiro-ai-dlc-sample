import { Tower } from "../entities/tower";
import type { Position } from "../value-objects/position";
import type { Card } from "../entities/card";

/**
 * タワー配置結果
 */
export interface PlacementResult {
  success: boolean;
  tower?: Tower;
  error?: string;
}

/**
 * タワー配置サービス
 */
export class TowerPlacementService {
  private readonly minDistanceBetweenTowers = 40;
  private readonly gameFieldBounds = {
    x: 0,
    y: 60,
    width: 800,
    height: 440
  };

  /**
   * タワーを配置
   */
  placeTower(card: Card, position: Position, existingTowers: Tower[]): PlacementResult {
    // 配置位置の検証
    const validationResult = this.validatePlacement(position, existingTowers);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.error
      };
    }

    // タワーを作成
    try {
      const tower = Tower.fromCard(card, position);
      return {
        success: true,
        tower
      };
    } catch (error) {
      return {
        success: false,
        error: `タワーの作成に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 配置位置の検証
   */
  validatePlacement(position: Position, existingTowers: Tower[]): { valid: boolean; error?: string } {
    // ゲームフィールド内かチェック
    if (!this.isWithinGameField(position)) {
      return {
        valid: false,
        error: "ゲームフィールド外には配置できません"
      };
    }

    // 他のタワーとの距離をチェック
    for (const tower of existingTowers) {
      const distance = position.distanceTo(tower.position);
      if (distance < this.minDistanceBetweenTowers) {
        return {
          valid: false,
          error: "他のタワーに近すぎます"
        };
      }
    }

    // 移動パス上かチェック（簡略化）
    if (this.isOnMovementPath(position)) {
      return {
        valid: false,
        error: "敵の移動経路上には配置できません"
      };
    }

    return { valid: true };
  }

  /**
   * ゲームフィールド内かチェック
   */
  private isWithinGameField(position: Position): boolean {
    return position.x >= this.gameFieldBounds.x &&
           position.x <= this.gameFieldBounds.x + this.gameFieldBounds.width &&
           position.y >= this.gameFieldBounds.y &&
           position.y <= this.gameFieldBounds.y + this.gameFieldBounds.height;
  }

  /**
   * 移動パス上かチェック（簡略化）
   */
  private isOnMovementPath(position: Position): boolean {
    // 簡略化：Y座標が280-320の範囲は移動パスとして扱う
    return position.y >= 280 && position.y <= 320;
  }

  /**
   * 配置可能な位置を取得
   */
  getValidPlacementPositions(existingTowers: Tower[]): Position[] {
    const positions: Position[] = [];
    const step = 40;

    for (let x = this.gameFieldBounds.x + step; x < this.gameFieldBounds.x + this.gameFieldBounds.width; x += step) {
      for (let y = this.gameFieldBounds.y + step; y < this.gameFieldBounds.y + this.gameFieldBounds.height; y += step) {
        const position = new Position(x, y);
        const validation = this.validatePlacement(position, existingTowers);
        if (validation.valid) {
          positions.push(position);
        }
      }
    }

    return positions;
  }
}