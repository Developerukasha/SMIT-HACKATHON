/* ===================================
   POPUP NOTIFICATION SYSTEM
   Modern toast notifications for user actions
   =================================== */

// Show popup notification
function showPopup(message, type = 'success') {
    // Create popup container if it doesn't exist
    let popupContainer = document.getElementById('popupContainer');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'popupContainer';
        popupContainer.className = 'popup-container';
        document.body.appendChild(popupContainer);
    }

    // Create popup element
    const popup = document.createElement('div');
    popup.className = `popup popup-${type}`;

    // Get icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠',
        edit: '✏️',
        delete: '🗑️'
    };

    const icon = icons[type] || icons.success;

    // Set popup content
    popup.innerHTML = `
        <div class="popup-icon">${icon}</div>
        <div class="popup-message">${message}</div>
    `;

    // Add to container
    popupContainer.appendChild(popup);

    // Trigger animation
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);

    // Auto remove after duration
    setTimeout(() => {
        popup.classList.remove('show');
        popup.classList.add('hide');

        // Remove from DOM after animation
        setTimeout(() => {
            popup.remove();
        }, 300);
    }, 2000);
}

// Expose to global scope
window.showPopup = showPopup;
