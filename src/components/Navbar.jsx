import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import 'react-toastify/dist/ReactToastify.css';
import detectEthereumProvider from '@metamask/detect-provider';
import { FaWallet, FaFaucet } from 'react-icons/fa';
import { IoSunny, IoMoon } from 'react-icons/io5';
import AINIMELogo from '../assets/evm-tokens/ainime-logo.gif';
import '../style/Navbar.css';

function Navbar({ setShowFaucetModal, onWalletDataChange, theme, toggleTheme }) {
  const [walletData, setWalletData] = useState({
    address: '',
    chainId: '',
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(
    localStorage.getItem('isDisconnected') === 'true'
  );
  const navigate = useNavigate();

  const galileoTestnet = {
    chainId: '0x40D9',
    chainName: '0G Galileo Testnet',
    nativeCurrency: { name: 'OG', symbol: 'OG', decimals: 18 },
    rpcUrls: ['https://rpc-testnet.0g.ai'],
    blockExplorerUrls: ['https://explorer.0g.ai'],
  };

  const connectWallet = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setIsDisconnected(false);
    localStorage.setItem('isDisconnected', 'false');

    try {
      const provider = await detectEthereumProvider({ timeout: 5000 });
      if (!provider) {
        setIsMetaMaskAvailable(false);
        toast.error('MetaMask not available. Please install MetaMask.', { position: 'bottom-left' });
        return;
      }

      setIsMetaMaskAvailable(true);

      // LANGKAH 1: Meminta akun dan memberikan feedback cepat
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const address = ethers.utils.getAddress(accounts[0]);
      toast.success('Wallet connected. Please approve network switch.', { position: 'bottom-left' });

      // LANGKAH 2: Cek dan switch/tambahkan network
      const currentChainId = await provider.request({ method: 'eth_chainId' });
      if (currentChainId.toLowerCase() !== galileoTestnet.chainId.toLowerCase()) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: galileoTestnet.chainId }],
          });
          toast.success('Successfully switched to Galileo Testnet.', { position: 'bottom-left' });
        } catch (switchError) {
          if (switchError.code === 4902) { // Kode untuk network yang belum ada
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [galileoTestnet],
            });
            toast.success('Added and switched to Galileo Testnet.', { position: 'bottom-left' });
          } else {
            // Error jika pengguna menolak switch
            toast.error('Failed to switch network. Please switch manually.', { position: 'bottom-left' });
            // Kita tetap lanjutkan dengan akun yang sudah terhubung
          }
        }
      }

      // LANGKAH 3: Perbarui state setelah semua proses selesai
      const finalChainId = await provider.request({ method: 'eth_chainId' });
      const newWalletData = { address, chainId: finalChainId };
      setWalletData(newWalletData);
      onWalletDataChange(newWalletData);
      // Notifikasi final bisa diganti atau dihapus karena sudah ada notif sebelumnya
      // toast.success(`Connected to ${address.substring(0, 6)}...${address.substring(38)}`, { position: 'bottom-left' });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet.', { position: 'bottom-left' });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, onWalletDataChange]);

  const disconnectWallet = useCallback(() => {
    setWalletData({ address: '', chainId: '' });
    onWalletDataChange({ address: '', chainId: '' });
    setIsDisconnected(true);
    localStorage.setItem('isDisconnected', 'true');
    window.location.reload();
  }, [onWalletDataChange]);

  const checkAndConnect = useCallback(async () => {
    const provider = await detectEthereumProvider({ timeout: 5000 });
    if (provider && provider.isMetaMask) {
      setIsMetaMaskAvailable(true);
      if (!isDisconnected) {
        try {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const newChainId = await provider.request({ method: 'eth_chainId' });
            const newWalletData = { address: ethers.utils.getAddress(accounts[0]), chainId: newChainId };
            setWalletData(newWalletData);
            onWalletDataChange(newWalletData);
          } else {
            disconnectWallet();
          }
        } catch (error) {
          console.error('Error checking MetaMask status:', error);
          disconnectWallet();
        }
      }
    } else {
      setIsMetaMaskAvailable(false);
    }
  }, [isDisconnected, onWalletDataChange, disconnectWallet]);

  const debouncedHandleChainChanged = useCallback(debounce((newChainId) => {
    if (walletData.address && !isDisconnected) {
      if (newChainId.toLowerCase() !== galileoTestnet.chainId.toLowerCase()) {
        toast.error('Wrong network detected. Please switch to Galileo Testnet.', {
          position: 'bottom-left',
        });
      } else {
        const newWalletData = { ...walletData, chainId: newChainId };
        setWalletData(newWalletData);
        onWalletDataChange(newWalletData);
        toast.success('Successfully switched to Galileo Testnet.', {
          position: 'bottom-left',
        });
      }
    }
  }, 500), [walletData, isDisconnected, onWalletDataChange]);

  const debouncedHandleAccountsChanged = useCallback(debounce(async (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      const provider = await detectEthereumProvider({ timeout: 5000 });
      if (provider) {
        const newChainId = await provider.request({ method: 'eth_chainId' });
        const newWalletData = { address: ethers.utils.getAddress(accounts[0]), chainId: newChainId };
        setWalletData(newWalletData);
        onWalletDataChange(newWalletData);
      }
    }
  }, 500), [disconnectWallet, onWalletDataChange]);

  useEffect(() => {
    checkAndConnect();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', debouncedHandleAccountsChanged);
      window.ethereum.on('chainChanged', debouncedHandleChainChanged);
      
      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', debouncedHandleAccountsChanged);
          window.ethereum.removeListener('chainChanged', debouncedHandleChainChanged);
        }
      };
    }
  }, [checkAndConnect, debouncedHandleAccountsChanged, debouncedHandleChainChanged]);

  const handleFaucetClick = () => {
    setShowFaucetModal(true);
    setIsMenuOpen(false);
  };

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
        <NavLink
          to="/"
          className={({ isActive }) => `menu-btn nav-link ${isActive ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Swap
        </NavLink>
        <NavLink
          to="/liquidity"
          className={({ isActive }) => `menu-btn nav-link ${isActive ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Pools
        </NavLink>
        <NavLink
          to="/faucet"
          className={({ isActive }) => `menu-btn faucet-btn ${isActive ? 'active' : ''}`}
          onClick={handleFaucetClick}
        >
          <FaFaucet /> Claim Faucet
        </NavLink>
        {walletData.address ? (
          <div className="wallet-info">
            <button
              className="menu-btn wallet-btn connected"
              onClick={() => {
                navigator.clipboard.writeText(walletData.address);
                toast.success('Wallet address copied!', { position: 'bottom-left' });
                setIsMenuOpen(false);
              }}
            >
              <FaWallet />
              <span className="wallet-address">
                {`${walletData.address.substring(0, 6)}...${walletData.address.substring(38)}`}
              </span>
            </button>
            <button
              className="menu-btn disconnect-btn"
              onClick={() => {
                disconnectWallet();
                setIsMenuOpen(false);
              }}
              disabled={isConnecting}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="menu-btn wallet-btn"
            onClick={() => {
              connectWallet();
              setIsMenuOpen(false);
            }}
            disabled={isConnecting || !isMetaMaskAvailable}
          >
            <FaWallet /> {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
        <button
          className="theme-toggle"
          onClick={() => {
            toggleTheme();
            setIsMenuOpen(false);
          }}
        >
          {theme === 'dark' ? <IoSunny /> : <IoMoon />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
