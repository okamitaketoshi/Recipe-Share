# Issue#8: ローカル開発環境用のDockerベースDB環境構築 - 設計書

**作成日**: 2026-04-04  
**Issue**: #8  
**優先度**: Medium  
**見積もり**: 4-8h

---

## 📋 概要

ローカル開発時にSupabaseの本番/ステージング環境に直接接続している状況を改善し、Dockerベースのローカル開発用DB環境を構築する。

### 目的

- ローカル開発時のネットワーク依存を排除
- 本番データへの影響リスク削減
- 開発者間でのデータ独立性確保
- オフライン開発の実現

---

## 🔍 現状分析

### 既存システム構成

- **DB接続**: `src/lib/supabase.ts` で環境変数を直接参照
- **環境変数**: `.env` のみ（Git管理外）、`.env.example` なし
- **DBスキーマ**: `supabase/migrations/` に2つのマイグレーションファイル
  - `20260310143236_create_recipes_table.sql`: recipesテーブル作成 + RLS設定
  - `20260311065834_add_steps_and_url_to_recipes.sql`: steps_array, recipe_url追加
- **Docker環境**: 未構築
- **mise設定**: pre-commitチェックタスクのみ、DB関連タスクなし

### DBスキーマ詳細

```sql
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps text NOT NULL,
  steps_array jsonb DEFAULT '[]'::jsonb,
  recipe_url text,
  created_at timestamptz DEFAULT now()
);

-- RLS有効、anon/authenticated共に全操作可能
```

### 影響範囲

- **変更対象**: `src/lib/supabase.ts`（軽微な変更）
- **デグレリスク**: 低
- **破壊的変更**: なし

---

## 🎯 検討事項と選択肢

### 1. ローカルDB環境の方式選定

#### 選択肢A: Supabase CLI（ローカルSupabase環境）

**メリット**:
- PostgreSQL + Auth + Storage + Realtime を含む完全なローカル環境
- 本番環境との完全な互換性
- Supabaseのマイグレーション管理機能をそのまま利用可能
- 将来的にAuth/Storage機能を追加する場合も追加作業不要

**デメリット**:
- セットアップがやや複雑（Supabase CLI + Docker Composeが必要）
- リソース消費量が大きい（複数コンテナ起動）
- 現時点ではAuth/Storage機能を使っていないため、オーバースペック

**コマンド例**:
```bash
npx supabase init
npx supabase start
npx supabase db reset  # マイグレーション適用
```

#### 選択肢B: 単純なPostgreSQLコンテナ

**メリット**:
- セットアップが非常にシンプル
- リソース消費量が小さい
- Docker Composeのみで完結
- 現在の要件（PostgreSQL + RLS）に対して十分

**デメリット**:
- Auth/Storage機能は別途実装が必要（将来必要になった場合）
- Supabase特有の機能（Realtime等）は使えない
- マイグレーション管理を別途検討する必要がある

