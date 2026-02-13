// ===== STATE =====
let currentUser = null;
let treatments = [];
let discounts = [];
let selectedDate = null;
let selectedTreatment = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Check for saved session
  const saved = localStorage.getItem('salon_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    showMainApp();
  }

  setupEventListeners();
});

function setupEventListeners() {
  // Auth forms
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('showRegister').addEventListener('click', toggleAuthForms);
  document.getElementById('showLogin').addEventListener('click', toggleAuthForms);

  // Admin
  document.getElementById('adminDotsBtn').addEventListener('click', () => {
    document.getElementById('adminModal').classList.add('active');
  });
  document.getElementById('adminForm').addEventListener('submit', handleAdminLogin);

  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Calendar
  document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
  document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));

  // Time slots
  document.querySelectorAll('.time-slot').forEach(slot => {
    slot.addEventListener('click', () => selectTime(slot));
  });

  // Book button
  document.getElementById('bookBtn').addEventListener('click', handleBooking);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Discount form
  document.getElementById('discountForm').addEventListener('submit', handleAddDiscount);

  // Notification settings
  document.getElementById('saveNotifSettings').addEventListener('click', saveNotifSettings);
}

// ===== AUTH =====
function toggleAuthForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const registerSwitch = document.getElementById('registerSwitch');
  const loginSwitch = document.querySelector('.auth-switch:not(#registerSwitch)');

  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginSwitch.style.display = 'block';
    registerSwitch.style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    loginSwitch.style.display = 'none';
    registerSwitch.style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const name = document.getElementById('loginName').value.trim();
  const phone = document.getElementById('loginPhone').value.trim();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error, 'error');
      return;
    }

    currentUser = data.user;
    localStorage.setItem('salon_user', JSON.stringify(currentUser));
    showMainApp();
    showToast('ברוכה הבאה! 💅', 'success');
  } catch (err) {
    showToast('שגיאה בהתחברות, נסי שוב', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error, 'error');
      return;
    }

    currentUser = data.user;
    localStorage.setItem('salon_user', JSON.stringify(currentUser));
    showMainApp();
    showToast('נרשמת בהצלחה! ברוכה הבאה 💅', 'success');
  } catch (err) {
    showToast('שגיאה בהרשמה, נסי שוב', 'error');
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const name = document.getElementById('adminName').value.trim();
  const phone = document.getElementById('adminPhone').value.trim();
  const adminCode = document.getElementById('adminCode').value.trim();

  try {
    const res = await fetch('/api/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, adminCode })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error, 'error');
      return;
    }

    currentUser = data.user;
    localStorage.setItem('salon_user', JSON.stringify(currentUser));
    closeAdminModal();
    showMainApp();
    showToast('ברוכה הבאה מנהלת! 👑', 'success');
  } catch (err) {
    showToast('שגיאה בכניסה, נסי שוב', 'error');
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('salon_user');
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('authPage').classList.add('active');
  document.getElementById('adminDotsBtn').style.display = 'flex';
}

// ===== MAIN APP =====
async function showMainApp() {
  document.getElementById('authPage').classList.remove('active');
  document.getElementById('authPage').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  document.getElementById('adminDotsBtn').style.display = 'none';

  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('welcomeName').textContent = currentUser.name;

  // Show/hide admin nav
  if (currentUser.is_admin) {
    document.getElementById('adminNavItem').style.display = 'flex';
  }

  await loadTreatments();
  await loadDiscounts();
  renderCalendar();
}

// ===== NAVIGATION =====
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

  if (pageId === 'appointmentsPage') loadMyAppointments();
  if (pageId === 'adminPage') loadAdminData();
}

// ===== TREATMENTS =====
async function loadTreatments() {
  try {
    const res = await fetch('/api/treatments');
    treatments = await res.json();
  } catch (err) {
    console.error('Failed to load treatments:', err);
  }
}

