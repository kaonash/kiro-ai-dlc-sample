import { Rectangle } from "../../domain/value-objects/rectangle";
import { Position } from "../../domain/value-objects/position";
import { Color } from "../../domain/value-objects/color";
import { RenderingService, TextStyle } from "../../domain/services/rendering-service";
import { Enemy, Tower } from "../../domain/entities/ui-manager";
import { GameConfig } from "../config/game-config";

/**
 * 戦場UI実装
 * 敵、タワー、パスの表示
 */
export class GameFieldUI {
  public readonly bounds: Rectangle;
  private readonly renderingService: RenderingService;
  private readonly config: GameConfig;

  private _enemies: Enemy[] = [];
  private _towers: Tower[] = [];
  private _selectedTower: Tower | null = null;
  private _showRange = false;
  private _movementPath: Position[] = [];

  // タワーサイズとレンジの定義
  private readonly towerSize = 24;
  private readonly enemySize = 12;
  private readonly towerRanges = new Map([
    ["archer", 80],
    ["cannon", 60],
    ["magic", 100],
    ["ice", 70],
    ["fire", 75],
  ]);

  constructor(bounds: Rectangle, renderingService: RenderingService) {
    this.bounds = bounds;
    this.renderingService = renderingService;
    this.config = GameConfig.getInstance();
  }

  /**
   * 現在の敵リスト
   */
  get enemies(): Enemy[] {
    return [...this._enemies];
  }

  /**
   * 現在のタワーリスト
   */
  get towers(): Tower[] {
    return [...this._towers];
  }

  /**
   * 選択中のタワー
   */
  get selectedTower(): Tower | null {
    return this._selectedTower;
  }

  /**
   * レンジ表示状態
   */
  get showRange(): boolean {
    return this._showRange;
  }

  /**
   * 敵情報を更新
   */
  updateEnemies(enemies: Enemy[]): void {
    this._enemies = [...enemies];
  }

  /**
   * タワー情報を更新
   */
  updateTowers(towers: Tower[]): void {
    this._towers = [...towers];
  }

  /**
   * 移動パス情報を更新
   */
  updateMovementPath(pathPoints: Position[]): void {
    this._movementPath = [...pathPoints];
  }

  /**
   * タワーレンジを表示
   */
  showTowerRange(tower: Tower): void {
    this._selectedTower = tower;
    this._showRange = true;
  }

  /**
   * タワーレンジを非表示
   */
  hideTowerRange(): void {
    this._selectedTower = null;
    this._showRange = false;
  }

  /**
   * 戦場を描画
   */
  render(context: CanvasRenderingContext2D, deltaTime: number): void {
    // 背景を描画
    this.renderBackground(context);

    // パスを描画（簡易版）
    this.renderPath(context);

    // タワーレンジを描画（タワーより下に）
    if (this._showRange && this._selectedTower) {
      this.renderTowerRange(context, this._selectedTower);
    }

    // タワーを描画
    this.renderTowers(context);

    // 敵を描画
    this.renderEnemies(context);
  }

  /**
   * 指定位置のタワーを取得
   */
  getTowerAtPosition(position: Position): Tower | null {
    for (const tower of this._towers) {
      const distance = position.distance(tower.position);
      if (distance <= this.towerSize / 2) {
        return tower;
      }
    }
    return null;
  }

  /**
   * 指定位置の敵を取得
   */
  getEnemyAtPosition(position: Position): Enemy | null {
    for (const enemy of this._enemies) {
      const distance = position.distance(enemy.position);
      if (distance <= this.enemySize / 2) {
        return enemy;
      }
    }
    return null;
  }

  /**
   * タワー配置可能位置かチェック
   */
  isValidTowerPosition(position: Position): boolean {
    // 境界内かチェック
    if (!this.bounds.contains(position)) {
      return false;
    }

    // 既存タワーと重複しないかチェック
    for (const tower of this._towers) {
      const distance = position.distance(tower.position);
      if (distance < this.towerSize) {
        return false;
      }
    }

    // パス上でないかチェック（簡易版）
    if (this.isOnPath(position)) {
      return false;
    }

    return true;
  }

