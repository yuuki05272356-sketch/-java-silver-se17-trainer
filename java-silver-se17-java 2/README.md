# Java Silver SE 17 Trainer - Java Edition

Java SE 17 / 1Z0-825-JPN 対策用の学習Webアプリを **Java 17 + Spring Boot** で作り直した版です。

## 重要: 「JavaでWebサイト」の構成

普通のSafari / ChromeはJavaコードを直接実行しません。そのため、Webアプリとして自然な構成にしています。

- サーバー / 問題読込 / ランダム出題 / 答え合わせ / 採点: **Java 17**
- Web API: **Spring Boot**
- 画面表示: HTML / CSS / 最小限のJavaScript
- 問題データ: JSON（JavaがJacksonで読み込む）
- 学習履歴: 現在はブラウザlocalStorage

つまり、問題を解くサイトとして使いながら、`src/main/java` を読むことでJavaアプリ開発も勉強できます。

## 主な機能

- 模擬試験: 問題数 5 / 10 / 20 / 30 / 60問から選択（登録問題数を超える設定では開始ボタンが無効）
- 制限時間: 5 / 10 / 20 / 30 / 60 / 90分から選択
- 本番設定: 60問 / 90分 / 合格ライン65%
- Javaサーバー側で選択した問題数をランダム出題
- 模擬試験中は正解データをブラウザへ送らない
- Javaサーバー側で採点
- 採点後は誤答ごとに、問題文・Javaコード・自分の回答・正解・全選択肢の解説を展開して確認
- 学習モードの答え合わせもJava APIで実行
- 全問題 / カテゴリ / タグ / 難易度 / 誤答 / 苦手 / 見直し / 分からない
- 単一選択 / 複数選択
- 問題一覧ジャンプ
- 見直し / 分からないフラグ
- 問題別の回答回数・正解回数・不正解回数・最終回答日時
- localStorageでページ再読み込み後も履歴維持
- iPhone / iPad / PCレスポンシブ
- PWA用manifest / Service Worker
- 現在の問題バンク: 本番不正解21分野に特化したオリジナル70問（既存20問 + 新規50問）

## 必要環境

- JDK 17以上（推奨: JDK 17）
- Maven 3.9系

IntelliJ IDEAなら `pom.xml` を開けばMavenプロジェクトとして読み込めます。

## 起動

```bash
cd java-silver-se17-java
mvn spring-boot:run
```

ブラウザで以下を開きます。

```text
http://localhost:8080
```

同じWi-FiのiPhoneから開く場合は、PC/MacのLAN内IPを使います。

```text
http://192.168.x.x:8080
```

## テスト

```bash
mvn test
```

問題IDの重複や不正な正解IDなどは、Java側の `JsonQuestionRepository` が起動時にも検証します。

## 問題追加

現在は `questions-001.json` に20問、`questions-002.json` に50問、合計70問を収録しています。問題数は固定ではなく、追加ファイルを登録すれば増やせます。


問題JSONはここです。

```text
src/main/resources/question-bank/
```

追加手順:

1. 次回は `questions-003.json` を作る（現在の最大IDは `JS17-0070`）
2. `question-files.json` の `files` に `questions-003.json` を追加
3. `mvn test`
4. 起動

UIコードを変更する必要はありません。

## Java学習で最初に読む順番

1. `model/Question.java`
2. `repository/QuestionRepository.java`
3. `repository/JsonQuestionRepository.java`
4. `service/QuestionService.java`
5. `service/ExamService.java`
6. `controller/QuestionController.java`
7. `controller/ExamController.java`

`JAVA_STUDY_MAP.md` に「Silverのどの知識がどこで使われているか」をまとめています。

## 将来拡張

`LocalStorageAdapter` をSupabase等の保存実装へ差し替えれば、PCとiPhone間で履歴同期できる設計です。問題データも将来DBへ移す場合は `QuestionRepository` の別実装を作る方針にできます。