function renderTreatments() {
  const list = document.getElementById('treatmentList');
  const dateDiscounts = discounts.filter(d => d.date === selectedDate);

  list.innerHTML = treatments.map(t => {
    const discount = dateDiscounts.find(d => !d.treatment_id || d.treatment_id === t.id);
    let finalPrice = t.price;
    let hasDiscount = false;

    if (discount) {
      hasDiscount = true;
      if (discount.discount_percent) {
        finalPrice = t.price * (1 - discount.discount_percent / 100);
      } else if (discount.discount_amount) {
        finalPrice = t.price - discount.discount_amount;
      }
    }

    return `
      <div class="treatment-card" data-id="${t.id}" onclick="selectTreatment(${t.id})">
        <div class="treatment-info">
          <h4>${t.name_he}</h4>
        </div>
        <div class="treatment-price">
          ${hasDiscount ? `<span class="original-price">${t.price} ₪</span>` : ''}
          ${Math.round(finalPrice)} ₪
        </div>
      </div>
    `;
  }).join('');
}

function selectTreatment(id) {
  selectedTreatment = id;
  document.querySelectorAll('.treatment-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.treatment-card[data-id="${id}"]`).classList.add('selected');
  document.getElementById('bookBtn').disabled = false;
}

// ===== TIME =====
function selectTime(slot) {
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  slot.classList.add('selected');
  selectedTime = slot.dataset.time;
}

// ===== CALENDAR =====
async function loadDiscounts() {
  try {
    const res = await fetch('/api/discounts/calendar');
    discounts = await res.json();
  } catch (err) {
    console.error('Failed to load discounts:', err);
  }
}

function renderCalendar() {
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  document.getElementById('calendarTitle').textContent = `${months[currentMonth]} ${currentYear}`;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Day of week (0=Sunday)
  let startDay = firstDay.getDay();

  // Previous month days
  const prevMonthLast = new Date(currentYear, currentMonth, 0);
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthLast.getDate() - i;
    const btn = document.createElement('button');
    btn.className = 'calendar-day other-month';
    btn.textContent = day;
    grid.appendChild(btn);
  }

  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = formatDate(date);
    const btn = document.createElement('button');
    btn.className = 'calendar-day';
    btn.textContent = day;

    if (date < today) {
      btn.classList.add('past');
    }

    if (date.toDateString() === today.toDateString()) {
      btn.classList.add('today');
    }

    // Check for discounts
    const dayDiscounts = discounts.filter(d => d.date === dateStr);
    if (dayDiscounts.length > 0) {
      btn.classList.add('has-discount');
      const badge = document.createElement('span');
      badge.className = 'discount-badge';
      badge.textContent = '🏷️';
      btn.appendChild(badge);

      // Tooltip-like title
      btn.title = dayDiscounts.map(d => d.description).join('\n');
    }

    if (dateStr === selectedDate) {
      btn.classList.add('selected');
    }

    if (date >= today) {
      btn.addEventListener('click', () => selectDate(dateStr, day));
    }

    grid.appendChild(btn);
  }

  // Next month days
  const totalCells = grid.children.length;
  const remaining = 42 - totalCells;
  for (let i = 1; i <= remaining; i++) {
    const btn = document.createElement('button');
    btn.className = 'calendar-day other-month';
    btn.textContent = i;
    grid.appendChild(btn);
  }
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

