import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '.import '../style/Claimlist.css';

function ClaimListModal({ claims, onClaim, onClose }) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      toast.info('Claim list modal closed', { position: 'bottom-right' });
    }
  };

  return (
    <div className="claim-list-modal" onClick={handleOverlayClick}>
      <div className="claim-list">
        <div className="modal-header">
          <h3>Claimable Tokens</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close claim list">
            <FaTimes />
          </button>
        </div>
        <div className="claim-list-content">
          {claims.length > 0 ? (
            claims.map((claim, index) => (
              <div key={index} className="claim-item">
                <div className="claim-token-info">
                  <img
                    src={claim.logo || 'https://via.placeholder.com/24'}
                    alt={claim.symbol}
                    className="claim-token-logo"
                    onError={(e) => (e.target.src = 'https://via.placeholder.com/24')}
                  />
                  <div className="claim-token-details">
                    <span className="claim-token-symbol">{claim.symbol}</span>
                    <span className="claim-token-name">{claim.name}</span>
                  </div>
                </div>
                <button
                  className="claim-token-btn"
                  onClick={() => onClaim(claim)}
                  disabled={claim.disabled}
                  aria-label={`Claim ${claim.symbol}`}
                >
                  Claim
                </button>
              </div>
            ))
          ) : (
            <div className="no-claims">No claimable tokens</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClaimListModal;