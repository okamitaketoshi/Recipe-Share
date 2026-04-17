# Issue着手開始スキル（Git Worktree版）

このスキルは、**Git Worktreeを使用した並行開発**でissueに着手する際の標準ワークフローを自動化します。

## 使用タイミング

以下のようなユーザーの依頼でこのスキルを使用してください：

- 「issue #22にworktreeで着手」「issue 22をworktreeで開始」
- 「issue #22を並行開発で進めたい」
- 「worktreeを使ってissue 22に取り組む」

## /start-issue との違い

| 項目 | /start-issue | /start-issue-worktree |
|-----|-------------|---------------------|
| ブランチ切り替え | git checkout | 不要（worktree作成） |
| 並行開発 | 不可（stash必要） | 可能 |
| ディスク容量 | 節約 | 追加（0.5-1MB程度） |
| 管理の複雑さ | シンプル | やや複雑 |

## 実行フロー

### Step 1: 現在の状態確認

```bash
# 現在のブランチ確認
git branch --show-current

# 未コミットの変更確認
git status --short

# 既存worktree確認
git worktree list
```

**未コミットの変更がある場合：**
Worktreeは並行開発が目的なので、未コミット変更があっても問題ありません。そのまま新しいworktreeを作成できます。

### Step 2: Submoduleの有無確認

```bash
ls -la .gitmodules 2>/dev/null
git submodule status
```

**Submoduleが存在する場合：**
- Submodule内の変更 → Submodule内にworktree作成
- 親gitの変更 → 親gitルートにworktree作成

### Step 3: issue内容を取得

`/get-github-issue`スキルを使用してissue情報を取得：

```bash
gh issue view <issue-number> --json title,body,state,labels
```

### Step 4: ブランチ名の自動生成

issue情報から適切なブランチ名を生成します（`/start-issue`と同じロジック）。

#### プレフィックスの判断

| 条件 | プレフィックス |
|------|--------------|
| ラベルに`バグ`または`bug`が含まれる | `bugfix/` |
| ラベルに`enhancement`または`feature`が含まれる | `feature/` |
| タイトルが「バグ」「修正」「fix」で始まる | `bugfix/` |
| その他 | `feature/` |

#### Worktreeディレクトリ名の生成

```
wt-issue-<number>-<description>
```

**例：**
- Issue #22「ドメインモデル作成」
  - ブランチ名: `feature/issue-22-domain-model`
  - Worktreeディレクトリ: `wt-issue-22-domain-model`

### Step 5: ブランチ名とWorktreeディレクトリの確認

自動生成した名前をユーザーに確認：

```
📋 Issue #22: ドメインモデル作成

生成されたブランチ名: feature/issue-22-domain-model
Worktreeディレクトリ: wt-issue-22-domain-model

この名前で作成しますか？
- Yes: そのまま作成
- No: カスタム名を入力
```

### Step 6: ブランチとWorktreeの存在確認

```bash
# ブランチ確認
git branch --list <branch-name>

# Worktreeディレクトリ確認
ls -d wt-issue-* 2>/dev/null
```

**既にブランチが存在する場合：**
```
⚠️  警告: ブランチ feature/issue-22-domain-model は既に存在します

対処方法:
1. 既存ブランチを使用してworktree作成
2. 別のブランチ名を使用する
```

**既にWorktreeディレクトリが存在する場合：**
```
⚠️  警告: Worktreeディレクトリ wt-issue-22-domain-model は既に存在します

対処方法:
1. 別のディレクトリ名を使用する
2. 既存worktreeを削除してから再作成する（注意）
```

### Step 7: Worktreeを作成

#### ケース1: ブランチが存在しない（新規作成）

```bash
git worktree add -b <branch-name> <worktree-dir> develop
```

例：
```bash
git worktree add -b feature/issue-22-domain-model wt-issue-22-domain-model develop
```

#### ケース2: ブランチが既に存在する

```bash
git worktree add <worktree-dir> <existing-branch>
```

例：
```bash
git worktree add wt-issue-22-domain-model feature/issue-22-domain-model
```

**作成成功時の出力例：**
```
Preparing worktree (new branch 'feature/issue-22-domain-model')
HEAD is now at abc1234 Merge pull request #XX from ...
```

### Step 7.5: Worktree作成の検証（🔴 必須）

**Worktree作成後、必ず以下の検証を実施すること：**

