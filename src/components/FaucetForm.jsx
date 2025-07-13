import { ethers } from 'ethers';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import AINIMEDexFaucetABI from '../abi_json/AINIMEDex_Faucet.json';
import aineLogo from '../assets/evm-tokens/aine-logo.gif';
import usdtLogo from '../assets/evm-tokens/usdt-logo.png';
import btcLogo from '../assets/evm-tokens/btc-logo.png';
import ethLogo from '../assets/evm-tokens/eth-logo.png';
import suiLogo from '../assets/evm-tokens/sui-logo.png';
import ogLogo from '../assets/evm-tokens/og-logo.png';
import solLogo from '../assets/evm-tokens/sol-logo.png'; // Logo for SOLAine
import avaxLogo from '../assets/evm-tokens/avax-logo.png'; // Logo for AVAXAine
import '../style/FaucetForm.css'; // Fixed import statement

function FaucetForm({ onClose, walletData }) {
  const faucetContractAddress = '0xc876f5a8Eb4B021334966Ae0709bb778e8159501';

  const tokens = [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'OG', name: 'OG GALILEO', logo: ogLogo, isNative: true },
    { address: '0xAACDf6B66B1b451B43FDA6270548783F642833C5', symbol: 'USDTaine', name: 'USDT', logo: usdtLogo, amount: '10' },
    { address: '0x1a0326c89c000C18794dD012D5055d9D16900f77', symbol: 'AINIME', name: 'AINIME', logo: aineLogo, amount: '0.1' },
    { address: '0xA5e937cbEC05EB8F71Ae8388845976A16046667b', symbol: 'BTCaine', name: 'BITCOIN', logo: btcLogo, amount: '0.0001' },
    { address: '0x832b82d71296577E7b5272ef2884F2E5EAE66065', symbol: 'ETHaine', name: 'ETHEREUM', logo: ethLogo, amount: '0.003' },
    { address: '0x4d3c3362397A8869C3EdD4d1c36B4Ccf20339a26', symbol: 'SUIaine', name: 'SUI', logo: suiLogo, amount: '3.5' },
    { address: '0xTBD', symbol: 'SOLAine', name: 'SOLANA', logo: solLogo, amount: '0.065' },
    { address: '0xTBD', symbol: 'AVAXAine', name: 'AVALANCHE', logo: avaxLogo, amount: '0.5' },
  ];

  const handleClaim = async (address, isNative, amount, symbol) => {
    if (!walletData.address) {
      toast.error('Silakan hubungkan wallet terlebih dahulu', { position: 'bottom-right' });
      return;
    }
    if (walletData.chainId.toLowerCase() !== '0x40d9') {
      toast.error('Silakan beralih ke 0G Galileo Testnet', { position: 'bottom-right' });
      return;
    }
    if (isNative) {
      window.open('http://faucet.0g.ai/', '_blank');
      toast.info('Mengalihkan ke OG Faucet', { position: 'bottom-right' });
      return;
    }
    if (!address || address === '0xTBD') {
      toast.error('Alamat token tidak valid', { position: 'bottom-right' });
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const faucetContract = new ethers.Contract(faucetContractAddress, AINIMEDexFaucetABI, signer);

      // Call claimFaucet function (matching the smart contract)
      const tx = await faucetContract.claimFaucet(address);
      await tx.wait();
      toast.success(`Berhasil mengklaim ${amount} ${symbol}!`, { position: 'bottom-right' });
      onClose();
    } catch (error) {
      if (error.message.includes('Asset not supported')) {
        toast.error('Token belum didaftarkan di faucet', { position: 'bottom-right' });
      } else if (error.message.includes('Claim interval not elapsed')) {
        toast.error('Anda belum bisa mengklaim lagi, tunggu 48 jam', { position: 'bottom-right' });
      } else if (error.message.includes('transfer failed')) {
        toast.error('Gagal mentransfer token, periksa saldo faucet', { position: 'bottom-right' });
      } else {
        toast.error(`Klaim gagal: ${error.message}`, { position: 'bottom-right' });
      }
    }
  };

  return (
    <div className="claim-list-modal">
      <div className="claim-list">
        <div className="modal-header">
          <h3>Claim Faucet</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="claim-list-content">
          {tokens.map((token) => (
            <div key={token.address} className="claim-item">
              <div className="claim-token-info">
                <img src={token.logo} alt={token.symbol} />
                <div className="claim-token-details">
                  <div className="claim-token-symbol">{token.symbol}</div>
                  <div className="claim-token-name">{token.name}</div>
                  {!token.isNative && (
                    <div className="claim-token-amount">Jumlah: {token.amount} {token.symbol}</div>
                  )}
                </div>
              </div>
              <button
                className="claim-token-btn"
                onClick={() => handleClaim(token.address, token.isNative, token.amount, token.symbol)}
                disabled={!walletData.address || (token.address === '0xTBD' && !token.isNative)}
              >
                {token.isNative ? 'Get OG' : 'Claim'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FaucetForm;