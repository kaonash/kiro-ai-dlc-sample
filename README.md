# Kiroで始めるAI-DLCのサンプル
本レポジトリはKiroを活用してAI-DLCを実践するためのサンプルプロジェクトです。
`.kiro` 内の設定がメインコンテンツで、 `/src` 配下はこの仕組みを利用して実際に作成したゲームのサンプルです。
「現状こんな感じのコードが出来上がるんだな」という参考程度にしてください。（動作はしますがバグが色々と残っていたりテストが通っていなかったりします）
[こちらの発表資料](https://speakerdeck.com/kaonash/kirodeshi-meruai-dlc)のAppendixとしてご活用ください。

## プロジェクト構成
このプロジェクトは以下の構成になっています：

### 🤖 AI-DLC関連ファイル（.kiroフォルダ）
```
.kiro/
├── specs/                    # 仕様書・設計文書
│   ├── plans/               # 作業計画書
│   ├── requirements/        # 要件定義書
│   ├── story-artifacts/     # ユーザーストーリー
│   ├── units/              # 開発ユニット定義
│   ├── design-artifacts/    # 設計文書
│   └── prompts.md          # 指示履歴
├── steering/               # 開発ガイドライン
│   ├── ai-dlc.md          # AI-DLC手法定義
│   ├── tech.md            # 技術方針
│   ├── product.md         # プロダクト仕様
│   ├── structure.md       # プロジェクト構造ルール
│   └── documentation-rules.md # 文書化ルール
└── hooks/                 # 自動化フック
    ├── spec-user-stories.kiro.hook
    ├── story-unit-processor.kiro.hook
    ├── design-completion-trigger.kiro.hook
    └── unit-completion-trigger.kiro.hook
```

### 🎮 ゲーム実装（srcフォルダ）
- **実装コード**: `src/` - TypeScriptで実装されたゲームロジック（参考実装）
- **テストコード**: `tests/` - テストコード（参考実装）
- **設定ファイル**: `config/` - ゲームバランス、カード定義、敵設定など
