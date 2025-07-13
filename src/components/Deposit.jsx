import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './deposit.css'; // Import file CSS Anda

// Import logo aset
import aineLogo from '../assets/evm-tokens/aine-logo.gif';
import usdtLogo from '../assets/evm-tokens/usdt-logo.png';
import btcLogo from '../assets/evm-tokens/btc-logo.png';
import ethLogo from '../assets/evm-tokens/eth-logo.png';
import ogLogo from '../assets/evm-tokens/og-logo.png';
import suiLogo from '../assets/evm-tokens/sui-logo.png';

// Import ABI
import AINIMEDexRouterABI from '../abi_json/AINIMEDexRouter.json';
import AINIMEDexPairABI from '../abi_json/AINIMEDexPair.json'; // Menggunakan ini sebagai contoh
import AINIMEDexFactoryABI from '../abi_json/AINIMEDexFactory.json';
import AINIMEDexFaucetABI from '../abi_json/AINIMEDexFaucet.json';

// Definisi alamat kontrak
const CONTRACT_ADDRESSES = {
  AINIME: '0x7F2aD0e0b4dD4DCABED3Bfa2eF33c29b6FF8E961',
  USDTaine: '0x3893BfDC29e3Ce42569C2D670738d94CEc4e0B01',
  BTCaine: '0xFaf376eF145Aa71802fA4909dEA4cc93f3f2DeD3',
  ETHaine: '0x118722D254483d8A346C1Dc1E6EF4f2f2Ec9e055',
  SUIaine: '0x4672aD176B54B2AFB86Ad955Ed1283B6F0e3D047',
  AINIMEDexRouter: '0x3C9aCC370F35593fEc8fdE3CDFe759304a03398B',
  AINIMEDexPair: '0x8d3d3CdcA507a49d809e26BcaC08125EA16a39eC',
  AINIMEDexFactory: '0x489249546958E8d3c5250017B1495ab05a283312',
  AINIMEDexFaucet: '0x452cAcf56b5411eAF2A3260910BB49396bCe528d',
};

// Daftar token yang bisa dideposit
const DEPOSIT_TOKENS = [
  { name: 'AINIME', address: CONTRACT_ADDRESSES.AINIME, logo: aineLogo },
  { name: 'USDTaine', address: CONTRACT_ADDRESSES.USDTaine, logo: usdtLogo },
  { name: 'BTCaine', address: CONTRACT_ADDRESSES.BTCaine, logo: btcLogo },
  { name: 'ETHaine', address: CONTRACT_ADDRESSES.ETHaine, logo: ethLogo },
  { name: 'SUIaine', address: CONTRACT_ADDRESSES.SUIaine, logo: suiLogo },
];

