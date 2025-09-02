# UI・フィードバックシステム コンポーネントモデル

## 概要

UI・フィードバックシステムユニットは、ユーザーインターフェース、視覚・音響エフェクト、リアルタイムフィードバックを担当するコンポーネント群です。HTML5 Canvas APIとWeb Audio APIを活用し、ブラウザで直接実行可能な2Dタワーディフェンスゲームの表示層を提供します。

## アーキテクチャ概要

### レイヤー構成
```
┌─────────────────────────────────────┐
│ エフェクトレイヤー（最前面）          │
├─────────────────────────────────────┤
│ UIレイヤー（ヘッダー・手札・情報）    │
├─────────────────────────────────────┤
│ ゲームオブジェクトレイヤー（敵・タワー）│
├─────────────────────────────────────┤
│ 背景レイヤー（戦場・パス）           │
└─────────────────────────────────────┘
```

### 画面レイアウト
```
┌─────────────────────────────────────────────────────────┐
│ ヘッダーエリア（タイマー・スコア・体力）                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│              メインゲームエリア                          │
│              （戦場・敵・タワー）                        │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 手札エリア（魔力表示・カード5枚）                        │
└─────────────────────────────────────────────────────────┘
```

## ドメインエンティティ

### GameRenderer（ゲームレンダラー）
**責任**: 全体的な描画制御とレンダリングループ管理

**属性**:
- `canvas: HTMLCanvasElement` - 描画対象のキャンバス
- `context: CanvasRenderingContext2D` - 描画コンテキスト
- `layers: RenderLayer[]` - レンダリングレイヤー配列
- `viewport: Viewport` - ビューポート情報
- `isRunning: boolean` - レンダリングループ実行状態

**振る舞い**:
- `startRenderLoop()` - レンダリングループ開始
- `stopRenderLoop()` - レンダリングループ停止
- `render(deltaTime: number)` - フレーム描画実行
- `resize(width: number, height: number)` - 画面サイズ変更対応

### UIManager（UIマネージャー）
**責任**: UI要素の管理と状態更新

**属性**:
- `headerUI: HeaderUI` - ヘッダーUI管理
- `handUI: HandUI` - 手札UI管理
- `gameFieldUI: GameFieldUI` - 戦場UI管理
- `tooltipUI: TooltipUI` - ツールチップUI管理

**振る舞い**:
- `updateGameState(state: GameState)` - ゲーム状態更新
- `updateHandState(hand: HandState)` - 手札状態更新
- `showTooltip(content: TooltipContent, position: Position)` - ツールチップ表示
- `hideTooltip()` - ツールチップ非表示

### EffectManager（エフェクトマネージャー）
**責任**: 視覚エフェクトの生成・管理・描画

**属性**:
- `activeEffects: Effect[]` - アクティブなエフェクト配列
- `effectPool: EffectPool` - エフェクトオブジェクトプール
- `particleSystem: ParticleSystem` - パーティクルシステム

**振る舞い**:
- `createTowerPlacementEffect(position: Position)` - タワー配置エフェクト生成
- `createAttackEffect(from: Position, to: Position)` - 攻撃エフェクト生成
- `createExplosionEffect(position: Position, intensity: number)` - 爆発エフェクト生成
- `createDamageNumberEffect(position: Position, damage: number)` - ダメージ数値エフェクト生成
- `update(deltaTime: number)` - エフェクト更新
- `render(context: CanvasRenderingContext2D)` - エフェクト描画

### AudioManager（音響マネージャー）
**責任**: 音響エフェクトの管理と再生制御

**属性**:
- `audioContext: AudioContext` - Web Audio APIコンテキスト
- `soundBuffers: Map<string, AudioBuffer>` - 音響バッファ管理
- `activeSources: AudioBufferSourceNode[]` - アクティブな音源配列
- `masterVolume: number` - マスター音量
- `isMuted: boolean` - ミュート状態

**振る舞い**:
- `loadSound(name: string, url: string)` - 音響ファイル読み込み
- `playSound(name: string, volume?: number)` - 効果音再生
- `playBGM(name: string, loop: boolean)` - BGM再生
- `setMasterVolume(volume: number)` - マスター音量設定
- `mute()` / `unmute()` - ミュート制御

