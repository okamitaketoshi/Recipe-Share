---
name: create-commit
description: |
  Gitコミット作成を自動化するスキル。ユーザーが「コミットしてください」「コミット作成してください」「コミットお願いします」などと明示的に指示した場合に使用する。
  
  CLAUDE.mdに記載された厳格なルールに従い、以下を自動実行:
  - ブランチの適切性チェックと新規作成
  - Supabase Preview環境トリガー
  - pre-commitチェック
  - 構造化されたコミットメッセージ生成
  - コミット実行
  
  このスキルはコミット作成の明示的な指示に対して必ず使用すること。「変更を保存」「git commit」などの類似表現も含む。
---

# Git Commit Creation Skill

このスキルは、CLAUDE.mdに定義されたコミット作成ルールに完全準拠した自動コミット作成を実現します。

## 重要な前提

このプロジェクトでは、以下の順序でコミット作成を行うことが**必須**です：

1. ブランチチェック・作成
2. Supabase Preview環境トリガー (`mise run supabase:trigger-preview`)
3. pre-commitチェック (`mise run pre-commit:check`)
4. コミット作成

これらのステップを省略してはいけません。

## 実行フロー

### Step 1: 現在の状態確認

```bash
# 現在のブランチ確認
git branch --show-current

# 変更ファイル確認
git status

# 変更差分確認（コミットメッセージ生成に使用）
git diff --cached
git diff
```

### Step 2: ブランチの適切性判断と作成

現在のブランチと変更内容の関連性を判断します。

#### 判断基準

**新ブランチが必要な場合：**
- 現在のブランチが`main`または`master`
- 現在のブランチ名と変更内容が関連していない

**既存ブランチを使用する場合：**
- ブランチ名と変更内容が明確に関連している

#### ブランチ名生成ルール

変更内容に基づいて適切なプレフィックスとブランチ名を生成：

| プレフィックス | 用途 | 例 |
|--------------|------|-----|
| `feature/` | 新機能追加 | `feature/recipe-image-upload` |
| `fix/` | バグ修正 | `fix/search-filter-bug` |
| `docs/` | ドキュメントのみ変更 | `docs/update-readme` |
| `chore/` | 設定・環境構築・ツール | `chore/mise-task-update` |
| `test/` | テスト追加・修正 | `test/add-unit-tests` |
| `refactor/` | リファクタリング | `refactor/extract-components` |

**ブランチ名の命名規則：**
- ケバブケース（小文字、ハイフン区切り）
- 簡潔で内容が分かる名前（3-5単語程度）
- 具体的で一意な名前

**例：**

```bash
# mainブランチにいて、レシピ画像アップロード機能を追加した場合
git checkout -b feature/recipe-image-upload

# feature/recipe-searchブランチにいて、mise.tomlを変更した場合（無関係）
git checkout -b chore/add-mise-tasks
```

#### 関連性判断の例

**関連あり（既存ブランチ使用）：**
- ブランチ: `feature/recipe-image-upload`
- 変更: `src/components/ImageUpload.tsx`, `src/hooks/useImageUpload.ts`
- 判定: 画像アップロード機能に関連 → **そのまま使用**

**関連なし（新ブランチ作成）：**
- ブランチ: `feature/recipe-image-upload`
- 変更: `mise.toml`, `CLAUDE.md`, `.gitignore`
- 判定: mise設定変更で画像アップロードと無関係 → **`chore/mise-config-update`を作成**

### Step 3: 変更ファイルのステージング

変更されたファイルをすべてステージングします：

```bash
# すべての変更をステージング
git add -A

# または、特定のファイルのみ
git add <file1> <file2> ...
```

**注意事項：**
- `.env`、`*.secret`などの機密情報ファイルは除外（pre-commitで検出されます）
- 不要な一時ファイル（`.DS_Store`など）も除外

### Step 4: Supabase Preview環境トリガー（必須）

**このステップは絶対に省略してはいけません。**

```bash
mise run supabase:trigger-preview
```

このコマンドは`supabase/.preview-trigger`ファイルにタイムスタンプを追記し、Supabase Freeプランでも確実にPreview環境が作成されるようにします。

**期待される出力：**
```
🔄 Supabase Preview環境トリガー用ファイルを更新...
✅ supabase/.preview-trigger を更新しました
```

### Step 5: pre-commitチェック（必須）

**このステップも絶対に省略してはいけません。**

```bash
mise run pre-commit:check
```

このコマンドは以下のチェックを実行します：
1. TypeScript型チェック
2. ESLint自動修正 + チェック
3. Prettier自動整形
4. 機密情報チェック

**期待される出力：**
```
🚀 pre-commitチェック開始...
📝 [1/4] TypeScript型チェック...
✅ TypeScript型チェック完了
🔍 [2/4] ESLint自動修正 + チェック...
✅ ESLint完了
💅 [3/4] Prettier自動整形...
✅ Prettier完了
🔒 [4/4] 機密情報チェック...
✅ 機密情報チェック完了
✨ すべてのチェックが完了しました！
```

