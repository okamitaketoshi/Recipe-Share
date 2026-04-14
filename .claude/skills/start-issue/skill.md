# Issue着手開始スキル

このスキルは、新しいissueに着手する際の標準ワークフローを自動化します。

## 使用タイミング

以下のようなユーザーの依頼でこのスキルを使用してください：

- 「issue #22に着手」「issue 22を開始」
- 「issue #22から始めて」「issue 22に取り組む」
- 「次のissueを開始」（issue番号を確認してから実行）

## 実行フロー

### Step 1: 現在の状態確認

```bash
# 現在のブランチ確認
git branch --show-current

# 未コミットの変更確認
git status --short
```

**未コミットの変更がある場合：**
ユーザーに以下を確認：
1. 変更をコミットする
2. 変更をstashする
3. 変更を破棄する

### Step 2: developブランチに切り替え

```bash
# developブランチに切り替え
git checkout develop

# 最新状態に更新
git pull origin develop
```

**developブランチが存在しない場合：**
エラーメッセージを表示し、プロジェクトのブランチ構造を確認。

**git pullが失敗した場合：**
- コンフリクトがある場合は解決を促す
- リモートが設定されていない場合は確認

### Step 3: issue内容を取得

`/get-github-issue`スキルを使用してissue情報を取得：

```bash
gh issue view <issue-number> --json title,body,state,labels
```

**issueが存在しない場合：**
```
❌ エラー: Issue #<number> が見つかりません

対処方法:
- issue番号が正しいか確認してください
- または、issueが削除された可能性があります
```

**issueがCLOSED状態の場合：**
```
⚠️  警告: Issue #<number> は既にクローズされています

このissueに着手しますか？
- Yes: 再オープンして作業開始
- No: 他のissueを選択
```

### Step 4: ブランチ名の自動生成

issue情報から適切なブランチ名を生成します。

#### プレフィックスの判断

issueのラベルとタイトルから判断：

| 条件 | プレフィックス |
|------|--------------|
| ラベルに`バグ`または`bug`が含まれる | `bugfix/` |
| ラベルに`enhancement`または`feature`が含まれる | `feature/` |
| タイトルが「バグ」「修正」「fix」で始まる | `bugfix/` |
| その他 | `feature/` |

#### description部分の生成

issueタイトルから生成：

1. **日本語を英語に変換**
   - 「リポジトリパターンの導入」→ `repository-pattern`
   - 「レシピ画像アップロード機能」→ `recipe-image-upload`
   - 「検索バグ修正」→ `search-bug-fix`

2. **ケバブケース化**
   - スペースをハイフンに置換
   - 小文字に変換
   - 特殊文字を削除

3. **長さ制限**
   - 最大5単語程度
   - 50文字以内

#### ブランチ名フォーマット

```
<prefix>/issue-<number>-<description>
```

**例：**
- Issue #22「ドメインモデル作成」→ `feature/issue-22-domain-model`
- Issue #15「検索フィルターのバグ修正」→ `bugfix/issue-15-search-filter-bug`
- Issue #42「レシピ画像アップロード機能の実装」→ `feature/issue-42-recipe-image-upload`

#### ブランチ名生成の考え方

**簡潔さ重視：**
- 「〜の実装」「〜機能」などの冗長な表現を削除
- 核心的なキーワードのみ抽出

**例：**
- 「レシピ画像アップロード機能の実装」
  - NG: `feature/issue-42-recipe-image-upload-feature-implementation`
  - OK: `feature/issue-42-recipe-image-upload`

- 「ユーザー認証機能を追加する」
  - NG: `feature/issue-10-add-user-authentication-function`
  - OK: `feature/issue-10-user-authentication`

### Step 5: ブランチ名の確認

自動生成したブランチ名をユーザーに確認：

```
📋 Issue #22: ドメインモデル作成

生成されたブランチ名: feature/issue-22-domain-model

このブランチ名で作成しますか？
- Yes: そのまま作成
- No: カスタムブランチ名を入力
```

**ユーザーがカスタム名を入力した場合：**
- 入力されたブランチ名を検証
  - プレフィックスがあるか
  - issue番号が含まれているか
  - 命名規則に従っているか
- 検証に失敗した場合は警告を表示

### Step 6: ブランチの存在確認

