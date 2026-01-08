// Firebase-enabled Chitti App

class ChittiApp {
    constructor() {
        this.chittis = [];
        this.payments = [];
        this.lotteries = [];
        this.currentUser = null;
        this.unsubscribeChittis = null;
        this.unsubscribePayments = null;
        this.unsubscribeLotteries = null;
        
        // Store Firebase references
        this.db = typeof db !== 'undefined' ? db : null;
        this.auth = typeof auth !== 'undefined' ? auth : null;
        
        this.initFirebase();
    }

    initFirebase() {
        try {
            // Wait for Firebase to be ready
            const waitForFirebase = setInterval(() => {
                if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
                    clearInterval(waitForFirebase);
                    
                    this.db = db;
                    this.auth = auth;
                    
                    this.auth.onAuthStateChanged((user) => {
                        if (user) {
                            this.currentUser = user;
                            this.setupRealtimeListeners();
                            this.init();
                        } else {
                            // No user, use local storage as fallback
                            this.chittis = this.loadFromStorage('chittis') || [];
                            this.payments = this.loadFromStorage('payments') || [];
                            this.lotteries = this.loadFromStorage('lotteries') || [];
                            this.init();
                        }
                    });
                }
            }, 100);

            // Fallback if Firebase doesn't load
            setTimeout(() => {
                clearInterval(waitForFirebase);
                if (!this.chittis || this.chittis.length === 0) {
                    this.chittis = this.loadFromStorage('chittis') || [];
                    this.payments = this.loadFromStorage('payments') || [];
                    this.lotteries = this.loadFromStorage('lotteries') || [];
                    this.init();
                }
            }, 3000);
        } catch (error) {
            console.error('Firebase initialization error:', error);
            // Fallback to localStorage
            this.chittis = this.loadFromStorage('chittis') || [];
            this.payments = this.loadFromStorage('payments') || [];
            this.lotteries = this.loadFromStorage('lotteries') || [];
            this.init();
        }
    }

    setupRealtimeListeners() {
        if (!this.currentUser || !this.db) return;

        const userId = this.currentUser.uid;

        // Listen to chittis
        if (this.unsubscribeChittis) this.unsubscribeChittis();
        this.unsubscribeChittis = this.db.collection('chittis')
            .where('userId', '==', userId)
            .onSnapshot((snapshot) => {
                this.chittis = [];
                snapshot.forEach((doc) => {
                    this.chittis.push({ id: doc.id, ...doc.data() });
                });
                this.updateUI();
            });

        // Listen to payments
        if (this.unsubscribePayments) this.unsubscribePayments();
        this.unsubscribePayments = this.db.collection('payments')
            .where('userId', '==', userId)
            .onSnapshot((snapshot) => {
                this.payments = [];
                snapshot.forEach((doc) => {
                    this.payments.push({ id: doc.id, ...doc.data() });
                });
                this.updatePaymentHistory();
            });

        // Listen to lotteries
        if (this.unsubscribeLotteries) this.unsubscribeLotteries();
        this.unsubscribeLotteries = this.db.collection('lotteries')
            .where('userId', '==', userId)
            .onSnapshot((snapshot) => {
                this.lotteries = [];
                snapshot.forEach((doc) => {
                    this.lotteries.push({ id: doc.id, ...doc.data() });
                });
                this.updateLotteryHistory();
                this.updateUI();
            });
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Forms
        document.getElementById('chittiForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createChitti();
        });

        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePayments();
        });

        document.getElementById('paymentChitti').addEventListener('change', (e) => {
            this.populateMemberPayments(e.target.value);
        });

        document.getElementById('lotteryParticipantsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveLotteryParticipants();
        });

        // Payment History
        this.updatePaymentHistory();

        // Report
        document.getElementById('reportChitti').addEventListener('change', (e) => {
            this.loadReport(e.target.value);
        });

        // Lottery month default
        const today = new Date();
        const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        document.getElementById('lotteryMonth').value = monthStr;
        document.getElementById('paymentMonth').value = monthStr;
    }

    // Tab Switching
    switchTab(tabName) {
        document.querySelectorAll('.tab-pane').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        if (tabName === 'payment' || tabName === 'lottery') {
            this.updateChittiDropdowns();
        }
        if (tabName === 'reports') {
            this.updateReportDropdown();
        }
    }

    // Chitti Management
    async createChitti() {
        const name = document.getElementById('chittiName').value;
        const monthlyAmount = parseInt(document.getElementById('monthlyAmount').value);
        const commission = parseFloat(document.getElementById('commission').value) || 0;
        const memberNames = document.getElementById('members').value
            .split(',')
            .map(m => m.trim())
            .filter(m => m !== '');
        const editingChittiId = document.getElementById('editingChittiId').value;

        if (memberNames.length === 0) {
            this.showToast('Please enter at least one member name', 'error');
            return;
        }

        const totalMembers = memberNames.length;

        const chittiData = {
            name,
            monthlyAmount,
            commission,
            totalMembers,
            members: memberNames.map(name => ({
                id: Date.now() + Math.random(),
                name,
                paidMonths: [],
                totalPaid: 0,
                wonLottery: false,
                lotteryParticipant: false
            })),
            createdDate: new Date().toLocaleDateString(),
            status: 'Active',
            userId: this.currentUser ? this.currentUser.uid : 'local'
        };

        try {
            if (this.db) {
                // Firebase enabled
                if (editingChittiId) {
                    await this.db.collection('chittis').doc(editingChittiId).update(chittiData);
                    this.showToast(`Chitti "${name}" updated successfully!`, 'success');
                } else {
                    await this.db.collection('chittis').add(chittiData);
                    this.showToast(`Chitti "${name}" created successfully!`, 'success');
                }
            } else {
                // Fallback to localStorage
                if (editingChittiId) {
                    const index = this.chittis.findIndex(c => c.id == editingChittiId);
                    if (index >= 0) {
                        chittiData.id = editingChittiId;
                        this.chittis[index] = chittiData;
                        this.showToast(`Chitti "${name}" updated successfully!`, 'success');
                    }
                } else {
                    chittiData.id = Date.now();
                    this.chittis.push(chittiData);
                    this.showToast(`Chitti "${name}" created successfully!`, 'success');
                }
                this.saveToStorage('chittis', this.chittis);
            }

            document.getElementById('chittiForm').reset();
            document.getElementById('editingChittiId').value = '';
            document.getElementById('formTitle').textContent = 'Create New Chitti';
            document.getElementById('submitBtn').textContent = 'Create Chitti';
            document.getElementById('cancelEditBtn').style.display = 'none';
            
            this.switchTab('dashboard');
            this.updateUI();
        } catch (error) {
            this.showToast('Error saving chitti: ' + error.message, 'error');
            console.error('Create chitti error:', error);
        }
    }

    editChitti(chittiId) {
        const chitti = this.chittis.find(c => c.id == chittiId);
        if (!chitti) return;

        document.getElementById('chittiName').value = chitti.name;
        document.getElementById('monthlyAmount').value = chitti.monthlyAmount;
        document.getElementById('commission').value = chitti.commission;
        document.getElementById('totalMembers').value = chitti.totalMembers;
        document.getElementById('members').value = chitti.members.map(m => m.name).join(', ');
        document.getElementById('editingChittiId').value = chittiId;

        document.getElementById('formTitle').textContent = 'Edit Chitti';
        document.getElementById('submitBtn').textContent = 'Update Chitti';
        document.getElementById('cancelEditBtn').style.display = 'inline-block';

        this.switchTab('add-chitti');
        document.getElementById('chittiForm').scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        document.getElementById('chittiForm').reset();
        document.getElementById('editingChittiId').value = '';
        document.getElementById('formTitle').textContent = 'Create New Chitti';
        document.getElementById('submitBtn').textContent = 'Create Chitti';
        document.getElementById('cancelEditBtn').style.display = 'none';
    }

    async deleteChitti(chittiId) {
        if (confirm('Are you sure you want to delete this chitti?')) {
            try {
                if (this.db) {
                    await this.db.collection('chittis').doc(chittiId).delete();
                } else {
                    this.chittis = this.chittis.filter(c => c.id !== chittiId);
                    this.saveToStorage('chittis', this.chittis);
                }
                this.showToast('Chitti deleted successfully!', 'success');
                this.updateUI();
            } catch (error) {
                this.showToast('Error deleting chitti: ' + error.message, 'error');
            }
        }
    }

    // Payment Management
    updateChittiDropdowns() {
        const paymentSelect = document.getElementById('paymentChitti');
        const lotterySelect = document.getElementById('lotteryChitti');
        const participantSelect = document.getElementById('participantChitti');
        
        paymentSelect.innerHTML = '<option value="">-- Choose Chitti --</option>';
        lotterySelect.innerHTML = '<option value="">-- Choose Chitti --</option>';
        participantSelect.innerHTML = '<option value="">-- Choose Chitti --</option>';

        this.chittis.forEach(chitti => {
            const option = document.createElement('option');
            option.value = chitti.id;
            option.textContent = chitti.name;
            paymentSelect.appendChild(option);
            
            const option2 = option.cloneNode(true);
            lotterySelect.appendChild(option2);

            const option3 = option.cloneNode(true);
            participantSelect.appendChild(option3);
        });
    }

    populateMemberPayments(chittiId) {
        const chitti = this.chittis.find(c => c.id == chittiId);
        if (!chitti) return;

        const container = document.getElementById('memberPaymentsContainer');
        container.innerHTML = '<label>Member Payments</label>';

        chitti.members.forEach(member => {
            const div = document.createElement('div');
            div.className = 'member-payment-item';
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; width: 60%;">
                    <input type="checkbox" class="member-paid" data-member-id="${member.id}" data-amount="${chitti.monthlyAmount}" onchange="app.toggleMemberAmount(this)">
                    <label style="margin: 0; flex: 1;">${member.name}</label>
                </div>
                <input type="number" class="member-amount" data-member-id="${member.id}" placeholder="₹${chitti.monthlyAmount}" value="${chitti.monthlyAmount}" disabled>
            `;
            container.appendChild(div);
        });
    }

    toggleMemberAmount(checkbox) {
        const memberId = checkbox.dataset.memberId;
        const amountInput = document.querySelector(`.member-amount[data-member-id="${memberId}"]`);
        const amount = checkbox.dataset.amount;

        if (checkbox.checked) {
            amountInput.disabled = false;
            amountInput.value = amount;
        } else {
            amountInput.disabled = true;
            amountInput.value = amount;
        }
    }

    async savePayments() {
        const chittiId = document.getElementById('paymentChitti').value;
        const month = document.getElementById('paymentMonth').value;

        if (!chittiId || !month) {
            this.showToast('Please select chitti and month', 'error');
            return;
        }

        const chitti = this.chittis.find(c => c.id == chittiId);
        const memberCheckboxes = document.querySelectorAll('.member-paid');

        let totalPaid = 0;
        let paymentsCount = 0;

        try {
            for (const checkbox of memberCheckboxes) {
                if (checkbox.checked) {
                    const memberId = checkbox.dataset.memberId;
                    const amountInput = document.querySelector(`.member-amount[data-member-id="${memberId}"]`);
                    const amount = parseInt(amountInput.value) || 0;

                    if (amount > 0) {
                        const member = chitti.members.find(m => m.id == memberId);
                        
                        const payment = {
                            chittiId: chittiId,
                            memberId: memberId,
                            memberName: member.name,
                            amount: amount,
                            month: month,
                            date: new Date().toLocaleDateString(),
                            userId: this.currentUser ? this.currentUser.uid : 'local',
                            timestamp: new Date()
                        };

                        if (this.db) {
                            // Firebase enabled
                            await this.db.collection('payments').add(payment);
                        } else {
                            // Fallback to localStorage
                            payment.id = Date.now() + Math.random();
                            this.payments.push(payment);
                        }
                        
                        totalPaid += amount;
                        paymentsCount++;
                    }
                }
            }

            if (paymentsCount === 0) {
                this.showToast('Please select at least one member as paid', 'error');
                return;
            }

            if (!this.db) {
                this.saveToStorage('payments', this.payments);
            }

            this.showToast(`${paymentsCount} payments recorded! Total: ₹${totalPaid}`, 'success');
            
            document.getElementById('paymentForm').reset();
            this.updatePaymentHistory();
            this.updateUI();
        } catch (error) {
            this.showToast('Error saving payments: ' + error.message, 'error');
            console.error('Save payments error:', error);
        }
    }

    updatePaymentHistory() {
        const tbody = document.getElementById('paymentTableBody');
        tbody.innerHTML = '';

        if (this.payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No payments recorded yet</td></tr>';
            return;
        }

        const sortedPayments = [...this.payments].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        sortedPayments.forEach(payment => {
            const chitti = this.chittis.find(c => c.id === payment.chittiId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${chitti ? chitti.name : 'Unknown'}</td>
                <td>${payment.memberName}</td>
                <td>₹${payment.amount}</td>
                <td>${payment.month}</td>
                <td>${payment.date}</td>
                <td><button class="btn btn-danger" onclick="app.deletePayment('${payment.id}')">Delete</button></td>
            `;
            tbody.appendChild(row);
        });
    }

    async deletePayment(paymentId) {
        if (confirm('Are you sure you want to delete this payment?')) {
            try {
                if (this.db) {
                    await this.db.collection('payments').doc(paymentId).delete();
                } else {
                    this.payments = this.payments.filter(p => p.id !== paymentId);
                    this.saveToStorage('payments', this.payments);
                }
                this.showToast('Payment deleted', 'success');
                this.updatePaymentHistory();
            } catch (error) {
                this.showToast('Error deleting payment: ' + error.message, 'error');
            }
        }
    }

    // Lottery System
    loadLotteryParticipants(chittiId) {
        const chitti = this.chittis.find(c => c.id == chittiId);
        if (!chitti) return;

        const container = document.getElementById('participantList');
        container.innerHTML = '<label>Who wants to participate in lottery?</label>';

        chitti.members.forEach(member => {
            const div = document.createElement('div');
            div.className = 'member-payment-item';
            const isParticipant = member.lotteryParticipant || false;
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; width: 60%;">
                    <input type="checkbox" class="lottery-participant" data-member-id="${member.id}" ${isParticipant ? 'checked' : ''}>
                    <label style="margin: 0; flex: 1;">${member.name}</label>
                </div>
            `;
            container.appendChild(div);
        });
    }

    async saveLotteryParticipants() {
        const chittiId = document.getElementById('participantChitti').value;
        
        if (!chittiId) {
            this.showToast('Please select a chitti', 'error');
            return;
        }

        const chitti = this.chittis.find(c => c.id == chittiId);
        if (!chitti) return;

        const checkboxes = document.querySelectorAll('.lottery-participant');
        let count = 0;

        try {
            // Update members with lottery participation
            chitti.members.forEach(member => {
                member.lotteryParticipant = false;
            });

            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const memberId = parseFloat(checkbox.dataset.memberId);
                    const member = chitti.members.find(m => m.id === memberId);
                    if (member) {
                        member.lotteryParticipant = true;
                        count++;
                    }
                }
            });

            // Save updated chitti
            if (this.db) {
                // Firebase enabled
                await this.db.collection('chittis').doc(chittiId).update({
                    members: chitti.members
                });
            } else {
                // Fallback to localStorage
                const index = this.chittis.findIndex(c => c.id == chittiId);
                if (index >= 0) {
                    this.chittis[index] = chitti;
                    this.saveToStorage('chittis', this.chittis);
                }
            }

            this.showToast(`${count} members selected for lottery`, 'success');
        } catch (error) {
            this.showToast('Error saving participants: ' + error.message, 'error');
            console.error('Save participants error:', error);
        }
    }

    async drawLottery() {
        const chittiId = document.getElementById('lotteryChitti').value;
        const month = document.getElementById('lotteryMonth').value;

        if (!chittiId || !month) {
            this.showToast('Please select chitti and month', 'error');
            return;
        }

        const chitti = this.chittis.find(c => c.id == chittiId);
        if (!chitti) return;

        // Get eligible members
        const eligibleMembers = chitti.members.filter(member => 
            member.paidMonths.includes(month) && member.lotteryParticipant === true
        );

        if (eligibleMembers.length === 0) {
            this.showToast('No eligible members for lottery (must have paid and opted in)', 'error');
            return;
        }

        const winner = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];

        try {
            const lottery = {
                chittiId: chittiId,
                chittiName: chitti.name,
                winnerId: winner.id,
                winnerName: winner.name,
                month: month,
                extraCharge: 2000,
                userId: this.currentUser ? this.currentUser.uid : 'local',
                timestamp: new Date(),
                drawnDate: new Date().toLocaleDateString()
            };

            if (this.db) {
                // Firebase enabled
                await this.db.collection('lotteries').add(lottery);
                
                const extraChargePayment = {
                    chittiId: chittiId,
                    memberId: winner.id,
                    memberName: winner.name,
                    amount: 2000,
                    month: month,
                    date: new Date().toLocaleDateString(),
                    description: 'Lottery Winner Extra Charge',
                    userId: this.currentUser ? this.currentUser.uid : 'local',
                    timestamp: new Date()
                };
                
                await this.db.collection('payments').add(extraChargePayment);
            } else {
                // Fallback to localStorage
                lottery.id = Date.now();
                this.lotteries.push(lottery);
                
                const extraChargePayment = {
                    id: Date.now() + Math.random(),
                    chittiId: chittiId,
                    memberId: winner.id,
                    memberName: winner.name,
                    amount: 2000,
                    month: month,
                    date: new Date().toLocaleDateString(),
                    description: 'Lottery Winner Extra Charge',
                    userId: this.currentUser ? this.currentUser.uid : 'local',
                    timestamp: new Date()
                };
                
                this.payments.push(extraChargePayment);
                this.saveToStorage('lotteries', this.lotteries);
                this.saveToStorage('payments', this.payments);
            }

            this.showLotteryResult(lottery);
            this.updateLotteryHistory();
            this.updatePaymentHistory();
            this.updateUI();
        } catch (error) {
            this.showToast('Error drawing lottery: ' + error.message, 'error');
            console.error('Draw lottery error:', error);
        }
    }

    showLotteryResult(lottery) {
        document.getElementById('winnerName').textContent = lottery.winnerName;
        document.getElementById('resultMonth').textContent = lottery.month;
        document.getElementById('resultChitti').textContent = lottery.chittiName;
        document.getElementById('lotteryResult').style.display = 'block';
    }

    hideLotteryResult() {
        document.getElementById('lotteryResult').style.display = 'none';
    }

    updateLotteryHistory() {
        const tbody = document.getElementById('lotteryTableBody');
        tbody.innerHTML = '';

        if (this.lotteries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No lotteries drawn yet</td></tr>';
            return;
        }

        const sortedLotteries = [...this.lotteries].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        sortedLotteries.forEach(lottery => {
            const drawnDate = lottery.timestamp ? new Date(lottery.timestamp.toDate()).toLocaleDateString() : lottery.drawnDate || '-';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${lottery.chittiName}</td>
                <td><strong>${lottery.winnerName}</strong></td>
                <td>${lottery.month}</td>
                <td>₹${lottery.extraCharge || 2000}</td>
                <td>${drawnDate}</td>
                <td><button class="btn btn-danger" onclick="app.deleteLottery('${lottery.id}')">Delete</button></td>
            `;
            tbody.appendChild(row);
        });
    }

    async deleteLottery(lotteryId) {
        if (confirm('Are you sure you want to delete this lottery record?')) {
            try {
                if (this.db) {
                    await this.db.collection('lotteries').doc(lotteryId).delete();
                } else {
                    this.lotteries = this.lotteries.filter(l => l.id !== lotteryId);
                    this.saveToStorage('lotteries', this.lotteries);
                }
                this.showToast('Lottery record deleted', 'success');
                this.updateLotteryHistory();
            } catch (error) {
                this.showToast('Error deleting lottery: ' + error.message, 'error');
            }
        }
    }

    // Reports
    updateReportDropdown() {
        const select = document.getElementById('reportChitti');
        select.innerHTML = '<option value="">-- Choose Chitti --</option>';

        this.chittis.forEach(chitti => {
            const option = document.createElement('option');
            option.value = chitti.id;
            option.textContent = chitti.name;
            select.appendChild(option);
        });
    }

    loadReport(chittiId) {
        if (!chittiId) {
            document.getElementById('reportTableBody').innerHTML = '';
            return;
        }

        const chitti = this.chittis.find(c => c.id == chittiId);
        const tbody = document.getElementById('reportTableBody');
        tbody.innerHTML = '';

        const totalAmount = chitti.totalMembers * chitti.monthlyAmount;

        chitti.members.forEach(member => {
            const paymentCount = member.paidMonths.length;
            const status = member.totalPaid >= totalAmount ? 'Completed' : 'Pending';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.name}</td>
                <td>${paymentCount}</td>
                <td>₹${member.totalPaid}</td>
                <td>${member.wonLottery ? '✓ Yes' : 'No'}</td>
                <td><span class="status-badge ${member.totalPaid > 0 ? 'status-paid' : 'status-pending'}">${status}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    // UI Update
    updateUI() {
        this.updateDashboard();
        this.updateChittiList();
    }

    updateDashboard() {
        document.getElementById('totalChittis').textContent = this.chittis.length;
        
        const totalMembers = this.chittis.reduce((sum, c) => sum + c.members.length, 0);
        document.getElementById('totalMembers').textContent = totalMembers;

        const totalCollected = this.payments.reduce((sum, p) => sum + p.amount, 0);
        document.getElementById('totalCollected').textContent = `₹${totalCollected.toLocaleString()}`;

        document.getElementById('totalLotteries').textContent = this.lotteries.length;
    }

    updateChittiList() {
        const container = document.getElementById('chittiList');
        
        if (this.chittis.length === 0) {
            container.innerHTML = '<p class="empty-message">No chittis created yet. Create one to get started!</p>';
            return;
        }

        container.innerHTML = '';

        this.chittis.forEach(chitti => {
            const totalExpected = chitti.totalMembers * chitti.monthlyAmount;
            const totalCollected = chitti.members.reduce((sum, m) => sum + m.totalPaid, 0);
            const commissionAmount = Math.round((totalCollected * chitti.commission) / 100);
            const percentage = Math.round((totalCollected / totalExpected) * 100);

            const card = document.createElement('div');
            card.className = 'chitti-card';
            card.innerHTML = `
                <h4>${chitti.name}</h4>
                <p><strong>Members:</strong> ${chitti.totalMembers}</p>
                <p><strong>Monthly:</strong> ₹${chitti.monthlyAmount.toLocaleString()}</p>
                <p><strong>Commission:</strong> ${chitti.commission}% (₹${commissionAmount.toLocaleString()})</p>
                <p><strong>Collected:</strong> ₹${totalCollected.toLocaleString()} / ₹${totalExpected.toLocaleString()}</p>
                <p><strong>Progress:</strong> ${percentage}%</p>
                <div style="background: #e0e0e0; height: 6px; border-radius: 3px; margin-top: 10px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="btn btn-secondary" onclick="app.editChitti('${chitti.id}')" style="flex: 1; padding: 8px;">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="app.deleteChitti('${chitti.id}')" style="flex: 1; padding: 8px;">🗑️ Delete</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Storage Fallback
    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // Notifications
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Export Functions
function exportToCSV() {
    if (app.chittis.length === 0) {
        alert('No data to export');
        return;
    }

    let csv = 'Chitti Name,Member Name,Total Paid,Months Paid,Won Lottery\n';

    app.chittis.forEach(chitti => {
        chitti.members.forEach(member => {
            csv += `"${chitti.name}","${member.name}",${member.totalPaid},"${member.paidMonths.join(', ')}","${member.wonLottery ? 'Yes' : 'No'}"\n`;
        });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chitti-report-${new Date().toLocaleDateString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function printReport() {
    window.print();
}

function drawLottery() {
    app.drawLottery();
}

function hideLotteryResult() {
    app.hideLotteryResult();
}

// Initialize App when Firebase is ready
let app;

function initializeApp() {
    try {
        app = new ChittiApp();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('App initialization error:', error);
        // Retry after delay
        setTimeout(initializeApp, 1000);
    }
}

// Start initialization immediately, retry if needed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Also try after a short delay as fallback
setTimeout(() => {
    if (!app) {
        initializeApp();
    }
}, 1500);
