import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import detectEthereumProvider from '@metamask/detect-provider';
import { FaCog, FaHistory } from 'react-icons/fa';
import { toast } from 'react-toastify'; // Pastikan ToastContainer sudah diatur di App.js atau root komponen

// Import ABI dari file JSON
import AINIMEDexFactoryABI from '../abi_json/AINIMEDexFactory.json';
import AINIMEDexPairABI from '../abi_json/AINIMEDexPair.json';
import AINIMEDexRouterABI from '../abi_json/AINIMEDexRouter.json';

// Import konstanta dari file terpisah
import { TOKEN_INFO, PREDEFINED_PAIRS, FACTORY_ADDRESS, ROUTER_ADDRESS } from '../constants/tokens';

import './Pools.css'; // Pastikan file CSS ini ada

function Pools({ walletData }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [myPools, setMyPools] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pools');
  const [isLoading, setIsLoading] = useState(true); // State loading baru

  // Gunakan konstanta yang diimpor
  const factoryAddress = FACTORY_ADDRESS;
  const routerAddress = ROUTER_ADDRESS;
  const tokenInfo = TOKEN_INFO; // Ini seharusnya objek yang di-key oleh alamat token
  const predefinedPairs = PREDEFINED_PAIRS;

  // Gunakan ABI yang diimpor
  const factoryABI = AINIMEDexFactoryABI;
  const pairABI = AINIMEDexPairABI;
  const routerABI = AINIMEDexRouterABI;

  // Inisialisasi Provider dan Signer
  useEffect(() => {
    const initProviderAndSigner = async () => {
      try {
        const ethProvider = await detectEthereumProvider({ timeout: 5000 });
        if (ethProvider) {
          // Menggunakan BrowserProvider untuk Ethers v6
          const web3Provider = new ethers.BrowserProvider(ethProvider);
          setProvider(web3Provider);

          if (walletData && walletData.address) {
            const currentSigner = await web3Provider.getSigner(walletData.address);
            setSigner(currentSigner);
          }

          // Listen for account and chain changes
          ethProvider.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
              window.location.reload(); // Reload untuk memastikan semua state terupdate
            } else {
              setSigner(null); // No account connected
              toast.info('Dompet terputus. Harap sambungkan kembali.', { position: 'bottom-right' });
            }
          });

          ethProvider.on('chainChanged', () => {
            window.location.reload(); // Reload jika jaringan berubah
          });

        } else {
          setError('MetaMask tidak terdeteksi. Silakan instal MetaMask.');
          toast.error('MetaMask tidak terdeteksi.', { position: 'bottom-right' });
        }
      } catch (err) {
        console.error('Gagal menginisialisasi provider:', err);
        setError('Gagal menginisialisasi provider: ' + err.message);
        toast.error('Gagal menginisialisasi provider.', { position: 'bottom-right' });
      }
    };
    initProviderAndSigner();

    // Cleanup function for event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => window.location.reload());
        window.ethereum.removeListener('chainChanged', () => window.location.reload());
      }
    };
  }, [walletData]); // walletData sebagai dependency agar provider/signer terupdate jika walletData berubah

  // Fungsi untuk mendapatkan informasi token berdasarkan alamat
  // Ini penting karena predefinedPairs mungkin hanya punya simbol, tapi kita butuh alamat sebenarnya
  const getTokenInfoByAddress = useCallback((address) => {
    // Diasumsikan TOKEN_INFO adalah objek { [alamat_token]: { symbol, name, decimals, logo } }
    return tokenInfo[address];
  }, [tokenInfo]);


  // Fungsi untuk mengambil data pair dan my pools
  useEffect(() => {
    const fetchPairsAndPools = async () => {
      if (!provider) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const factory = new ethers.Contract(factoryAddress, factoryABI, provider);
        const walletAddress = walletData.address;
        const pairsList = [];
        const myPoolsList = [];

        // Menggunakan Map untuk mencari token info berdasarkan simbol dengan cepat
        const tokenInfoBySymbol = new Map();
        for (const addr in tokenInfo) {
          tokenInfoBySymbol.set(tokenInfo[addr].symbol, { ...tokenInfo[addr], address: addr });
        }

        for (const pairConfig of predefinedPairs) {
          const token0Symbol = pairConfig.tokenA;
          const token1Symbol = pairConfig.tokenB;

          const token0Info = tokenInfoBySymbol.get(token0Symbol);
          const token1Info = tokenInfoBySymbol.get(token1Symbol);

          if (!token0Info || !token1Info) {
            console.warn(`Informasi token tidak ditemukan untuk pair: ${token0Symbol}/${token1Symbol}`);
            continue;
          }

          if (pairConfig.comingSoon) {
            pairsList.push({
              token0: token0Info,
              token1: token1Info,
              address: 'Coming Soon',
              comingSoon: true,
              totalLiquidity: '0',
              status: 'Coming Soon'
            });
            continue;
          }

          let pairAddress;
          try {
            // Urutkan alamat token sebelum memanggil getPair
            const [addrA, addrB] = [token0Info.address, token1Info.address].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            pairAddress = await factory.getPair(addrA, addrB);
            // Tidak perlu sleep di sini, ethers.js sudah menangani batching/rate limiting di belakang layar
          } catch (e) {
            console.error(`Gagal mendapatkan alamat pair untuk ${token0Symbol}/${token1Symbol}:`, e);
            // Tetap tambahkan ke daftar dengan status 'Not Created'
            pairsList.push({
              token0: token0Info,
              token1: token1Info,
              address: 'Not Created',
              comingSoon: false,
              totalLiquidity: '0',
              status: 'Not Created'
            });
            continue; // Lanjutkan ke pair berikutnya
          }

          if (pairAddress && pairAddress !== ethers.ZeroAddress) { // Menggunakan ethers.ZeroAddress
            try {
              const pairContract = new ethers.Contract(pairAddress, pairABI, provider);
              const [reserves, token0ContractAddress, token1ContractAddress] = await Promise.all([
                pairContract.getReserves(),
                pairContract.token0(),
                pairContract.token1(),
              ]);

              // Pastikan untuk mendapatkan info token berdasarkan alamat kontrak yang sebenarnya dari pair
              const actualToken0Info = getTokenInfoByAddress(token0ContractAddress);
              const actualToken1Info = getTokenInfoByAddress(token1ContractAddress);

              if (!actualToken0Info || !actualToken1Info) {
                console.warn(`Informasi token tidak lengkap untuk pair di alamat ${pairAddress}: ${token0ContractAddress}/${token1ContractAddress}`);
                continue;
              }

              const reserve0 = ethers.formatUnits(reserves.reserve0, actualToken0Info.decimals);
              const reserve1 = ethers.formatUnits(reserves.reserve1, actualToken1Info.decimals);
              const liquidity = `${parseFloat(reserve0).toFixed(2)} ${actualToken0Info.symbol} / ${parseFloat(reserve1).toFixed(2)} ${actualToken1Info.symbol}`;

              pairsList.push({
                address: pairAddress,
                token0: actualToken0Info,
                token1: actualToken1Info,
                comingSoon: false,
                totalLiquidity: liquidity,
                status: 'Exists'
              });

              if (walletAddress) {
                const userBalance = await pairContract.balanceOf(walletAddress);
                if (userBalance > 0n) { // Menggunakan BigInt comparison untuk Ethers v6
                  myPoolsList.push({
                    address: pairAddress,
                    token0: actualToken0Info,
                    token1: actualToken1Info,
                    totalLiquidity: liquidity,
                    userLPBalance: ethers.formatUnits(userBalance, 18), // Asumsi LP token 18 desimal
                  });
                }
              }
            } catch (innerError) {
              console.error(`Gagal mengambil data untuk pair ${pairAddress}:`, innerError);
              pairsList.push({
                token0: token0Info,
                token1: token1Info,
                address: pairAddress,
                comingSoon: false,
                totalLiquidity: 'Error',
                status: 'Data Error'
              });
            }
          } else {
            pairsList.push({
              token0: token0Info,
              token1: token1Info,
              address: 'Not Created',
              comingSoon: false,
              totalLiquidity: '0',
              status: 'Not Created'
            });
          }
        }

        setPairs(pairsList);
        setMyPools(myPoolsList);
      } catch (err) {
        console.error('Gagal mengambil daftar pool secara keseluruhan:', err);
        setError('Gagal mengambil daftar pool: ' + err.message);
        toast.error('Gagal mengambil daftar pool.', { position: 'bottom-right' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPairsAndPools();
  }, [provider, signer, walletData, factoryAddress, factoryABI, pairABI, predefinedPairs, getTokenInfoByAddress]);

  const handleWithdraw = async (pair) => {
    if (!signer || !walletData.address) {
      toast.error('Silakan hubungkan wallet Anda terlebih dahulu.', { position: 'bottom-right' });
      return;
    }
    try {
      const pairContract = new ethers.Contract(pair.address, pairABI, signer);
      const userLPBalance = await pairContract.balanceOf(walletData.address);

      if (userLPBalance === 0n) { // Menggunakan BigInt comparison
        toast.info('Anda tidak memiliki LP token di pool ini.', { position: 'bottom-right' });
        return;
      }

      const routerContract = new ethers.Contract(routerAddress, routerABI, signer);

      toast.info('Meminta persetujuan untuk LP token...', { position: 'bottom-right' });
      const approveTx = await pairContract.approve(routerAddress, userLPBalance);
      await approveTx.wait();
      toast.success('Persetujuan LP token berhasil!', { position: 'bottom-right' });

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 menit dari sekarang

      toast.info('Mengirim transaksi withdraw...', { position: 'bottom-right' });
      const tx = await routerContract.removeLiquidity(
        pair.token0.address,
        pair.token1.address,
        userLPBalance,
        0, // amountAMin, set 0 untuk membiarkan router menghitung minimum
        0, // amountBMin, set 0 untuk membiarkan router menghitung minimum
        walletData.address,
        deadline
      );
      toast.info('Transaksi withdraw sedang diproses...', { position: 'bottom-right' });
      await tx.wait();
      toast.success('Withdraw berhasil!', { position: 'bottom-right' });
      // Setelah withdraw, perbarui data pool
      // Anda bisa memanggil fetchPairsAndPools() lagi atau menghapus dari myPoolsList secara lokal
      // Untuk kesederhanaan, kita akan refresh halaman atau memanggil ulang fetch.
      window.location.reload();
    } catch (err) {
      console.error('Gagal withdraw:', err);
      if (err.code === 4001) {
        toast.error('Transaksi dibatalkan oleh pengguna.', { position: 'bottom-right' });
      } else {
        toast.error('Gagal withdraw: ' + err.reason || err.message, { position: 'bottom-right' });
      }
    }
  };

  if (error) {
    return (
      <div className="pools-card error-card">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="swap-button" onClick={() => setError(null)}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="pools-card">
      <div className="swap-header">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'pools' ? 'active' : ''}`}
            onClick={() => setActiveTab('pools')}
          >
            Pools
          </button>
          <button
            className={`tab-button ${activeTab === 'my-pools' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-pools')}
          >
            My Pools
          </button>
        </div>
        <div className="network-indicator">
          <span>{walletData.chainId === '0x40d9' ? 'OG Testnet' : 'Wrong Network'}</span>
          <div className="pulse"></div>
          <button className="settings-btn">
            <FaCog />
          </button>
          <button className="history-btn">
            <FaHistory />
          </button>
        </div>
      </div>
      <div className="pools-container">
        <h3>Liquidity Pools</h3>
        {isLoading ? (
          <p className="loading-message">Memuat data pool...</p>
        ) : (
          <div className="pools-grid">
            {activeTab === 'pools' &&
              pairs.map((pair, index) => (
                <div key={index} className="pool-item">
                  <div className="pool-info">
                    <img src={pair.token0.logo} alt={pair.token0.symbol} className="token-logo" />
                    <img src={pair.token1.logo} alt={pair.token1.symbol} className="token-logo" />
                    <span className="pair-name">{`${pair.token0.symbol}/${pair.token1.symbol}`}</span>
                  </div>
                  <div className="pool-details">
                    <span className="total-liquidity">Total Liquidity: {pair.totalLiquidity}</span>
                  </div>
                  <div className="pool-action">
                    {pair.status === 'Coming Soon' ? (
                      <span className="coming-soon">Segera Hadir</span>
                    ) : pair.status === 'Not Created' ? (
                      <Link to={`/deposit/${pair.token0.symbol}-${pair.token1.symbol}`} className="deposit-button">
                        Buat/Tambah Likuiditas
                      </Link>
                    ) : pair.status === 'Data Error' ? (
                      <span className="error-message">Error Memuat Data</span>
                    ) : (
                      <Link to={`/deposit/${pair.token0.symbol}-${pair.token1.symbol}`} className="deposit-button">
                        Tambah Likuiditas
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            {activeTab === 'my-pools' &&
              (myPools.length > 0 ? (
                myPools.map((pair, index) => (
                  <div key={index} className="pool-item">
                    <div className="pool-info">
                      <img src={pair.token0.logo} alt={pair.token0.symbol} className="token-logo" />
                      <img src={pair.token1.logo} alt={pair.token1.symbol} className="token-logo" />
                      <span className="pair-name">{`${pair.token0.symbol}/${pair.token1.symbol}`}</span>
                    </div>
                    <div className="pool-details">
                      <span className="total-liquidity">LP Anda: {parseFloat(pair.userLPBalance).toFixed(6)}</span>
                    </div>
                    <div className="pool-action">
                      <button className="withdraw-button" onClick={() => handleWithdraw(pair)}>
                        Tarik Likuiditas
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-pools-message">Anda belum memiliki liquidity pool.</p>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Pools;