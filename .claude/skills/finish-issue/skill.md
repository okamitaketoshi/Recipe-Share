---
name: finish-issue
description: PRマージ後のissue後片付けスキル。worktree削除、ブランチ削除、developブランチ最新化、issue クローズを自動実行。PRマージ後に必ず使用すること。
---

# PRマージ後のIssue後片付けスキル

このスキルは、PRマージ後のissue後片付け作業を自動化します。

## 使用タイミング

以下のようなユーザーの依頼でこのスキルを使用してください：

- 「PRマージしたので後片付けして」「PRマージ後の処理を実行して」
- 「issue #22を終了して」「issue #22のworktreeを削除して」
- 「developを最新化してworktreeを削除」

**重要**: このスキルはPRがマージされた後にのみ実行してください。マージ前に実行すると作業中のコードが失われます。

## 実行フロー

### Step 1: 現在の状態確認

```bash
# 現在のディレクトリ確認
pwd

# worktree一覧確認
git worktree list
```

**worktree内にいる場合：**
元のディレクトリに戻る必要があります。

### Step 2: 元のディレクトリに戻る

```bash
# プロジェクトルートに戻る
cd /Users/okamit/dev/Recipe-Share
```

**注意事項**:
- worktree内にいる状態では、そのworktreeを削除できない
- 必ず元のディレクトリ（プロジェクトルート）に戻ってから作業

### Step 3: developブランチに切り替え

```bash
# developブランチに切り替え
git checkout develop
```

**既にdevelopブランチにいる場合：**
「Already on 'develop'」と表示されるが、問題ありません。

**別のブランチにいる場合：**
未コミットの変更がある場合は警告を表示し、ユーザーに確認します。

### Step 4: developブランチを最新化

```bash
# リモートのdevelopブランチから最新を取得
git pull origin develop
```

**期待される出力**:
```
From https://github.com/owner/repo
 * branch            develop    -> FETCH_HEAD
Already up to date.
```

または

```
Updating abc1234..def5678
Fast-forward
 ...
```

**コンフリクトが発生した場合：**
```
❌ エラー: developブランチの更新でコンフリクトが発生しました

対処方法:
1. コンフリクトを解決: git status で確認
2. 手動でマージ: git merge --abort で中断してから再度実行
```

### Step 5: 最新コミット確認

```bash
# developブランチの最新コミットを確認
git log --oneline -5
```

**確認ポイント**:
- マージコミットが最新になっているか
- issue番号が含まれているか

**例**:
```
fe862c2 Merge pull request #53 from okamitaketoshi/feature/issue-22-domain-model
545d93f ✨ ドメインモデルとvitest環境を実装
```

### Step 6: issue番号の特定

ユーザーが明示的にissue番号を指定していない場合、以下の方法でissue番号を特定します：

**方法1: ユーザーに確認**
```
どのissueを終了しますか？

例: issue #22、issue 22
```

**方法2: 最新のマージコミットから抽出**
```bash
# 最新のマージコミットからissue番号を抽出
git log --oneline -1 | grep -oE '#[0-9]+' | head -1
```

例: `Merge pull request #53 from...` → `#53`

ただし、これはPR番号なので、PR内容を確認してissue番号を特定する必要があります。

**推奨**: ユーザーに明示的に確認する方が確実です。

### Step 7: worktreeの特定と削除

issue番号からworktreeディレクトリ名を特定します。

**命名規則**:
- `wt-issue-<number>-<description>` 形式
- 例: `wt-issue-22-domain-model`

**worktree削除手順**:

```bash
# worktree一覧でissue番号を含むものを検索
git worktree list | grep "wt-issue-22"

# 該当worktreeを削除
git worktree remove wt-issue-22-domain-model
```

**複数のworktreeが見つかった場合：**
ユーザーにどれを削除するか確認します。

```
以下のworktreeが見つかりました：
1. wt-issue-22-domain-model
2. wt-issue-22-tests

どれを削除しますか？（すべて削除する場合は "all"）
```

**worktreeが見つからない場合：**
```
⚠️  警告: issue #22のworktreeが見つかりません

対処方法:
- worktreeを使用していない可能性があります
- または既に削除されています
- ブランチ削除のみ実行します
```

### Step 8: ローカルブランチの削除

```bash
# マージ済みブランチを削除
git branch -d feature/issue-22-domain-model
```

**期待される出力**:
```
Deleted branch feature/issue-22-domain-model (was 545d93f).
```

**ブランチ名の特定**:
issue番号から推測するか、ユーザーに確認します。

