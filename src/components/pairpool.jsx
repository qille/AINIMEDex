import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import AINIMEDexFactoryABI from '../abi_json/AINIMEDex_Factory.json';
import AINIMEDexRouterABI from '../abi_json/AINIMEDex_Router.json';
import ERC20ABI from '../abi_json/ERC20.json';
import usdtLogo from '../assets/evm-tokens/usdt-logo.png';
import aineLogo from '../assets/evm-tokens/aine-logo.png';
import ogaineLogo from '../assets/evm-tokens/ogaine-logo.png';
import btcLogo from '../assets/evm-tokens/btc-logo.png';
import ethLogo from '../assets/evm-tokens/eth-logo.png';
import suiLogo from '../assets/evm-tokens/sui-logo.png';
import '../style/pairpool.css';
import 'react-toastify/dist/ReactToastify.css';

// Token data dengan alamat AINIME yang diperbarui
const tokens = [
  {
    name: 'USDTaine',
    symbol: 'USDTaine',
    address: '0xAACDf6B66B1b451B43FDA6270548783F642833C5',
    logo: usdtLogo,
    price: 1,
    decimals: 18,
  },
  {
    name: 'AINIME',
    symbol: 'AINE',
    address: '0x1a0326c89c000C18794dD012D5055d9D16900f77',
    logo: aineLogo,
    price: 100,
    decimals: 18,
    burn: 0.01,
  },
  {
    name: 'OGaine',
    symbol: 'OGaine',
    address: '0xd2476F4d3D5479982Df08382A4063018A9b7483c',
    logo: ogaineLogo,
    price: 10,
    decimals: 18,
  },
  {
    name: 'BTCaine',
    symbol: 'BTCaine',
    address: '0xA5e937cbEC05EB8F71Ae8388845976A16046667b',
    logo: btcLogo,
    price: 108000,
    decimals: 18,
  },
  {
    name: 'ETHaine',
    symbol: 'ETHaine',
    address: '0x832b82d71296577E7b5272ef2884F2E5EAE66065',
    logo: ethLogo,
    price: 2610,
    decimals: 18,
  },
  {
    name: 'SUIaine',
    symbol: 'SUIaine',
    address: '0x4d3c3362397A8869C3EdD4d1c36B4Ccf20339a26',
    logo: suiLogo,
    price: 3,
    decimals: 18,
  },
];

const FACTORY_ADDRESS = '0xc8EE2ae053970546bE8A59767864ce4e79133176';
const ROUTER_ADDRESS = '0x677d3823c98E47776eB46BFc0A4C6dF5758BBeC5';
const TOTAL_POOL_VALUE_USD = 60000000;