const Deposite = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(DEPOSIT_TOKENS[0]); // Default token pertama
  const [tokenBalance, setTokenBalance] = useState('0.0');
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initEthers = async () => {
      if (window.ethereum) {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider);

        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);
          const ethSigner = await ethProvider.getSigner();
          setSigner(ethSigner);

          window.ethereum.on('accountsChanged', (newAccounts) => {
            setAccount(newAccounts[0] || '');
            window.location.reload();
          });

          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });

        } catch (error) {
          console.error("Gagal menghubungkan ke MetaMask:", error);
          setError("Silakan hubungkan ke MetaMask untuk melanjutkan.");
        }
      } else {
        setError("MetaMask tidak terdeteksi. Silakan instal MetaMask.");
      }
    };

    initEthers();
  }, []);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (signer && selectedToken && account) {
        try {
          const tokenContract = new ethers.Contract(selectedToken.address, AINIMEDexPairABI, provider); // Asumsi AINIMEDexPairABI untuk token ERC20
          const balance = await tokenContract.balanceOf(account);
          setTokenBalance(ethers.formatUnits(balance, 18)); // Asumsi 18 desimal
        } catch (err) {
          console.error("Gagal mengambil saldo token:", err);
          setTokenBalance('0.0');
        }
      }
    };
    fetchTokenBalance();
  }, [signer, selectedToken, account, provider]);

  const handleDeposit = async () => {
    if (!signer) {
      setError("Silakan hubungkan dompet Anda.");
      return;
    }

    if (!depositAmount || isNaN(depositAmount) || parseFloat(depositAmount) <= 0) {
      setError("Harap masukkan jumlah deposit yang valid.");
      return;
    }

    setIsDepositing(true);
    setError('');

    try {
      const tokenContract = new ethers.Contract(selectedToken.address, AINIMEDexPairABI, signer); // ABI ERC-20
      const amountInWei = ethers.parseUnits(depositAmount, 18); // Asumsi 18 desimal

      // --- Langkah 1: Persetujuan (Approve) ---
      console.log(`Menyetujui ${depositAmount} ${selectedToken.name} untuk ${CONTRACT_ADDRESSES.AINIMEDexFaucet}...`);
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.AINIMEDexFaucet, amountInWei);
      await approveTx.wait();
      console.log("Persetujuan berhasil!", approveTx);

      // --- Langkah 2: Deposit ke Faucet ---
      const faucetContract = new ethers.Contract(CONTRACT_ADDRESSES.AINIMEDexFaucet, AINIMEDexFaucetABI, signer);
      console.log(`Melakukan deposit ${depositAmount} ${selectedToken.name} ke Faucet...`);
      const depositTx = await faucetContract.depositToken(selectedToken.address, amountInWei); // Contoh fungsi: depositToken
      await depositTx.wait();
      console.log("Deposit berhasil!", depositTx);

      alert(`Berhasil mendepositkan ${depositAmount} ${selectedToken.name}!`);
      setDepositAmount('');
      // Perbarui saldo setelah deposit
      const balance = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.formatUnits(balance, 18));
    } catch (err) {
      console.error("Gagal melakukan deposit:", err);
      setError(`Gagal melakukan deposit: ${err.reason || err.message || err}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const setPercentageAmount = (percentage) => {
    if (tokenBalance) {
      const amount = (parseFloat(tokenBalance) * percentage).toFixed(4); // Batasi 4 desimal
      setDepositAmount(amount);
    }
  };

  return (
    <div className="deposit-card">
      <h2>Deposit Dana</h2>

      {!account ? (
        <p style={{ textAlign: 'center', color: '#ff4d4d' }}>{error || "Harap hubungkan dompet MetaMask Anda."}</p>
      ) : (
        <p style={{ textAlign: 'center', color: '#fff', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Terhubung: <strong style={{ color: '#007bff' }}>{account.substring(0, 6)}...{account.substring(account.length - 4)}</strong>
        </p>
      )}

      {error && <p style={{ color: '#ff4d4d', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

      <div className="deposit-input">
        <label htmlFor="token-select">Pilih Token:</label>
        <div className="token-info">
          <img src={selectedToken.logo} alt={`${selectedToken.name} Logo`} className="token-logo" />
          <div className="token-details">
            <select
              id="token-select"
              value={selectedToken.name}
              onChange={(e) => {
                const newToken = DEPOSIT_TOKENS.find(token => token.name === e.target.value);
                setSelectedToken(newToken);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                appearance: 'none', // Sembunyikan panah default
                cursor: 'pointer',
                padding: '0',
                margin: '0',
                width: '100%'
              }}
            >
              {DEPOSIT_TOKENS.map((token) => (
                <option key={token.name} value={token.name}>
                  {token.name}
                </option>
              ))}
            </select>
            <span className="token-contract">{selectedToken.address.substring(0, 8)}...{selectedToken.address.substring(selectedToken.address.length - 6)}</span>
            <span className="token-balance">Saldo Anda: {tokenBalance} {selectedToken.name}</span>
          </div>
        </div>
      </div>

      <div className="deposit-input">
        <label htmlFor="deposit-amount">Jumlah Deposit:</label>
        <input
          type="number"
          id="deposit-amount"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="0.0"
          disabled={!account || isDepositing}
        />
        <div className="percentage-buttons">
          <button className="percentage-btn" onClick={() => setPercentageAmount(0.25)} disabled={!account || isDepositing}>25%</button>
          <button className="percentage-btn" onClick={() => setPercentageAmount(0.5)} disabled={!account || isDepositing}>50%</button>
          <button className="percentage-btn" onClick={() => setPercentageAmount(0.75)} disabled={!account || isDepositing}>75%</button>
          <button className="percentage-btn" onClick={() => setPercentageAmount(1)} disabled={!account || isDepositing}>MAX</button>
        </div>
      </div>

      <div className="button-group">
        <button
          className="confirm-button"
          onClick={handleDeposit}
          disabled={!account || !depositAmount || isDepositing}
        >
          {isDepositing ? 'Mendepositkan...' : 'Deposit Sekarang'}
        </button>
        <button
          className="cancel-button"
          onClick={() => setDepositAmount('')}
          disabled={isDepositing}
        >
          Batal
        </button>
      </div>

      {/* Bagian ini bisa dihapus atau disembunyikan di produksi */}
      <div style={{ marginTop: '2rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
        <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.8rem' }}>Alamat Kontrak (Untuk Referensi)</h3>
        <pre style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '5px', overflowX: 'auto', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
          <code>
            {JSON.stringify(CONTRACT_ADDRESSES, null, 2)}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default Deposite;