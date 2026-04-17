# CLAUDE.md - Claude Code 設定

このファイルはプロジェクト全体で共有すべき設定・ルールのみを記載します。

**個人的な設定・ナレッジ**: `.claude/CLAUDE.personal.md` に記載（Git追跡対象外）

- ワークツリー配置方針・命名規則
- 個人的な開発Tips
- トラブルシューティングメモ
- 開発ルーチン

詳細: `.claude/CLAUDE.personal.md.example` を参照

---

## 🌐 言語設定（絶対遵守）

**CRITICAL: すべての応答は必ず日本語で行う**

- Claude Code本体、全Agentの応答
- タスク報告、エラーメッセージ、コード内コメント
- 例外: 技術用語、ライブラリ名、プログラミングキーワード

---

## 🚨 絶対ルール

### コード修正

#### 基本原則

- **Claude Code本体は原則としてコードを直接修正しない**
- コード修正は基本的に**Developer Agent**を使用
- **例外**: 軽微な修正のみ（typo、1-3行のバグ修正、コメント修正）

#### Developer Agent起動前の必須プロセス

1. **設計・調査フェーズ**（Claude Code本体が実施）
   - 既存コードの読み込み・分析
   - 影響範囲の特定
   - デグレリスク・破壊的変更の洗い出し
   - `docs/`に設計ドキュメント作成

2. **ユーザーとの対話**（必須・複数回）
   - AskUserQuestionツールで設計方針を確認
   - デグレリスク・破壊的変更について議論
   - 複数の選択肢を提示
   - **不明点を全てクリアにする**
   - **十分な対話と熟考なしにDeveloper起動禁止**

3. **計画確定後、Developer Agent起動**
   - ユーザー承認を得た計画をDeveloper Agentに渡す
   - Developer完了後、自動的にReview Agent起動（グローバル設定に従う）

#### Developer Agentの役割

- 確定した設計に従って実装
- テスト作成
- コードレビュー対応（Review Agent指摘事項の修正）

### Git操作ルール

#### ブランチ戦略: Git Flow

このプロジェクトは**Git Flow**を採用しています。詳細は[Git Flow戦略ガイド](docs/git-flow-strategy.md)を参照してください。

**ブランチ構造**:

```
main（本番環境）
  └─ develop（開発統合）
       ├─ feature/issue-XX-description（機能開発）
       ├─ bugfix/issue-XX-description（バグ修正）
       ├─ release/vX.Y.Z（リリース準備）
       └─ hotfix/vX.Y.Z-description（緊急修正）
```

**ブランチ命名規則**:
| プレフィックス | 用途 | 例 |
|---------------|------|-----|
| `feature/` | 新機能開発 | `feature/issue-42-recipe-image-upload` |
| `bugfix/` | バグ修正 | `bugfix/issue-15-search-crash` |
| `release/` | リリース準備 | `release/v1.0.0` |
| `hotfix/` | 本番緊急修正 | `hotfix/v1.0.1-security-fix` |

**Issue着手時の手順（🔴 必須）**:

新しいissueに着手する際は、必ず以下の手順を実施すること：

1. **developブランチに切り替え**

   ```bash
   git checkout develop
   git pull origin develop  # 最新状態に更新
   ```

2. **issue内容を確認**
   - `/get-github-issue <issue-number>` スキルを使用してissue内容を確認
   - 例: `/get-github-issue 22`

3. **新しいブランチを作成**

   ```bash
   # feature/issue-XX-description 形式
   git checkout -b feature/issue-22-domain-model

   # または bugfix/issue-XX-description 形式
   git checkout -b bugfix/issue-15-search-crash
   ```

4. **ブランチ名の要件**
   - ✅ 必ず `feature/` または `bugfix/` プレフィックスを使用
   - ✅ 必ずissue番号を含める（トレーサビリティ確保）
   - ✅ ケバブケース（小文字、ハイフン区切り）
   - ✅ 簡潔で内容が分かる名前（3-5単語程度）

**禁止事項**:

- ❌ mainブランチから直接feature/bugfixブランチを作成
- ❌ developブランチで直接コミット
- ❌ issue番号を含めないブランチ名
- ❌ 既存のfeature/bugfixブランチで別issueの作業

**基本ワークフロー**:

1. `develop`から`feature/`または`bugfix/`ブランチを作成
2. 開発 + テスト
3. `develop`へPR作成・マージ
4. リリース準備時は`release/`ブランチを作成
5. `main`へマージ + タグ付け
6. 緊急修正は`main`から`hotfix/`ブランチを作成

**重要な制約**:

- ✅ `main`: `release/*`または`hotfix/*`からのみマージ可能
- ✅ `develop`: すべての開発ブランチの統合先
- ❌ `feature/*`や`bugfix/*`から`main`へ直接マージ禁止
- ✅ マージ後は`main`にバージョンタグを付与（例: `v1.0.0`）

**Vercel連携**:

- `main`ブランチ → Production環境に自動デプロイ
- すべてのPR作成 → Preview環境が自動生成
  - ✅ `feature/*` → `develop` のPR → Preview環境で動作確認
  - ✅ `bugfix/*` → `develop` のPR → Preview環境で動作確認
  - ✅ `release/*` → `main` のPR → Preview環境で最終確認（本番デプロイ前）
  - ✅ `hotfix/*` → `main` のPR → Preview環境で確認
- ⚠️ PR作成後、Preview URLで十分な動作確認を実施してからマージすること

#### Git操作の権限