// Fungsi untuk menunggu tanda terima transaksi dengan retry
const waitForTransactionReceipt = async (provider, txHash, maxRetries = 5, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        return receipt;
      }
    } catch (error) {
      console.warn(`Percobaan ${i + 1} gagal: ${error.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error('Gagal mendapatkan tanda terima transaksi setelah beberapa percobaan.');
};

// Fungsi untuk menampilkan notifikasi
// Pastikan ToastContainer di App.jsx diatur ke position="bottom-left"
const showNotification = (message, type = 'error') => {
  toast[type](message, {
    position: 'bottom-left', // Menggunakan bottom-left untuk konsistensi global
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: document.body.classList.contains('light') ? 'light' : 'dark',
    style: {
      opacity: 0.85, // Tetap mempertahankan gaya transparansi
    },
  });
};

function PairPool({ walletData }) {
  const [token0, setToken0] = useState(null);
  const [token1, setToken1] = useState(null);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        try {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(web3Provider);
          setSigner(web3Provider.getSigner());
        } catch (error) {
          showNotification('Gagal menginisialisasi provider MetaMask.', 'error');
        }
      } else {
        showNotification('MetaMask tidak tersedia. Silakan instal MetaMask.', 'error');
      }
    };
    initProvider();
  }, []);

  // Calculate token amounts based on $60M total pool value, accounting for 1% burn on AINIME
  const calculateAmounts = (tokenA, tokenB) => {
    if (!tokenA || !tokenB) return { amountA: '0', amountB: '0' };

    const valuePerTokenUSD = TOTAL_POOL_VALUE_USD / 2; // $30000000 USD per token
    let amountA = valuePerTokenUSD / tokenA.price;
    let amountB = valuePerTokenUSD / tokenB.price;

    // Adjust for 1% burn if token is AINIME
    if (tokenA.symbol === 'AINE') {
      amountA = amountA / (1 - tokenA.burn); // Kompensasi burn 1%
    }
    if (tokenB.symbol === 'AINE') {
      amountB = amountB / (1 - tokenB.burn); // Kompensasi burn 1%
    }

    const amountAWei = ethers.utils.parseUnits(amountA.toFixed(6), tokenA.decimals);
    const amountBWei = ethers.utils.parseUnits(amountB.toFixed(6), tokenB.decimals);

    return { amountA: amountAWei.toString(), amountB: amountBWei.toString() };
  };

  // Handle token selection
  const handleTokenSelect = (token, isToken0) => {
    if (isToken0) {
      if (token1 && token1.address === token.address) {
        showNotification('Token yang sama tidak dapat dipilih.', 'error');
        return;
      }
      setToken0(token);
    } else {
      if (token0 && token0.address === token.address) {
        showNotification('Token yang sama tidak dapat dipilih.', 'error');
        return;
      }
      setToken1(token);
    }
  };

  // Update amounts when tokens change
  useEffect(() => {
    if (token0 && token1) {
      const { amountA, amountB } = calculateAmounts(token0, token1);
      setAmount0(ethers.utils.formatUnits(amountA, token0.decimals));
      setAmount1(ethers.utils.formatUnits(amountB, token1.decimals));
    } else {
      setAmount0('');
      setAmount1('');
    }
  }, [token0, token1]);

  // Create liquidity pair or add liquidity if pair exists
  const createPair = async () => {
    if (!provider || !signer || !walletData.address || walletData.chainId.toLowerCase() !== '0x40d9') {
      showNotification('Silakan hubungkan wallet ke 0G Galileo Testnet.', 'error');
      return;
    }
    if (!token0 || !token1) {
      showNotification('Pilih dua token untuk membuat pair.', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const factory = new ethers.Contract(FACTORY_ADDRESS, AINIMEDexFactoryABI, signer);
      const router = new ethers.Contract(ROUTER_ADDRESS, AINIMEDexRouterABI, signer);

      const tokenA = token0.address < token1.address ? token0 : token1;
      const tokenB = token0.address < token1.address ? token1 : token0;
      const amountA = token0.address < token1.address ? amount0 : amount1;
      const amountB = token0.address < token1.address ? amount1 : amount0;

      const tokenAContract = new ethers.Contract(tokenA.address, ERC20ABI, signer);
      const tokenBContract = new ethers.Contract(tokenB.address, ERC20ABI, signer);

      const amountAWei = ethers.utils.parseUnits(amountA, tokenA.decimals);
      const amountBWei = ethers.utils.parseUnits(amountB, tokenB.decimals);

      // Approve tokens
      const allowanceA = await tokenAContract.allowance(walletData.address, ROUTER_ADDRESS);
      if (allowanceA.lt(amountAWei)) {
        const approveTxA = await tokenAContract.approve(ROUTER_ADDRESS, amountAWei, { gasLimit: 100000 });
        await waitForTransactionReceipt(provider, approveTxA.hash);
        showNotification(`Persetujuan untuk ${tokenA.symbol} berhasil.`, 'info'); // Notifikasi info setelah approval
      }
      const allowanceB = await tokenBContract.allowance(walletData.address, ROUTER_ADDRESS);
      if (allowanceB.lt(amountBWei)) {
        const approveTxB = await tokenBContract.approve(ROUTER_ADDRESS, amountBWei, { gasLimit: 100000 });
        await waitForTransactionReceipt(provider, approveTxB.hash);
        showNotification(`Persetujuan untuk ${tokenB.symbol} berhasil.`, 'info'); // Notifikasi info setelah approval
      }

      // Check if pair exists
      let pairAddress = await factory.getPair(tokenA.address, tokenB.address);
      if (pairAddress === ethers.constants.AddressZero) {
        // Create pair if it doesn't exist
        const tx = await factory.createPair(tokenA.address, tokenB.address, { gasLimit: 300000 });
        await waitForTransactionReceipt(provider, tx.hash);
        pairAddress = await factory.getPair(tokenA.address, tokenB.address);
        showNotification('Pair berhasil dibuat.', 'success');
      } else {
        showNotification('Pair sudah ada, melanjutkan untuk menambahkan likuiditas.', 'info');
      }

      // Add liquidity
      const addLiquidityTx = await router.addLiquidity(
        tokenA.address,
        tokenB.address,
        amountAWei,
        amountBWei,
        walletData.address,
        { gasLimit: 500000 }
      );
      await waitForTransactionReceipt(provider, addLiquidityTx.hash);
      showNotification('Likuiditas berhasil ditambahkan.', 'success');
    } catch (error) {
      console.error('Gagal membuat pair atau menambahkan likuiditas:', error);
      showNotification(`Error: ${error.reason || error.message || 'Transaksi gagal, silakan cek explorer.'}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="pairpool-card">
      <div className="swap-header">
        <h2>Buat Pair Likuiditas</h2>
        <div className="network-indicator">
          <span>
            {walletData.address && walletData.chainId.toLowerCase() === '0x40d9'
              ? 'OG Testnet'
              : 'Wallet Tidak Terhubung'}
          </span>
          <div className="pulse"></div>
        </div>
      </div>
      <div className="pairpool-container">
        <div className="token-input">
          <div className="token-info">
            {token0 ? (
              <>
                <img src={token0.logo} alt={token0.symbol} className="token-logo" />
                <span>
                  {token0.name} ({token0.symbol})
                </span>
              </>
            ) : (
              <span>Pilih Token</span>
            )}
          </div>
          <select
            className="token-select"
            onChange={(e) => {
              const selected = tokens.find((t) => t.address === e.target.value);
              handleTokenSelect(selected, true);
            }}
            value={token0?.address || ''}
            disabled={isCreating}
          >
            <option value="">Pilih Token</option>
            {tokens.map((token) => (
              <option key={token.address} value={token.address}>
                {token.name} ({token.symbol})
              </option>
            ))}
          </select>
          {token0 && (
            <span className="balance">
              Jumlah: {parseFloat(amount0).toLocaleString('en-US', { maximumFractionDigits: 6 })}
            </span>
          )}
        </div>
        <div className="plus-sign">+</div>
        <div className="token-input">
          <div className="token-info">
            {token1 ? (
              <>
                <img src={token1.logo} alt={token1.symbol} className="token-logo" />
                <span>
                  {token1.name} ({token1.symbol})
                </span>
              </>
            ) : (
              <span>Pilih Token</span>
            )}
          </div>
          <select
            className="token-select"
            onChange={(e) => {
              const selected = tokens.find((t) => t.address === e.target.value);
              handleTokenSelect(selected, false);
            }}
            value={token1?.address || ''}
            disabled={isCreating}
          >
            <option value="">Pilih Token</option>
            {tokens.map((token) => (
              <option key={token.address} value={token.address}>
                {token.name} ({token.symbol})
              </option>
            ))}
          </select>
          {token1 && (
            <span className="balance">
              Jumlah: {parseFloat(amount1).toLocaleString('en-US', { maximumFractionDigits: 6 })}
            </span>
          )}
        </div>
        {token0 && token1 && (
          <div className="pool-info">
            <p>Pair: {token0.symbol}/{token1.symbol}</p>
            <p>
              Nilai Total Pool: ${TOTAL_POOL_VALUE_USD.toLocaleString('en-US')} USD
            </p>
            {token0.burn || token1.burn ? (
              <p className="burn-info">
                Catatan: 1% biaya pembakaran pada transaksi {token0.burn ? token0.name : token1.name}
              </p>
            ) : null}
            <p>Status: {isCreating ? 'Sedang diproses...' : 'Pair baru akan dibuat atau likuiditas akan ditambahkan'}</p>
          </div>
        )}
        <button
          className="deposit-button"
          onClick={createPair}
          disabled={isCreating || !token0 || !token1 || walletData.chainId.toLowerCase() !== '0x40d9'}
        >
          {isCreating ? <FaSpinner className="spinner" /> : 'Buat Pair atau Tambah Likuiditas'}
        </button>
      </div>
    </div>
  );
}

export default PairPool;