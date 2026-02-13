const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin code for registration
const ADMIN_CODE = 'SALON2024';

// Database setup
const db = new Database(path.join(__dirname, 'data', 'salon.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_he TEXT NOT NULL,
    price REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    treatment_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (treatment_id) REFERENCES treatments(id)
  );

  CREATE TABLE IF NOT EXISTS discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    discount_percent INTEGER,
    discount_amount REAL,
    treatment_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (treatment_id) REFERENCES treatments(id)
  );

  CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed treatments if empty
const treatmentCount = db.prepare('SELECT COUNT(*) as count FROM treatments').get();
if (treatmentCount.count === 0) {
  const insertTreatment = db.prepare('INSERT INTO treatments (name, name_he, price) VALUES (?, ?, ?)');
  insertTreatment.run('medical_pedicure', 'פדיקור רפואי', 200);
  insertTreatment.run('aesthetic_pedicure', 'פדיקור אסטתי', 160);
  insertTreatment.run('ingrown_nail', 'הוצאת ציפורן חודרנית בלבד', 110);
  insertTreatment.run('gel_manicure', 'מניקור לק ג\'ל', 160);
  insertTreatment.run('gel_building', 'בנייה בג\'ל', 185);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== AUTH ROUTES ==========

// Register
app.post('/api/register', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'שם ומספר טלפון הם שדות חובה' });
  }

  const phoneClean = phone.replace(/\D/g, '');
  if (phoneClean.length < 9 || phoneClean.length > 15) {
    return res.status(400).json({ error: 'מספר טלפון לא תקין' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phoneClean);
  if (existing) {
    return res.status(400).json({ error: 'מספר טלפון זה כבר רשום במערכת' });
  }

  const result = db.prepare('INSERT INTO users (name, phone) VALUES (?, ?)').run(name, phoneClean);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

  res.json({ success: true, user: { id: user.id, name: user.name, phone: user.phone, is_admin: user.is_admin } });
});

// Login
app.post('/api/login', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'שם ומספר טלפון הם שדות חובה' });
  }

  const phoneClean = phone.replace(/\D/g, '');
  const user = db.prepare('SELECT * FROM users WHERE phone = ? AND name = ?').get(phoneClean, name);

  if (!user) {
    return res.status(401).json({ error: 'פרטים לא נכונים או שהמשתמש לא קיים' });
  }

  res.json({ success: true, user: { id: user.id, name: user.name, phone: user.phone, is_admin: user.is_admin } });
});

// Admin registration
app.post('/api/admin/register', (req, res) => {
  const { name, phone, adminCode } = req.body;
  if (!name || !phone || !adminCode) {
    return res.status(400).json({ error: 'כל השדות הם חובה' });
  }

  if (adminCode !== ADMIN_CODE) {
    return res.status(403).json({ error: 'קוד מנהל שגוי' });
  }

  const phoneClean = phone.replace(/\D/g, '');
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phoneClean);

  if (existing) {
    db.prepare('UPDATE users SET is_admin = 1 WHERE phone = ?').run(phoneClean);
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phoneClean);
    return res.json({ success: true, user: { id: user.id, name: user.name, phone: user.phone, is_admin: 1 } });
  }

  const result = db.prepare('INSERT INTO users (name, phone, is_admin) VALUES (?, ?, 1)').run(name, phoneClean);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

  res.json({ success: true, user: { id: user.id, name: user.name, phone: user.phone, is_admin: 1 } });
});

// ========== TREATMENT ROUTES ==========

app.get('/api/treatments', (req, res) => {
  const treatments = db.prepare('SELECT * FROM treatments').all();
  res.json(treatments);
});

// ========== APPOINTMENT ROUTES ==========

