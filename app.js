const books = [
  { id: 1, title: 'The Psychology of Money', author: 'Morgan Housel', category: 'Money/Investing', status: 'available', color: '#e9f4ed' },
  { id: 2, title: 'Company of One', author: 'Paul Jarvis', category: 'Business', status: 'available', color: '#f3f3f5' },
  { id: 3, title: 'How Innovation Works', author: 'Matt Ridley', category: 'Business', status: 'borrowed', color: '#f8dd1f' },
  { id: 4, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', category: 'Literature', status: 'reserved', color: '#5c392d' },
  { id: 5, title: 'The Two Towers', author: 'J.R.R. Tolkien', category: 'Fantasy', status: 'available', color: '#19314b' },
  { id: 6, title: 'Objectif Lune', author: 'Hergé', category: 'Design', status: 'available', color: '#d9b185' },
  { id: 7, title: 'Muntata', author: 'S. Raman', category: 'Business', status: 'borrowed', color: '#37b7e5' },
  { id: 8, title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', category: 'Self Improvement', status: 'available', color: '#ee651e' },
];

const studentsDb = {
  REG1001: { registerNumber: 'REG1001', fullName: 'Davis Workman', department: 'Computer Science', year: '3' },
  REG2044: { registerNumber: 'REG2044', fullName: 'Emma Joseph', department: 'Mechanical', year: '2' },
};

const state = {
  route: 'discover',
  search: '',
  category: 'All Categories',
  user: null,
  pendingAction: null,
  verifyAttempts: 0,
  profiles: [],
  borrows: [],
  reserves: [],
  logs: [],
};

const el = (id) => document.getElementById(id);
const content = el('content');
const pageTitle = el('pageTitle');
const categoryFilter = el('categoryFilter');

const categories = ['All Categories', ...new Set(books.map((b) => b.category))];
categoryFilter.innerHTML = categories.map((c) => `<option>${c}</option>`).join('');

function log(type, details) {
  state.logs.unshift({ type, details, at: new Date().toLocaleString() });
}

function requireAuth(action) {
  if (state.user) return action();
  state.pendingAction = action;
  el('authModal').showModal();
}

function badge(status) {
  return `<span class="status ${status}">${status[0].toUpperCase() + status.slice(1)}</span>`;
}

function bookCard(book) {
  return `<article class="book-card">
    <div class="cover" style="background:${book.color}">${book.title}</div>
    <div class="book-meta">
      ${badge(book.status)}
      <h4>${book.title}</h4>
      <p class="muted">${book.author}</p>
      <p class="muted">${book.category}</p>
      <div class="actions">
        <button class="btn small btn-primary" onclick="borrowBook(${book.id})">Borrow</button>
        <button class="btn small btn-ghost" onclick="reserveBook(${book.id})">Reserve</button>
        <button class="btn small" onclick="openDetails(${book.id})">Details</button>
      </div>
    </div>
  </article>`;
}

function getVisibleBooks() {
  return books.filter((b) =>
    (state.category === 'All Categories' || b.category === state.category) &&
    (b.title.toLowerCase().includes(state.search) || b.author.toLowerCase().includes(state.search))
  );
}

function discoverView() {
  const visible = getVisibleBooks();
  return `
    <h3 class="section-title">Book Recommendation</h3>
    <div class="book-row">${visible.map(bookCard).join('')}</div>
    <h3 class="section-title">Book Category</h3>
    <div class="book-row">
      ${categories.slice(1).map((c) => `<div class="panel"><strong>${c}</strong><p class="muted">${books.filter((b) => b.category === c).length} books</p></div>`).join('')}
    </div>`;
}

function myLibraryView() {
  const mine = state.borrows.filter((b) => b.userEmail === state.user?.email);
  return `<h3 class="section-title">My Library</h3>
  <div class="book-row">${mine.length ? mine.map((r) => bookCard(books.find((b) => b.id === r.bookId))).join('') : '<p class="muted">No borrowed books yet.</p>'}</div>`;
}

function reservedView() {
  const rows = state.reserves.filter((r) => r.userEmail === state.user?.email).map((r) => {
    const mins = Math.max(0, Math.ceil((r.expiresAt - Date.now()) / 60000));
    const book = books.find((b) => b.id === r.bookId);
    return `<tr><td>${book.title}</td><td>${new Date(r.expiresAt).toLocaleTimeString()}</td><td>${mins} min</td></tr>`;
  });
  return `<h3 class="section-title">Reserved Books (Pick up in 2 hours)</h3>
  <table class="table"><thead><tr><th>Book</th><th>Expires</th><th>Countdown</th></tr></thead><tbody>${rows.join('') || '<tr><td colspan="3">No reservations</td></tr>'}</tbody></table>`;
}

function detailsView(id) {
  const b = books.find((x) => x.id === id);
  return `<div class="panel"><h3>${b.title}</h3><p>${b.author}</p><p class="muted">${b.category}</p>
  ${badge(b.status)}
  <p>This is a realistic mock detail page with summary, shelf location and availability history.</p>
  <div class="actions"><button class="btn btn-primary" onclick="borrowBook(${b.id})">Borrow</button><button class="btn btn-ghost" onclick="reserveBook(${b.id})">Reserve</button></div>
  </div>`;
}

function adminView() {
  const activeUsers = state.user ? `<li>${state.user.name} (${state.user.email})</li>` : '<li>No active user</li>';
  return `
  <h3 class="section-title">Admin Dashboard</h3>
  <div class="grid-2">
    <div class="panel"><h4>Most Borrowed Books</h4>
      <div class="chart">${books.slice(0,5).map((b, i) => `<div class="bar" style="height:${60 + i * 22}px"><span>${i + 2}</span></div>`).join('')}</div>
    </div>
    <div class="panel"><h4>Reservations Over Time</h4><div class="line-chart"><svg viewBox="0 0 300 180"><polyline fill="none" stroke="#0f4b3e" stroke-width="4" points="5,160 70,110 130,125 190,60 250,90 295,30" /></svg></div></div>
    <div class="panel"><h4>Category Popularity</h4><div class="pie"></div></div>
    <div class="panel"><h4>Active Users</h4><ul>${activeUsers}</ul></div>
  </div>
  <h4>User Management</h4>
  <table class="table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Register No.</th></tr></thead><tbody>
  ${state.profiles.map((u) => `<tr><td>${u.name}</td><td>${u.email}</td><td>${u.phone || '-'}</td><td>${u.registerNumber || '-'}</td></tr>`).join('') || '<tr><td colspan="4">No users</td></tr>'}
  </tbody></table>
  <h4>Book Management</h4>
  <div class="actions"><button class="btn btn-primary" onclick="addBook()">Add Book</button></div>
  <table class="table"><thead><tr><th>Title</th><th>Status</th><th>Actions</th></tr></thead><tbody>
  ${books.map((b) => `<tr><td>${b.title}</td><td>${b.status}</td><td><button class="btn small" onclick="editBook(${b.id})">Edit</button><button class="btn small btn-ghost" onclick="deleteBook(${b.id})">Delete</button></td></tr>`).join('')}
  </tbody></table>
  <h4>Activity Logs</h4>
  <table class="table"><thead><tr><th>Type</th><th>Details</th><th>Time</th></tr></thead><tbody>
  ${state.logs.map((l) => `<tr><td>${l.type}</td><td>${l.details}</td><td>${l.at}</td></tr>`).join('') || '<tr><td colspan="3">No logs</td></tr>'}
  </tbody></table>`;
}

function genericView(title) {
  return `<h3 class="section-title">${title}</h3><div class="panel"><p class="muted">Fully functional placeholder content with realistic state. Use navigation, search, and actions to populate data.</p></div>`;
}

function render() {
  pageTitle.textContent = state.route === 'discover' ? 'Discover' : state.route.replace('-', ' ');
  document.querySelectorAll('.nav-item[data-route]').forEach((n) => n.classList.toggle('active', n.dataset.route === state.route));

  if (state.route === 'discover' || state.route === 'categories') content.innerHTML = discoverView();
  else if (state.route === 'my-library') content.innerHTML = myLibraryView();
  else if (state.route === 'reserved') content.innerHTML = reservedView();
  else if (state.route === 'admin') content.innerHTML = adminView();
  else if (state.route.startsWith('details-')) content.innerHTML = detailsView(Number(state.route.split('-')[1]));
  else content.innerHTML = genericView(pageTitle.textContent);

  el('profileBox').innerHTML = state.user
    ? `<strong>${state.user.name}</strong><p>${state.user.email}</p><p>${state.user.phone || 'Phone unavailable'}</p>`
    : '<strong>Guest</strong><p>Login to borrow/reserve books</p>';
}

window.borrowBook = (id) => requireAuth(() => {
  const book = books.find((b) => b.id === id);
  book.status = 'borrowed';
  state.borrows.push({ bookId: id, userEmail: state.user.email, at: Date.now() });
  log('BORROW', `${state.user.email} borrowed ${book.title}`);
  render();
});
window.reserveBook = (id) => requireAuth(() => {
  const book = books.find((b) => b.id === id);
  book.status = 'reserved';
  state.reserves.push({ bookId: id, userEmail: state.user.email, at: Date.now(), expiresAt: Date.now() + 2 * 60 * 60 * 1000 });
  log('RESERVE', `${state.user.email} reserved ${book.title}`);
  render();
});
window.openDetails = (id) => { state.route = `details-${id}`; render(); };
window.addBook = () => {
  const title = prompt('Book title');
  if (!title) return;
  books.push({ id: Date.now(), title, author: 'New Author', category: 'General', status: 'available', color: '#ecebf7' });
  log('BOOK_ADD', `Added ${title}`);
  render();
};
window.editBook = (id) => {
  const book = books.find((b) => b.id === id);
  const title = prompt('New title', book.title);
  if (!title) return;
  book.title = title;
  log('BOOK_EDIT', `Edited ${id}`);
  render();
};
window.deleteBook = (id) => {
  const idx = books.findIndex((b) => b.id === id);
  if (idx >= 0) {
    log('BOOK_DELETE', `Deleted ${books[idx].title}`);
    books.splice(idx, 1);
    render();
  }
};

el('searchBtn').onclick = () => { state.search = el('searchInput').value.toLowerCase(); render(); };
categoryFilter.onchange = (e) => { state.category = e.target.value; render(); };

Array.from(document.querySelectorAll('.nav-item[data-route]')).forEach((b) => {
  b.onclick = () => { state.route = b.dataset.route; render(); };
});

el('logoutBtn').onclick = () => { state.user = null; render(); };

el('cancelAuth').onclick = () => el('authModal').close();
el('authForm').onsubmit = (e) => {
  e.preventDefault();
  state.user = { name: 'Library User', email: el('emailInput').value, phone: null };
  state.profiles.push({ ...state.user });
  log('LOGIN', `${state.user.email} login via email`);
  el('authModal').close();
  el('verifyModal').showModal();
};

el('googleBtn').onclick = () => {
  const mockGoogle = { name: 'Davis Workman', email: 'davis.workman@gmail.com', phone: '+1 415 555 0182' };
  state.user = mockGoogle;
  state.profiles.push({ ...state.user });
  log('LOGIN_GOOGLE', `${mockGoogle.email} login via google`);
  el('authModal').close();
  el('verifyModal').showModal();
};

el('verifyForm').onsubmit = (e) => {
  e.preventDefault();
  const reg = el('registerInput').value.trim().toUpperCase();
  state.verifyAttempts += 1;
  const found = studentsDb[reg];
  if (found) {
    const merged = {
      name: found.fullName || state.user.name,
      email: state.user.email,
      phone: state.user.phone || null,
      registerNumber: found.registerNumber,
      department: found.department,
    };
    state.user = merged;
    el('verifyModal').close();
    el('nameField').value = merged.name;
    el('emailField').value = merged.email;
    el('phoneField').value = merged.phone || '';
    el('deptField').value = merged.department;
    el('profileModal').showModal();
    el('verifyMessage').textContent = '';
    state.verifyAttempts = 0;
    return;
  }
  if (state.verifyAttempts === 2) el('verifyMessage').textContent = 'Please try again';
  if (state.verifyAttempts >= 3) {
    el('verifyMessage').textContent = 'We cannot verify your details';
    state.verifyAttempts = 0;
  }
};

el('profileForm').onsubmit = (e) => {
  e.preventDefault();
  state.user = {
    ...state.user,
    name: el('nameField').value,
    email: el('emailField').value,
    phone: el('phoneField').value,
    department: el('deptField').value,
  };
  state.profiles = state.profiles.filter((p) => p.email !== state.user.email).concat(state.user);
  log('PROFILE_MERGE', `Profile merged for ${state.user.email}`);
  el('profileModal').close();
  if (state.pendingAction) {
    const fn = state.pendingAction;
    state.pendingAction = null;
    fn();
  }
  render();
};

setInterval(() => {
  state.reserves = state.reserves.filter((r) => r.expiresAt > Date.now());
  render();
}, 60000);

render();
