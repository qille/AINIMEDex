import React from 'react';
import { FaTimes } from 'react-icons/fa';

function SwapHistoryModal({ onClose }) {
  // In a real application, you would fetch swap history here
  const dummyHistory = [
    { id: 1, type: 'Swap', tokenIn: 'OG', amountIn: '100', tokenOut: 'AINIME', amountOut: '1000', date: '2025-06-28 10:30 AM' },
    { id: 2, type: 'Swap', tokenIn: 'AINIME', amountIn: '50', tokenOut: 'USDTaine', amountOut: '5000', date: '2025-06-27 09:15 AM' },
    { id: 3, type: 'Swap', tokenIn: 'BTCaine', amountIn: '0.01', tokenOut: 'OG', amountOut: '107.6', date: '2025-06-26 03:00 PM' },
  ];

  return (
    <div className="history-modal-overlay">
      <div className="history-modal">
        <div className="modal-header">
          <h3>Swap History</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="history-list-content" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {dummyHistory.length > 0 ? (
            dummyHistory.map((item) => (
              <div key={item.id} className="claim-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span><strong>{item.type}</strong>: {item.amountIn} {item.tokenIn} &rarr; {item.amountOut} {item.tokenOut}</span>
                  <span style={{ fontSize: '0.8em', color: 'var(--text-color-secondary)' }}>{item.date}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-color-secondary)' }}>No swap history found.</p>
          )}
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.9em', color: 'var(--text-color-secondary)', textAlign: 'center' }}>
          (This is dummy data. Real swap history would require blockchain event fetching or local storage.)
        </p>
      </div>
    </div>
  );
}

export default SwapHistoryModal;