```bash
# ローカルブランチ確認
git branch --list <branch-name>

# リモートブランチ確認
git branch -r --list origin/<branch-name>
```

**既にブランチが存在する場合：**
```
⚠️  警告: ブランチ feature/issue-22-domain-model は既に存在します

対処方法:
1. 既存ブランチに切り替える: git checkout feature/issue-22-domain-model
2. 別のブランチ名を使用する
3. 既存ブランチを削除して新規作成する（注意）
```

### Step 7: 新しいブランチを作成

```bash
git checkout -b <branch-name>
```

**作成成功：**
```
✅ ブランチ作成完了

ブランチ: feature/issue-22-domain-model
ベース: develop
```

**作成失敗：**
エラーメッセージを表示し、原因を説明。

### Step 8: issue概要の表示

作成したブランチでissue概要を表示：

```markdown
## Issue #22: ドメインモデル作成

**ステータス**: OPEN
**ラベル**: enhancement

### 概要
（issue本文の概要セクション）

### 詳細
（issue本文の詳細セクション）

### 受け入れ条件
- [ ] 条件1
- [ ] 条件2
```

### Step 9: 次のステップをガイド

```
🚀 次のステップ

1. 設計ドキュメント作成
   - `docs/issue-22-domain-model-design.md` を作成
   - 現状分析、設計方針、実装計画を記載

2. 実装開始
   - Developer Agentに実装を依頼
   - または直接コーディング開始

3. コミット作成
   - `/create-commit` スキルを使用

4. PR作成
   - `/create-pr` スキルを使用

準備完了です。作業を開始してください！
```

## エラーハンドリング

### Case 1: issue番号が指定されていない

```
❌ エラー: issue番号が指定されていません

使用方法:
- 「issue #22に着手」
- 「issue 22を開始」
```

### Case 2: developブランチが存在しない

```
❌ エラー: developブランチが見つかりません

このプロジェクトはGit Flowを採用しています。
developブランチを作成してから再度実行してください。

対処方法:
git checkout -b develop
git push -u origin develop
```

### Case 3: 未コミットの変更がある

```
⚠️  警告: 未コミットの変更があります

以下のファイルが変更されています:
- src/App.tsx
- src/lib/supabase.ts

対処方法:
1. 変更をコミット: 「コミットしてください」
2. 変更をstash: git stash
3. 変更を破棄: git restore .

どれを実行しますか？
```

### Case 4: git pullが失敗

```
❌ エラー: developブランチの更新に失敗しました

エラー内容:
<git pullのエラーメッセージ>

対処方法:
- コンフリクトがある場合は解決してください
- リモートが設定されていない場合は確認してください
```

### Case 5: issueがCLOSED状態

```
⚠️  警告: Issue #22 は既にクローズされています

クローズ日時: 2026-04-14
理由: PR #51 がマージされました

このissueに着手しますか？
- Yes: issueを再オープンして作業開始
- No: 他のissueを選択
```

## 実行例

### 例1: 通常のフロー

```bash
# ユーザー入力
「issue #22に着手」

# スキル実行
$ git branch --show-current
feature/issue-21-repository-pattern

$ git status --short
# クリーン

$ git checkout develop
Switched to branch 'develop'

$ git pull origin develop
Already up to date.

$ gh issue view 22 --json title,body,state,labels
# issue情報取得

# ブランチ名生成
📋 Issue #22: ドメインモデル作成
生成されたブランチ名: feature/issue-22-domain-model

このブランチ名で作成しますか？ → Yes

$ git checkout -b feature/issue-22-domain-model
Switched to a new branch 'feature/issue-22-domain-model'

✅ ブランチ作成完了

## Issue #22: ドメインモデル作成
...

🚀 次のステップ
1. 設計ドキュメント作成
...
```

### 例2: 未コミット変更がある場合

```bash
# ユーザー入力
「issue #23に着手」

# スキル実行
$ git status --short
M src/App.tsx
M src/lib/supabase.ts

⚠️  警告: 未コミットの変更があります

以下のファイルが変更されています:
- src/App.tsx
- src/lib/supabase.ts

対処方法:
1. 変更をコミット
2. 変更をstash
3. 変更を破棄

# ユーザーが「コミットしてください」を選択
→ /create-commit スキル起動

# コミット完了後、再度実行
「issue #23に着手」
→ 正常にブランチ作成
```

