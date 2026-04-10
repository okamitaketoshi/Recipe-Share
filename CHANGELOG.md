# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Git Flow戦略の導入
- CHANGELOG.mdの作成
- Git Flow戦略ガイドドキュメント（docs/git-flow-strategy.md）
- Vercel無償プラン対応のワークフロー説明

### Changed

- CLAUDE.mdにGit Flow戦略を追加
- Git Flow戦略ガイドにVercel無償プランの制約と対応方針を追記
- feature/bugfixブランチはローカル環境でのテスト必須に変更
- release/hotfixブランチのみVercel Preview環境で最終確認可能

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
