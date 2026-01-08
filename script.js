// Chitti Management System - JavaScript

// Data Structure
class ChittiApp {
    constructor() {
        this.chittis = this.loadFromStorage('chittis') || [];
        this.payments = this.loadFromStorage('payments') || [];
        this.lotteries = this.loadFromStorage('lotteries') || [];
        this.init();
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
        // Hide all tabs
        document.querySelectorAll('.tab-pane').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update dropdowns when switching to payment or report tabs
        if (tabName === 'payment' || tabName === 'lottery') {
            this.updateChittiDropdowns();
        }
        if (tabName === 'reports') {
            this.updateReportDropdown();
        }
    }

    // Chitti Management
    createChitti() {
        const name = document.getElementById('chittiName').value;
        const monthlyAmount = parseInt(document.getElementById('monthlyAmount').value);
        const commission = parseFloat(document.getElementById('commission').value) || 0;
        const memberNames = document.getElementById('members').value
            .split(',')
            .map(m => m.trim())
            .filter(m => m !== ''); // Remove empty entries
        const editingChittiId = document.getElementById('editingChittiId').value;

        if (memberNames.length === 0) {
            this.showToast('Please enter at least one member name', 'error');
            return;
        }

        // Use actual member count (ignore the Total Members field if it doesn't match)
        const totalMembers = memberNames.length;

        if (editingChittiId) {
            // Update existing chitti
            const chittiIndex = this.chittis.findIndex(c => c.id == editingChittiId);
            if (chittiIndex > -1) {
                this.chittis[chittiIndex].name = name;
                this.chittis[chittiIndex].monthlyAmount = monthlyAmount;
                this.chittis[chittiIndex].commission = commission;
                this.chittis[chittiIndex].totalMembers = totalMembers;
                this.chittis[chittiIndex].members = memberNames.map(memberName => {
                    const existing = this.chittis[chittiIndex].members.find(m => m.name === memberName);
                    return existing || {
                        id: Date.now() + Math.random(),
                        name: memberName,
                        paidMonths: [],
                        totalPaid: 0,
                        wonLottery: false
                    };
                });
                this.saveToStorage('chittis', this.chittis);
                this.showToast(`Chitti "${name}" updated successfully!`, 'success');
            }
        } else {
            // Create new chitti
            const chitti = {
                id: Date.now(),
                name,
                monthlyAmount,
                commission,
                totalMembers,
                members: memberNames.map(name => ({
                    id: Date.now() + Math.random(),
                    name,
                    paidMonths: [],
                    totalPaid: 0,
                    wonLottery: false
                })),
                createdDate: new Date().toLocaleDateString(),
                status: 'Active'
            };

            this.chittis.push(chitti);
            this.saveToStorage('chittis', this.chittis);
            this.showToast(`Chitti "${name}" created successfully!`, 'success');
        }

        // Reset form
        document.getElementById('chittiForm').reset();
        document.getElementById('editingChittiId').value = '';
        document.getElementById('formTitle').textContent = 'Create New Chitti';
        document.getElementById('submitBtn').textContent = 'Create Chitti';
        document.getElementById('cancelEditBtn').style.display = 'none';
        
        this.updateUI();
        
        // Switch to dashboard
        this.switchTab('dashboard');
    }

    editChitti(chittiId) {
        const chitti = this.chittis.find(c => c.id == chittiId);
        if (!chitti) return;

        // Populate form with existing data
        document.getElementById('chittiName').value = chitti.name;
        document.getElementById('monthlyAmount').value = chitti.monthlyAmount;
        document.getElementById('commission').value = chitti.commission;
        document.getElementById('totalMembers').value = chitti.totalMembers;
        document.getElementById('members').value = chitti.members.map(m => m.name).join(', ');
        document.getElementById('editingChittiId').value = chittiId;

        // Update form UI
        document.getElementById('formTitle').textContent = 'Edit Chitti';
        document.getElementById('submitBtn').textContent = 'Update Chitti';
        document.getElementById('cancelEditBtn').style.display = 'inline-block';

        // Switch to form tab
        this.switchTab('add-chitti');

        // Scroll to form
        document.getElementById('chittiForm').scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        document.getElementById('chittiForm').reset();
        document.getElementById('editingChittiId').value = '';
        document.getElementById('formTitle').textContent = 'Create New Chitti';
        document.getElementById('submitBtn').textContent = 'Create Chitti';
        document.getElementById('cancelEditBtn').style.display = 'none';
    }

    deleteChitti(chittiId) {
        if (confirm('Are you sure you want to delete this chitti? All associated payments and lottery records will not be affected.')) {
            this.chittis = this.chittis.filter(c => c.id !== chittiId);
            this.saveToStorage('chittis', this.chittis);
            this.showToast('Chitti deleted successfully!', 'success');
            this.updateUI();
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

    savePayments() {
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

        memberCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const memberId = checkbox.dataset.memberId;
                const amountInput = document.querySelector(`.member-amount[data-member-id="${memberId}"]`);
                const amount = parseInt(amountInput.value) || 0;

                if (amount > 0) {
                    const payment = {
                        id: Date.now() + Math.random(),
                        chittiId: parseInt(chittiId),
                        memberId: parseFloat(memberId),
                        memberName: chitti.members.find(m => m.id == memberId).name,
                        amount,
                        month,
                        date: new Date().toLocaleDateString()
                    };

                    this.payments.push(payment);
                    
                    // Update member stats
                    const member = chitti.members.find(m => m.id == memberId);
                    if (member) {
                        member.paidMonths.push(month);
                        member.totalPaid += amount;
                    }

                    totalPaid += amount;
                    paymentsCount++;
                }
            }
        });