function selectDate(dateStr, day) {
  selectedDate = dateStr;
  selectedTreatment = null;
  selectedTime = null;

  // Reset time selection
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));

  // Format display date
  const date = new Date(dateStr);
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  document.getElementById('selectedDateDisplay').textContent =
    `יום ${dayNames[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

  // Show discount banner if exists
  const dateDiscounts = discounts.filter(d => d.date === dateStr);
  const banner = document.getElementById('discountBanner');
  if (dateDiscounts.length > 0) {
    banner.style.display = 'block';
    banner.innerHTML = '🏷️ ' + dateDiscounts.map(d => d.description).join(' | ');
  } else {
    banner.style.display = 'none';
  }

  // Show treatment selection
  const sel = document.getElementById('treatmentSelection');
  sel.classList.add('active');
  document.getElementById('bookBtn').disabled = true;

  renderTreatments();
  renderCalendar();

  // Scroll to treatment selection
  sel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ===== BOOKING =====
async function handleBooking() {
  if (!selectedDate || !selectedTreatment) {
    showToast('יש לבחור תאריך וסוג טיפול', 'error');
    return;
  }

  const notes = document.getElementById('appointmentNotes').value.trim();

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        treatmentId: selectedTreatment,
        date: selectedDate,
        time: selectedTime,
        notes
      })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error, 'error');
      return;
    }

    showToast('התור נקבע בהצלחה! 🎉', 'success');

    // Reset selection
    selectedDate = null;
    selectedTreatment = null;
    selectedTime = null;
    document.getElementById('treatmentSelection').classList.remove('active');
    document.getElementById('appointmentNotes').value = '';
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    renderCalendar();

  } catch (err) {
    showToast('שגיאה בקביעת התור, נסי שוב', 'error');
  }
}

// ===== MY APPOINTMENTS =====
async function loadMyAppointments() {
  const container = document.getElementById('myAppointments');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await fetch(`/api/appointments/user/${currentUser.id}`);
    const appointments = await res.json();

    if (appointments.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>אין תורים עדיין</p>
          <p style="font-size:0.8rem;margin-top:5px;">קבעי תור חדש מלוח השנה</p>
        </div>
      `;
      return;
    }

    const statusMap = {
      pending: { label: 'ממתין לאישור', class: 'status-pending' },
      confirmed: { label: 'מאושר', class: 'status-confirmed' },
      cancelled: { label: 'בוטל', class: 'status-cancelled' },
      completed: { label: 'הושלם', class: 'status-completed' }
    };

    container.innerHTML = appointments.map(a => {
      const date = new Date(a.date);
      const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      const status = statusMap[a.status] || statusMap.pending;

      return `
        <div class="appointment-card">
          <div class="appointment-header">
            <h4>${a.treatment_name}</h4>
            <span class="appointment-status ${status.class}">${status.label}</span>
          </div>
          <div class="appointment-details">
            <span>📅 יום ${dayNames[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}</span>
            ${a.time ? `<span>🕐 ${a.time}</span>` : ''}
            <span>💰 ${a.treatment_price} ₪</span>
            ${a.notes ? `<span>📝 ${a.notes}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p style="text-align:center;color:var(--danger);">שגיאה בטעינת התורים</p>';
  }
}

// ===== ADMIN =====
async function loadAdminData() {
  if (!currentUser.is_admin) return;
  loadAdminAppointments();
  loadAdminDiscounts();
  loadAdminSettings();
  populateDiscountTreatments();
}

function populateDiscountTreatments() {
  const select = document.getElementById('discountTreatment');
  // Keep first option (all treatments)
  select.innerHTML = '<option value="">כל הטיפולים</option>';
  treatments.forEach(t => {
    select.innerHTML += `<option value="${t.id}">${t.name_he}</option>`;
  });
}

