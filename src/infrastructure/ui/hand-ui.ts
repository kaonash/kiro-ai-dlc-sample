import { Rectangle } from "../../domain/value-objects/rectangle";
import { Position } from "../../domain/value-objects/position";
import { Color } from "../../domain/value-objects/color";
import { RenderingService, TextStyle } from "../../domain/services/rendering-service";
import { Card } from "../../domain/entities/ui-manager";
import { GameConfig } from "../config/game-config";

/**
 * 手札UI実装
 * カード表示、マナ表示、ドラッグ&ドロップ処理
 */
export class HandUI {
  public readonly bounds: Rectangle;
  private readonly renderingService: RenderingService;
  private readonly config: GameConfig;

  private _cards: Card[] = [];
  private _currentMana = 0;
  private _maxMana = 10;
  private _selectedCardIndex = -1;
  private _isDragging = false;
  private _draggedCard: Card | null = null;
  private _dragPosition = new Position(0, 0);

  constructor(bounds: Rectangle, renderingService: RenderingService) {
    this.bounds = bounds;
    this.renderingService = renderingService;
    this.config = GameConfig.getInstance();
  }

  /**
   * 現在の手札
   */
  get cards(): Card[] {
    return [...this._cards];
  }

  /**
   * 現在のマナ
   */
  get currentMana(): number {
    return this._currentMana;
  }

  /**
   * 最大マナ
   */
  get maxMana(): number {
    return this._maxMana;
  }

  /**
   * 選択中のカードインデックス
   */
  get selectedCardIndex(): number {
    return this._selectedCardIndex;
  }

  /**
   * ドラッグ状態
   */
  get isDragging(): boolean {
    return this._isDragging;
  }

  /**
   * ドラッグ中のカード
   */
  get draggedCard(): Card | null {
    return this._draggedCard;
  }

  /**
   * ドラッグ位置
   */
  get dragPosition(): Position {
    return this._dragPosition;
  }

  /**
   * 手札を更新
   */
  updateHand(cards: Card[]): void {
    this._cards = [...cards];
    
    // 選択中のカードが無効になった場合はクリア
    if (this._selectedCardIndex >= this._cards.length) {
      this._selectedCardIndex = -1;
    }
  }

  /**
   * マナを更新
   */
  updateMana(current: number, max: number): void {
    this._currentMana = Math.max(0, current);
    this._maxMana = Math.max(1, max);
  }

  /**
   * カードを選択
   */
  selectCard(index: number): void {
    if (index >= 0 && index < this._cards.length) {
      this._selectedCardIndex = index;
    } else {
      this._selectedCardIndex = -1;
    }
  }

  /**
   * カードドラッグを開始
   */
  startCardDrag(card: Card, position: Position): void {
    this._isDragging = true;
    this._draggedCard = card;
    this._dragPosition = position;
  }

  /**
   * カードドラッグを終了
   */
  endCardDrag(): void {
    this._isDragging = false;
    this._draggedCard = null;
    this._dragPosition = new Position(0, 0);
  }

  /**
   * 手札を描画
   */
  render(context: CanvasRenderingContext2D, deltaTime: number): void {
    // 背景を描画
    this.renderBackground(context);

    // マナバーを描画
    this.renderManaBar(context);

    // カードを描画
    this.renderCards(context);

    // ドラッグ中のカードを描画
    if (this._isDragging && this._draggedCard) {
      this.renderDraggedCard(context);
    }
  }

  /**
   * カードの境界を取得
   */
  getCardBounds(): Rectangle[] {
    const cardCount = this._cards.length;
    if (cardCount === 0) return [];

    const uiConfig = this.config.ui;
    const cardWidth = uiConfig.hand.cardWidth;
    const cardHeight = uiConfig.hand.cardHeight;
    const minSpacing = uiConfig.hand.cardSpacing;
    const margin = uiConfig.layout.margin;

    const availableWidth = this.bounds.width - (2 * margin);
    const totalCardWidth = cardCount * cardWidth;
    const totalSpacingWidth = (cardCount - 1) * minSpacing;
    
    // カードが収まらない場合は間隔を調整
    const spacing = totalCardWidth + totalSpacingWidth <= availableWidth 
      ? minSpacing 
      : Math.max(5, (availableWidth - totalCardWidth) / (cardCount - 1));

    const bounds: Rectangle[] = [];
    const startX = this.bounds.x + margin;
    let currentX = startX;

    for (let i = 0; i < cardCount; i++) {
      bounds.push(new Rectangle(
        currentX,
        this.bounds.y + 35, // マナバー分のスペースを確保
        cardWidth,
        cardHeight
      ));
      currentX += cardWidth + spacing;
    }

    return bounds;
  }

  /**
   * カードが購入可能かチェック
   */
  canAffordCard(card: Card): boolean {
    return this._currentMana >= card.cost;
  }

  /**
   * 指定位置のカードを取得
   */
  getCardAtPosition(position: Position): Card | null {
    const cardBounds = this.getCardBounds();
    
    for (let i = 0; i < cardBounds.length; i++) {
      if (cardBounds[i].contains(position)) {
        return this._cards[i];
      }
    }

    return null;
  }