```bash
# 1. Worktree一覧確認（新しいworktreeが表示されること）
git worktree list

# 期待される出力:
# /Users/user/project                            abc1234 [develop]
# /Users/user/project/wt-issue-22-domain-model   def5678 [feature/issue-22-domain-model]

# 2. ディレクトリ存在確認
ls -ld wt-issue-*

# 期待される出力:
# drwxr-xr-x 15 user group 480 Apr 17 10:30 wt-issue-22-domain-model

# 3. ディレクトリに移動
cd <worktree-dir>

# 4. 現在地確認（worktreeディレクトリにいることを確認）
pwd

# 期待される出力:
# /Users/user/project/wt-issue-22-domain-model

# 5. ブランチ確認（正しいブランチにいることを確認）
git branch --show-current

# 期待される出力:
# feature/issue-22-domain-model
```

**検証チェックリスト：**
- [ ] `git worktree list`に新しいworktreeが表示されている
- [ ] `ls -ld wt-issue-*`でディレクトリが存在している
- [ ] `pwd`でworktreeディレクトリにいる（`/path/to/project/wt-issue-XX-name`）
- [ ] `git branch --show-current`で正しいブランチにいる（`feature/issue-XX-name`）
- [ ] ❌ developブランチにいない（もしdevelopと表示されたら、worktree作成失敗）

**検証失敗時の対応：**

いずれかの検証項目で期待される結果と異なる場合：

1. **worktreeが`git worktree list`に表示されない**
   ```
   ❌ エラー: Worktree作成に失敗しました
   
   対処方法:
   - エラーメッセージを確認
   - ブランチ名が既に使用されていないか確認
   - ディスク容量が十分にあるか確認
   - 再度worktree作成を試行
   ```

2. **ディレクトリが存在しない**
   ```
   ❌ エラー: Worktreeディレクトリが作成されていません
   
   対処方法:
   - `git worktree add`コマンドが正常に完了したか確認
   - エラーメッセージを確認
   - 手動でディレクトリが削除されていないか確認
   ```

3. **pwdでworktreeディレクトリにいない**
   ```
   ⚠️  警告: Worktreeディレクトリに移動していません
   
   対処方法:
   - cd <worktree-dir> を再度実行
   - ディレクトリパスが正しいか確認
   ```

4. **developブランチにいる**
   ```
   🚨 重大エラー: developブランチにいます！
   
   これは最も危険な状態です。Worktree作成が失敗しています。
   
   対処方法:
   1. 即座に作業を中断
   2. Worktree作成をやり直す
   3. 検証チェックリストを全て確認してから実装開始
   ```

**報告フォーマット：**

検証完了後、以下の形式で報告すること：

```
✅ Worktree作成完了

## 検証結果
- ✅ Worktree一覧: 表示確認
- ✅ ディレクトリ存在: 確認
- ✅ 現在地: /Users/user/project/wt-issue-22-domain-model
- ✅ ブランチ: feature/issue-22-domain-model

Worktreeパス: /Users/user/project/wt-issue-22-domain-model
ブランチ: feature/issue-22-domain-model
ベース: develop
```

### Step 8: 必要なファイルのセットアップ

Worktreeディレクトリに移動してセットアップを実行：

```bash
cd <worktree-dir>

# 環境変数ファイルをコピー
cp ../.env .env 2>/dev/null || true
cp ../.env.local .env.local 2>/dev/null || true
cp ../.env.production.local .env.production.local 2>/dev/null || true

# node_modulesをシンボリックリンク（推奨）
ln -s ../node_modules node_modules

# .claudeディレクトリをコピー
cp -r ../.claude .claude 2>/dev/null || true
```

**セットアップ完了確認：**
```bash
# ファイル確認
ls -lah

# サイズ確認
du -sh .
```

**期待されるサイズ：**
- シンボリックリンク使用: 約0.5-1MB
- フルインストール: 約150-200MB

### Step 9: issue概要の表示

作成したworktreeでissue概要を表示：

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

### Step 10: 次のステップをガイド