async function loadAdminDiscounts() {
  try {
    const res = await fetch('/api/discounts');
    const discountList = await res.json();
    const container = document.getElementById('discountsList');

    if (discountList.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-light);font-size:0.9rem;">אין מבצעים פעילים</p>';
      return;
    }

    container.innerHTML = discountList.map(d => {
      const date = new Date(d.date);
      return `
        <div class="discount-item">
          <div class="discount-item-info">
            <div class="date">${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}</div>
            <div class="desc">${d.description}${d.treatment_name ? ` (${d.treatment_name})` : ' (כל הטיפולים)'}</div>
            <div class="desc">${d.discount_percent ? d.discount_percent + '% הנחה' : ''}${d.discount_amount ? d.discount_amount + ' ₪ הנחה' : ''}</div>
          </div>
          <button class="btn-delete" onclick="deleteDiscount(${d.id})">✕</button>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load discounts:', err);
  }
}

async function handleAddDiscount(e) {
  e.preventDefault();
  const date = document.getElementById('discountDate').value;
  const description = document.getElementById('discountDesc').value.trim();
  const type = document.getElementById('discountType').value;
  const value = parseFloat(document.getElementById('discountValue').value) || 0;
  const treatmentId = document.getElementById('discountTreatment').value;

  try {
    const res = await fetch('/api/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        description,
        discountPercent: type === 'percent' ? value : null,
        discountAmount: type === 'amount' ? value : null,
        treatmentId: treatmentId || null
      })
    });

    if (!res.ok) {
      const data = await res.json();
      showToast(data.error, 'error');
      return;
    }

    showToast('מבצע נוסף בהצלחה! 🏷️', 'success');
    document.getElementById('discountForm').reset();
    await loadDiscounts();
    loadAdminDiscounts();
    renderCalendar();
  } catch (err) {
    showToast('שגיאה בהוספת מבצע', 'error');
  }
}

async function deleteDiscount(id) {
  if (!confirm('למחוק את המבצע?')) return;

  try {
    await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
    showToast('המבצע נמחק', 'info');
    await loadDiscounts();
    loadAdminDiscounts();
    renderCalendar();
  } catch (err) {
    showToast('שגיאה במחיקת מבצע', 'error');
  }
}

async function loadAdminAppointments() {
  const container = document.getElementById('allAppointments');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await fetch('/api/appointments/all');
    const appointments = await res.json();

    if (appointments.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-light);font-size:0.9rem;">אין תורים</p>';
      return;
    }

    const statusMap = {
      pending: 'ממתין',
      confirmed: 'מאושר',
      cancelled: 'בוטל',
      completed: 'הושלם'
    };

    container.innerHTML = appointments.map(a => {
      const date = new Date(a.date);
      return `
        <div class="admin-appointment-card">
          <div class="client-info">👤 ${a.user_name} | 📱 ${a.user_phone}</div>
          <div class="appointment-meta">
            💅 ${a.treatment_name} | 📅 ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}
            ${a.time ? '| 🕐 ' + a.time : ''} | 💰 ${a.treatment_price} ₪
            ${a.notes ? '<br>📝 ' + a.notes : ''}
          </div>
          <div style="margin-bottom:6px;font-size:0.85rem;">סטטוס: <strong>${statusMap[a.status]}</strong></div>
          <div class="status-actions">
            <button style="background:var(--success);color:white;" onclick="updateStatus(${a.id},'confirmed')">אשרי</button>
            <button style="background:var(--danger);color:white;" onclick="updateStatus(${a.id},'cancelled')">בטלי</button>
            <button style="background:#42a5f5;color:white;" onclick="updateStatus(${a.id},'completed')">הושלם</button>
            <button style="background:#ff9800;color:white;" onclick="callWhatsApp('${a.user_phone}')">וואטסאפ</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p style="text-align:center;color:var(--danger);">שגיאה בטעינת התורים</p>';
  }
}

async function updateStatus(id, status) {
  try {
    await fetch(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    showToast('סטטוס עודכן', 'success');
    loadAdminAppointments();
  } catch (err) {
    showToast('שגיאה בעדכון', 'error');
  }
}

function callWhatsApp(phone) {
  let cleanPhone = phone.replace(/\D/g, '');
  // Add Israel country code if needed
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '972' + cleanPhone.substring(1);
  }
  window.open(`https://wa.me/${cleanPhone}`, '_blank');
}

async function loadAdminSettings() {
  try {
    const res = await fetch('/api/admin/settings');
    const settings = await res.json();
    if (settings.notification_email) {
      document.getElementById('notifEmail').value = settings.notification_email;
    }
    if (settings.notification_whatsapp) {
      document.getElementById('notifWhatsapp').value = settings.notification_whatsapp;
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

async function saveNotifSettings() {
  const email = document.getElementById('notifEmail').value.trim();
  const whatsapp = document.getElementById('notifWhatsapp').value.trim();

  try {
    const promises = [];
    if (email) {
      promises.push(fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'notification_email', value: email })
      }));
    }
    if (whatsapp) {
      promises.push(fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'notification_whatsapp', value: whatsapp })
      }));
    }
    await Promise.all(promises);
    showToast('הגדרות נשמרו בהצלחה! ✓', 'success');
  } catch (err) {
    showToast('שגיאה בשמירת ההגדרות', 'error');
  }
}

// ===== ADMIN MODAL =====
function closeAdminModal() {
  document.getElementById('adminModal').classList.remove('active');
}

// Close modal on overlay click
document.getElementById('adminModal').addEventListener('click', (e) => {
  if (e.target.id === 'adminModal') closeAdminModal();
});

// ===== TOAST =====
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
