# このサイトでJavaを勉強するための地図

このプロジェクトは、Java Silverで出てくる文法が「実際のWebアプリでどう使われるか」を追いやすい構成にしています。

| Java Silverテーマ | このプロジェクトで見る場所 | 実際の用途 |
|---|---|---|
| class | `ExamService`, `QuestionService` | 処理を役割ごとに分ける |
| record | `Question`, `Choice`, 各DTO | データを不変オブジェクトとして表す |
| constructor | 各Service / Repository | 必要な依存オブジェクトを受け取る |
| interface | `QuestionRepository` | JSON保存と将来DB保存を交換しやすくする |
| override | `JsonQuestionRepository` | interfaceで決めたメソッドを実装する |
| List | 問題一覧、選択肢、正解 | 順序付きデータを扱う |
| Map | 問題ID検索、回答、カテゴリ集計 | キーから値を高速に探す |
| Set | ID重複チェック、回答比較 | 重複を許さない集合 |
| var | JSON読込、採点処理 | ローカル変数の型推論 |
| for / 拡張for | 問題読込・採点 | コレクションを順番に処理 |
| if | 検証・採点 | 条件分岐 |
| static | `QuestionView.from()` | インスタンス無しの変換メソッド |
| private/public | 全Javaファイル | 外から触ってよい範囲を制御 |
| exception | `QuestionDataException` | 不正な問題JSONを異常として扱う |
| generics | `List<Question>`, `Map<String,...>` | コレクションの型安全性 |
| lambda / Stream | `QuestionService`, `AppCatalogService` | 絞り込み・変換・集計 |
| Optional | `QuestionRepository.findById()` | 「存在しない可能性」を表す |

## おすすめの読み方

まず `Question.java` のrecordを読む → `QuestionRepository` のinterfaceを見る → `JsonQuestionRepository` の `@Override` を追う → `QuestionService` のStreamを見る → `ExamService` の採点ロジックを見る、の順が分かりやすいです。

資格問題で覚えた知識を見つけたら、実際に1行変更して挙動を確認すると定着しやすくなります。たとえば `Collections.shuffle(pool)` を外す、合格ライン判定を変える、難易度フィルタを追加する、といった小変更が教材になります。
