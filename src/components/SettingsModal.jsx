import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../style/SettingsModal.css';

function SettingsModal({
  gasPrice,
  setGasPrice,
  slippage,
  setSlippage,
  deadline,
  setDeadline,
  expertMode,
  setExpertMode,
  flippySounds,
  setFlippySounds,
  interfaceSettings,
  setInterfaceSettings,
  onClose,
}) {
  const resetDeadline = () => {
    setDeadline(20);
    toast.info('Batas waktu transaksi direset ke 20 menit', { position: 'bottom-right' });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
      toast.info('Pengaturan ditutup', { position: 'bottom-right' });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // BARIS BARU: Fungsi untuk menangani perubahan suara flippy
  const handleFlippySoundsChange = () => {
    const newValue = !flippySounds;
    setFlippySounds(newValue);
    if (newValue) {
      toast.success('Suara flippy diaktifkan!', { position: 'bottom-right' });
      // Di sini kita perlu memutar suara, tetapi karena file suara ada di SwapForm.js,
      // kita tidak bisa memutarnya secara langsung dari sini.
      // Logika pemutaran suara akan berada di SwapForm.js.
    } else {
      toast.info('Suara flippy dinonaktifkan.', { position: 'bottom-right' });
    }
  };

  return (
    <div className="settings-modal" onClick={handleOverlayClick}>
      <div className="settings-content">
        <div className="modal-header">
          <h3>Pengaturan</h3>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Tutup pengaturan">
            <FaTimes size={14} />
          </button>
        </div>
        <div className="settings-section">
          <h4>Kecepatan Transaksi (GWEI)</h4>
          <div className="settings-options">
            {[{ value: '0.1', label: 'Standar (0.1)' }, { value: '0.12', label: 'Cepat (0.12)' }, { value: '0.15', label: 'Instans (0.15)' }].map(({ value, label }) => (
              <button
                key={value}
                className={`settings-btn ${gasPrice === value ? 'selected' : ''}`}
                onClick={() => setGasPrice(value)}
                aria-label={`Pilih kecepatan ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <h4>Toleransi Slippage</h4>
          <div className="settings-options">
            {[{ value: 'auto', label: 'Otomatis' }, { value: '0.1', label: '0.1%' }, { value: '0.5', label: '0.5%' }, { value: '1.0', label: '1.0%' }].map(({ value, label }) => (
              <button
                key={value}
                className={`settings-btn ${slippage === value ? 'selected' : ''}`}
                onClick={() => setSlippage(value)}
                aria-label={`Pilih slippage ${label}`}
              >
                {label}
              </button>
            ))}
        </div>
        </div>
        <div className="settings-section">
          <h4>Batas Waktu Transaksi</h4>
          <div className="deadline-input">
            <input
              type="number"
              value={deadline}
              onChange={(e) => setDeadline(Math.max(1, parseInt(e.target.value) || 1))}
              className="settings-input"
              min="1"
              aria-label="Batas waktu transaksi dalam menit"
            />
            <span>Menit</span>
            <button className="reset-btn" onClick={resetDeadline} aria-label="Reset batas waktu">
              Reset
            </button>
          </div>
        </div>
        <div className="settings-section toggle-section">
          <h4>Pengaturan Antarmuka</h4>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={interfaceSettings}
              onChange={() => setInterfaceSettings(!interfaceSettings)}
              id="interface-settings"
              aria-label="Aktifkan pengaturan antarmuka"
            />
            <label htmlFor="interface-settings" className="toggle-label"></label>
          </div>
        </div>
        <div className="settings-section toggle-section">
          <h4>Mode Pakar</h4>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={expertMode}
              onChange={() => setExpertMode(!expertMode)}
              id="expert-mode"
              aria-label="Aktifkan mode pakar"
            />
            <label htmlFor="expert-mode" className="toggle-label"></label>
          </div>
        </div>
        <div className="settings-section toggle-section">
          <h4>Suara Flippy</h4>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={flippySounds}
              onChange={handleFlippySoundsChange}
              id="flippy-sounds"
              aria-label="Aktifkan suara flippy"
            />
            <label htmlFor="flippy-sounds" className="toggle-label"></label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;