```
🚀 次のステップ

## Worktree環境

**Worktreeパス**: /Users/user/project/wt-issue-22-domain-model
**ブランチ**: feature/issue-22-domain-model
**追加ディスク容量**: 596KB

## 並行開発の使い方

### 現在のworktreeで作業
```bash
# 既にworktreeディレクトリにいます
pwd  # 現在地確認
```

### 元のディレクトリに戻る
```bash
cd ..
```

### 両方を同時に開く
- Claude Codeウィンドウ1: 元のディレクトリ
- Claude Codeウィンドウ2: wt-issue-22-domain-model

## 実装開始

1. 設計ドキュメント作成
   - `docs/issue-22-domain-model-design.md`

2. 実装
   - Developer Agentに実装を依頼
   - または直接コーディング

3. コミット作成
   - `/create-commit` スキルを使用

4. PR作成
   - `/create-pr` スキルを使用

## 作業完了後

```bash
# 元のディレクトリに戻る
cd ..

# Worktree削除
git worktree remove wt-issue-22-domain-model
```

準備完了です。作業を開始してください！
```

## エラーハンドリング

### Case 1: issue番号が指定されていない

```
❌ エラー: issue番号が指定されていません

使用方法:
- 「issue #22にworktreeで着手」
- 「issue 22をworktreeで開始」
```

### Case 2: Submoduleが存在する

```
⚠️  Submoduleが検出されました

Submodule: submodule-name

変更対象を確認してください:
1. Submodule内のコードを変更 → Submodule内にworktree作成
2. 親gitのコードを変更 → 親gitルートにworktree作成

どちらですか？
```

### Case 3: Worktree作成失敗

```
❌ エラー: Worktree作成に失敗しました

エラー内容:
<git worktree addのエラーメッセージ>

対処方法:
- ブランチ名が既に使用されていないか確認
- Worktreeディレクトリが既に存在しないか確認
- ディスク容量が十分にあるか確認
```

### Case 4: node_modulesが存在しない

```
⚠️  警告: node_modulesが見つかりません

対処方法:
1. 元のディレクトリでnpm installを実行
2. Worktree内で独立してnpm installを実行（150MB追加）

どちらで進めますか？
```

## ベストプラクティス

### Worktreeディレクトリ命名規則

1. **必ず`wt-`プレフィックスを使用**
   - OK: `wt-issue-22-domain-model`
   - NG: `issue-22-worktree`, `domain-model-wt`

2. **issue番号を含める**
   - トレーサビリティ確保
   - 後から検索しやすい

3. **簡潔で分かりやすい**
   - 50文字以内
   - ケバブケース（小文字、ハイフン区切り）

### node_modulesの管理

**シンボリックリンク（推奨）：**
```bash
ln -s ../node_modules node_modules
```
- ✅ ディスク容量を節約（0.5-1MB）
- ✅ 依存関係を共有
- ⚠️ 異なるバージョンが必要な場合は不便

**独立インストール（特殊ケース）：**
```bash
npm install
```
- ✅ 完全に独立した環境
- ✅ 異なる依存関係をテスト可能
- ❌ ディスク容量を消費（150MB）
- ❌ インストール時間がかかる

### Worktree削除のタイミング

以下のいずれかの時点で削除：
1. PRがマージされた後
2. issueがクローズされた後
3. 作業を中断して別のissueに移る前

**削除コマンド：**
```bash
cd ..  # 元のディレクトリに戻る
git worktree remove wt-issue-22-domain-model
```

## よくある間違い

❌ **Worktreeディレクトリ内でworktree削除**
```bash
# wt-issue-22内にいる状態で
git worktree remove wt-issue-22  # エラー
```

✅ **正しい方法**
```bash
# 元のディレクトリに戻ってから
cd ..
git worktree remove wt-issue-22
```

❌ **ブランチ削除してからworktree削除**
```bash
git branch -D feature/issue-22  # 先にブランチ削除（NG）
git worktree remove wt-issue-22  # エラーになる
```

✅ **正しい方法**
```bash
git worktree remove wt-issue-22  # 先にworktree削除
git branch -D feature/issue-22   # その後ブランチ削除
```

❌ **Worktreeディレクトリを手動削除**
```bash
rm -rf wt-issue-22  # 手動削除（NG）
```

✅ **正しい方法**
```bash
git worktree remove wt-issue-22  # git worktreeコマンドで削除
```

## 実行例

### 例1: 通常のフロー