  /**
   * 背景を描画
   */
  private renderBackground(context: CanvasRenderingContext2D): void {
    const backgroundColor = new Color(30, 30, 30, 0.9);
    const borderColor = new Color(70, 70, 70, 1);

    this.renderingService.renderRectangle(
      context,
      this.bounds,
      backgroundColor,
      borderColor,
      2
    );
  }

  /**
   * マナバーを描画
   */
  private renderManaBar(context: CanvasRenderingContext2D): void {
    const uiConfig = this.config.ui;
    const manaBarWidth = uiConfig.hand.manaBarWidth;
    const manaBarMargin = uiConfig.hand.manaBarMargin;
    const manaBarHeight = 15;
    
    const manaBarBounds = new Rectangle(
      this.bounds.x + manaBarMargin,
      this.bounds.y + 10,
      manaBarWidth,
      manaBarHeight
    );

    // マナラベル
    const labelPosition = new Position(manaBarBounds.x, manaBarBounds.y - 5);
    const labelStyle: TextStyle = {
      font: "14px Arial",
      color: Color.white(),
      align: "left",
      baseline: "bottom",
    };

    this.renderingService.renderText(context, "Mana", labelPosition, labelStyle);

    // マナバー
    const manaRatio = this._currentMana / this._maxMana;
    const manaColor = new Color(100, 150, 255);

    this.renderingService.renderProgressBar(
      context,
      manaRatio,
      manaBarBounds,
      manaColor
    );

    // マナ数値
    const manaText = `${this._currentMana}/${this._maxMana}`;
    const manaTextPosition = new Position(
      manaBarBounds.x + manaBarBounds.width + 10,
      manaBarBounds.y + manaBarBounds.height / 2
    );

    const manaTextStyle: TextStyle = {
      font: "12px Arial",
      color: Color.white(),
      align: "left",
      baseline: "middle",
    };

    this.renderingService.renderText(context, manaText, manaTextPosition, manaTextStyle);
  }

  /**
   * カードを描画
   */
  private renderCards(context: CanvasRenderingContext2D): void {
    const cardBounds = this.getCardBounds();

    for (let i = 0; i < this._cards.length; i++) {
      const card = this._cards[i];
      const bounds = cardBounds[i];
      const isSelected = i === this._selectedCardIndex;
      const canAfford = this.canAffordCard(card);

      this.renderCard(context, card, bounds, isSelected, canAfford);
    }
  }

  /**
   * 個別のカードを描画
   */
  private renderCard(
    context: CanvasRenderingContext2D,
    card: Card,
    bounds: Rectangle,
    isSelected: boolean,
    canAfford: boolean
  ): void {
    // カード背景
    const backgroundColor = canAfford 
      ? new Color(60, 80, 100, 1)
      : new Color(40, 40, 40, 0.7);
    
    const borderColor = isSelected 
      ? new Color(255, 255, 100, 1)
      : new Color(100, 100, 100, 1);

    const borderWidth = isSelected ? 3 : 1;

    this.renderingService.renderRectangle(
      context,
      bounds,
      backgroundColor,
      borderColor,
      borderWidth
    );

    // カード名
    const namePosition = new Position(
      bounds.x + bounds.width / 2,
      bounds.y + 20
    );

    const nameStyle: TextStyle = {
      font: "14px Arial",
      color: canAfford ? Color.white() : new Color(150, 150, 150),
      align: "center",
      baseline: "middle",
    };

    this.renderingService.renderText(context, card.name, namePosition, nameStyle);

    // コスト
    const costPosition = new Position(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height - 15
    );

    const costStyle: TextStyle = {
      font: "12px Arial",
      color: canAfford ? new Color(100, 150, 255) : new Color(100, 100, 100),
      align: "center",
      baseline: "middle",
    };

    this.renderingService.renderText(context, `Cost: ${card.cost}`, costPosition, costStyle);
  }

  /**
   * ドラッグ中のカードを描画
   */
  private renderDraggedCard(context: CanvasRenderingContext2D): void {
    if (!this._draggedCard) return;

    const uiConfig = this.config.ui;
    const cardWidth = uiConfig.hand.cardWidth;
    const cardHeight = uiConfig.hand.cardHeight;
    
    const dragBounds = new Rectangle(
      this._dragPosition.x - cardWidth / 2,
      this._dragPosition.y - cardHeight / 2,
      cardWidth,
      cardHeight
    );

    const canAfford = this.canAffordCard(this._draggedCard);
    
    // 半透明で描画
    const backgroundColor = canAfford 
      ? new Color(60, 80, 100, 0.8)
      : new Color(40, 40, 40, 0.5);

    const borderColor = new Color(255, 255, 100, 0.8);

    this.renderingService.renderRectangle(
      context,
      dragBounds,
      backgroundColor,
      borderColor,
      2
    );

    // カード情報を描画
    this.renderCard(context, this._draggedCard, dragBounds, true, canAfford);
  }
}