# Deployment Guide

## Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
npm install -g firebase-tools
```

### Step 2: Create Firebase Project
1. Visit https://console.firebase.google.com/
2. Click "Add Project" → Enter "chitti-app" → Create

### Step 3: Enable Services
- **Authentication**: Enable Email/Password
- **Firestore**: Create database in production mode

### Step 4: Get Config
1. Project Settings → Your apps → Web
2. Copy firebaseConfig
3. Paste into `src/firebase.js`

### Step 5: Deploy
```bash
firebase login
firebase init
# Select: Firestore, Hosting
# Firestore rules: firestore.rules
# Public directory: dist

npm run build
firebase deploy
```

Done! App live at: `https://YOUR_PROJECT_ID.firebaseapp.com`

## Detailed Steps

### Firebase Project Setup

1. **Create Project**
   - Name: chitti-app
   - Location: Choose nearest region
   - Disable Analytics (optional)

2. **Enable Authentication**
   ```
   Authentication → Sign-in method → Email/Password → Enable
   ```

3. **Create Firestore Database**
   ```
   Firestore Database → Create database → Production mode → Select location
   ```

4. **Get Configuration**
   ```
   Project Settings → General → Your apps → Add app (Web)
   App nickname: chitti-web
   Copy firebaseConfig object
   ```

### Local Configuration

1. **Update Firebase Config**
   
   Edit `src/firebase.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "chitti-app.firebaseapp.com",
     projectId: "chitti-app",
     storageBucket: "chitti-app.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

2. **Test Locally**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173

### Firebase CLI Setup

1. **Install CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login**
   ```bash
   firebase login
   ```

3. **Initialize Project**
   ```bash
   firebase init
   ```
   
   Select:
   - [x] Firestore
   - [x] Hosting
   
   Configuration:
   - Firestore rules: `firestore.rules` (use existing)
   - Firestore indexes: `firestore.indexes.json` (default)
   - Public directory: `dist`
   - Single-page app: `Yes`
   - GitHub deploys: `No`

### Build and Deploy

1. **Build Production Bundle**
   ```bash
   npm run build
   ```
   
   This creates optimized files in `dist/` folder

2. **Deploy Everything**
   ```bash
   firebase deploy
   ```

3. **Deploy Specific Services**
   ```bash
   # Only Firestore rules
   firebase deploy --only firestore:rules
   
   # Only hosting
   firebase deploy --only hosting
   ```

### Post-Deployment

1. **Test Admin Login**
   - Phone: admin
   - Password: admin123

2. **Create Test Chitti**
   - Amount: 100000
   - Duration: 10
   - Commission: 5

3. **Add Test Member**
   - Name: Test User
   - Phone: 9876543210
   - Password: test123

4. **Verify Real-time Updates**
   - Open app in two browsers
   - Login as admin in one, member in other
   - Record payment and verify both see updates

## Custom Domain (Optional)

1. **Add Domain in Firebase Console**
   ```
   Hosting → Add custom domain → Enter domain → Verify
   ```

2. **Update DNS Records**
   - Add A records provided by Firebase
   - Wait for SSL certificate (up to 24 hours)

## Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: chitti-app
```

## Monitoring

### Firebase Console

1. **Authentication Usage**
   ```
   Authentication → Usage
   ```

2. **Firestore Usage**
   ```
   Firestore → Usage
   ```

3. **Hosting Traffic**
   ```
   Hosting → Usage
   ```

### Set Budget Alerts

1. Go to Google Cloud Console
2. Billing → Budgets & alerts
3. Create budget with email notifications

## Rollback

If deployment has issues:

```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

## Performance Optimization

1. **Enable Compression** (automatic with Firebase Hosting)
2. **Cache Headers** (configured in firebase.json)
3. **Minimize Firestore Reads**:
   - Use real-time listeners efficiently
   - Unsubscribe when components unmount
   - Query only necessary data

## Security Checklist

- [x] Firestore security rules deployed
- [x] Authentication enabled
- [x] API keys restricted (optional, in Firebase Console)
- [x] HTTPS enforced (automatic)
- [x] No sensitive data in client code

## Troubleshooting

**Build fails:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Deploy fails:**
```bash
firebase logout
firebase login
firebase use --add
firebase deploy
```

**Rules not working:**
```bash
firebase deploy --only firestore:rules
```

**Hosting not updating:**
```bash
# Clear cache
firebase hosting:channel:deploy preview
# Then deploy to live
firebase deploy --only hosting
```

## Cost Estimation

Free tier covers:
- ~1000 active users/month
- ~50K daily operations
- 10GB bandwidth/month

Exceeding limits:
- Firestore: $0.06 per 100K reads
- Hosting: $0.15 per GB
- Authentication: Free for email/password

## Support Resources

- Firebase Docs: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com/
- Status Page: https://status.firebase.google.com/
- Community: https://firebase.google.com/community