### InputHandler（入力ハンドラー）
**責任**: マウス・キーボード入力の処理と変換

**属性**:
- `canvas: HTMLCanvasElement` - 入力対象キャンバス
- `mousePosition: Position` - 現在のマウス位置
- `isDragging: boolean` - ドラッグ状態
- `dragStartPosition: Position` - ドラッグ開始位置
- `hoveredElement: UIElement | null` - ホバー中の要素

**振る舞い**:
- `handleMouseMove(event: MouseEvent)` - マウス移動処理
- `handleMouseDown(event: MouseEvent)` - マウス押下処理
- `handleMouseUp(event: MouseEvent)` - マウス離上処理
- `handleDragStart(position: Position)` - ドラッグ開始処理
- `handleDragEnd(position: Position)` - ドラッグ終了処理
- `getWorldPosition(screenPosition: Position): Position` - 座標変換

## 値オブジェクト

### Position（位置）
**属性**:
- `x: number` - X座標
- `y: number` - Y座標

**振る舞い**:
- `distance(other: Position): number` - 距離計算
- `add(other: Position): Position` - 位置加算
- `subtract(other: Position): Position` - 位置減算

### Color（色）
**属性**:
- `r: number` - 赤成分（0-255）
- `g: number` - 緑成分（0-255）
- `b: number` - 青成分（0-255）
- `a: number` - 透明度（0-1）

**振る舞い**:
- `toRGBA(): string` - RGBA文字列変換
- `withAlpha(alpha: number): Color` - 透明度変更

### Rectangle（矩形）
**属性**:
- `x: number` - 左上X座標
- `y: number` - 左上Y座標
- `width: number` - 幅
- `height: number` - 高さ

**振る舞い**:
- `contains(position: Position): boolean` - 点の内包判定
- `intersects(other: Rectangle): boolean` - 矩形の交差判定

### AnimationState（アニメーション状態）
**属性**:
- `startTime: number` - 開始時刻
- `duration: number` - 継続時間
- `startValue: number` - 開始値
- `endValue: number` - 終了値
- `easingFunction: EasingFunction` - イージング関数

**振る舞い**:
- `getCurrentValue(currentTime: number): number` - 現在値取得
- `isComplete(currentTime: number): boolean` - 完了判定

## ドメインサービス

### RenderingService（レンダリングサービス）
**責任**: 効率的な描画処理の提供

**振る舞い**:
- `renderSprite(context: CanvasRenderingContext2D, sprite: Sprite, position: Position)` - スプライト描画
- `renderText(context: CanvasRenderingContext2D, text: string, position: Position, style: TextStyle)` - テキスト描画
- `renderHealthBar(context: CanvasRenderingContext2D, current: number, max: number, bounds: Rectangle)` - 体力バー描画
- `renderProgressBar(context: CanvasRenderingContext2D, progress: number, bounds: Rectangle, color: Color)` - プログレスバー描画

### AnimationService（アニメーションサービス）
**責任**: アニメーション計算とトゥイーン処理

**振る舞い**:
- `createTween(startValue: number, endValue: number, duration: number, easing: EasingFunction): AnimationState` - トゥイーン作成
- `updateAnimation(animation: AnimationState, currentTime: number): number` - アニメーション更新
- `easeInOut(t: number): number` - イーズインアウト関数
- `easeIn(t: number): number` - イーズイン関数
- `easeOut(t: number): number` - イーズアウト関数

### CollisionDetectionService（衝突判定サービス）
**責任**: UI要素の当たり判定処理

**振る舞い**:
- `pointInRectangle(point: Position, rect: Rectangle): boolean` - 点と矩形の判定
- `pointInCircle(point: Position, center: Position, radius: number): boolean` - 点と円の判定
- `findUIElementAt(position: Position, elements: UIElement[]): UIElement | null` - 位置のUI要素検索

## UI コンポーネント

### HeaderUI（ヘッダーUI）
**責任**: ゲーム状態情報の表示

**属性**:
- `timerDisplay: TimerDisplay` - タイマー表示
- `scoreDisplay: ScoreDisplay` - スコア表示
- `healthDisplay: HealthDisplay` - 体力表示
- `bounds: Rectangle` - 表示領域

