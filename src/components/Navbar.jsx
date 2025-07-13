import { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import detectEthereumProvider from '@metamask/detect-provider';
import { FaWallet, FaFaucet } from 'react-icons/fa';
import { IoSunny, IoMoon } from 'react-icons/io5';
import AINIMELogo from '../assets/evm-tokens/ainime-logo.gif';
import '../style/Navbar.css';

// --- Konfigurasi Jaringan ---
const galileoTestnet = {
  chainId: '0x40D9',
  chainName: '0G Galileo Testnet',
  nativeCurrency: { name: 'OG', symbol: 'OG', decimals: 18 },
  rpcUrls: ['https://rpc-testnet.0g.ai'],
  blockExplorerUrls: ['https://explorer.0g.ai'],
};

// --- Komponen Navbar ---
function Navbar({ onWalletDataChange, theme, toggleTheme }) {
  // State untuk mengelola UI dan data wallet
  const [walletData, setWalletData] = useState({ address: '', chainId: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  // Mengambil status disconect dari localStorage saat inisialisasi
  const [isDisconnected, setIsDisconnected] = useState(
    localStorage.getItem('isDisconnected') === 'true'
  );

  // --- Fungsi untuk memutus koneksi wallet ---
  const disconnectWallet = useCallback(() => {
    setWalletData({ address: '', chainId: '' });
    onWalletDataChange({ address: '', chainId: '' });
    setIsDisconnected(true);
    localStorage.setItem('isDisconnected', 'true');
    toast.info('Wallet disconnected.', { position: 'bottom-left' });
  }, [onWalletDataChange]);

  // --- Fungsi untuk menyambungkan wallet ---
  const connectWallet = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      const provider = await detectEthereumProvider({ timeout: 3000 });
      if (!provider) {
        setIsMetaMaskAvailable(false);
        toast.error('MetaMask not available. Please install MetaMask.', { position: 'bottom-left' });
        return;
      }
      setIsMetaMaskAvailable(true);

      // Permintaan akun hanya jika belum terhubung
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const address = ethers.utils.getAddress(accounts[0]);
      
      const currentChainId = await provider.request({ method: 'eth_chainId' });
      if (currentChainId.toLowerCase() !== galileoTestnet.chainId.toLowerCase()) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: galileoTestnet.chainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [galileoTestnet],
            });
            toast.success('Galileo Testnet has been added!', { position: 'bottom-left' });
          } else {
            toast.error('Please switch to Galileo Testnet manually.', { position: 'bottom-left' });
            return; // Hentikan proses jika gagal
          }
        }
      }

      const newWalletData = {
        address,
        chainId: await provider.request({ method: 'eth_chainId' }),
      };
      setWalletData(newWalletData);
      onWalletDataChange(newWalletData);
      toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`, { position: 'bottom-left' });
      setIsDisconnected(false);
      localStorage.setItem('isDisconnected', 'false');

    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet.', { position: 'bottom-left' });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, onWalletDataChange]);

  // --- Efek untuk memeriksa status koneksi ---
  useEffect(() => {
    const checkConnectionStatus = async () => {
      // Jangan periksa status jika pengguna secara eksplisit memutuskan koneksi
      if (isDisconnected) {
        setIsMetaMaskAvailable(true);
        return;
      }
      
      const provider = await detectEthereumProvider({ timeout: 2000 });
      if (provider && provider.isMetaMask) {
        setIsMetaMaskAvailable(true);
        try {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const chainId = await provider.request({ method: 'eth_chainId' });
            const newWalletData = {
              address: ethers.utils.getAddress(accounts[0]),
              chainId,
            };
            setWalletData(newWalletData);
            onWalletDataChange(newWalletData);
          } else {
            // Jika tidak ada akun yang terhubung, atur ulang state
            setWalletData({ address: '', chainId: '' });
            onWalletDataChange({ address: '', chainId: '' });
          }
        } catch (error) {
          console.error('Error checking MetaMask status:', error);
          setWalletData({ address: '', chainId: '' });
          onWalletDataChange({ address: '', chainId: '' });
        }
      } else {
        setIsMetaMaskAvailable(false);
        setWalletData({ address: '', chainId: '' });
        onWalletDataChange({ address: '', chainId: '' });
      }
    };
    
    checkConnectionStatus();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkConnectionStatus();
        }
      };

      const handleChainChanged = () => {
        checkConnectionStatus();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [isDisconnected, onWalletDataChange, disconnectWallet]);

  // --- Perbaikan Tampilan (JSX) ---
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={AINIMELogo} alt="AINIMEDex Logo" className="navbar-logo" />
        <div className="navbar-text">
          <span className="navbar-title">AINIMEDex</span>
          <span className="navbar-subtitle">Decentralized Exchange</span>
        </div>
      </div>
      <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        ☰
      </button>
      <div className={`menu-items ${isMenuOpen ? 'open' : ''}`}>
        <NavLink to="/" className={({ isActive }) => `menu-btn nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
          Swap
        </NavLink>
        <NavLink to="/liquidity" className={({ isActive }) => `menu-btn nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
          Pools
        </NavLink>
        <NavLink to="/faucet" className={({ isActive }) => `menu-btn faucet-btn ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
          <FaFaucet /> Claim Faucet
        </NavLink>
        
        <div className="wallet-container">
          {walletData.address ? (
            <>
              <button
                className="menu-btn wallet-btn connected"
                onClick={() => {
                  navigator.clipboard.writeText(walletData.address);
                  toast.success('Wallet address copied!', { position: 'bottom-left' });
                }}
              >
                <FaWallet />
                <span className="wallet-address">
                  {`${walletData.address.substring(0, 6)}...${walletData.address.substring(38)}`}
                </span>
              </button>
              <button
                className="menu-btn disconnect-btn"
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              className="menu-btn wallet-btn"
              onClick={connectWallet}
              disabled={isConnecting || !isMetaMaskAvailable}
            >
              <FaWallet /> {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
        
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <IoSunny /> : <IoMoon />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
