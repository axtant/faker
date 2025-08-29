// main.js
if (document.getElementById('steamLoginBtn')) {
  import('./auth.js').then(m => m.initAuth());
}

if (document.getElementById('dashboardContent')) {
  import('./dashboard.js').then(m => m.initDashboard());
}