**振る舞い**:
- `updateTimer(timeRemaining: number)` - タイマー更新
- `updateScore(score: number)` - スコア更新
- `updateHealth(current: number, max: number)` - 体力更新
- `render(context: CanvasRenderingContext2D)` - 描画

### HandUI（手札UI）
**責任**: 手札とマナの表示・操作

**属性**:
- `cardSlots: CardSlot[]` - カードスロット配列
- `manaDisplay: ManaDisplay` - マナ表示
- `selectedCard: Card | null` - 選択中のカード
- `bounds: Rectangle` - 表示領域

**振る舞い**:
- `updateHand(cards: Card[])` - 手札更新
- `updateMana(current: number, max: number)` - マナ更新
- `selectCard(index: number)` - カード選択
- `startCardDrag(card: Card, position: Position)` - カードドラッグ開始
- `render(context: CanvasRenderingContext2D)` - 描画

### GameFieldUI（戦場UI）
**責任**: 戦場上のオブジェクト表示

**属性**:
- `enemies: EnemySprite[]` - 敵スプライト配列
- `towers: TowerSprite[]` - タワースプライト配列
- `path: PathSprite` - パススプライト
- `bounds: Rectangle` - 表示領域

**振る舞い**:
- `updateEnemies(enemies: Enemy[])` - 敵情報更新
- `updateTowers(towers: Tower[])` - タワー情報更新
- `showTowerRange(tower: Tower)` - タワー射程表示
- `hideTowerRange()` - タワー射程非表示
- `render(context: CanvasRenderingContext2D)` - 描画

### TooltipUI（ツールチップUI）
**責任**: 詳細情報の表示

**属性**:
- `content: string` - 表示内容
- `position: Position` - 表示位置
- `isVisible: boolean` - 表示状態
- `fadeAnimation: AnimationState` - フェードアニメーション

**振る舞い**:
- `show(content: string, position: Position)` - 表示
- `hide()` - 非表示
- `update(deltaTime: number)` - 更新
- `render(context: CanvasRenderingContext2D)` - 描画

## エフェクトシステム

### Effect（エフェクト基底クラス）
**責任**: 視覚エフェクトの基本機能

**属性**:
- `position: Position` - 位置
- `startTime: number` - 開始時刻
- `duration: number` - 継続時間
- `isActive: boolean` - アクティブ状態

**振る舞い**:
- `update(deltaTime: number)` - 更新
- `render(context: CanvasRenderingContext2D)` - 描画
- `isExpired(currentTime: number): boolean` - 期限切れ判定

### ParticleEffect（パーティクルエフェクト）
**責任**: パーティクルベースのエフェクト

**属性**:
- `particles: Particle[]` - パーティクル配列
- `emissionRate: number` - 放出レート
- `particleLifetime: number` - パーティクル寿命

**振る舞い**:
- `emitParticles(count: number)` - パーティクル放出
- `updateParticles(deltaTime: number)` - パーティクル更新

### DamageNumberEffect（ダメージ数値エフェクト）
**責任**: ダメージ数値の表示

**属性**:
- `damage: number` - ダメージ値
- `color: Color` - 表示色
- `floatAnimation: AnimationState` - 浮上アニメーション
- `fadeAnimation: AnimationState` - フェードアニメーション

## イベントインターフェース

### UIEventBus（UIイベントバス）
**責任**: UI関連イベントの配信

**振る舞い**:
- `subscribe(eventType: string, handler: EventHandler)` - イベント購読
- `unsubscribe(eventType: string, handler: EventHandler)` - 購読解除
- `publish(event: UIEvent)` - イベント発行

### 受信イベント
- `GameStateUpdated` - ゲーム状態更新（ゲームセッション管理から）
- `HandUpdated` - 手札更新（カード戦略管理から）
- `TowerPlaced` - タワー配置（タワー戦闘システムから）
- `TowerAttacked` - タワー攻撃（タワー戦闘システムから）
- `EnemyDamaged` - 敵ダメージ（敵チャレンジシステムから）
- `EnemyDefeated` - 敵撃破（敵チャレンジシステムから）
- `ManaUpdated` - マナ更新（マナシステムから）

### 発行イベント
- `CardDragStarted` - カードドラッグ開始
- `CardDropped` - カードドロップ
- `TowerSelected` - タワー選択
- `GameFieldClicked` - 戦場クリック

## コンポーネント相互作用

