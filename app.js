const books = [
  { id: 1, title: 'The Psychology of Money', author: 'Morgan Housel', category: 'Money/Investing', status: 'available', cls: 'b1' },
  { id: 2, title: 'Company of One', author: 'Paul Jarvis', category: 'Design', status: 'available', cls: 'b2' },
  { id: 3, title: 'How Innovation Works', author: 'Matt Ridley', category: 'Business', status: 'borrowed', cls: 'b3' },
  { id: 4, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', category: 'Self Improvement', status: 'reserved', cls: 'b4' },
  { id: 5, title: 'The Two Towers', author: 'J.R.R. Tolkien', category: 'Money/Investing', status: 'available', cls: 'b1' },
  { id: 6, title: 'Objectif Lune', author: 'Hergé', category: 'Design', status: 'available', cls: 'b2' },
  { id: 7, title: 'Muntata', author: 'S. Raman', category: 'Business', status: 'borrowed', cls: 'b3' },
  { id: 8, title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', category: 'Self Improvement', status: 'available', cls: 'b4' },
];

const studentsDb = {
  REG1001: { registerNumber: 'REG1001', fullName: 'Davis Workman', department: 'Computer Science' },
  REG2044: { registerNumber: 'REG2044', fullName: 'Emma Joseph', department: 'Mechanical' },
};

const state = { route: 'discover', search: '', category: 'All Categories', user: null, pendingAction: null, verifyAttempts: 0, profiles: [], borrows: [], reserves: [], logs: [] };
const el = (id) => document.getElementById(id);

const categories = ['All Categories', ...new Set(books.map((b) => b.category))];
el('categoryFilter').innerHTML = categories.map((c) => `<option>${c}</option>`).join('');

const log = (type, details) => state.logs.unshift({ type, details, at: new Date().toLocaleString() });
function requireAuth(action) { if (state.user) return action(); state.pendingAction = action; el('authModal').showModal(); }

function bookMarkup(book) {
  return `<div class="book ${book.cls}">
      <h4>${book.title}</h4>
      <p>${book.author}</p>
      <p>${book.status}</p>
      <div style="position:absolute;bottom:8px;left:10px;display:flex;gap:6px">
        <button onclick="borrowBook(${book.id})" style="font-size:10px">Borrow</button>
        <button onclick="reserveBook(${book.id})" style="font-size:10px">Reserve</button>
      </div>
    </div>`;
}

function discoverView() {
  const visible = books.filter((b) => (state.category === 'All Categories' || b.category === state.category) && (b.title.toLowerCase().includes(state.search) || b.author.toLowerCase().includes(state.search))).slice(0,4);
  return `
    <h3 style="font-size:34px;display:none">Book Recommendation</h3>
    <p style="font-size:34px;display:none">hidden</p>
    <p style="font-size:32px;display:none">hidden</p>
    <p style="font-size:16px;margin:0 0 10px">Book Recemendation</p>
    <div class="book-strip">
      ${visible.map(bookMarkup).join('')}
      <button class="view-all" onclick="setRoute('categories')">View all</button>
    </div>
    <p style="font-size:32px;display:none">hidden</p>
    <p style="font-size:16px;margin:0 0 12px">Book Category</p>
    <div class="category-grid">
      ${['Money/Investing','Design','Business','Self Improvement'].map((c,i)=>`<div class="category-card"><div class="icon-slab"><div class="mini-book ${['b1','b2','b3','b4'][i]}"></div></div><strong>${c}</strong></div>`).join('')}
    </div>`;
}

function tableView(title, rows) {
  return `<p style="font-size:16px;margin:0 0 10px">${title}</p><table class="table"><thead><tr><th>Title</th><th>Status</th><th>User</th></tr></thead><tbody>${rows || '<tr><td colspan="3">No records</td></tr>'}</tbody></table>`;
}

function adminView() {
  return `<p style="font-size:16px;margin:0 0 8px">Admin Dashboard</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
    <div style="border:1px solid #ececf0;border-radius:12px;padding:12px">Most borrowed books (bar chart)</div>
    <div style="border:1px solid #ececf0;border-radius:12px;padding:12px">Reservations over time (line chart)</div>
    <div style="border:1px solid #ececf0;border-radius:12px;padding:12px">Category popularity (pie chart)</div>
    <div style="border:1px solid #ececf0;border-radius:12px;padding:12px">Logged in users: ${state.user ? 1 : 0}</div>
  </div>
  <table class="table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Register number</th></tr></thead><tbody>${state.profiles.map((u)=>`<tr><td>${u.name}</td><td>${u.email}</td><td>${u.phone || '-'}</td><td>${u.registerNumber || '-'}</td></tr>`).join('') || '<tr><td colspan="4">No users</td></tr>'}</tbody></table>`;
}

function render() {
  el('pageTitle').textContent = state.route === 'discover' ? 'Discover' : state.route.replace('-', ' ');
  document.querySelectorAll('.nav-item[data-route]').forEach((n) => n.classList.toggle('active', n.dataset.route === state.route));

  if (state.route === 'discover' || state.route === 'categories' || state.route === 'favorites' || state.route === 'help' || state.route === 'settings') {
    el('content').innerHTML = discoverView();
  } else if (state.route === 'my-library') {
    const rows = state.borrows.filter((x) => x.userEmail === state.user?.email).map((b) => `<tr><td>${books.find((k)=>k.id===b.bookId)?.title}</td><td>Borrowed</td><td>${b.userEmail}</td></tr>`).join('');
    el('content').innerHTML = tableView('My Library', rows);
  } else if (state.route === 'reserved') {
    const rows = state.reserves.filter((x) => x.userEmail === state.user?.email).map((b) => `<tr><td>${books.find((k)=>k.id===b.bookId)?.title}</td><td>${Math.max(0, Math.ceil((b.expiresAt - Date.now())/60000))} min</td><td>${b.userEmail}</td></tr>`).join('');
    el('content').innerHTML = tableView('Reserved Books (pick up within 2 hours)', rows);
  } else {
    el('content').innerHTML = adminView();
  }

  el('profileBox').innerHTML = state.user ? `👤 ${state.user.name}<br>${state.user.email}` : '👤 Dovis Workman';
}

window.setRoute = (route) => { state.route = route; render(); };
window.borrowBook = (id) => requireAuth(() => {
  const b = books.find((x) => x.id === id);
  b.status = 'borrowed';
  state.borrows.push({ bookId: id, userEmail: state.user.email });
  log('BORROW', `${state.user.email} borrowed ${b.title}`);
  render();
});
window.reserveBook = (id) => requireAuth(() => {
  const b = books.find((x) => x.id === id);
  b.status = 'reserved';
  state.reserves.push({ bookId: id, userEmail: state.user.email, expiresAt: Date.now() + 2 * 60 * 60 * 1000 });
  log('RESERVE', `${state.user.email} reserved ${b.title}`);
  render();
});

Array.from(document.querySelectorAll('.nav-item[data-route]')).forEach((btn) => btn.onclick = () => { state.route = btn.dataset.route; render(); });
el('searchBtn').onclick = () => { state.search = el('searchInput').value.toLowerCase(); render(); };
el('categoryFilter').onchange = (e) => { state.category = e.target.value; render(); };
el('logoutBtn').onclick = () => { state.user = null; render(); };
el('cancelAuth').onclick = () => el('authModal').close();

el('authForm').onsubmit = (e) => {
  e.preventDefault();
  state.user = { name: 'Library User', email: el('emailInput').value, phone: null };
  state.profiles.push(state.user);
  el('authModal').close();
  el('verifyModal').showModal();
};
el('googleBtn').onclick = () => {
  state.user = { name: 'Davis Workman', email: 'davis.workman@gmail.com', phone: '+1 415 555 0182' };
  state.profiles.push(state.user);
  el('authModal').close();
  el('verifyModal').showModal();
};

el('verifyForm').onsubmit = (e) => {
  e.preventDefault();
  const reg = el('registerInput').value.trim().toUpperCase();
  state.verifyAttempts += 1;
  if (studentsDb[reg]) {
    const db = studentsDb[reg];
    const merged = { name: db.fullName || state.user.name, email: state.user.email, phone: state.user.phone || null, registerNumber: db.registerNumber, department: db.department };
    state.user = merged;
    el('nameField').value = merged.name;
    el('emailField').value = merged.email;
    el('phoneField').value = merged.phone || '';
    el('deptField').value = merged.department;
    state.verifyAttempts = 0;
    el('verifyMessage').textContent = '';
    el('verifyModal').close();
    el('profileModal').showModal();
  } else if (state.verifyAttempts === 2) {
    el('verifyMessage').textContent = 'Please try again';
  } else if (state.verifyAttempts >= 3) {
    el('verifyMessage').textContent = 'We cannot verify your details';
    state.verifyAttempts = 0;
  }
};

el('profileForm').onsubmit = (e) => {
  e.preventDefault();
  state.user = { ...state.user, name: el('nameField').value, email: el('emailField').value, phone: el('phoneField').value, department: el('deptField').value };
  state.profiles = state.profiles.filter((p) => p.email !== state.user.email).concat(state.user);
  el('profileModal').close();
  if (state.pendingAction) { const run = state.pendingAction; state.pendingAction = null; run(); }
  render();
};

setInterval(() => {
  state.reserves = state.reserves.filter((r) => r.expiresAt > Date.now());
  if (state.route === 'reserved') render();
}, 60000);

render();
