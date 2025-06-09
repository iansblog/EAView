// Placeholder for theme toggle logic
(function() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');
  function setTheme(theme) {
    document.body.classList.toggle('bg-dark', theme === 'dark');
    document.body.classList.toggle('bg-light', theme !== 'dark');
    document.body.classList.toggle('text-light', theme === 'dark');
    document.body.classList.toggle('text-dark', theme !== 'dark');
    localStorage.setItem('theme', theme);
    toggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }
  let theme = storedTheme || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
  toggleBtn.addEventListener('click', function() {
    theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(theme);
  });
})();