##### 絶対禁止

- `git push` - リモートへのプッシュ（ユーザーが実行）
- `git merge` - ブランチのマージ（PR経由で実行）
- `git rebase` - コミット履歴の書き換え

##### ユーザーの明示的な指示がある場合のみ許可

- `git commit` - **コミット作成は必ずユーザーに確認してから実行**
- **重要**: ファイルを編集した後、勝手にコミットを作成してはいけない
- ユーザーが「コミットしてください」「コミット作成してください」などと明示的に指示した場合のみコミット作成を実行

##### 自由に使用可能

- `git status` - 作業ツリーの状態確認
- `git add` - ステージングエリアへのファイル追加
- `git diff` - 変更内容の確認
- `git log` - コミット履歴の確認
- `git branch` - ブランチ一覧の確認
- `git tag` - タグの確認
- `worktree list` - ワークツリー一覧の確認

### コミット作成時の必須チェック（🔴 絶対遵守）

#### 基本原則

- **コミット作成前に必ず `mise run pre-commit:check` を実行**
- チェックが失敗した場合は修正してから再実行
- チェックが成功してからコミット作成

#### 実行フロー

```bash
# 1. 変更ファイルをステージング
git add <files>

# 2. pre-commitチェック実行（必須）
mise run pre-commit:check

# 3. チェックが成功したらコミット作成
git commit -m "$(cat <<'EOF'
✨ 機能の説明（1行目）

- 詳細1
- 詳細2

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

#### チェック失敗時の対応

1. **エラー内容を確認**
   - pre-commitが出力するエラーメッセージを読む
   - どのファイルのどの行に問題があるか特定

2. **修正実施**
   - 指摘された問題を修正
   - 必要に応じてコードフォーマット、lint修正

3. **再チェック**
   - 修正後、再度 `mise run pre-commit:check` を実行
   - 成功するまで繰り返す

4. **コミット作成**
   - チェックが成功したら `git commit` を実行

#### 絶対禁止事項

- ❌ **pre-commitチェックをスキップしてコミット作成**
  - 「軽微な変更だから不要」と判断してはいけない
  - 「時間がないから後で」と延期してはいけない

- ❌ **チェックが失敗したまま強制コミット**
  - `--no-verify` フラグの使用禁止
  - 問題を放置してコミットしてはいけない

- ❌ **エラーを無視して次の作業に進む**
  - pre-commitエラーは必ず修正してからコミット
  - 「他の人が修正する」と責任転嫁してはいけない

#### Supabase Preview環境トリガー（🔴 必須）

**背景**: Supabase Freeプランでは、`supabase/`ディレクトリ配下の変更がないとPreview環境が作成されない

**コミット作成時の必須手順**:

```bash
# 1. Supabase Preview環境トリガー（必須）
mise run supabase:trigger-preview

# 2. pre-commitチェック実行
mise run pre-commit:check

# 3. コミット作成
git commit -m "..."
```

**重要事項**:

- すべてのコミット作成前に必ず実行すること
- このステップを省略すると、PR作成時にSupabase Preview環境が作成されない
- `supabase/.preview-trigger`ファイルにタイムスタンプが追記される

### Issue作成ルール

#### 基本原則

- **すべてのissueには適切なラベルを必ず付与する**
- **issue本文は定型フォーマットに従って記載する**

#### ラベルの種類と用途

| ラベル名        | 用途                                  | 例                                   |
| --------------- | ------------------------------------- | ------------------------------------ |
| `環境構築`      | 開発環境・CI/CD・インフラ関連のタスク | Docker設定、mise導入、pre-commit設定 |
| `enhancement`   | 新機能追加・既存機能の改善タスク      | 画像アップロード機能、ソート機能     |
| `バグ`          | バグ修正・不具合対応タスク            | レイアウト崩れ、API通信エラー        |
| `documentation` | ドキュメント作成・更新タスク          | README更新、設計書作成、API仕様書    |

#### Issue本文の必須項目

すべてのissueには以下の項目を**必ず**含めること：

```markdown
## 概要

（1-2文で何をするissueなのかを簡潔に説明）

## 詳細

- 具体的な実装内容
- 対象ファイル・コンポーネント
- UI/UX要件（該当する場合）
- データベース変更（該当する場合）

## 要検討事項

- 技術選定で検討が必要な点
- 実装方針で判断が必要な点
- デグレリスク・破壊的変更の可能性
- （検討事項がない場合は「なし」と明記）

## 技術スタック

- 使用するライブラリ・フレームワーク
- 新規導入が必要な依存関係
- 関連する既存コード

## 受け入れ条件

- [ ] 機能が正常に動作すること
- [ ] 既存機能にデグレがないこと
- [ ] コードレビューが完了していること
- [ ] テストが追加されていること（該当する場合）
- [ ] ドキュメントが更新されていること（該当する場合）
```

#### Issue作成コマンド例

```bash
gh issue create \
  --title "🖼️ レシピ画像アップロード機能の実装" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
## 概要
レシピに画像を追加できるようにする機能を実装する。

## 詳細
...

## 要検討事項
...

## 技術スタック
...

## 受け入れ条件
- [ ] 機能が正常に動作すること
...
EOF
)"
```

#### 注意事項

- タイトルには絵文字を使用して視認性を向上させる（任意）
- 関連するissueがある場合は本文に記載（例: `## 関連Issue\n#123, #456`）
- 優先度が明確な場合は本文に記載（High/Medium/Low）