**命名規則**:
- `feature/issue-<number>-<description>`
- `bugfix/issue-<number>-<description>`
- `chore/issue-<number>-<description>`

**ブランチが見つからない場合：**
```
⚠️  警告: issue #22のブランチが見つかりません

対処方法:
- 既に削除されている可能性があります
- または別の名前で作成されています
- 次のステップに進みます
```

**マージされていないブランチの場合：**
```
❌ エラー: ブランチがマージされていません

error: The branch 'feature/issue-22-domain-model' is not fully merged.
If you are sure you want to delete it, run 'git branch -D feature/issue-22-domain-model'.

対処方法:
- PRがマージされているか確認してください
- 強制削除する場合は git branch -D を使用（注意）
```

### Step 9: issueのクローズ

```bash
# issueをクローズ（コメント付き）
gh issue close <issue-number> --comment "✅ PR #<pr-number> がマージされ、実装が完了しました。

## 完了内容
- （実装内容を箇条書き）

developブランチにマージ済みです。"
```

**期待される出力**:
```
✓ Closed issue #22
```

**既にクローズされている場合：**
```
! Issue owner/repo#22 (タイトル) is already closed
```

これは問題ありません。PRマージ時に自動クローズされている可能性があります。

**issueが見つからない場合：**
```
❌ エラー: Issue #22 が見つかりません

対処方法:
- issue番号が正しいか確認してください
- または、issueが削除された可能性があります
```

### Step 10: 結果報告

すべての作業が完了したら、結果を報告します。

```
✅ Issue #22 の後片付けが完了しました

## 実施した作業
1. ✅ developブランチに切り替え
2. ✅ developブランチ最新化（最新コミット: fe862c2）
3. ✅ worktree削除（wt-issue-22-domain-model）
4. ✅ ローカルブランチ削除（feature/issue-22-domain-model）
5. ✅ issue #22 クローズ

## 現在の状態
- 現在のブランチ: develop（最新）
- アクティブなworktree: （残存worktreeのリスト）

次のissueに取り組めます！
```

## エラーハンドリング

### Case 1: worktree内で実行された場合

```
❌ エラー: worktree内にいるため削除できません

現在のディレクトリ: /Users/user/project/wt-issue-22-domain-model

対処方法:
プロジェクトルートに移動してから再実行してください。
cd /Users/user/project
```

**自動対応**:
スキルが自動的にプロジェクトルートに移動します。

### Case 2: developブランチの更新でコンフリクト

```
❌ エラー: developブランチの更新でコンフリクトが発生しました

対処方法:
1. コンフリクトを確認: git status
2. コンフリクトを解決してから再実行
3. または git merge --abort で中断
```

### Case 3: worktreeが見つからない

```
⚠️  警告: issue #22のworktreeが見つかりません

既に削除されているか、worktreeを使用していない可能性があります。
ブランチ削除のみ実行します。
```

### Case 4: ブランチがマージされていない

```
❌ エラー: ブランチがマージされていません

ブランチ: feature/issue-22-domain-model

対処方法:
1. PRがマージされているか確認
2. マージされている場合は git branch -D で強制削除
3. マージされていない場合は作業を保存してからマージ
```

### Case 5: gh CLIが利用できない

```
❌ エラー: gh CLIがインストールされていません

対処方法:
1. gh CLIをインストール: brew install gh
2. 認証: gh auth login
3. 再実行
```

## 実行例

### 例1: 標準的なフロー

```bash
# ユーザー入力
「PRマージしたので後片付けして」

# スキル実行
$ pwd
/Users/user/project/wt-issue-22-domain-model

# → プロジェクトルートに移動
$ cd /Users/user/project

$ git checkout develop
Already on 'develop'

$ git pull origin develop
From https://github.com/owner/repo
 * branch            develop    -> FETCH_HEAD
Already up to date.

$ git log --oneline -5
fe862c2 Merge pull request #53 from owner/feature/issue-22-domain-model
545d93f ✨ ドメインモデルとvitest環境を実装
...

# issue番号を確認
どのissueを終了しますか？ → issue #22

$ git worktree list | grep "wt-issue-22"
/Users/user/project/wt-issue-22-domain-model   545d93f [feature/issue-22-domain-model]

$ git worktree remove wt-issue-22-domain-model

$ git branch -d feature/issue-22-domain-model
Deleted branch feature/issue-22-domain-model (was 545d93f).

$ gh issue close 22 --comment "..."
✓ Closed issue #22

✅ Issue #22 の後片付けが完了しました
...
```

