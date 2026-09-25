// ==========================================================================
// RentPeer - Toast Notifications System
// ==========================================================================

const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    }
  },

  show(message, type = 'info', title = '', duration = 4000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    let defaultTitle = 'Notification';

    if (type === 'success') {
      icon = '✅';
      defaultTitle = 'Success';
    } else if (type === 'error') {
      icon = '⚠️';
      defaultTitle = 'Attention';
    } else if (type === 'warning') {
      icon = '⚡';
      defaultTitle = 'Warning';
    }

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title || defaultTitle}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, duration);
  },

  success(msg, title = 'Success') {
    this.show(msg, 'success', title);
  },

  error(msg, title = 'Error') {
    this.show(msg, 'error', title);
  },

  info(msg, title = 'RentPeer Info') {
    this.show(msg, 'info', title);
  },

  warning(msg, title = 'Notice') {
    this.show(msg, 'warning', title);
  },
};