### ゲーム開始時の初期化フロー
```
1. GameRenderer初期化
   ↓
2. UIManager、EffectManager、AudioManager、InputHandler初期化
   ↓
3. 各UIコンポーネント初期化
   ↓
4. イベントリスナー登録
   ↓
5. レンダリングループ開始
```

### フレーム描画フロー
```
1. GameRenderer.render()呼び出し
   ↓
2. 各レイヤーの描画
   - 背景レイヤー描画
   - ゲームオブジェクトレイヤー描画（GameFieldUI）
   - UIレイヤー描画（HeaderUI、HandUI）
   - エフェクトレイヤー描画（EffectManager）
   ↓
3. 次フレームのrequestAnimationFrame登録
```

### カードドラッグ&ドロップフロー
```
1. InputHandler.handleMouseDown()
   ↓
2. HandUI.selectCard()でカード選択
   ↓
3. InputHandler.handleDragStart()
   ↓
4. HandUI.startCardDrag()でドラッグ開始
   ↓
5. マウス移動でドラッグ位置更新
   ↓
6. InputHandler.handleDragEnd()
   ↓
7. CardDroppedイベント発行
```

### エフェクト表示フロー
```
1. 外部イベント受信（例：TowerAttacked）
   ↓
2. EffectManager.createAttackEffect()
   ↓
3. エフェクトオブジェクト生成・activeEffectsに追加
   ↓
4. 毎フレームでEffect.update()、Effect.render()
   ↓
5. エフェクト完了時にactiveEffectsから削除
```

## パフォーマンス最適化

### 描画最適化
- **ダーティレクタングル**: 変更された領域のみ再描画
- **オブジェクトプーリング**: エフェクトオブジェクトの再利用
- **レイヤー分離**: 更新頻度の異なる要素を別レイヤーで管理
- **フレームレート制御**: requestAnimationFrameによる60fps制御

### メモリ最適化
- **エフェクトプール**: パーティクルエフェクトの再利用
- **音響バッファ管理**: 使用頻度に応じたバッファ管理
- **イベントリスナー管理**: 適切な登録・解除

### 品質調整
- **自動品質調整**: フレームレート低下時のエフェクト数制限
- **設定可能品質**: ユーザー設定による品質レベル調整

## 技術的考慮事項

### ブラウザ互換性
- **Canvas API**: 全モダンブラウザ対応
- **Web Audio API**: フォールバック機能付き
- **requestAnimationFrame**: ポリフィル対応

### エラーハンドリング
- **音響読み込み失敗**: サイレント継続
- **Canvas初期化失敗**: フォールバック表示
- **メモリ不足**: 品質自動調整

### 拡張性
- **プラグイン機能**: 新しいエフェクトタイプの追加
- **テーマシステム**: UI外観のカスタマイズ
- **国際化対応**: 多言語テキスト表示

## テスト戦略

### 単体テスト
- **値オブジェクト**: 計算ロジックのテスト
- **サービス**: アニメーション、衝突判定のテスト
- **エフェクト**: ライフサイクル管理のテスト

### 統合テスト
- **イベント連携**: 他ユニットとのイベント交換テスト
- **レンダリング**: 描画結果の視覚的テスト
- **パフォーマンス**: フレームレート測定テスト

### E2Eテスト
- **ユーザー操作**: ドラッグ&ドロップ操作のテスト
- **ゲームフロー**: 開始から終了までの表示テスト
- **ブラウザ互換性**: 複数ブラウザでの動作テスト

## 実装優先度

### 高優先度（MVP）
1. 基本レンダリングシステム
2. ヘッダーUI（タイマー・スコア・体力）
3. 手札UI（カード表示・マナ表示）
4. 基本入力処理（クリック・ドラッグ）
5. 基本エフェクト（配置・攻撃・撃破）

### 中優先度
1. 音響システム
2. アニメーション強化
3. ツールチップ表示
4. パフォーマンス最適化

### 低優先度（将来拡張）
1. 高品質エフェクト
2. BGM対応
3. 設定画面
4. アクセシビリティ対応

このコンポーネントモデルにより、ユーザーストーリー5.1（即座の視覚・音響フィードバック）と5.2（明確なゲーム状態表示）の両方を実現し、楽しく操作しやすいゲーム体験を提供します。