// Create appointment
app.post('/api/appointments', (req, res) => {
  const { userId, treatmentId, date, time, notes } = req.body;
  if (!userId || !treatmentId || !date) {
    return res.status(400).json({ error: 'חסרים פרטים נדרשים' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'משתמש לא נמצא' });
  }

  const treatment = db.prepare('SELECT * FROM treatments WHERE id = ?').get(treatmentId);
  if (!treatment) {
    return res.status(404).json({ error: 'טיפול לא נמצא' });
  }

  // Check for discount
  const discount = db.prepare(
    'SELECT * FROM discounts WHERE date = ? AND (treatment_id IS NULL OR treatment_id = ?)'
  ).get(date, treatmentId);

  let finalPrice = treatment.price;
  let discountInfo = null;
  if (discount) {
    if (discount.discount_percent) {
      finalPrice = treatment.price * (1 - discount.discount_percent / 100);
    } else if (discount.discount_amount) {
      finalPrice = treatment.price - discount.discount_amount;
    }
    discountInfo = discount.description;
  }

  const result = db.prepare(
    'INSERT INTO appointments (user_id, treatment_id, date, time, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, treatmentId, date, time || null, notes || null);

  const appointment = {
    id: result.lastInsertRowid,
    user: user.name,
    phone: user.phone,
    treatment: treatment.name_he,
    price: finalPrice,
    originalPrice: treatment.price,
    discount: discountInfo,
    date,
    time,
    status: 'pending'
  };

  // Send notification to admin
  notifyAdmin(appointment);

  res.json({ success: true, appointment });
});

// Get appointments for user
app.get('/api/appointments/user/:userId', (req, res) => {
  const appointments = db.prepare(`
    SELECT a.*, t.name_he as treatment_name, t.price as treatment_price
    FROM appointments a
    JOIN treatments t ON a.treatment_id = t.id
    WHERE a.user_id = ?
    ORDER BY a.date DESC
  `).all(req.params.userId);

  res.json(appointments);
});

// Get all appointments (admin)
app.get('/api/appointments/all', (req, res) => {
  const appointments = db.prepare(`
    SELECT a.*, t.name_he as treatment_name, t.price as treatment_price,
           u.name as user_name, u.phone as user_phone
    FROM appointments a
    JOIN treatments t ON a.treatment_id = t.id
    JOIN users u ON a.user_id = u.id
    ORDER BY a.date DESC
  `).all();

  res.json(appointments);
});

// Update appointment status (admin)
app.put('/api/appointments/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'סטטוס לא תקין' });
  }

  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Delete appointment
app.delete('/api/appointments/:id', (req, res) => {
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ========== DISCOUNT ROUTES ==========

// Get all discounts
app.get('/api/discounts', (req, res) => {
  const discounts = db.prepare(`
    SELECT d.*, t.name_he as treatment_name
    FROM discounts d
    LEFT JOIN treatments t ON d.treatment_id = t.id
    ORDER BY d.date ASC
  `).all();
  res.json(discounts);
});

// Get discounts for calendar (public)
app.get('/api/discounts/calendar', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const discounts = db.prepare(`
    SELECT d.*, t.name_he as treatment_name
    FROM discounts d
    LEFT JOIN treatments t ON d.treatment_id = t.id
    WHERE d.date >= ?
    ORDER BY d.date ASC
  `).all(today);
  res.json(discounts);
});

// Create discount (admin)
app.post('/api/discounts', (req, res) => {
  const { date, description, discountPercent, discountAmount, treatmentId } = req.body;
  if (!date || !description) {
    return res.status(400).json({ error: 'תאריך ותיאור הם שדות חובה' });
  }

  const result = db.prepare(
    'INSERT INTO discounts (date, description, discount_percent, discount_amount, treatment_id) VALUES (?, ?, ?, ?, ?)'
  ).run(date, description, discountPercent || null, discountAmount || null, treatmentId || null);

  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete discount (admin)
app.delete('/api/discounts/:id', (req, res) => {
  db.prepare('DELETE FROM discounts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ========== ADMIN SETTINGS ==========

app.get('/api/admin/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM admin_settings').all();
  const settingsObj = {};
  settings.forEach(s => { settingsObj[s.key] = s.value; });
  res.json(settingsObj);
});

app.post('/api/admin/settings', (req, res) => {
  const { key, value } = req.body;
  db.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)').run(key, value);
  res.json({ success: true });
});

// ========== NOTIFICATION ==========

async function notifyAdmin(appointment) {
  // Get admin notification settings
  const emailSetting = db.prepare("SELECT value FROM admin_settings WHERE key = 'notification_email'").get();
  const whatsappSetting = db.prepare("SELECT value FROM admin_settings WHERE key = 'notification_whatsapp'").get();

  const message = `📅 תור חדש!\n👤 ${appointment.user}\n📱 ${appointment.phone}\n💅 ${appointment.treatment}\n📆 ${appointment.date}${appointment.time ? '\n🕐 ' + appointment.time : ''}\n💰 ${appointment.price} ₪${appointment.discount ? '\n🏷️ ' + appointment.discount : ''}`;

  console.log('=== New Appointment Notification ===');
  console.log(message);
  console.log('===================================');

  // Send email if configured
  if (emailSetting && emailSetting.value) {
    try {
      // Using a test/demo SMTP - in production, configure real SMTP
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: emailSetting.value,
          subject: `תור חדש - ${appointment.treatment} - ${appointment.date}`,
          text: message
        });
        console.log('Email notification sent to:', emailSetting.value);
      }
    } catch (err) {
      console.error('Failed to send email:', err.message);
    }
  }

  // WhatsApp notification via URL (opens WhatsApp web/app)
  if (whatsappSetting && whatsappSetting.value) {
    const whatsappPhone = whatsappSetting.value.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    console.log(`WhatsApp link: https://wa.me/${whatsappPhone}?text=${encodedMessage}`);
  }
}

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Beauty Salon App running on http://localhost:${PORT}`);
});