  /**
   * タワーの射程を取得
   */
  getTowerRange(towerType: string): number {
    return this.towerRanges.get(towerType) || 50;
  }

  /**
   * 背景を描画
   */
  private renderBackground(context: CanvasRenderingContext2D): void {
    const backgroundColor = new Color(50, 80, 50, 1); // 緑っぽい戦場
    
    this.renderingService.renderRectangle(
      context,
      this.bounds,
      backgroundColor
    );
  }

  /**
   * パスを描画（簡易版）
   */
  private renderPath(context: CanvasRenderingContext2D): void {
    const margin = this.config.ui.layout.margin;

    // 実際の移動パスがある場合はそれを使用、なければデフォルト位置
    if (this._movementPath.length >= 2) {
      const actualStartPos = this._movementPath[0];
      const actualEndPos = this._movementPath[this._movementPath.length - 1];
      this.renderPathLabels(context, actualStartPos.x, actualEndPos.x, actualStartPos.y, actualEndPos.y);
    } else {
      // フォールバック：デフォルト位置（茶色の直線は描画しない）
      const startX = this.bounds.x + margin;
      const endX = this.bounds.x + this.bounds.width - margin;
      const centerY = this.bounds.y + this.bounds.height / 2;
      this.renderPathLabels(context, startX, endX, centerY, centerY);
    }
  }

  /**
   * START/GOALラベルを描画
   */
  private renderPathLabels(context: CanvasRenderingContext2D, startX: number, endX: number, startY: number, endY: number): void {
    const labelStyle: TextStyle = {
      font: "14px Arial",
      color: Color.white(),
      align: "center",
      baseline: "middle",
    };

    const margin = this.config.ui.layout.margin;
    const labelOffset = 30; // ラベルをマーカーから離す距離

    // STARTラベル（画面内に収まるように調整）
    const startLabelX = Math.max(margin + 25, startX); // 左端から最低25px離す
    const startPosition = new Position(startLabelX, startY - labelOffset);
    this.renderingService.renderText(context, "START", startPosition, labelStyle);

    // GOALラベル（画面内に収まるように調整）
    const goalLabelX = Math.min(this.bounds.x + this.bounds.width - margin - 25, endX); // 右端から最低25px離す
    const goalPosition = new Position(goalLabelX, endY - labelOffset);
    this.renderingService.renderText(context, "GOAL", goalPosition, labelStyle);

    // START/GOALマーカー（実際のパス位置に配置）
    const markerColor = new Color(255, 255, 100, 1);
    
    // STARTマーカー（緑の円）
    this.renderingService.renderCircle(
      context,
      new Position(startX, startY),
      8,
      new Color(100, 255, 100, 1),
      markerColor,
      2
    );

    // GOALマーカー（赤の円）
    this.renderingService.renderCircle(
      context,
      new Position(endX, endY),
      8,
      new Color(255, 100, 100, 1),
      markerColor,
      2
    );
  }

  /**
   * タワーを描画
   */
  private renderTowers(context: CanvasRenderingContext2D): void {
    for (const tower of this._towers) {
      this.renderTower(context, tower);
    }
  }

  /**
   * 個別のタワーを描画
   */
  private renderTower(context: CanvasRenderingContext2D, tower: Tower): void {
    const towerBounds = new Rectangle(
      tower.position.x - this.towerSize / 2,
      tower.position.y - this.towerSize / 2,
      this.towerSize,
      this.towerSize
    );

    const towerColor = this.getTowerColor(tower.type);
    const borderColor = tower === this._selectedTower 
      ? new Color(255, 255, 100, 1)
      : new Color(0, 0, 0, 1);

    this.renderingService.renderRectangle(
      context,
      towerBounds,
      towerColor,
      borderColor,
      2
    );

    // タワータイプのラベル
    const labelStyle: TextStyle = {
      font: "10px Arial",
      color: Color.white(),
      align: "center",
      baseline: "middle",
    };

    this.renderingService.renderText(
      context,
      tower.type.charAt(0).toUpperCase(),
      tower.position,
      labelStyle
    );
  }

