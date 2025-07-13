import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './style/ToastifyCustom.css'; 
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

import SwapForm from './components/SwapForm';
import Liquidity from './components/Liquidity';
import LiquidityPage from './components/LiquidityPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FaucetForm from './components/FaucetForm';
import PairPool from './components/PairPool';

import './index.css';

function App() {
  const [showFaucetModal, setShowFaucetModal] = useState(false);
  const [walletData, setWalletData] = useState({
    address: '',
    chainId: '',
    isConnected: false,
  });
  const [theme, setTheme] = useState('dark'); // Tambahkan state tema
  const navigate = useNavigate();

  useEffect(() => {
    const initWallet = async () => {
      try {
        const provider = await detectEthereumProvider();
        if (provider) {
          const web3Provider = new ethers.providers.Web3Provider(provider, 'any');
          const accounts = await provider.request({ method: 'eth_accounts' });
          const chainId = await provider.request({ method: 'eth_chainId' });

          if (accounts.length > 0) {
            setWalletData({
              address: accounts[0],
              chainId: chainId,
              isConnected: true,
            });
          }

          provider.on('accountsChanged', (accounts) => {
            setWalletData((prev) => ({
              ...prev,
              address: accounts[0] || '',
              isConnected: !!accounts[0],
            }));
          });

          provider.on('chainChanged', (chainId) => {
            setWalletData((prev) => ({
              ...prev,
              chainId: chainId,
            }));
          });
        } else {
          console.error('MetaMask tidak terdeteksi.');
        }
      } catch (error) {
        console.error('Gagal menginisialisasi wallet:', error);
      }
    };

    initWallet();
  }, []);

  const handleWalletDataChange = (newWalletData) => {
    if (!newWalletData || typeof newWalletData !== 'object') {
      console.error('Invalid wallet data provided');
      return;
    }
    setWalletData({
      address: newWalletData.address || '',
      chainId: newWalletData.chainId || '',
      isConnected: !!newWalletData.address,
    });
  };

  const handleFaucetModalClose = () => {
    setShowFaucetModal(false);
    navigate('/'); // Arahkan kembali ke halaman Swap
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme; // Terapkan tema ke body
  };

  return (
    <div className="app-container">
      <Navbar
        setShowFaucetModal={setShowFaucetModal}
        onWalletDataChange={handleWalletDataChange}
        onFaucetModalClose={handleFaucetModalClose}
        theme={theme}
        toggleTheme={handleThemeToggle}
      />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <SwapForm
                setShowFaucetModal={setShowFaucetModal}
                walletData={walletData}
              />
            }
          />
          <Route
            path="/liquidity"
            element={<Liquidity walletData={walletData} />}
          />
          <Route
            path="/liquidity/:pairAddress"
            element={<LiquidityPage walletData={walletData} />}
          />
          <Route
            path="/pair"
            element={<PairPool walletData={walletData} />}
          />
          <Route
            path="/faucet"
            element={<div>{/* Placeholder untuk rute faucet */}</div>}
          />
        </Routes>
      </main>
      {showFaucetModal && (
        <FaucetForm
          onClose={handleFaucetModalClose}
          walletData={walletData}
        />
      )}
      <Footer />
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme} // Gunakan tema dari state
        limit={1}
      />
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}