#### チェック失敗時の対応

pre-commitチェックが失敗した場合：

1. **エラー内容を確認**して問題を特定
2. **修正を実施**（自動修正されたファイルは再ステージング）
3. **再度チェック実行**
4. 成功するまで繰り返す

**絶対に以下を行ってはいけません：**
- `--no-verify`フラグでチェックをスキップ
- エラーを無視してコミット作成

**Prettier自動整形後の対応：**
```bash
# Prettierがファイルを整形した場合、再度ステージング
git add <整形されたファイル>
```

### Step 6: コミットメッセージ生成

変更内容を分析して、構造化されたコミットメッセージを生成します。

#### 絵文字の選択

変更内容に基づいて適切な絵文字を選択：

| 絵文字 | 用途 | 例 |
|-------|------|-----|
| ✨ | 新機能追加 | ユーザー認証、画像アップロード |
| 🐛 | バグ修正 | レイアウト崩れ、API通信エラー |
| 🔧 | 設定・環境構築 | mise.toml、Vercel設定 |
| 📝 | ドキュメント更新 | README、CLAUDE.md |
| 🧪 | テスト追加 | ユニットテスト、E2Eテスト |
| ⚡ | パフォーマンス改善 | クエリ最適化、キャッシュ |
| 🔒 | セキュリティ | 認証強化、脆弱性修正 |
| ♻️ | リファクタリング | コード整理、重複削除 |
| 🎨 | UI/UXデザイン | スタイル変更、レイアウト |
| 🚀 | デプロイ関連 | CI/CD、ビルド設定 |

#### メッセージ構造

**基本フォーマット：**

```
<絵文字> <簡潔なタイトル（50文字以内）>

<空行>

## 背景 / ## 概要
（なぜこの変更が必要だったのか）

## 詳細
- 変更内容の箇条書き
- 具体的なファイルや実装内容

## 使用方法（該当する場合）
```bash
# コマンド例
```

## その他（該当する場合）
- 関連Issue: #123
- 破壊的変更: なし
- テスト: 追加済み

<空行>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

#### メッセージ生成の考え方

**タイトル行：**
- 50文字以内
- 命令形（「追加」「修正」「更新」）
- 具体的で分かりやすい

**本文：**
- **背景/概要**: なぜこの変更が必要だったのか
- **詳細**: 何を変更したのか（ファイル名、実装内容）
- **使用方法**: 新しいコマンドや機能の使い方（該当する場合）
- **その他**: 関連Issue、破壊的変更、テスト状況など

**例1: 新機能追加**
```
✨ レシピ画像アップロード機能を実装

## 概要
レシピに画像を追加できるようにする機能を実装。
ユーザーがレシピを視覚的に確認できるようになる。

## 詳細
- `src/components/ImageUpload.tsx` - 画像アップロードコンポーネント
- `src/hooks/useImageUpload.ts` - アップロードロジック
- `src/api/upload.ts` - Supabase Storage API連携
- スキーマにimage_url列を追加

## 使用方法
レシピフォームに画像アップロードボタンが表示され、
クリックして画像を選択すると自動的にSupabase Storageにアップロード。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**例2: バグ修正**
```
🐛 検索フィルターが正常に動作しない問題を修正

## 背景
材料検索で特定の材料を入力すると、
検索結果が0件になる不具合が発生していた。

## 詳細
- `src/lib/search.ts` - 検索ロジックの修正
  - 正規表現のエスケープ処理を追加
  - 大文字小文字を区別しないように変更
- テストケースを追加

## 修正内容
特殊文字（括弧、ドットなど）を含む材料名でも
正しく検索できるようになった。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**例3: 設定ファイル更新**
```
🔧 Supabase Preview環境トリガー用mise task追加

## 背景
Supabase Freeプランでは、supabaseディレクトリ配下の変更がないと
Preview環境が作成されないため、コミット時に必ず実行する仕組みを導入。

## 詳細
- `mise.toml` - `supabase:trigger-preview`タスクを追加
- `CLAUDE.md` - コミット時の必須手順として記載
- `supabase/.preview-trigger` - トリガー用ファイルを作成

## 使用方法
```bash
# コミット前に実行（必須）
mise run supabase:trigger-preview
```

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

#### メッセージ生成時の注意点

1. **変更内容を正確に把握する**
   - `git diff`の出力を読んで実際の変更を確認
   - ファイル名だけでなく、コードの変更内容も理解

2. **ユーザーの意図を反映する**
   - ユーザーが「なぜこの変更をしたか」を考慮
   - 会話履歴から背景や目的を抽出

3. **簡潔で明確に**
   - 冗長な説明を避ける
   - 箇条書きで読みやすく

4. **一貫性を保つ**
   - プロジェクトの過去のコミットメッセージを参考に
   - 同じスタイルを維持

### Step 7: コミット作成

生成したメッセージでコミットを作成：