**docker-compose.yml例**:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: recipe_share
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
```

#### 選択肢C: ハイブリッドアプローチ

**メリット**:
- 段階的な導入が可能
- 初期はPostgreSQLコンテナで開始し、必要に応じてSupabase CLIに移行
- 現在の要件に対して最小限の構成で開始できる

**デメリット**:
- 将来的に移行コストが発生する可能性
- 移行時にマイグレーションファイルの変換が必要になる場合がある

**推奨**: **選択肢C（ハイブリッドアプローチ）**

**理由**:
- 現在はAuth/Storage機能を使っていない
- まずPostgreSQLコンテナで開始し、環境構築のハードルを下げる
- 将来Auth/Storage が必要になったタイミングでSupabase CLIに移行すれば良い

---

### 2. マイグレーション管理ツールの選定

#### 選択肢A: Prisma

**メリット**:
- TypeScript統合、型安全なクエリ
- マイグレーション自動生成
- スキーマ定義をTypeScriptで管理

**デメリット**:
- 既存のSupabaseマイグレーションファイルとの互換性がない
- Prismaのスキーマ定義に書き換える必要がある
- Supabase特有の機能（RLS等）をPrismaで管理するのが難しい

#### 選択肢B: Supabase CLI

**メリット**:
- Supabaseネイティブ、本番環境との完全な一貫性
- 既存のマイグレーションファイルをそのまま使える
- RLS、関数、トリガーなどPostgreSQLの全機能をサポート

**デメリット**:
- Supabase CLIのインストールが必要
- ローカルDB環境として単純なPostgreSQLコンテナを選択した場合、CLIの恩恵が限定的

#### 選択肢C: raw SQL（手動管理）

**メリット**:
- シンプル、追加ツール不要
- 既存のマイグレーションファイルをそのまま使える
- PostgreSQLの全機能を自由に使える

**デメリット**:
- マイグレーションバージョン管理を手動で行う必要がある
- ロールバック処理を自分で実装する必要がある

**推奨**: **選択肢C（raw SQL）+ マイグレーション適用スクリプト**

**理由**:
- 既存の `supabase/migrations/*.sql` をそのまま活用できる
- シンプルで追加学習コスト不要
- マイグレーション適用スクリプトを作成すれば、バージョン管理も可能

**実装方針**:
```bash
# docker/postgres/init.sql に既存マイグレーションを統合
# または、mise taskでマイグレーション適用スクリプトを作成
mise run db:migrate  # マイグレーション適用
```

---

### 3. 環境変数管理方針

#### 既存の課題

- `.env` のみでSupabase本番環境を管理
- `.env.example` がない
- 環境別の切り替えロジックがない

#### 提案する構成

```
.env                  # Supabase本番用（Git管理外、既存）
.env.local            # ローカルDB用（Git管理外、新規作成）
.env.local.example    # ローカルDB用テンプレート（Git管理対象）
.env.example          # Supabase本番用テンプレート（Git管理対象、新規作成）
```

#### 環境変数の内容

**.env.local.example**:
```bash
# ローカルDB用環境変数（開発用）
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recipe_share
```

#### 環境切り替え方法

1. **ローカルDB使用時**: `.env.local` を作成（Viteが自動的に優先読み込み）
2. **Supabase本番使用時**: `.env.local` を削除または `.env.local.backup` にリネーム

---

## 📝 設計方針（推奨構成）

### 採用する構成

1. **ローカルDB環境**: PostgreSQLコンテナ（選択肢B → 将来的に選択肢Aへ移行可能）
2. **マイグレーション管理**: raw SQL + マイグレーション適用スクリプト（選択肢C）
3. **環境変数管理**: `.env.local` / `.env.local.example` による環境切り替え

### 実装方針

#### Phase 1: Docker環境構築

- `docker-compose.yml` 作成
- PostgreSQL 16 Alpine イメージ使用
- ボリューム設定（データ永続化）
- ヘルスチェック設定

#### Phase 2: マイグレーション適用

- `docker/postgres/init.sql` に既存マイグレーションを統合
- または `mise run db:migrate` でマイグレーション適用スクリプト作成

#### Phase 3: 環境変数整備

- `.env.local.example` 作成
- `.env.example` 作成
- `.gitignore` に `.env.local` 追加（既に `*.local` で除外済み）

#### Phase 4: mise task追加

```toml
[tasks."db:up"]
description = "ローカルDB起動"
run = "docker compose up -d"

[tasks."db:down"]
description = "ローカルDB停止"
run = "docker compose down"

[tasks."db:logs"]
description = "ローカルDBログ確認"
run = "docker compose logs -f postgres"

[tasks."db:reset"]
description = "ローカルDBリセット（データ削除 + 再起動）"
run = "docker compose down -v && docker compose up -d"
```

#### Phase 5: ドキュメント整備

- `README.md` にローカル環境セットアップ手順追加
- トラブルシューティング追加

---

## ✅ 受け入れ条件

- [ ] `mise run db:up` でローカルDB起動ができる
- [ ] `.env.local` の切り替えでローカルDB/Supabase本番を選択できる
- [ ] 既存マイグレーションがローカルDBに適用されている
- [ ] 既存機能（レシピCRUD）がローカルDBで動作する
- [ ] 既存機能にデグレがない
- [ ] `README.md` にセットアップ手順が記載されている

---

## 🔗 参考資料

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Docker Compose PostgreSQL](https://hub.docker.com/_/postgres)
- [Vite環境変数](https://vite.dev/guide/env-and-mode.html)

---

## 📌 将来的な拡張

### Supabase CLIへの移行タイミング

以下の要件が発生した場合、Supabase CLIへの移行を検討：

- Auth機能の実装（ユーザー登録・ログイン）
- Storage機能の実装（レシピ画像アップロード）
- Realtime機能の実装（リアルタイム同期）

### 移行手順（参考）

1. Supabase CLI インストール: `npm install -g supabase`
2. プロジェクト初期化: `npx supabase init`
3. 既存マイグレーションを `supabase/migrations/` に配置
4. ローカルSupabase起動: `npx supabase start`
5. `docker-compose.yml` 削除（不要になる）