        if (paymentsCount === 0) {
            this.showToast('Please select at least one member as paid', 'error');
            return;
        }

        this.saveToStorage('payments', this.payments);
        this.saveToStorage('chittis', this.chittis);
        
        this.showToast(`${paymentsCount} payments recorded! Total: ₹${totalPaid}`, 'success');
        
        // Reset and update
        document.getElementById('paymentForm').reset();
        this.updatePaymentHistory();
        this.updateUI();
    }

    updatePaymentHistory() {
        const tbody = document.getElementById('paymentTableBody');
        tbody.innerHTML = '';

        if (this.payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No payments recorded yet</td></tr>';
            return;
        }

        // Sort by date descending
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
                <td><button class="btn btn-danger" onclick="app.deletePayment(${payment.id})">Delete</button></td>
            `;
            tbody.appendChild(row);
        });
    }

    deletePayment(paymentId) {
        if (confirm('Are you sure you want to delete this payment?')) {
            this.payments = this.payments.filter(p => p.id !== paymentId);
            this.saveToStorage('payments', this.payments);
            this.updatePaymentHistory();
            this.updateUI();
            this.showToast('Payment deleted', 'success');
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

    saveLotteryParticipants() {
        const chittiId = document.getElementById('participantChitti').value;
        
        if (!chittiId) {
            this.showToast('Please select a chitti', 'error');
            return;
        }

        const chitti = this.chittis.find(c => c.id == chittiId);
        if (!chitti) return;

        const checkboxes = document.querySelectorAll('.lottery-participant');
        let count = 0;

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

        this.saveToStorage('chittis', this.chittis);
        this.showToast(`${count} members selected for lottery`, 'success');
    }

    drawLottery() {
        const chittiId = document.getElementById('lotteryChitti').value;
        const month = document.getElementById('lotteryMonth').value;

        if (!chittiId || !month) {
            this.showToast('Please select chitti and month', 'error');
            return;
        }

        const chitti = this.chittis.find(c => c.id == chittiId);
        if (!chitti) return;

        // Get members who have paid for this month AND want to participate in lottery
        const eligibleMembers = chitti.members.filter(member => 
            member.paidMonths.includes(month) && member.lotteryParticipant === true
        );

        if (eligibleMembers.length === 0) {
            this.showToast('No eligible members for lottery (must have paid and opted in)', 'error');
            return;
        }

        // Random selection
        const winner = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];

        // Record lottery with extra charge
        const lottery = {
            id: Date.now(),
            chittiId: parseInt(chittiId),
            chittiName: chitti.name,
            winnerId: winner.id,
            winnerName: winner.name,
            month,
            extraCharge: 2000,
            drawnDate: new Date().toLocaleDateString()
        };

        // Add extra charge to winner's total
        winner.totalPaid += 2000;

        this.lotteries.push(lottery);

        // Record the extra charge as a payment
        const extraChargePayment = {
            id: Date.now() + Math.random(),
            chittiId: parseInt(chittiId),
            memberId: winner.id,
            memberName: winner.name,
            amount: 2000,
            month: month,
            date: new Date().toLocaleDateString(),
            description: 'Lottery Winner Extra Charge'
        };
        this.payments.push(extraChargePayment);

        this.saveToStorage('lotteries', this.lotteries);
        this.saveToStorage('chittis', this.chittis);
        this.saveToStorage('payments', this.payments);

        // Show result
        this.showLotteryResult(lottery);
        this.updateLotteryHistory();
        this.updatePaymentHistory();
        this.updateUI();
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
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No lotteries drawn yet</td></tr>';
            return;
        }

        // Sort by date descending
        const sortedLotteries = [...this.lotteries].sort((a, b) => 
            new Date(b.drawnDate) - new Date(a.drawnDate)
        );

        sortedLotteries.forEach(lottery => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${lottery.chittiName}</td>
                <td><strong>${lottery.winnerName}</strong></td>
                <td>${lottery.month}</td>
                <td>₹${lottery.extraCharge || 2000}</td>
                <td>${lottery.drawnDate}</td>
                <td><button class="btn btn-danger" onclick="app.deleteLottery(${lottery.id})">Delete</button></td>
            `;
            tbody.appendChild(row);
        });
    }

    deleteLottery(lotteryId) {
        if (confirm('Are you sure you want to delete this lottery record?')) {
            const lottery = this.lotteries.find(l => l.id === lotteryId);
            const chitti = this.chittis.find(c => c.id === lottery.chittiId);
            
            if (chitti) {
                const member = chitti.members.find(m => m.id === lottery.winnerId);
                if (member) {
                    member.wonLottery = false;
                    // Deduct the extra charge
                    member.totalPaid -= (lottery.extraCharge || 2000);
                }
            }

            // Remove the extra charge payment
            this.payments = this.payments.filter(p => 
                !(p.chittiId === lottery.chittiId && p.memberId === lottery.winnerId && p.description === 'Lottery Winner Extra Charge' && p.amount === (lottery.extraCharge || 2000))
            );

            this.lotteries = this.lotteries.filter(l => l.id !== lotteryId);
            this.saveToStorage('lotteries', this.lotteries);
            this.saveToStorage('chittis', this.chittis);
            this.saveToStorage('payments', this.payments);
            this.updateLotteryHistory();
            this.updatePaymentHistory();
            this.updateUI();
            this.showToast('Lottery record deleted', 'success');
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
        this.updateLotteryHistory();
    }

    updateDashboard() {
        // Stats
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
                    <button class="btn btn-secondary" onclick="app.editChitti(${chitti.id})" style="flex: 1; padding: 8px;">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="app.deleteChitti(${chitti.id})" style="flex: 1; padding: 8px;">🗑️ Delete</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Storage
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

// Initialize App
const app = new ChittiApp();