  /**
   * 敵を描画
   */
  private renderEnemies(context: CanvasRenderingContext2D): void {
    for (const enemy of this._enemies) {
      this.renderEnemy(context, enemy);
    }
  }

  /**
   * 個別の敵を描画
   */
  private renderEnemy(context: CanvasRenderingContext2D, enemy: Enemy): void {
    const enemyColor = new Color(200, 50, 50, 1); // 赤い敵
    const borderColor = new Color(100, 0, 0, 1);

    this.renderingService.renderCircle(
      context,
      enemy.position,
      this.enemySize / 2,
      enemyColor,
      borderColor,
      1
    );

    // 体力バー（簡易版）
    if (enemy.health < 100) {
      const healthBarWidth = 20;
      const healthBarHeight = 4;
      const healthBarBounds = new Rectangle(
        enemy.position.x - healthBarWidth / 2,
        enemy.position.y - this.enemySize / 2 - 8,
        healthBarWidth,
        healthBarHeight
      );

      this.renderingService.renderHealthBar(
        context,
        enemy.health,
        100,
        healthBarBounds
      );
    }
  }

  /**
   * タワーレンジを描画
   */
  private renderTowerRange(context: CanvasRenderingContext2D, tower: Tower): void {
    const range = this.getTowerRange(tower.type);
    const rangeColor = new Color(255, 255, 255, 0.2);
    const borderColor = new Color(255, 255, 255, 0.5);

    this.renderingService.renderCircle(
      context,
      tower.position,
      range,
      rangeColor,
      borderColor,
      2
    );
  }

  /**
   * タワータイプに応じた色を取得
   */
  private getTowerColor(towerType: string): Color {
    switch (towerType) {
      case "archer":
        return new Color(100, 150, 100, 1); // 緑
      case "cannon":
        return new Color(150, 100, 100, 1); // 赤
      case "magic":
        return new Color(100, 100, 150, 1); // 青
      case "ice":
        return new Color(150, 200, 255, 1); // 水色
      case "fire":
        return new Color(255, 150, 100, 1); // オレンジ
      default:
        return new Color(100, 100, 100, 1); // グレー
    }
  }

  /**
   * 位置がパス上かチェック（実際の移動パスを基準）
   */
  private isOnPath(position: Position): boolean {
    if (this._movementPath.length < 2) {
      // 移動パスが設定されていない場合はフォールバック
      const centerY = this.bounds.y + this.bounds.height / 2;
      const pathWidth = 40;
      const margin = this.config.ui.layout.margin;
      
      const isInPathY = Math.abs(position.y - centerY) < pathWidth / 2;
      const isInPathX = position.x >= this.bounds.x + margin && 
                        position.x <= this.bounds.x + this.bounds.width - margin;
      
      return isInPathY && isInPathX;
    }

    // 実際の移動パスに沿ってチェック
    const pathWidth = 30; // パス幅
    
    for (let i = 0; i < this._movementPath.length - 1; i++) {
      const start = this._movementPath[i];
      const end = this._movementPath[i + 1];
      
      // 線分との距離を計算
      const distance = this.distanceToLineSegment(position, start, end);
      if (distance < pathWidth / 2) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 点から線分までの距離を計算
   */
  private distanceToLineSegment(point: Position, lineStart: Position, lineEnd: Position): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // 線分が点の場合
      return Math.sqrt(A * A + B * B);
    }
    
    let param = dot / lenSq;
    
    let xx: number, yy: number;
    
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}