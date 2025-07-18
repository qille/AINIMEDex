import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import PairPool from './components/PairPool';
import Faucet from './components/Faucet';
import NotFound from './components/NotFound'; // Impor komponen NotFound

import './index.css';

function App() {
  const [walletData, setWalletData] = useState({
    address: '',
    chainId: '',
    isConnected: false,
  });
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const initWallet = async () => {
      try {
        const provider = await detectEthereumProvider({ timeout: 2000 });
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' });
          const chainId = await provider.request({ method: 'eth_chainId' });

          if (accounts.length > 0) {
            setWalletData({
              address: ethers.utils.getAddress(accounts[0]),
              chainId,
              isConnected: true,
            });
          }

          const handleAccountsChanged = (accounts) => {
            setWalletData((prev) => ({
              ...prev,
              address: accounts[0] ? ethers.utils.getAddress(accounts[0]) : '',
              isConnected: !!accounts[0],
            }));
          };

          const handleChainChanged = (newChainId) => {
            setWalletData((prev) => ({
              ...prev,
              chainId: newChainId,
            }));
          };

          provider.on('accountsChanged', handleAccountsChanged);
          provider.on('chainChanged', handleChainChanged);

          return () => {
            if (provider.removeListener) {
              provider.removeListener('accountsChanged', handleAccountsChanged);
              provider.removeListener('chainChanged', handleChainChanged);
            }
          };
        } else {
          console.error('MetaMask not detected.');
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
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

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  return (
    <div className="app-container">
      <Navbar
        onWalletDataChange={handleWalletDataChange}
        theme={theme}
        toggleTheme={handleThemeToggle}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<SwapForm walletData={walletData} />} />
          <Route path="/liquidity" element={<Liquidity walletData={walletData} />} />
          <Route path="/liquidity/:pairAddress" element={<LiquidityPage walletData={walletData} />} />
          <Route path="/pair" element={<PairPool walletData={walletData} />} />
          <Route path="/faucet" element={<Faucet walletData={walletData} />} />
          <Route path="*" element={<NotFound />} /> {/* Rute untuk 404 */}
        </Routes>
      </main>
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
        theme={theme}
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