```bash
git commit -m "$(cat <<'EOF'
<生成したコミットメッセージ全体>
EOF
)"
```

**HEREDOCを使用する理由：**
- 複数行のメッセージを正しく処理
- 特殊文字のエスケープ問題を回避
- 可読性の向上

### Step 8: 結果報告

コミット作成後、以下を報告：

```bash
# コミットログ確認
git log --oneline -1

# 現在のブランチ確認
git branch --show-current
```

**報告内容：**
- ✅ コミット作成完了
- ブランチ名: `feature/xxx`
- コミットハッシュ: `abc1234`
- コミットタイトル

## エラーハンドリング

### pre-commitチェック失敗

**TypeScriptエラー：**
```
npm run typecheck
# エラー箇所を確認して修正
```

**ESLintエラー：**
```
npm run lint
# 自動修正が適用されるので、再度git add
```

**機密情報検出：**
```
# 該当ファイルを確認
# .gitignoreに追加するか、ファイルから機密情報を削除
```

### コミット失敗

**コミットフックエラー：**
- フックのエラーメッセージを確認
- 問題を修正してから再度コミット
- `--no-verify`は絶対に使用しない

## 実行例

### 例1: 新機能追加（mainブランチから）

```bash
# 現在: mainブランチ、ImageUpload.tsxを追加

$ git branch --show-current
main

$ git status
modified: src/components/ImageUpload.tsx
new file: src/hooks/useImageUpload.ts

# → feature/recipe-image-uploadブランチを作成
$ git checkout -b feature/recipe-image-upload

$ git add -A
$ mise run supabase:trigger-preview
$ mise run pre-commit:check
$ git commit -m "✨ レシピ画像アップロード機能を実装..."

✅ コミット作成完了
ブランチ: feature/recipe-image-upload
コミット: abc1234 ✨ レシピ画像アップロード機能を実装
```

### 例2: 既存ブランチで関連する変更

```bash
# 現在: feature/recipe-image-uploadブランチ

$ git status
modified: src/components/ImageUpload.tsx
modified: src/api/upload.ts

# → ブランチ名と変更内容が関連 → そのまま使用

$ git add -A
$ mise run supabase:trigger-preview
$ mise run pre-commit:check
$ git commit -m "⚡ 画像アップロードのパフォーマンス改善..."

✅ コミット作成完了
ブランチ: feature/recipe-image-upload（既存）
コミット: def5678 ⚡ 画像アップロードのパフォーマンス改善
```

### 例3: 既存ブランチで無関係な変更

```bash
# 現在: feature/recipe-image-uploadブランチ

$ git status
modified: mise.toml
modified: CLAUDE.md

# → ブランチ名と変更内容が無関係 → 新ブランチ作成

$ git checkout -b chore/mise-task-update

$ git add -A
$ mise run supabase:trigger-preview
$ mise run pre-commit:check
$ git commit -m "🔧 mise taskを追加..."

✅ コミット作成完了
ブランチ: chore/mise-task-update（新規作成）
コミット: ghi9012 🔧 mise taskを追加
```

## 重要な注意事項

### 絶対に守るべきルール

1. **Supabase Preview環境トリガーは必須**
   - すべてのコミット前に実行
   - このステップを省略すると、PR作成時にPreview環境が作成されない

2. **pre-commitチェックは必須**
   - チェック失敗時は必ず修正
   - `--no-verify`でスキップしてはいけない

3. **ブランチチェックは必須**
   - mainブランチに直接コミットしない
   - 変更内容と無関係なブランチを使用しない

4. **コミットメッセージは構造化**
   - 絵文字、タイトル、本文、Co-Authored-By行を含める
   - HEREDOCを使用して正しくフォーマット

### よくある間違い

❌ **mainブランチに直接コミット**
```bash
# mainブランチで変更 → コミット（NG）
git commit -m "fix bug"
```

✅ **正しい方法**
```bash
# 新ブランチを作成してからコミット
git checkout -b fix/search-bug
git commit -m "..."
```

❌ **pre-commitチェックをスキップ**
```bash
git commit --no-verify -m "..."
```

✅ **正しい方法**
```bash
mise run pre-commit:check
# エラーがあれば修正
git commit -m "..."
```

❌ **Supabase Preview環境トリガーを省略**
```bash
# トリガーなしでコミット（NG）
git commit -m "..."
```

✅ **正しい方法**
```bash
mise run supabase:trigger-preview
mise run pre-commit:check
git commit -m "..."
```

## まとめ

このスキルは、CLAUDE.mdに定義されたコミット作成ルールを完全自動化します。ユーザーが「コミットしてください」と言うだけで、以下がすべて実行されます：

1. ✅ 適切なブランチチェック・作成
2. ✅ Supabase Preview環境トリガー
3. ✅ pre-commitチェック（型チェック、lint、整形、機密情報チェック）
4. ✅ 構造化されたコミットメッセージ自動生成
5. ✅ コミット作成・結果報告

このワークフローに従うことで、常に高品質で一貫性のあるコミットが作成されます。
