/* ===================================
   THEME MANAGEMENT MODULE
   Handles light/dark mode toggling
   =================================== */

// Get the current theme from localStorage or default to 'light'
function getTheme() {
    return localStorage.getItem('theme') || 'light';
}

// Set the theme and save to localStorage
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Toggle between light and dark themes
function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateThemeIcon(newTheme);
}

// Update the theme toggle button icon
function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// Initialize theme on page load
function initializeTheme() {
    const savedTheme = getTheme();
    setTheme(savedTheme);
    updateThemeIcon(savedTheme);
}

// Call this when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}

// Expose functions to global scope
window.toggleTheme = toggleTheme;
window.getTheme = getTheme;
window.setTheme = setTheme;
