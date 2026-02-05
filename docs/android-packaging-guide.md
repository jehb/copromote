# Android Packaging Guide - Promoty PWA

This guide walks you through packaging Promoty as a native Android application using **Bubblewrap**, Google's official tool for creating Trusted Web Activities (TWAs).

---

## Prerequisites

- **Node.js** 16+ installed
- **Java Development Kit (JDK)** 11+ installed
- **Android SDK** (via Android Studio or command-line tools)
- Your PWA must be hosted on **HTTPS**

---

## Step 1: Install Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
```

Verify installation:
```bash
bubblewrap --version
```

---

## Step 2: Initialize Your TWA Project

Navigate to a directory where you want to create the Android project (NOT inside your Next.js project):

```bash
mkdir promoty-android
cd promoty-android
bubblewrap init --manifest https://yourdomain.com/manifest.json
```

**Interactive Prompts:**
- **Host URL**: `https://yourdomain.com`
- **App name**: `Promoty`
- **Package name**: `com.promoty.app` (must match assetlinks.json)
- **Icon URL**: `https://yourdomain.com/icons/icon-512x512.png`
- **Maskable icon URL**: `https://yourdomain.com/icons/maskable-icon-512x512.png`
- **Theme color**: `#2563eb`
- **Background color**: `#ffffff`
- **Start URL**: `/`
- **Display mode**: `standalone`
- **Orientation**: `portrait`

This creates a `twa-manifest.json` file.

---

## Step 3: Generate Signing Key

For **development/testing**:
```bash
bubblewrap build
```
This auto-generates a debug key.

For **production** (Google Play Store):
```bash
keytool -genkey -v -keystore promoty-release-key.keystore -alias promoty -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: Store this keystore file securely! You'll need it for all future updates.

---

## Step 4: Get SHA-256 Fingerprint

Extract the SHA-256 fingerprint from your keystore:

```bash
keytool -list -v -keystore promoty-release-key.keystore -alias promoty
```

Look for the **SHA256** line, it will look like:
```
SHA256: 14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B1:3F:CF:44:E5
```

Copy this fingerprint (remove the colons):
```
146DE983C5730650D8EEB9952F34FC6416A08342E61DBEA88A0496B13FCF44E5
```

---

## Step 5: Update Digital Asset Links

Update `/public/.well-known/assetlinks.json` with your SHA-256 fingerprint:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.promoty.app",
      "sha256_cert_fingerprints": [
        "146DE983C5730650D8EEB9952F34FC6416A08342E61DBEA88A0496B13FCF44E5"
      ]
    }
  }
]
```

**Deploy this file to your production server** at:
```
https://yourdomain.com/.well-known/assetlinks.json
```

Verify it's accessible:
```bash
curl https://yourdomain.com/.well-known/assetlinks.json
```

---

## Step 6: Configure Next.js to Serve .well-known

Add to `next.config.ts`:

```typescript
const nextConfig = {
  // ... existing config
  async headers() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ]
  },
}
```

---

## Step 7: Build the APK

### Development Build
```bash
bubblewrap build
```

Output: `app-release-unsigned.apk`

### Production Build (Signed)
```bash
bubblewrap build --signingKeyPath ./promoty-release-key.keystore --signingKeyAlias promoty
```

Output: `app-release-signed.apk`

---

## Step 8: Install on Android Device

### Via USB (ADB)
```bash
adb install app-release-signed.apk
```

### Via File Transfer
1. Copy APK to your Android device
2. Open the file and tap "Install"
3. Enable "Install from Unknown Sources" if prompted

---

## Step 9: Test the TWA

1. **Open the app** on your Android device
2. **Verify NO browser UI** (no address bar, no Chrome tabs)
3. **Test offline functionality**:
   - Turn off WiFi/mobile data
   - Navigate to Contacts → Should load from cache
   - Delete a contact → Should queue for sync
   - Turn on internet → Verify sync completes

---

## Step 10: Publish to Google Play Store

### Prerequisites
- Google Play Developer account ($25 one-time fee)
- Privacy Policy URL
- App screenshots (phone + tablet)
- Feature graphic (1024x500px)

### Steps
1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill in app details (name, description, category)
4. Upload screenshots and graphics
5. Upload the **signed APK** from Step 7
6. Set pricing (free/paid)
7. Submit for review

**Review time**: 1-7 days

---

## Updating the App

When you make changes to your PWA:

1. **Update the web app** (deploy to production)
2. **Increment version** in `twa-manifest.json`:
   ```json
   {
     "versionCode": 2,
     "versionName": "1.1.0"
   }
   ```
3. **Rebuild APK**:
   ```bash
   bubblewrap build --signingKeyPath ./promoty-release-key.keystore --signingKeyAlias promoty
   ```
4. **Upload to Google Play Console** as an update

**Note**: Most updates only require deploying the web app. The APK only needs updating for:
- Manifest changes (icons, name, shortcuts)
- Android-specific features
- Version bumps for Play Store

---

## Troubleshooting

### "App not verified" warning
- Ensure `assetlinks.json` is deployed and accessible
- Verify SHA-256 fingerprint matches your keystore
- Wait up to 24 hours for Google to verify

### App opens in Chrome instead of standalone
- Check Digital Asset Links are configured correctly
- Verify domain ownership in Google Search Console
- Ensure HTTPS is enabled

### Offline features not working
- Verify service worker is registered
- Check IndexedDB persistence in Chrome DevTools
- Test PWA in Chrome first before packaging

---

## Resources

- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA Quick Start Guide](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator)
- [Google Play Console](https://play.google.com/console)

---

## Summary

✅ **Development**: Use `bubblewrap build` for quick testing  
✅ **Production**: Use signed APK with proper Digital Asset Links  
✅ **Updates**: Most changes only require web deployment  
✅ **Distribution**: Publish to Google Play Store for wide reach
