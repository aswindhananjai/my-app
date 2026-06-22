# Just us - Android APK Installation Guide

## 📱 APK File

**File**: `just-us.apk` (14 KB)
**App Name**: Just us
**Version**: 1.0.0
**Connects to**: https://just-us-seven-theta.vercel.app

---

## 🚀 How to Install

### Method 1: Direct Download from GitHub

1. Go to: https://github.com/aswindhananjai/just-us
2. Click on `just-us.apk` file
3. Click "Download" button
4. Transfer to your Android phone
5. Open the APK file on your phone
6. Allow installation from unknown sources if prompted
7. Install the app

### Method 2: From Your Computer

1. The APK is already in your project folder: `just-us.apk`
2. Transfer it to your Android phone via:
   - USB cable
   - Email
   - Cloud storage (Google Drive, Dropbox)
   - AirDrop (if supported)
3. Open the file on your phone
4. Install

---

## ⚙️ Installation Steps on Android

1. **Download** the APK to your phone
2. **Locate** the file in your Downloads folder
3. **Tap** the APK file
4. If you see a warning:
   - Go to Settings > Security
   - Enable "Install from Unknown Sources" or "Install Unknown Apps"
   - Return and tap the APK again
5. **Tap "Install"**
6. Wait for installation to complete
7. **Tap "Open"** or find "Just us" app in your app drawer

---

## 🎯 What Happens When You Open

1. App opens in fullscreen
2. Shows the "Just us" web app
3. You'll see the passcode entry screen
4. Enter your passcode:
   - **Aswin**: 140297
   - **Anu**: 010195
5. Start using the app!

---

## ✨ App Features

- **WebView App**: Loads the web version seamlessly
- **Fullscreen**: No browser UI, feels like a native app
- **Back Button**: Works to navigate within the app
- **Offline**: Caches the web app for offline use
- **JavaScript Enabled**: All features work
- **Local Storage**: Saves your login session

---

## 🔄 Updating the App

Since this APK points to the Vercel deployment:
- **App updates automatically** when you push changes to GitHub
- **No need to reinstall** the APK
- Just refresh the app to see updates

To get a new APK with changes:
1. Update code in `android-app/`
2. Run: `cd android-app && ./gradlew assembleDebug`
3. Copy new APK: `cp app/build/outputs/apk/debug/app-debug.apk ../just-us.apk`

---

## 🛡️ Security Note

This APK:
- ✅ Is built from source code in this repo
- ✅ Points to your Vercel deployment only
- ✅ Enables JavaScript and local storage
- ✅ Has no ads or tracking
- ✅ Is safe to install

**The app connects to**: https://just-us-seven-theta.vercel.app

---

## 📊 Technical Details

| Property | Value |
|----------|-------|
| **Package Name** | com.aswin.myapp |
| **App Name** | Just us |
| **Min SDK** | 21 (Android 5.0) |
| **Target SDK** | 33 (Android 13) |
| **Size** | 14 KB |
| **Type** | WebView wrapper |

---

## 🔧 Troubleshooting

**"App not installed" error**
- Enable "Install from Unknown Sources"
- Make sure you have enough storage
- Try restarting your phone

**App opens but shows blank screen**
- Check internet connection
- Try clearing app data
- Reinstall the app

**Can't find downloaded APK**
- Check Downloads folder
- Check File Manager > Downloads
- Search for "just-us.apk"

**App crashes on open**
- Make sure you're on Android 5.0 or higher
- Try reinstalling
- Check if WebView is updated in Google Play Store

---

## 🎨 Customizing the App

To change the app icon or splash screen:
1. Replace icons in `android-app/app/src/main/res/mipmap-*/`
2. Update colors in `android-app/app/src/main/res/values/colors.xml`
3. Rebuild the APK

---

## 📱 Testing

The app has been tested on:
- ✅ Android 5.0+
- ✅ WebView component
- ✅ JavaScript execution
- ✅ Local storage
- ✅ Back button navigation

---

## 💡 Why APK Size is So Small?

The APK is only 14 KB because:
- It's a WebView wrapper (no app logic inside)
- All features run from the web app
- No images or large resources bundled
- Minimal Android code

The actual app (web version) is hosted on Vercel and loads when you open the APK.

---

**Enjoy using Just us on your Android device!** ❤️

For any issues, check the app loads correctly in a mobile browser first:
https://just-us-seven-theta.vercel.app
