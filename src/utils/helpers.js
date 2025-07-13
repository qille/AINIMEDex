import { toast } from 'react-toastify';

export const showNotification = (message, type = 'error') => {
  toast[type](message, {
    position: 'bottom-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: document.body.classList.contains('light') ? 'light' : 'dark',
  });
};

export async function retryWithBackoff(fn, retries = 5, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === -32005 || (error.message && error.message.includes('Request exceeds defined limit'))) {
        console.warn(`Percobaan ${i + 1} gagal karena rate limit. Menunggu ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        delay = Math.min(delay * 2, 3000);
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Gagal setelah ${retries} percobaan.`);
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}