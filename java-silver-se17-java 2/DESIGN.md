# Java Edition 設計

## 1. 全体アーキテクチャ

```text
iPhone / PC Browser
        |
        | HTTP / JSON
        v
Spring Boot (Java 17)
  Controller
      v
  Service
      v
  Repository interface
      v
JsonQuestionRepository
      v
question-bank/*.json
```

画面はWeb標準のHTML/CSS/JavaScript、アプリの問題処理はJavaに寄せています。

## 2. 責務

- Controller: HTTPリクエスト/レスポンス
- Service: 出題、絞り込み、答え合わせ、採点
- Repository: 問題保存場所の抽象化
- Model/DTO: Javaのデータ構造
- JSON: 問題本体
- localStorage: 個人の学習履歴

## 3. 正解情報の扱い

`QuestionView` には `correctAnswers` / `explanation` を含めません。

模擬試験開始時、ブラウザに渡すのは問題文と選択肢だけです。採点時に回答をJava APIへ送り、Java側が問題バンクの正解と比較します。

学習モードでは回答後だけ `/api/answers/check` が正解・解説を返します。

## 4. 問題追加

`question-files.json` が問題JSON一覧です。`questions-002.json` 以降を追加してmanifestへ登録すれば、Repositoryが自動読込します。

## 5. 300〜500問への拡張

JSONファイルを分割したまま追加可能です。UIは `/api/questions` を通して問題を受け取るため、ファイル数を意識しません。

将来DB化するときは `QuestionRepository` の実装を `DatabaseQuestionRepository` に交換する設計です。

## 6. 保存

現バージョンでは学習履歴はブラウザlocalStorageです。`storage.js` をAdapterとして分離しているため、Supabaseなどへ移行しやすい構造です。
