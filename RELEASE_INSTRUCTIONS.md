# NexRide Android Release Instructions

Follow these steps to build, synchronize, and generate a production-ready Android App Bundle (.aab) for the Google Play Store.

## Prerequisites

1.  **Node.js & npm**: Ensure you have Node.js installed.
2.  **Android Studio**: Required for building and signing the native Android app.
3.  **Java Development Kit (JDK)**: Recommended version 17 or higher.

## Development Workflow

### 1. Build the Web Application
This command generates the latest web assets in the `dist/` directory.
```bash
npm run build
```

### 2. Synchronize with Capacitor
Sync the web assets and any plugin changes with the native Android project.
```bash
npm run cap:sync
```

### 3. Open in Android Studio
Launch Android Studio to manage the native project.
```bash
npm run cap:open
```

## Generating a Signed Android App Bundle (.aab)

Once the project is open in Android Studio:

1.  **Sync Gradle**: Click "Sync Project with Gradle Files" (elephant icon) if prompted.
2.  **Build Menu**: Go to `Build` > `Generate Signed Bundle / APK...`.
3.  **Select Bundle**: Choose `Android App Bundle` and click `Next`.
4.  **Key Store**: 
    - If you have an existing key, select it.
    - If not, click `Create new...` and follow the prompts to create a release key. **Keep this key safe; you will need it for future updates.**
5.  **Build Variant**: Select `release`.
6.  **Destination**: Choose where to save the `.aab` file.
7.  **Finish**: Android Studio will build the signed bundle.

## Configuration Details

- **App Name**: NexRide
- **Package Name**: `com.nexride.app`
- **Version Name**: `1.0.0`
- **Minimum SDK**: 24 (Android 7.0)
- **Target SDK**: Latest Stable

## Troubleshooting

- **Blank Page**: Ensure `npm run build` was executed before `cap sync`.
- **Permissions**: Internet permission is enabled by default in `AndroidManifest.xml`.
- **Firebase**: Ensure your `google-services.json` is placed in `android/app/` if you are using native Firebase features. The current web SDK integration will work within the WebView.