```bash
# ユーザー入力
「issue #22にworktreeで着手」

# スキル実行
$ git worktree list
/Users/user/project  d7bab74 [main]

$ gh issue view 22 --json title,body,state,labels
# issue情報取得

# ブランチ名生成
📋 Issue #22: ドメインモデル作成
生成されたブランチ名: feature/issue-22-domain-model
Worktreeディレクトリ: wt-issue-22-domain-model

このブランチ名で作成しますか？ → Yes

$ git worktree add -b feature/issue-22-domain-model wt-issue-22-domain-model develop
Preparing worktree (new branch 'feature/issue-22-domain-model')
HEAD is now at abc1234

$ cd wt-issue-22-domain-model
$ cp ../.env .env
$ ln -s ../node_modules node_modules
$ cp -r ../.claude .claude

✅ Worktree作成完了

Worktreeパス: /Users/user/project/wt-issue-22-domain-model
ブランチ: feature/issue-22-domain-model
追加ディスク容量: 596KB

## Issue #22: ドメインモデル作成
...

🚀 次のステップ
...
```

### 例2: 既にブランチが存在する場合

```bash
# ユーザー入力
「issue #22にworktreeで着手」

# スキル実行
$ git branch --list feature/issue-22-domain-model
feature/issue-22-domain-model

⚠️  ブランチ feature/issue-22-domain-model は既に存在します

既存ブランチを使用してworktree作成しますか？ → Yes

$ git worktree add wt-issue-22-domain-model feature/issue-22-domain-model
Preparing worktree (checking out 'feature/issue-22-domain-model')
HEAD is now at def5678

✅ Worktree作成完了
...
```

### 例3: 複数worktreeの並行開発

```bash
# 現在の状態
$ git worktree list
/Users/user/project                      d7bab74 [main]
/Users/user/project/wt-issue-21-repo     abc1234 [feature/issue-21-repository-pattern]

# 新しいworktree作成
「issue #22にworktreeで着手」

$ git worktree add -b feature/issue-22-domain-model wt-issue-22-domain-model develop

# 結果
$ git worktree list
/Users/user/project                      d7bab74 [main]
/Users/user/project/wt-issue-21-repo     abc1234 [feature/issue-21-repository-pattern]
/Users/user/project/wt-issue-22-domain   def5678 [feature/issue-22-domain-model]

# 3つのissueを並行開発中！
```

## 重要な注意事項

### 絶対に守るべきルール

1. **Worktreeディレクトリ名に`wt-`プレフィックス必須**
   - プロジェクト全体で統一
   - .gitignoreで除外しやすい

2. **Submoduleの確認は必須**
   - Submodule内変更なのに親gitにworktree作成すると問題

3. **node_modulesはシンボリックリンク推奨**
   - ディスク容量を節約
   - 特殊な理由がない限りシンボリックリンクを使用

4. **Worktree削除は`git worktree remove`を使用**
   - 手動削除（rm -rf）は禁止
   - Gitのメタデータが残って問題になる

### Worktreeの制限

1. **同じブランチを複数worktreeで使用不可**
   ```bash
   # エラー例
   git worktree add wt-test feature/test  # OK
   git worktree add wt-test2 feature/test  # NG（同じブランチ）
   ```

2. **Worktree内で別のworktree作成不可**
   ```bash
   # wt-issue-22内で
   git worktree add wt-issue-23 ...  # NG
   ```

3. **Claude Codeは1つのディレクトリのみ認識**
   - 複数worktreeを同時操作する場合は複数のClaude Codeウィンドウが必要

## まとめ

このスキルは、Git Worktreeを使用したIssue着手時の標準ワークフローを自動化します。ユーザーが「issue #22にworktreeで着手」と言うだけで、以下がすべて実行されます：

1. ✅ 現在の状態確認
2. ✅ Submoduleの有無確認
3. ✅ `/get-github-issue`でissue内容取得
4. ✅ ブランチ名とWorktreeディレクトリ名の自動生成
5. ✅ ブランチ名の確認・カスタマイズ
6. ✅ 新しいWorktreeを作成
7. ✅ 必要なファイルのセットアップ（.env, node_modules, .claude）
8. ✅ issue概要の表示
9. ✅ 次のステップのガイド

このワークフローに従うことで、常に正しい手順で並行開発環境を構築できます。

---

## 統合ワークフロー

完全な並行開発フロー：

```
/start-issue-worktree → 設計・実装 → /create-commit → /create-pr → worktree削除
```

各スキルが連携して、一貫した並行開発ワークフローを提供します。