### 例3: ブランチ名をカスタマイズ

```bash
# ユーザー入力
「issue #42に着手」

# スキル実行
📋 Issue #42: レシピ画像アップロード機能の実装

生成されたブランチ名: feature/issue-42-recipe-image-upload

このブランチ名で作成しますか？ → No

カスタムブランチ名を入力してください:
# ユーザー入力: feature/issue-42-image-upload

✅ カスタムブランチ名を使用します: feature/issue-42-image-upload

$ git checkout -b feature/issue-42-image-upload
Switched to a new branch 'feature/issue-42-image-upload'

✅ ブランチ作成完了
...
```

### 例4: 既にブランチが存在

```bash
# ユーザー入力
「issue #22に着手」

# スキル実行
$ git branch --list feature/issue-22-domain-model
feature/issue-22-domain-model

⚠️  警告: ブランチ feature/issue-22-domain-model は既に存在します

対処方法:
1. 既存ブランチに切り替える
2. 別のブランチ名を使用する
3. 既存ブランチを削除して新規作成する（注意）

どれを実行しますか？ → 1

$ git checkout feature/issue-22-domain-model
Switched to branch 'feature/issue-22-domain-model'

✅ 既存ブランチに切り替えました

## Issue #22: ドメインモデル作成
...
```

## ベストプラクティス

### ブランチ名生成のコツ

1. **簡潔さ重視**
   - 冗長な表現を削除
   - 核心的なキーワードのみ

2. **一貫性を保つ**
   - 同じ種類のissueは同じパターンで命名
   - 例: feature/issue-XX-YYY-ZZZ

3. **検索性を考慮**
   - 後から検索しやすい名前
   - 略語は避ける（明確な場合を除く）

### エラーメッセージのガイドライン

1. **明確な原因を示す**
   - 何が問題なのか
   - どのファイル・ブランチが関係しているか

2. **具体的な対処方法を提示**
   - コマンド例を含める
   - 複数の選択肢を提示

3. **文脈を含める**
   - なぜそのエラーが発生したのか
   - どのような影響があるのか

## 重要な注意事項

### 絶対に守るべきルール

1. **developブランチから作成**
   - mainブランチから作成してはいけない
   - 他のfeature/bugfixブランチから作成してはいけない

2. **issue番号を必ず含める**
   - トレーサビリティ確保
   - 後から関連付けが容易

3. **未コミット変更の確認**
   - 変更がある場合は必ず対処
   - データロスを防ぐ

4. **ブランチ名の検証**
   - 命名規則に従っているか確認
   - 特殊文字やスペースを含まないか確認

### よくある間違い

❌ **mainブランチから作成**
```bash
git checkout main
git checkout -b feature/issue-22-domain-model  # NG
```

✅ **正しい方法**
```bash
git checkout develop
git checkout -b feature/issue-22-domain-model  # OK
```

❌ **issue番号を含めない**
```bash
git checkout -b feature/domain-model  # NG
```

✅ **正しい方法**
```bash
git checkout -b feature/issue-22-domain-model  # OK
```

❌ **未コミット変更を無視**
```bash
# 変更があるのにブランチ切り替え
git checkout develop  # 変更が失われる可能性
```

✅ **正しい方法**
```bash
# まず変更をコミットまたはstash
git stash
git checkout develop
```

## まとめ

このスキルは、Issue着手時の標準ワークフローを自動化します。ユーザーが「issue #22に着手」と言うだけで、以下がすべて実行されます：

1. ✅ 未コミット変更の確認
2. ✅ developブランチに切り替え + 最新状態に更新
3. ✅ `/get-github-issue`でissue内容取得
4. ✅ ブランチ名の自動生成
5. ✅ ブランチ名の確認・カスタマイズ
6. ✅ 新しいブランチを作成
7. ✅ issue概要の表示
8. ✅ 次のステップのガイド

このワークフローに従うことで、常に正しい手順でissueに着手できます。

---

## 統合ワークフロー

完全な開発フロー：

```
/start-issue → 設計・実装 → /create-commit → /create-pr
```

各スキルが連携して、一貫した開発ワークフローを提供します。