### 例2: 複数worktreeがある場合

```bash
# ユーザー入力
「issue #22を終了して」

# スキル実行
$ git worktree list
/Users/user/project                            fe862c2 [develop]
/Users/user/project/wt-issue-22-domain-model   545d93f [feature/issue-22-domain-model]
/Users/user/project/wt-issue-22-tests          abc1234 [feature/issue-22-tests]
/Users/user/project/wt-issue-23-usecase-layer  def5678 [feature/issue-23-usecase-layer]

以下のworktreeが見つかりました（issue #22関連）：
1. wt-issue-22-domain-model
2. wt-issue-22-tests

どれを削除しますか？（すべて削除する場合は "all"）
→ all

$ git worktree remove wt-issue-22-domain-model
$ git worktree remove wt-issue-22-tests

✅ 2つのworktreeを削除しました
...
```

### 例3: 既にissueがクローズされている場合

```bash
# ユーザー入力
「issue #22の後片付けして」

# スキル実行
...
$ gh issue close 22 --comment "..."
! Issue owner/repo#22 (ドメインモデルの作成) is already closed

✅ Issue #22 は既にクローズされています（PRマージ時に自動クローズ）

✅ Issue #22 の後片付けが完了しました
...
```

## ベストプラクティス

### issue番号の確認

1. **ユーザーに明示的に確認**
   - 推測ではなく、ユーザーに issue番号を確認する
   - 間違ったissueを終了するリスクを回避

2. **最新のマージコミットから推測**
   - PR番号とissue番号は異なる場合がある
   - PR本文を確認してissue番号を特定

### worktree削除のタイミング

1. **PRマージ後すぐに削除**
   - 不要なディスク容量を解放
   - 混乱を避ける

2. **複数worktreeの管理**
   - 並行開発中の場合は削除するworktreeを慎重に選択
   - `git worktree list`で確認してから削除

### ブランチ削除の注意事項

1. **マージ確認**
   - PRがマージされているか必ず確認
   - マージされていないブランチは削除しない

2. **リモートブランチは削除しない**
   - ローカルブランチのみ削除
   - リモートブランチはGitHub上で削除（PRマージ時のオプション）

## 重要な注意事項

### 絶対に守るべきルール

1. **PRマージ後にのみ実行**
   - マージ前に実行すると作業中のコードが失われる
   - 必ずPRがマージされたことを確認してから実行

2. **worktree内にいない状態で削除**
   - worktree内で削除しようとするとエラー
   - 必ずプロジェクトルートに戻ってから削除

3. **issue番号を確認**
   - 間違ったissueを終了しないように注意
   - ユーザーに明示的に確認

4. **developブランチを最新化**
   - マージ後の最新状態に更新
   - 次の作業で古いコードベースを使わないように

### よくある間違い

❌ **worktree内で削除しようとする**
```bash
# wt-issue-22内で実行（NG）
git worktree remove wt-issue-22
```

✅ **正しい方法**
```bash
# プロジェクトルートに戻ってから削除
cd /Users/user/project
git worktree remove wt-issue-22
```

❌ **PRマージ前に削除**
```bash
# マージ前に削除（NG）
git worktree remove wt-issue-22  # 作業中のコードが失われる
```

✅ **正しい方法**
```bash
# PRマージ後に削除
# 1. GitHub上でPRをマージ
# 2. developブランチを最新化
# 3. worktree削除
```

❌ **developブランチを更新せずに次の作業**
```bash
# developブランチが古い状態で新しいブランチ作成（NG）
git checkout -b feature/issue-23
```

✅ **正しい方法**
```bash
# developブランチを最新化してから新しいブランチ作成
git checkout develop
git pull origin develop
git checkout -b feature/issue-23
```

## まとめ

このスキルは、PRマージ後のissue後片付け作業を自動化します。ユーザーが「PRマージしたので後片付けして」と言うだけで、以下がすべて実行されます：

1. ✅ 元のディレクトリに戻る
2. ✅ developブランチに切り替え
3. ✅ developブランチを最新化
4. ✅ worktree削除
5. ✅ ローカルブランチ削除
6. ✅ issue クローズ
7. ✅ 結果報告

このワークフローに従うことで、常に正しい手順でissueを終了できます。

---

## 統合ワークフロー

完全な開発フロー：

```
/start-issue-worktree → 設計・実装 → /create-commit → /create-pr → PRマージ → /finish-issue
```

各スキルが連携して、一貫した開発ワークフローを提供します。
