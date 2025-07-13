import { FaTimes, FaCheckCircle, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import '../style/TokenListModal.css';

function TokenListModal({ tokens, onSelect, onClose, searchAddress, setSearchAddress, handleTokenSearch, tokenPrices }) {
  const addTokenToWallet = async (tokenAddress, tokenSymbol, tokenName, tokenLogo) => {
    if (!window.ethereum) {
      toast.error('Wallet not connected', { position: 'bottom-right' });
      return;
    }
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: 18,
            image: tokenLogo || 'https://via.placeholder.com/32',
          },
        },
      });
      toast.success(`Added ${tokenSymbol} to wallet`, { position: 'bottom-right' });
    } catch (error) {
      toast.error(`Failed to add token: ${error.message}`, { position: 'bottom-right' });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      toast.info('Token list closed', { position: 'bottom-right' });
    }
  };

  return (
    <div className="token-list-modal" onClick={handleOverlayClick}>
      <div className="token-list">
        <div className="modal-header">
          <h3>Select Token</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close token list">
            <FaTimes size={14} />
          </button>
        </div>
        <div className="token-search-container">
          <input
            type="text"
            className="token-search"
            placeholder="Search name or paste address"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            aria-label="Search token or enter address"
          />
          <button className="search-token-btn" onClick={handleTokenSearch} aria-label="Add custom token">
            Add
          </button>
        </div>
        <div className="token-list-content">
          {tokens.length === 0 ? (
            <div className="no-tokens">No tokens found</div>
          ) : (
            tokens.map((token) => (
              <div
                key={token.address}
                className="token-item"
                onClick={() => onSelect(token.address)}
                aria-label={`Select token ${token.symbol}`}
              >
                <img
                  src={token.logo || 'https://via.placeholder.com/32'}
                  alt={token.symbol}
                  className="token-logo"
                />
                <div className="token-info">
                  <div className="symbol">{token.symbol}{token.verified && <FaCheckCircle className="verified-icon" size={10} />}</div>
                  <div className="name">{token.name}</div>
                  {tokenPrices[token.address] && (
                    <div className="price">1 {token.symbol} ≈ ${tokenPrices[token.address].toFixed(2)} USDT</div>
                  )}
                </div>
                <button
                  className="add-token-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    addTokenToWallet(token.address, token.symbol, token.name, token.logo);
                  }}
                  aria-label={`Add ${token.symbol} to wallet`}
                >
                  <FaPlus size={10} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TokenListModal;