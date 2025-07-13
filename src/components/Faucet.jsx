import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';
import '../style/Claimlist.css';

// Import token logos
import usdtLogo from '../assets/evm-tokens/usdt-logo.png';
import aineLogo from '../assets/evm-tokens/ainime-logo.gif'; // Assuming aine-logo.png is the same as ainime-logo.gif
import ogaineLogo from '../assets/evm-tokens/ogaine-logo.png';
import btcLogo from '../assets/evm-tokens/btc-logo.png'; // Placeholder, replace if actual logo is provided
import ethLogo from '../assets/evm-tokens/eth-logo.png';
import suiLogo from '../assets/evm-tokens/sui-logo.png';
import ogLogo from '../assets/evm-tokens/og-logo.png'; // Added OG Native logo

// Import Faucet ABI
import AINIMEDexFaucetABI from '../abi_json/AINIMEDex_Faucet.json';

function ClaimListModal({ walletData }) {
  const navigate = useNavigate();
  const [isClaiming, setIsClaiming] = useState({});

  // Define the tokens with their contract addresses and logos, with OG Native at the top
  const claims = [
    {
      symbol: 'OG',
      name: 'OG Native',
      address: null, // No contract address for external link
      logo: ogLogo,
      disabled: false,
      externalLink: 'https://faucet.0g.ai/', // External faucet link
    },
    {
      symbol: 'USDTaine',
      name: 'Tether AINE',
      address: '0xAACDf6B66B1b451B43FDA6270548783F642833C5',
      logo: usdtLogo,
      disabled: false,
    },
    {
      symbol: 'AINIME',
      name: 'AINIME Token',
      address: '0x1a0326c89c000C18794dD012D5055d9D16900f77',
      logo: aineLogo,
      disabled: false,
    },
    {
      symbol: 'OGaine',
      name: 'OG AINE',
      address: '0xd2476F4d3D5479982Df08382A4063018A9b7483c',
      logo: ogaineLogo,
      disabled: false,
    },
    {
      symbol: 'BTCaine',
      name: 'Bitcoin AINE',
      address: '0xA5e937cbEC05EB8F71Ae8388845976A16046667b',
      logo: btcLogo, // Replace with actual logo if provided
      disabled: false,
    },
    {
      symbol: 'ETHaine',
      name: 'Ethereum AINE',
      address: '0x832b82d71296577E7b5272ef2884F2E5EAE66065',
      logo: ethLogo,
      disabled: false,
    },
    {
      symbol: 'SUIaine',
      name: 'SUI AINE',
      address: '0x4d3c3362397A8869C3EdD4d1c36B4Ccf20339a26',
      logo: suiLogo,
      disabled: false,
    },
  ];

  const handleClose = () => {
    navigate('/');
    toast.info('Claim list closed', { position: 'bottom-right' });
  };

  const handleClaim = async (claim) => {
    if (claim.externalLink) {
      // For OG Native, redirect to external faucet
      window.open(claim.externalLink, '_blank');
      toast.info(`Redirecting to ${claim.name} faucet`, { position: 'bottom-right' });
      return;
    }

    if (!walletData.address) {
      toast.error('Please connect your wallet first.', { position: 'bottom-right' });
      return;
    }

    setIsClaiming((prev) => ({ ...prev, [claim.symbol]: true }));

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const faucetContract = new ethers.Contract(
        '0xc876f5a8Eb4B021334966Ae0709bb778e8159501', // AINIMEDex_Faucet contract address
        AINIMEDexFaucetABI,
        signer
      );

      // Assuming the faucet contract has a `claim` function that takes a token address
      const tx = await faucetContract.claim(claim.address);
      await tx.wait();

      toast.success(`Successfully claimed ${claim.symbol}!`, { position: 'bottom-right' });
    } catch (error) {
      console.error(`Error claiming ${claim.symbol}:`, error);
      toast.error(`Failed to claim ${claim.symbol}.`, { position: 'bottom-right' });
    } finally {
      setIsClaiming((prev) => ({ ...prev, [claim.symbol]: false }));
    }
  };

  return (
    <div className="claim-list-page">
      <div className="claim-list">
        <div className="modal-header">
          <h3>Claimable Tokens</h3>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close claim list">
            <FaTimes />
          </button>
        </div>
        <div className="claim-list-content">
          {claims.length > 0 ? (
            claims.map((claim, index) => (
              <div key={index} className="claim-item">
                <div className="claim-token-info">
                  <img
                    src={claim.logo}
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
                  onClick={() => handleClaim(claim)}
                  disabled={isClaiming[claim.symbol] || (!claim.externalLink && !walletData.address)}
                  aria-label={`Claim ${claim.symbol}`}
                >
                  {isClaiming[claim.symbol] ? 'Claiming...' : 'Claim'}
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
