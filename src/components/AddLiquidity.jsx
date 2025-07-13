import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import detectEthereumProvider from '@metamask/detect-provider';
import AINIMEDexRouterABI from '../abi_json/AINIMEDex_Router.json';
import AINIMEDexPairABI from '../abi_json/AINIMEDex_Pair.json';
import ERC20ABI from '../abi_json/ERC20.json';
import styles from '../style/AddLiquidity.module.css';
import { showNotification, retryWithBackoff, debounce } from '../utils/helpers';
import { tokens } from '../utils/tokens'; // Impor tokens dari file terpusat

function AddLiquidity({ walletData, pairData }) {
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isNewPair, setIsNewPair] = useState(true);
  const [token0Balance, setToken0Balance] = useState('0');
  const [token1Balance, setToken1Balance] = useState('0');
  const navigate = useNavigate();
  const cacheRef = useRef({ balances: {}, reserves: {} });

  const routerContractAddress = '0x677d3823c98E47776eB46BFc0A4C6dF5758BBeC5';
  const factoryContractAddress = '0xc8EE2ae053970546bE8A59767864ce4e79133176';

  useEffect(() => {
    const initProvider = async () => {
      try {
        const ethProvider = await detectEthereumProvider({ timeout: 5000 });
        let web3Provider;
        if (ethProvider) {
          web3Provider = new ethers.providers.Web3Provider(ethProvider, 'any');
          await ethProvider.request({ method: 'eth_requestAccounts' });
          setProvider(web3Provider);
          setSigner(web3Provider.getSigner());
        } else {
          showNotification('MetaMask tidak terdeteksi. Menggunakan provider default.', 'warning');
          web3Provider = new ethers.providers.JsonRpcProvider('https://evmrpc-testnet.0g.ai/', {
            chainId: parseInt('0x40d9', 16),
            name: 'OG Galileo Testnet',
            ensAddress: null,
          });
          setProvider(web3Provider);
        }
      } catch (error) {
        console.error('Gagal menginisialisasi provider:', error);
        showNotification('Gagal menginisialisasi provider.', 'error');
      }
    };
    initProvider();
  }, []);

  useEffect(() => {
    if (
      !pairData ||
      !pairData.pairAddress ||
      !pairData.token0 ||
      !pairData.token1 ||
      !pairData.pairName
    ) {
      console.error('Data pair tidak lengkap:', pairData);
      showNotification('Data pair tidak ditemukan atau tidak lengkap.', 'error');
      navigate('/liquidity');
    } else {
      console.log('Pair data diterima:', pairData);
      setIsNewPair(!pairData.pairAddress || pairData.status === 'Not Created');
    }
  }, [pairData, navigate]);

  useEffect(() => {
    cacheRef.current = { balances: {}, reserves: {} };

    const fetchBalances = async () => {
      if (!provider || !signer || !walletData.address || !pairData) return;
      try {
        const address = walletData.address;
        const cacheKey0 = `${pairData.token0.address}:${address}`;
        const cacheKey1 = `${pairData.token1.address}:${address}`;

        if (cacheRef.current.balances[cacheKey0] && cacheRef.current.balances[cacheKey1]) {
          setToken0Balance(cacheRef.current.balances[cacheKey0]);
          setToken1Balance(cacheRef.current.balances[cacheKey1]);
          return;
        }

        const token0Contract = new ethers.Contract(pairData.token0.address, ERC20ABI, provider);
        const token1Contract = new ethers.Contract(pairData.token1.address, ERC20ABI, provider);

        const [balance0, balance1] = await Promise.all([
          retryWithBackoff(() => token0Contract.balanceOf(address)),
          retryWithBackoff(() => token1Contract.balanceOf(address)),
        ]);

        const formattedBalance0 = ethers.utils.formatUnits(balance0, pairData.token0.decimals);
        const formattedBalance1 = ethers.utils.formatUnits(balance1, pairData.token1.decimals);

        cacheRef.current.balances[cacheKey0] = formattedBalance0;
        cacheRef.current.balances[cacheKey1] = formattedBalance1;

        setToken0Balance(formattedBalance0);
        setToken1Balance(formattedBalance1);
        console.log('Saldo token:', { token0: formattedBalance0, token1: formattedBalance1 });
      } catch (error) {
        console.error('Gagal mengambil saldo:', error);
        showNotification('Gagal mengambil saldo token.', 'error');
      }
    };

    const verifyPair = async () => {
      if (!provider || !pairData) return;
      try {
        if (!ethers.utils.isAddress(pairData.token0.address) || !ethers.utils.isAddress(pairData.token1.address)) {
          throw new Error('Alamat token tidak valid');
        }

        const factoryContract = new ethers.Contract(
          factoryContractAddress,
          ['function getPair(address tokenA, address tokenB) external view returns (address pair)'],
          provider
        );
        const pairAddress = await retryWithBackoff(() =>
          factoryContract.getPair(pairData.token0.address, pairData.token1.address)
        );

        if (pairAddress === ethers.constants.AddressZero) {
          setIsNewPair(true);
        } else {
          setIsNewPair(false);
        }
        console.log('Status pair:', { pairAddress, isNewPair: pairAddress === ethers.constants.AddressZero });
      } catch (error) {
        console.error('Gagal memverifikasi pair:', error);
        showNotification(`Gagal memverifikasi status pair: ${error.message}`, 'error');
      }
    };

    fetchBalances();
    verifyPair();
  }, [provider, signer, walletData.address, pairData?.token0?.address, pairData?.token1?.address]);

  const calculatePairAmount = useCallback(
    debounce(async (amount, isToken0Input, token0Address, token1Address) => {
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        if (isToken0Input) setAmount1('');
        else setAmount0('');
        return;
      }

      if (isNewPair) {
        if (isToken0Input) setAmount1('');
        else setAmount0('');
        return;
      }

      const routerContract = new ethers.Contract(routerContractAddress, AINIMEDexRouterABI, provider);
      try {
        const [price] = await retryWithBackoff(() =>
          routerContract.getTokenPrice(token0Address, token1Address, true)
        );
        const priceFormatted = parseFloat(ethers.utils.formatUnits(price, 18));
        if (isNaN(priceFormatted) || priceFormatted <= 0) {
          throw new Error('Harga token tidak valid');
        }

        const amountIn = parseFloat(amount);
        let amountOut = isToken0Input ? amountIn * priceFormatted : amountIn / priceFormatted;

        if (isToken0Input) {
          setAmount1(amountOut.toFixed(6));
        } else {
          setAmount0(amountOut.toFixed(6));
        }
        console.log('Hasil perhitungan jumlah pasangan:', { amountIn, amountOut, isToken0Input });
      } catch (error) {
        console.error('Gagal menghitung jumlah pasangan:', error);
        showNotification('Gagal menghitung jumlah pasangan. Masukkan jumlah kedua token secara manual.', 'warning');
        if (isToken0Input) setAmount1('');
        else setAmount0('');
      }
    }, 500),
    [provider, isNewPair]
  );

  const handleAmount0Change = (e) => {
    const value = e.target.value;
    if (value === '' || (parseFloat(value) >= 0 && !isNaN(value))) {
      setAmount0(value);
      if (pairData && !isNewPair) {
        calculatePairAmount(value, true, pairData.token0.address, pairData.token1.address);
      }
    }
  };

  const handleAmount1Change = (e) => {
    const value = e.target.value;
    if (value === '' || (parseFloat(value) >= 0 && !isNaN(value))) {
      setAmount1(value);
      if (pairData && !isNewPair) {
        calculatePairAmount(value, false, pairData.token0.address, pairData.token1.address);
      }
    }
  };

  const handleAmountSelect = (percentage, isToken0) => {
    const balance = isToken0 ? parseFloat(token0Balance) : parseFloat(token1Balance);
    if (isNaN(balance) || balance <= 0) {
      showNotification('Saldo tidak tersedia.', 'error');
      return;
    }
    const newAmount = (balance * percentage).toFixed(6);
    if (isToken0) {
      setAmount0(newAmount);
      if (pairData && !isNewPair) {
        calculatePairAmount(newAmount, true, pairData.token0.address, pairData.token1.address);
      }
    } else {
      setAmount1(newAmount);
      if (pairData && !isNewPair) {
        calculatePairAmount(newAmount, false, pairData.token0.address, pairData.token1.address);
      }
    }
  };

  const approveToken = async (tokenAddress, amount, decimals) => {
    if (!signer) {
      showNotification('Signer tidak tersedia. Silakan hubungkan wallet.', 'error');
      return false;
    }
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const amountWei = ethers.utils.parseUnits(amount, decimals);
      const allowance = await retryWithBackoff(() =>
        tokenContract.allowance(walletData.address, routerContractAddress)
      );
      if (allowance.gte(amountWei)) {
        showNotification(`Token ${tokenAddress.slice(0, 6)}... sudah disetujui.`, 'info');
        return true;
      }
      const tx = await retryWithBackoff(() =>
        tokenContract.approve(routerContractAddress, amountWei, { gasLimit: 100000 })
      );
      await tx.wait();
      showNotification(`Token ${tokenAddress.slice(0, 6)}... disetujui.`, 'success');
      return true;
    } catch (error) {
      console.error('Gagal menyetujui token:', error);
      showNotification(`Gagal menyetujui token: ${error.reason || error.message}`, 'error');
      return false;
    }
  };

  const handleDeposit = async () => {
    if (
      !provider ||
      !signer ||
      !pairData ||
      !walletData.address ||
      walletData.chainId.toLowerCase() !== '0x40d9'
    ) {
      showNotification('Silakan hubungkan wallet ke 0G Galileo Testnet.', 'error');
      return;
    }
    if (!amount0 || !amount1 || parseFloat(amount0) <= 0 || parseFloat(amount1) <= 0) {
      showNotification('Masukkan jumlah yang valid.', 'error');
      return;
    }
    if (parseFloat(amount0) > parseFloat(token0Balance) || parseFloat(amount1) > parseFloat(token1Balance)) {
      showNotification('Saldo tidak cukup.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const routerContract = new ethers.Contract(routerContractAddress, AINIMEDexRouterABI, signer);
      const token0IsLower = pairData.token0.address.toLowerCase() < pairData.token1.address.toLowerCase();
      const tokenA = token0IsLower ? pairData.token0 : pairData.token1;
      const tokenB = token0IsLower ? pairData.token1 : pairData.token0;
      const amountA = token0IsLower ? amount0 : amount1;
      const amountB = token0IsLower ? amount1 : amount0;
      const amountAWei = ethers.utils.parseUnits(amountA, tokenA.decimals);
      const amountBWei = ethers.utils.parseUnits(amountB, tokenB.decimals);

      const approvedA = await approveToken(tokenA.address, amountA, tokenA.decimals);
      if (!approvedA) {
        setIsLoading(false);
        return;
      }
      const approvedB = await approveToken(tokenB.address, amountB, tokenB.decimals);
      if (!approvedB) {
        setIsLoading(false);
        return;
      }

      const tx = await retryWithBackoff(() =>
        routerContract.addLiquidity(
          tokenA.address,
          tokenB.address,
          amountAWei,
          amountBWei,
          walletData.address,
          { gasLimit: 500000 }
        )
      );

      await tx.wait();
      showNotification('Likuiditas berhasil ditambahkan.', 'success');
      navigate('/liquidity');
    } catch (error) {
      console.error('Gagal menambahkan likuiditas:', error);
      showNotification(`Gagal menambahkan likuiditas: ${error.reason || error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <header className={styles['card-header']}>
        <h2>Add Liquidity</h2>
      </header>
      {pairData && (
        <div className={styles['card-body']}>
          <div className={styles['input-group']}>
            <div className={styles['input-header']}>
              <div className={styles['token-info']}>
                <img src={pairData.token0.logo} alt={pairData.token0.symbol} className={styles['token-logo']} />
                <span className={styles['token-name']}>{pairData.token0.name} ({pairData.token0.symbol})</span>
              </div>
            </div>
            <input
              type="number"
              value={amount0}
              onChange={handleAmount0Change}
              placeholder="0.0"
              disabled={isLoading}
              className={styles['token-input']}
              min="0"
              step="any"
            />
            <div className={styles['input-footer']}>
              <div className={styles['percent-buttons']}>
                <button onClick={() => handleAmountSelect(0.25, true)}>25%</button>
                <button onClick={() => handleAmountSelect(0.5, true)}>50%</button>
                <button onClick={() => handleAmountSelect(0.75, true)}>75%</button>
                <button onClick={() => handleAmountSelect(1, true)}>MAX</button>
              </div>
              <span className={styles.balance}>Balance: {parseFloat(token0Balance).toFixed(6)}</span>
            </div>
          </div>
          <div className={styles['divider-icon']}>+</div>
          <div className={styles['input-group']}>
            <div className={styles['input-header']}>
              <div className={styles['token-info']}>
                <img src={pairData.token1.logo} alt={pairData.token1.symbol} className={styles['token-logo']} />
                <span className={styles['token-name']}>{pairData.token1.name} ({pairData.token1.symbol})</span>
              </div>
            </div>
            <input
              type="number"
              value={amount1}
              onChange={handleAmount1Change}
              placeholder="0.0"
              disabled={isLoading}
              className={styles['token-input']}
              min="0"
              step="any"
            />
            <div className={styles['input-footer']}>
              <div className={styles['percent-buttons']}>
                <button onClick={() => handleAmountSelect(0.25, false)}>25%</button>
                <button onClick={() => handleAmountSelect(0.5, false)}>50%</button>
                <button onClick={() => handleAmountSelect(0.75, false)}>75%</button>
                <button onClick={() => handleAmountSelect(1, false)}>MAX</button>
              </div>
              <span className={styles.balance}>Balance: {parseFloat(token1Balance).toFixed(6)}</span>
            </div>
          </div>
          <div className={styles['info-panel']}>
            <div className={styles['info-item']}>
              <span className={styles['info-label']}>Pair</span>
              <span className={styles['info-value']}>{pairData.pairName}</span>
            </div>
            <div className={styles['info-item']}>
              <span className={styles['info-label']}>Total Liquidity</span>
              <span className={styles['info-value']}>
                {parseFloat(pairData.reserve0 || 0).toFixed(2)} {pairData.token0.symbol} /{' '}
                {parseFloat(pairData.reserve1 || 0).toFixed(2)} {pairData.token1.symbol}
              </span>
            </div>
            {pairData.status === 'Not Created' && (
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Status</span>
                <span className={`${styles['info-value']} ${styles['status-new']}`}>New Pair</span>
              </div>
            )}
          </div>
          <button
            className={styles['action-button']}
            onClick={handleDeposit}
            disabled={isLoading || !walletData.address || walletData.chainId.toLowerCase() !== '0x40d9'}
          >
            {isLoading ? <FaSpinner className={styles.spinner} /> : 'Add Liquidity'}
          </button>
        </div>
      )}
    </div>
  );
}

export default AddLiquidity;
