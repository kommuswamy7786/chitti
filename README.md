# Chitti Management System

A modern web application for managing **chitti** (rotating savings groups) with real-time payment tracking, lottery system, and commission calculations.

## Features

✅ **Chitti Management**
- Create and manage multiple chittis
- Track members and their payment status
- Commission percentage tracking

✅ **Payment Tracking**
- Record monthly payments with checkboxes
- Auto-fill member amounts
- Payment history with delete options

✅ **Lottery System**
- Draw lottery winners from paid members
- Optional ₹2,000 extra charge for winners
- Lottery history tracking

✅ **Reports & Analytics**
- Dashboard with key statistics
- Member payment reports
- Export to CSV and print functionality

✅ **Real-Time Sync** (with Firebase)
- Cloud database support
- Multi-user access
- Offline mode with auto-sync

✅ **Responsive Design**
- Works on desktop, tablet, and mobile
- Modern gradient UI
- Smooth animations

## Quick Start

### Local Setup (No Backend)
1. Clone the repository
2. Open `index.html` in your browser
3. Start creating chittis!

Data will be saved in your browser's localStorage.

### Cloud Setup (with Firebase)
1. Create a Firebase project at https://console.firebase.google.com
2. Add your Firebase credentials to `firebase-config.js`
3. Deploy to Netlify or GitHub Pages
4. Share URL with group members

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main UI structure |
| `style.css` | Responsive styling |
| `script-firebase.js` | App logic with Firebase support |
| `firebase-config.js` | Firebase configuration (template) |
| `FIREBASE_SETUP.md` | Firebase setup guide |

## Usage

### Create a Chitti
1. Go to "Create Chitti" tab
2. Enter chitti name, monthly amount, commission %
3. Add member names (comma-separated)
4. Click "Create Chitti"

### Record Payments
1. Go to "Record Payment" tab
2. Select chitti and month
3. Check members who paid
4. Click "Save Payments"

### Draw Lottery
1. Go to "Draw Lottery" tab
2. First, let members opt-in (Lottery Participants)
3. Select chitti and month
4. Click "Draw Winner"
5. Winner gets ₹2,000 extra charge automatically

### View Reports
1. Go to "Reports" tab
2. Select a chitti
3. See member payment status

## Deployment

### Option 1: Netlify (Recommended)
1. Go to https://netlify.com
2. Drag and drop your project folder
3. Get a public URL

### Option 2: GitHub Pages
1. Push to GitHub
2. Enable GitHub Pages in Settings
3. Share the GitHub Pages URL

## Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage**: localStorage (default) or Firebase Firestore (optional)
- **Authentication**: Firebase Auth (optional)
- **Styling**: Custom CSS with gradients and animations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## License

MIT

## Support

For Firebase setup issues, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

For other questions, check the browser console (F12) for error messages.

---

**Made with ❤️ for chitti groups everywhere!**
