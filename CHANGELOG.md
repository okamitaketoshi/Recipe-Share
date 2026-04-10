# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Vercel Preview環境の説明を修正
  - すべてのPR作成時に自動的にPreview環境が生成されることを明記
  - マージ先ブランチに関係なく動作することを追記
  - docs/git-flow-strategy.md を全面的に修正
  - CLAUDE.md のVercel連携説明を修正
- 誤った制約情報（developへのPRでPreview環境なし）を削除

### Added

- Git Flow戦略の導入
- CHANGELOG.mdの作成
- Git Flow戦略ガイドドキュメント（docs/git-flow-strategy.md）

### Changed

- CLAUDE.mdにGit Flow戦略を追加

## [1.0.0] - 2026-04-10

### Added

- レシピ作成・編集・削除機能（完全CRUD）
- 材料検索機能（AND/OR検索モード対応）
- Supabase Realtimeによるリアルタイム更新
- レスポンシブUIデザイン
- ローカル開発環境（Supabase CLI）
- Vercelへの自動デプロイ設定
- pre-commit フックの統合
- GitHub issue操作スキル

### Technical

- React 18.3.1 + TypeScript 5.5.3
- Vite 5.4.2 ビルドシステム
- Tailwind CSS 3.4.1 スタイリング
- Supabase 2.57.4 バックエンド
- ESLint + Prettier コード品質管理

### Infrastructure

- Vercel Production環境: https://recipe-share-two.vercel.app
- Supabase PostgreSQLデータベース
- GitHub Actions CI/CD（予定）
