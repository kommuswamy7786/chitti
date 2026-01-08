# Chitti Management System

A complete Firebase-based web application for managing chit funds with admin controls, member tracking, lottery system, and real-time updates.

## Features

- **Admin Dashboard**: Create chittis, add members, track payments, run lotteries
- **Member Portal**: View payment status and chitti details
- **Lottery System**: Random selection from eligible members
- **Real-time Updates**: Live data synchronization across all users
- **Mobile Responsive**: Works on all devices
- **Secure Authentication**: Phone-based login with Firebase Auth

## Tech Stack

- Firebase (Firestore + Authentication + Hosting)
- Vanilla JavaScript (ES6+)
- Vite (Build tool)
- Modern CSS with responsive design

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: "chitti-app"
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 3. Enable Firebase Services

**Enable Authentication:**
- Go to Authentication > Sign-in method
- Enable "Email/Password"

**Enable Firestore:**
- Go to Firestore Database
- Click "Create database"
- Start in "production mode"
- Choose location closest to your users

### 4. Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click Web icon (</>)
4. Register app name: "chitti-web"
5. Copy the firebaseConfig object

### 5. Update Firebase Config

Edit `src/firebase.js` and replace with your config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 6. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 7. Login to Firebase

```bash
firebase login
```

### 8. Initialize Firebase

```bash
firebase init
```

Select:
- Firestore (use existing firestore.rules)
- Hosting (use dist folder)

### 9. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

## Development

Run local development server:

```bash
npm run dev
```

Open http://localhost:5173

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
firebase deploy
```

Your app will be live at: `https://YOUR_PROJECT_ID.firebaseapp.com`

## Default Login Credentials

**Admin:**
- Phone: admin
- Password: admin123

**Members:**
- Created by admin with custom credentials

## Usage Guide

### Admin Workflow

1. **Login** with admin credentials
2. **Create Chitti**: Set amount, duration, commission
3. **Add Members**: Enter name, phone, password, assign to chitti
4. **Track Payments**: View member payment status
5. **Record Payments**: Mark payments as received
6. **Run Lottery**: Select winner from eligible members (paid current month)
7. **View Reports**: See analytics and statistics

### Member Workflow

1. **Login** with phone number and password
2. **View Chitti Details**: See total amount, monthly payment, duration
3. **Check Payment Status**: Track your payment history
4. **Lottery Status**: See if you've won

## Firebase Free Tier Optimization

This app is optimized for Firebase free tier:

- **Firestore**: Minimal reads/writes with efficient queries
- **Authentication**: Email/password (no SMS costs)
- **Hosting**: Static files only
- **No Cloud Functions**: All logic runs client-side

### Free Tier Limits

- 50K reads/day
- 20K writes/day
- 1GB storage
- 10GB hosting transfer/month

## Security Rules

The app includes comprehensive Firestore security rules:

- Admins can read/write all data
- Members can only read their own data
- All operations require authentication
- Role-based access control

## Project Structure

```
chitti-app/
├── src/
│   ├── firebase.js      # Firebase configuration
│   ├── main.js          # Application logic
│   └── style.css        # Styles
├── index.html           # Main HTML
├── firestore.rules      # Security rules
├── firebase.json        # Firebase config
├── package.json         # Dependencies
└── vite.config.js       # Build config
```

## Troubleshooting

**Login fails:**
- Check Firebase config in src/firebase.js
- Verify Authentication is enabled in Firebase Console

**Data not saving:**
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check browser console for errors

**Deployment fails:**
- Run `npm run build` first
- Ensure Firebase CLI is logged in: `firebase login`

## Support

For issues or questions, check:
- Firebase Console for errors
- Browser console for client-side errors
- Firestore rules for permission issues

## License

MIT
