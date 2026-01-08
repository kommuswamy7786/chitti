import { db, auth, collection, addDoc, updateDoc, doc, getDocs, query, where, onSnapshot, serverTimestamp, getDoc, setDoc, deleteDoc, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from './firebase.js';

let currentUser = null;
let unsubscribers = [];

window.login = async () => {
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  
  if (!phone || !password) return alert('Enter phone and password');

  try {
    const email = `${phone}@chitti.app`;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (userDoc.exists()) {
      currentUser = { id: userCredential.user.uid, ...userDoc.data() };
      showDashboard();
    }
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
};

window.logout = async () => {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  await signOut(auth);
  currentUser = null;
  document.getElementById('auth-section').classList.remove('hidden');
  document.getElementById('admin-section').classList.add('hidden');
  document.getElementById('member-section').classList.add('hidden');
};

function showDashboard() {
  document.getElementById('auth-section').classList.add('hidden');
  
  if (currentUser.role === 'admin') {
    document.getElementById('admin-section').classList.remove('hidden');
    loadAdminDashboard();
  } else {
    document.getElementById('member-section').classList.remove('hidden');
    loadMemberDashboard();
  }
}

window.createChitti = async () => {
  const amount = document.getElementById('chitti-amount').value;
  const duration = document.getElementById('chitti-duration').value;
  const commission = document.getElementById('chitti-commission').value;

  if (!amount || !duration || !commission) return alert('Fill all fields');

  try {
    await addDoc(collection(db, 'chittis'), {
      totalAmount: parseFloat(amount),
      duration: parseInt(duration),
      commission: parseFloat(commission),
      monthlyAmount: parseFloat(amount) / parseInt(duration),
      currentMonth: 1,
      status: 'active',
      createdAt: serverTimestamp(),
      createdBy: currentUser.id
    });
    
    alert('Chitti created!');
    document.getElementById('chitti-amount').value = '';
    document.getElementById('chitti-duration').value = '';
    document.getElementById('chitti-commission').value = '';
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

window.addMember = async () => {
  const name = document.getElementById('member-name').value;
  const phone = document.getElementById('member-phone').value;
  const password = document.getElementById('member-password').value;
  const chittiId = document.getElementById('member-chitti').value;

  if (!name || !phone || !password || !chittiId) return alert('Fill all fields');

  try {
    const email = `${phone}@chitti.app`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name, phone, role: 'member', createdAt: serverTimestamp()
    });

    await addDoc(collection(db, 'members'), {
      userId: userCredential.user.uid,
      name, phone, chittiId,
      payments: [],
      hasWonLottery: false,
      createdAt: serverTimestamp()
    });

    alert('Member added!');
    document.getElementById('member-name').value = '';
    document.getElementById('member-phone').value = '';
    document.getElementById('member-password').value = '';
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

window.recordPayment = async (memberId, chittiId, month) => {
  try {
    const memberRef = doc(db, 'members', memberId);
    const memberDoc = await getDoc(memberRef);
    const payments = memberDoc.data().payments || [];
    
    payments.push({ month, paidAt: serverTimestamp(), status: 'paid' });
    await updateDoc(memberRef, { payments });
    alert('Payment recorded!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

window.runLottery = async () => {
  const chittiId = document.getElementById('lottery-chitti').value;
  if (!chittiId) return alert('Select a chitti');

  try {
    const chittiDoc = await getDoc(doc(db, 'chittis', chittiId));
    const currentMonth = chittiDoc.data().currentMonth;

    const membersSnapshot = await getDocs(query(collection(db, 'members'), where('chittiId', '==', chittiId), where('hasWonLottery', '==', false)));

    const eligibleMembers = [];
    membersSnapshot.forEach(doc => {
      const member = doc.data();
      const payments = member.payments || [];
      const paidThisMonth = payments.some(p => p.month === currentMonth && p.status === 'paid');
      
      if (paidThisMonth) eligibleMembers.push({ id: doc.id, ...member });
    });

    if (eligibleMembers.length === 0) return alert('No eligible members');

    const winner = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
    
    await updateDoc(doc(db, 'members', winner.id), { hasWonLottery: true });
    await addDoc(collection(db, 'lotteries'), {
      chittiId, month: currentMonth, winnerId: winner.id, winnerName: winner.name, timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'chittis', chittiId), { currentMonth: currentMonth + 1 });

    document.getElementById('lottery-result').innerHTML = `<div class="lottery-winner">🎉 Winner: ${winner.name} (${winner.phone})</div>`;
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

async function loadAdminDashboard() {
  const unsubChittis = onSnapshot(collection(db, 'chittis'), (snapshot) => {
    const chittis = [];
    snapshot.forEach(doc => chittis.push({ id: doc.id, ...doc.data() }));
    displayChittis(chittis);
    populateChittiSelects(chittis);
    loadReports(chittis);
  });
  unsubscribers.push(unsubChittis);
}

window.deleteChitti = async (chittiId) => {
  if (!confirm('Delete this chitti? This will also delete all members.')) return;
  
  try {
    const membersSnapshot = await getDocs(query(collection(db, 'members'), where('chittiId', '==', chittiId)));
    for (const memberDoc of membersSnapshot.docs) {
      await deleteDoc(doc(db, 'members', memberDoc.id));
    }
    await deleteDoc(doc(db, 'chittis', chittiId));
    alert('Chitti deleted!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

function displayChittis(chittis) {
  document.getElementById('chitti-list').innerHTML = chittis.map(c => `
    <div class="chitti-item">
      <strong>₹${c.totalAmount.toLocaleString()}</strong> - ${c.duration} months
      <span class="status-badge status-active">Month ${c.currentMonth}/${c.duration}</span>
      <br><small>Commission: ${c.commission}% | Monthly: ₹${c.monthlyAmount.toFixed(2)}</small>
      <br><button class="btn-small" style="background:#ef4444" onclick="deleteChitti('${c.id}')">Delete</button>
    </div>
  `).join('');
}

function populateChittiSelects(chittis) {
  ['member-chitti', 'view-chitti', 'lottery-chitti'].forEach(id => {
    document.getElementById(id).innerHTML = '<option value="">Select Chitti</option>' + 
      chittis.map(c => `<option value="${c.id}">₹${c.totalAmount} - ${c.duration}M</option>`).join('');
  });
}

window.loadMembers = async () => {
  const chittiId = document.getElementById('view-chitti').value;
  if (!chittiId) return;

  const membersSnapshot = await getDocs(query(collection(db, 'members'), where('chittiId', '==', chittiId)));
  const chittiDoc = await getDoc(doc(db, 'chittis', chittiId));
  const currentMonth = chittiDoc.data().currentMonth;

  document.getElementById('members-list').innerHTML = '';

  membersSnapshot.forEach(doc => {
    const member = doc.data();
    const payments = member.payments || [];
    const paidThisMonth = payments.some(p => p.month === currentMonth && p.status === 'paid');

    document.getElementById('members-list').innerHTML += `
      <div class="member-item">
        <strong>${member.name}</strong> - ${member.phone}
        <span class="status-badge ${paidThisMonth ? 'status-paid' : 'status-pending'}">${paidThisMonth ? 'Paid' : 'Pending'}</span>
        ${member.hasWonLottery ? '<span class="status-badge" style="background:#fef3c7;color:#92400e">🏆 Won</span>' : ''}
        <br><button class="btn-small btn-success" onclick="recordPayment('${doc.id}', '${chittiId}', ${currentMonth})">Record Payment</button>
      </div>
    `;
  });
};

async function loadReports(chittis) {
  let totalAmount = 0, activeChittis = 0;
  chittis.forEach(c => {
    totalAmount += c.totalAmount;
    if (c.status === 'active') activeChittis++;
  });

  const membersSnapshot = await getDocs(collection(db, 'members'));

  document.getElementById('reports').innerHTML = `
    <div class="grid">
      <div class="stat-card"><div class="stat-value">${activeChittis}</div><div class="stat-label">Active Chittis</div></div>
      <div class="stat-card"><div class="stat-value">${membersSnapshot.size}</div><div class="stat-label">Total Members</div></div>
      <div class="stat-card"><div class="stat-value">₹${totalAmount.toLocaleString()}</div><div class="stat-label">Total Amount</div></div>
    </div>
  `;
}

async function loadMemberDashboard() {
  const membersSnapshot = await getDocs(query(collection(db, 'members'), where('userId', '==', currentUser.id)));

  document.getElementById('member-dashboard').innerHTML = '';

  for (const memberDoc of membersSnapshot.docs) {
    const member = memberDoc.data();
    const chittiDoc = await getDoc(doc(db, 'chittis', member.chittiId));
    const chitti = chittiDoc.data();
    const payments = member.payments || [];
    const paidMonths = payments.filter(p => p.status === 'paid').length;

    document.getElementById('member-dashboard').innerHTML += `
      <div class="card">
        <h3>Chitti Details</h3>
        <div class="chitti-item">
          <strong>Total:</strong> ₹${chitti.totalAmount.toLocaleString()}<br>
          <strong>Monthly:</strong> ₹${chitti.monthlyAmount.toFixed(2)}<br>
          <strong>Duration:</strong> ${chitti.duration} months<br>
          <strong>Current Month:</strong> ${chitti.currentMonth}<br>
          <strong>Your Payments:</strong> ${paidMonths}/${chitti.duration}
          ${member.hasWonLottery ? '<br><span class="status-badge" style="background:#fef3c7;color:#92400e">🏆 You Won!</span>' : ''}
        </div>
        <h3 style="margin-top:20px">Payment History</h3>
        ${payments.map(p => `<div class="member-item">Month ${p.month} - <span class="status-badge status-paid">Paid</span></div>`).join('') || '<p>No payments yet</p>'}
      </div>
    `;
  }

  const unsubMembers = onSnapshot(query(collection(db, 'members'), where('userId', '==', currentUser.id)), () => loadMemberDashboard());
  unsubscribers.push(unsubMembers);
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    try {
      await createUserWithEmailAndPassword(auth, 'admin@chitti.app', 'admin123');
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        name: 'Admin', phone: 'admin', role: 'admin', createdAt: serverTimestamp()
      });
    } catch (e) {}
  }
});
