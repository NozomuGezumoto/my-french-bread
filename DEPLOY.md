# My French Bread - App Store 提出手順

ジェラートアプリ（My Italy Gelato）と同様の手順です。Cursor でできる部分は済んでいます。

## 事前準備（済んでいる想定）
- [ ] Apple Developer Program 登録
- [ ] Expo アカウント
- [ ] `npm install` 済み

## ✅ Cursor で済んだこと
- [x] `eas.json` 作成（build / submit profile）
- [x] `app.json` の iOS 設定
  - bundleIdentifier: `com.myfrenchbread.app`
  - カメラ・フォトの説明文（infoPlist）
  - ITSAppUsesNonExemptEncryption: false
- [x] アセット画像
  - `images/icon.png`
  - `assets/images/splash-icon.png`
  - `assets/images/favicon.png`

## あなたが行う手順

### 1. EAS にプロジェクトを紐づけ
```bash
cd /Users/mochi/My-Apps/my-french-baguette
eas init
```
→ プロジェクト作成して Project ID が `app.json` に保存されます。

### 2. Apple Developer で App ID 登録
- [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → + → App IDs
- **Bundle ID**: `com.myfrenchbread.app` を登録

### 3. App Store Connect でアプリ作成
- [App Store Connect](https://appstoreconnect.apple.com/) → マイ App → + → 新規 App
- 上記 Bundle ID を選択して作成
- **App 情報**の「Apple ID」（数字）をコピー

### 4. eas.json に ascAppId を設定
提出前に `eas.json` の `submit.production` を次の形式で追加・更新:

```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "ここにApp Store ConnectのApple ID（数字）を記入"
    }
  }
}
```

空のままでは `eas submit` できません。

### 5. ビルド
```bash
eas build --platform ios --profile production
```
初回は Apple ID でログイン（証明書は EAS が自動作成）

### 6. 提出
```bash
eas submit --platform ios --latest --profile production
```
またはビルドと同時に:
```bash
eas build --platform ios --profile production --auto-submit
```

### 7. App Store Connect
- メタデータ・スクリーンショットを入力して審査に提出
