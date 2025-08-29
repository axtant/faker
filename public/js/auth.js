document.getElementById('steamLoginBtn').addEventListener('click', e => {
  e.currentTarget.classList.add('loading');
  e.currentTarget.innerHTML = 'Redirecting to Steam...';
});
