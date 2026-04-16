---
name: get-github-issue
description: |
  GitHub issueの詳細情報を取得して表示します。ユーザーが「issue #XX の内容を教えて」「issue XX を確認して」「issue XX の詳細を見せて」「issue XX を表示して」などと依頼した際に使用します。gh CLIを使用してissueのタイトル、本文、ラベル、ステータス、担当者などの情報を取得し、読みやすい形式で提示します。
---

# GitHub Issue取得スキル

このスキルは、GitHub CLIを使用してissueの詳細情報を取得し、ユーザーに分かりやすく提示します。

## 使用タイミング

以下のようなユーザーの依頼でこのスキルを使用してください：

- 「issue #XX の内容を教えて」「issue #XX を確認して」
- 「issue XX の詳細を見せて」「issue XX を表示して」
- 「issue XX はどんな内容？」「issue XX について教えて」
- 「issue XX のステータスは？」

## Issue情報の取得

### 基本的な取得方法

`gh issue view`コマンドを使用してissue情報を取得します：

```bash
gh issue view <issue-number> --json title,body,state,labels,assignees,createdAt,updatedAt,url -q '.'
```

**取得できる情報**:
- `title`: issueのタイトル
- `body`: issueの本文
- `state`: ステータス（OPEN/CLOSED）
- `labels`: ラベル一覧
- `assignees`: 担当者一覧
- `createdAt`: 作成日時
- `updatedAt`: 最終更新日時
- `url`: issueのURL

### シンプルな取得（タイトルと本文のみ）

タイトルと本文だけが必要な場合：

```bash
gh issue view <issue-number> --json title,body -q '{title: .title, body: .body}'
```

これは軽量で高速な取得方法で、issueの概要を素早く確認したい場合に適しています。

## 情報の表示方法

取得したissue情報は、以下のような読みやすい形式でユーザーに提示します：

### 標準表示形式

```markdown
## Issue #XX: [タイトル]

**ステータス**: [OPEN/CLOSED]
**作成日**: [作成日時]
**最終更新**: [更新日時]
**URL**: [issueのURL]

### ラベル
- ラベル1
- ラベル2

### 担当者
- ユーザー名1
- ユーザー名2

### 本文

[issue本文をそのまま表示]
```

### 簡易表示形式

タイトルと本文のみを取得した場合：

```markdown
## Issue #XX: [タイトル]

[issue本文をそのまま表示]
```

## 取得パターン

### パターン1: 単一issueの詳細取得

ユーザーが特定のissue番号を指定した場合：

```bash
gh issue view 35 --json title,body,state,labels,assignees,createdAt,updatedAt,url -q '.'
```

結果を整形して表示します。

### パターン2: 複数issueの情報取得

ユーザーが複数のissueについて聞いた場合（例: "issue #33, #34, #35の内容を教えて"）：

```bash
# 各issueを順番に取得
for issue_num in 33 34 35; do
  echo "=== Issue #$issue_num ==="
  gh issue view $issue_num --json title,body,state -q '.'
done
```

各issueの情報を区切って表示します。

### パターン3: 関連issueの取得

issue本文に関連issueへの参照（例: `#123`）がある場合、必要に応じて関連issueも取得できます：

```bash
# 本文から関連issue番号を抽出して取得
gh issue view 35 --json body -q '.body' | grep -oE '#[0-9]+' | sort -u
```

ユーザーが「関連issueも見せて」と明示的に依頼した場合のみ実行します。

## エラーハンドリング

### Issue番号が存在しない場合

```bash
gh issue view 999
# Error: issue '999' not found
```

エラーが発生した場合は、ユーザーに以下を案内します：

- 「Issue #999 は見つかりませんでした」
- 「Issue番号が正しいか確認してください」
- 「または、issueが削除された可能性があります」

### gh CLIが利用できない場合

```bash
which gh || echo "gh CLI is not installed"
```

gh CLIが利用できない場合は、インストール方法を案内します：

```bash
# Homebrewでインストール（macOS/Linux）
brew install gh

# 認証
gh auth login
```

### 認証エラーの場合

```bash
# gh auth statusで認証状態を確認
gh auth status
```

認証が必要な場合は、`gh auth login`を案内します。

## JSON出力のパース

`gh issue view`は`--json`オプションで構造化データを取得できます。`-q`オプションで`jq`クエリを使用してフィルタリングします。

**例**:

```bash
# タイトルのみ取得
gh issue view 35 --json title -q '.title'

# ラベル名の配列を取得
gh issue view 35 --json labels -q '.labels[].name'

# カスタムフォーマット
gh issue view 35 --json title,state,url -q '"\(.title) (\(.state)) - \(.url)"'
```

## 応用例

### 例1: 特定のラベルを持つissueの検索

```bash
# "環境構築"ラベルを持つissueを取得
gh issue list --label "環境構築" --json number,title,state -q '.[] | "#\(.number): \(.title) (\(.state))"'
```

### 例2: 最近更新されたissueの取得

```bash
# 最近更新された5件のissueを取得
gh issue list --limit 5 --json number,title,updatedAt -q '.[] | "#\(.number): \(.title) (更新: \(.updatedAt))"'
```

### 例3: issue本文の特定セクション抽出

issue本文から特定のセクション（例: "## 受け入れ条件"）を抽出したい場合：

```bash
gh issue view 35 --json body -q '.body' | awk '/## 受け入れ条件/,/^## [^#]/ {print}'
```

ただし、これはユーザーが明示的に特定セクションを要求した場合のみ実行します。

## ベストプラクティス

### 情報の適切な粒度

ユーザーの質問に応じて、必要な情報のみを取得します：

- **「issue #35の内容を教えて」** → タイトルと本文のみ
- **「issue #35の詳細を見せて」** → 全情報（ラベル、担当者、日時等）
- **「issue #35のステータスは？」** → ステータスのみ

### 長い本文の扱い

issue本文が非常に長い場合（例: 500行以上）：

1. まず要約を提示する
2. 「全文を表示しますか？」とユーザーに確認する
3. 承認後に全文を表示する

または、セクション単位で表示する：

```markdown
## Issue #35: [タイトル]

### 概要セクション
[概要の内容]

### 詳細セクション
[詳細の内容]

...（他のセクションは折りたたみ）
```

### 複数issue取得時の配慮

複数のissueを一度に取得する場合は、処理時間を考慮します：

- 3件以内: そのまま順次取得
- 4件以上: 「X件のissueを取得します。少し時間がかかります」と通知

## まとめ

このスキルを使用することで：

- ✅ GitHub issueの情報を素早く取得
- ✅ 構造化された読みやすい形式で表示
- ✅ ユーザーの質問に応じた適切な粒度の情報提供
- ✅ エラー時の適切なガイダンス

ユーザーがissue情報の取得を依頼したら、このスキルに従って実行してください。
