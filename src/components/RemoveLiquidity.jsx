import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import detectEthereumProvider from '@metamask/detect-provider';
import AINIMEDexRouterABI from '../abi_json/AINIMEDex_Router.json';
import AINIMEDexPairABI from '../abi_json/AINIMEDex_Pair.json';
import ERC20ABI from '../abi_json/ERC20.json';
import styles from '../style/AddLiquidity.module.css';
import { showNotification, retryWithBackoff } from '../utils/helpers';

function RemoveLiquidity({ walletData, pairData }) {
  const [amountLP, setAmountLP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [lpBalance, setLPBalance] = useState('0');
  const navigate = useNavigate();
  const cacheRef = useRef({ balances: {} });

  const routerContractAddress = '0x677d3823c98E47776eB46BFc0A4C6dF5758BBeC5';

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
    if (!pairData || !pairData.pairAddress || pairData.pairAddress === 'Not Created') {
      showNotification('Data pair tidak ditemukan atau pair belum dibuat.', 'error');
      navigate('/liquidity');
    }
  }, [pairData, navigate]);

  useEffect(() => {
    const fetchLPBalance = async () => {
      if (!provider || !signer || !walletData.address || !pairData?.pairAddress) return;
      try {
        const cacheKey = `${pairData.pairAddress}:${walletData.address}`;
        if (cacheRef.current.balances[cacheKey]) {
          setLPBalance(cacheRef.current.balances[cacheKey]);
          return;
        }

        const pairContract = new ethers.Contract(pairData.pairAddress, AINIMEDexPairABI, provider);
        const balance = await retryWithBackoff(() => pairContract.getLPBalance(walletData.address));
        const formattedBalance = ethers.utils.formatUnits(balance, 18);
        cacheRef.current.balances[cacheKey] = formattedBalance;
        setLPBalance(formattedBalance);
      } catch (error) {
        console.error('Gagal mengambil saldo LP:', error);
        showNotification('Gagal mengambil saldo LP.', 'error');
      }
    };
    fetchLPBalance();
  }, [provider, signer, walletData.address, pairData?.pairAddress]);

  const handleAmountLPChange = (e) => {
    const value = e.target.value;
    if (value === '' || (parseFloat(value) >= 0 && !isNaN(value))) {
      setAmountLP(value);
    }
  };

  const handleAmountSelect = (percentage) => {
    const balance = parseFloat(lpBalance);
    if (isNaN(balance) || balance <= 0) {
      showNotification('Saldo LP tidak tersedia.', 'error');
      return;
    }
    const newAmount = (balance * percentage).toFixed(6);
    setAmountLP(newAmount);
  };

  const approveLP = async (amount) => {
    if (!signer) {
      showNotification('Signer tidak tersedia. Silakan hubungkan wallet.', 'error');
      return false;
    }
    try {
      const pairContract = new ethers.Contract(pairData.pairAddress, AINIMEDexPairABI, signer);
      const amountWei = ethers.utils.parseUnits(amount, 18);
      const allowance = await retryWithBackoff(() =>
        pairContract.allowance(walletData.address, routerContractAddress)
      );
      if (allowance.gte(amountWei)) {
        showNotification(`LP Token ${pairData.pairAddress.slice(0, 6)}... sudah disetujui.`, 'info');
        return true;
      }
      const tx = await retryWithBackoff(() =>
        pairContract.approve(routerContractAddress, amountWei, { gasLimit: 100000 })
      );
      await tx.wait();
      showNotification(`LP Token ${pairData.pairAddress.slice(0, 6)}... disetujui.`, 'success');
      return true;
    } catch (error) {
      console.error('Gagal menyetujui LP token:', error);
      showNotification(`Gagal menyetujui LP token: ${error.reason || error.message}`, 'error');
      return false;
    }
  };

  const handleRemove = async () => {
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
    if (!amountLP || parseFloat(amountLP) <= 0) {
      showNotification('Masukkan jumlah LP yang valid.', 'error');
      return;
    }
    if (parseFloat(amountLP) > parseFloat(lpBalance)) {
      showNotification('Saldo LP tidak cukup.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const approved = await approveLP(amountLP);
      if (!approved) {
        setIsLoading(false);
        return;
      }

      const routerContract = new ethers.Contract(routerContractAddress, AINIMEDexRouterABI, signer);
      const amountLPWei = ethers.utils.parseUnits(amountLP, 18);

      const tx = await retryWithBackoff(() =>
        routerContract.removeLiquidity(
          pairData.token0.address,
          pairData.token1.address,
          amountLPWei,
          0,
          0,
          walletData.address,
          { gasLimit: 500000 }
        )
      );

      await tx.wait();
      showNotification('Likuiditas berhasil ditarik.', 'success');
      navigate('/liquidity');
    } catch (error) {
      console.error('Gagal menarik likuiditas:', error);
      showNotification(`Gagal menarik likuiditas: ${error.reason || error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <header className={styles['card-header']}>
        <h2>Remove Liquidity</h2>
      </header>
      {pairData && pairData.pairAddress !== 'Not Created' && (
        <div className={styles['card-body']}>
          <div className={styles['input-group']}>
            <div className={styles['input-header']}>
              <div className={styles['token-info']}>
                <img src={pairData.token0.logo} alt={pairData.token0.symbol} className={styles['token-logo']} />
                <img src={pairData.token1.logo} alt={pairData.token1.symbol} className={styles['token-logo']} />
                <span className={styles['token-name']}>{pairData.pairName}</span>
              </div>
            </div>
            <input
              type="number"
              value={amountLP}
              onChange={handleAmountLPChange}
              placeholder="0.0"
              disabled={isLoading}
              className={styles['token-input']}
              min="0"
              step="any"
            />
            <div className={styles['input-footer']}>
              <div className={styles['percent-buttons']}>
                <button onClick={() => handleAmountSelect(0.25)}>25%</button>
                <button onClick={() => handleAmountSelect(0.5)}>50%</button>
                <button onClick={() => handleAmountSelect(0.75)}>75%</button>
                <button onClick={() => handleAmountSelect(1)}>MAX</button>
              </div>
              <span className={styles.balance}>Balance: {parseFloat(lpBalance).toFixed(6)}</span>
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
          </div>
          <button
            className={styles['action-button']}
            onClick={handleRemove}
            disabled={isLoading || !walletData.address || walletData.chainId.toLowerCase() !== '0x40d9'}
          >
            {isLoading ? <FaSpinner className={styles.spinner} /> : 'Remove Liquidity'}
          </button>
        </div>
      )}
    </div>
  );
}

export default RemoveLiquidity;