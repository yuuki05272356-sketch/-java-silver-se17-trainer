# ChatGPTへ問題追加を依頼するときのテンプレート

以下をそのまま使い、`[ ]` 部分だけ変更してください。

---

この Java Silver SE 17 Trainer の既存問題バンクを前提に、オリジナル問題を追加してください。

対象資格:
- Oracle Certified Java Programmer, Silver SE 17
- Java SE 17 Programmer I
- 1Z0-825-JPN

追加条件:
- 追加数: [20] 問
- 主カテゴリ: [switch式 / yield]
- 難易度: [4〜5]
- 特に重視: [コンパイル可否、yield、網羅性、型推論]

必須ルール:
- Java SE 17 の仕様に厳密に従う
- 実試験問題を転載せず、すべて新規オリジナル問題にする
- 既存問題と論点・コード・選択肢が実質重複しないようにする
- 曖昧な正解を作らない
- 単一選択/複数選択を明示する
- 誤答選択肢は受験者が勘違いしやすいものにする
- 正解理由だけでなく各誤答が誤りの理由も `choiceExplanations` に書く
- 問題IDは既存最大IDの続きから重複なしで採番する
- difficulty は1〜5
- category は `src/main/resources/question-bank/categories.json` の値から選ぶ
- tags は複数付与可
- コードがない問題では `code: null`
- JSONとして構文エラーがないことを確認する

現在のV5問題バンク:
- `questions-001.json`: JS17-0001〜JS17-0020
- `questions-002.json`: JS17-0021〜JS17-0070
- 次の追加は原則 `questions-003.json` / `JS17-0071` から開始する

出力形式:
1. 新規 `questions-XXX.json` の完成内容
2. `src/main/resources/question-bank/question-files.json` に追加するファイル名
3. 追加問題数、ID範囲、カテゴリ内訳、難易度内訳
4. Java仕様上の注意点がある問題だけ短いレビューコメント

問題オブジェクトはこの形式に統一する:

```json
{
  "id": "JS17-0071",
  "question": "問題文",
  "code": "Javaコード または null",
  "choices": [
    {"id": "A", "text": "..."},
    {"id": "B", "text": "..."}
  ],
  "correctAnswers": ["B"],
  "explanation": "全体解説",
  "choiceExplanations": {
    "A": "Aが誤りの理由",
    "B": "Bが正しい理由"
  },
  "category": "10. switch式 / yield",
  "tags": ["switch-expression", "yield"],
  "difficulty": 4,
  "multipleChoice": false,
  "original": true
}
```

追加後に `mvn test` を実行し、問題ID・必須項目・回答ID・データ整合性を検証してください。

---
