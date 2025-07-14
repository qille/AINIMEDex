import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { FaArrowDown, FaCog, FaHistory, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import AINIMEDexRouterABI from '../abi_json/AINIMEDex_Router.json';
import flippySound from '../assets/sounds/flippy.mp3';
import TokenListModal from './TokenListModal';
import SettingsModal from './SettingsModal';
import usdtLogo from '../assets/evm-tokens/usdt-logo.png';
import ogLogo from '../assets/evm-tokens/og-logo.png';
import aineLogo from '../assets/evm-tokens/aine-logo.gif';
import ogaineLogo from '../assets/evm-tokens/ogaine-logo.png';
import btcLogo from '../assets/evm-tokens/btc-logo.png';
import ethLogo from '../assets/evm-tokens/eth-logo.png';
import styles from '../style/Swapform.module.css';

function SwapForm({ setShowFaucetModal, walletData }) {
  const [tokenInAddress, setTokenInAddress] = useState('0xAACDf6B66B1b451B43FDA6270548783F642833C5');
  const [tokenOutAddress, setTokenOutAddress] = useState('0x1a0326c89c000C18794dD012D5055d9D16900f77');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('0');
  const [balanceIn, setBalanceIn] = useState('0');
  const [balanceOut, setBalanceOut] = useState('0');
  const [showTokenInList, setShowTokenInList] = useState(false);
  const [showTokenOutList, setShowTokenOutList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gasPrice, setGasPrice] = useState('0.1');
  const [slippage, setSlippage] = useState('0.5');
  const [deadline, setDeadline] = useState(20);
  const [expertMode, setExpertMode] = useState(false);
  const [flippySounds, setFlippySounds] = useState(false);
  const [interfaceSettings, setInterfaceSettings] = useState(true);
  const [searchAddress, setSearchAddress] = useState('');
  const [error, setError] = useState(null);
  const [pairPrice, setPairPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const flippyAudio = useRef(null);
  const routerAddress = '0x677d3823c98E47776eB46BFc0A4C6dF5758BBeC5';

  useEffect(() => {
    flippyAudio.current = new Audio(flippySound);
    return () => {
      if (flippyAudio.current) {
        flippyAudio.current.pause();
        flippyAudio.current = null;
      }
    };
  }, []);

  const playFlippySound = () => {
    if (flippySounds && flippyAudio.current) {
      flippyAudio.current.play().catch(e => console.error("Error playing flippy sound:", e));
    }
  };

  const tokenPrices = {
    '0x0000000000000000000000000000000000000000': 10,
    '0xAACDf6B66B1b451B43FDA6270548783F642833C5': 1,
    '0x1a0326c89c000C18794dD012D5055d9D16900f77': 100,
    '0xd2476F4d3D5479982Df08382A4063018A9b7483c': 10,
    '0xA5e937cbEC05EB8F71Ae8388845976A16046667b': 108000,
    '0x832b82d71296577E7b5272ef2884F2E5EAE66065': 2610,
  };

  const defaultTokens = [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'OG', name: 'OG GALILEO', logo: ogLogo, verified: true },
    { address: '0xAACDf6B66B1b451B43FDA6270548783F642833C5', symbol: 'USDTainime', name: 'USDT AINIME', logo: usdtLogo, verified: true },
    { address: '0x1a0326c89c000C18794dD012D5055d9D16900f77', symbol: 'AINIME', name: 'AINIME', logo: aineLogo, verified: true },
    { address: '0xd2476F4d3D5479982Df08382A4063018A9b7483c', symbol: 'OGainime', name: 'OG AINIME', logo: ogaineLogo, verified: true },
    { address: '0xA5e937cbEC05EB8F71Ae8388845976A16046667b', symbol: 'BTCainime', name: 'BITCOIN AINIME', logo: btcLogo, verified: true },
    { address: '0x832b82d71296577E7b5272ef2884F2E5EAE66065', symbol: 'ETHainime', name: 'ETHEREUM AINIME', logo: ethLogo, verified: true },
  ];

  const [tokens, setTokens] = useState(defaultTokens);

  const fetchBalance = async () => {
    if (!walletData.address || walletData.chainId.toLowerCase() !== '0x40d9') {
      setBalanceIn('0');
      setBalanceOut('0');
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      if (tokenInAddress === '0x0000000000000000000000000000000000000000') {
        const balanceHex = await provider.getBalance(walletData.address);
        setBalanceIn(parseFloat(ethers.utils.formatUnits(balanceHex, 18)).toFixed(4));
      } else {
        const contractIn = new ethers.Contract(
          tokenInAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const balanceWeiIn = await contractIn.balanceOf(walletData.address);
        setBalanceIn(parseFloat(ethers.utils.formatUnits(balanceWeiIn, 18)).toFixed(4));
      }
      if (tokenOutAddress === '0x0000000000000000000000000000000000000000') {
        const balanceHex = await provider.getBalance(walletData.address);
        setBalanceOut(parseFloat(ethers.utils.formatUnits(balanceHex, 18)).toFixed(4));
      } else {
        const contractOut = new ethers.Contract(
          tokenOutAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const balanceWeiOut = await contractOut.balanceOf(walletData.address);
        setBalanceOut(parseFloat(ethers.utils.formatUnits(balanceWeiOut, 18)).toFixed(4));
      }
    } catch (error) {
      setError('Failed to fetch balance: ' + error.message);
      toast.error('Cannot fetch balance.', { position: 'bottom-left' });
      setBalanceIn('0');
      setBalanceOut('0');
    }
  };

  const debouncedFetchBalance = debounce(fetchBalance, 500);

  useEffect(() => {
    debouncedFetchBalance();
    return () => debouncedFetchBalance.cancel();
  }, [walletData.address, walletData.chainId, tokenInAddress, tokenOutAddress]);

  const calculateOutput = async () => {
    if (!tokenInAddress || !tokenOutAddress || !amountIn || isNaN(amountIn) || parseFloat(amountIn) <= 0 || !walletData.address || walletData.chainId.toLowerCase() !== '0x40d9') {
      setAmountOut('0');
      setPairPrice('');
      return;
    }
    if (tokenInAddress === '0x0000000000000000000000000000000000000000' || tokenOutAddress === '0x0000000000000000000000000000000000000000') {
      setAmountOut('0');
      setPairPrice('');
      toast.info('Swapping with OG is coming soon.', { position: 'bottom-left' });
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const routerContract = new ethers.Contract(
        routerAddress,
        AINIMEDexRouterABI,
        provider
      );
      
      const amountInWei = ethers.utils.parseUnits(amountIn || '0', 18);
      const [price, reserveA, reserveB] = await routerContract.getTokenPrice(tokenInAddress, tokenOutAddress, true);

      if (reserveA.eq(0) || reserveB.eq(0)) {
        setAmountOut('0');
        setPairPrice('');
        toast.error('No liquidity for this pair.', { position: 'bottom-left' });
        return;
      }
      
      // Menggunakan formula dari kontrak pintar untuk perhitungan yang akurat
      const amountInWithFee = amountInWei.mul(997);
      const numerator = amountInWithFee.mul(reserveB);
      const denominator = reserveA.mul(1000).add(amountInWithFee);
      const amountOutWei = numerator.div(denominator);

      // Mengaplikasikan slippage di frontend untuk visualisasi yang akurat
      const slippageFactor = 1 - parseFloat(slippage) / 100;
      const amountOutAfterSlippage = amountOutWei.mul(ethers.utils.parseUnits(slippageFactor.toString(), 18)).div(ethers.utils.parseUnits('1', 18));
      
      const amountOutFormatted = parseFloat(ethers.utils.formatUnits(amountOutAfterSlippage, 18)).toFixed(4);
      setAmountOut(amountOutFormatted);

      // Menghitung harga per unit untuk tampilan
      const priceFormatted = parseFloat(ethers.utils.formatUnits(price, 18)).toFixed(4);
      const tokenInSymbol = tokens.find(t => t.address === tokenInAddress)?.symbol || 'Token';
      const tokenOutSymbol = tokens.find(t => t.address === tokenOutAddress)?.symbol || 'Token';
      setPairPrice(`1 ${tokenInSymbol} ≈ ${priceFormatted} ${tokenOutSymbol}`);
    } catch (error) {
      setAmountOut('0');
      setPairPrice('');
      setError('Failed to calculate output: ' + error.message);
      toast.error('Cannot calculate output.', { position: 'bottom-left' });
    }
  };

  const debouncedCalculateOutput = debounce(calculateOutput, 500);

  useEffect(() => {
    debouncedCalculateOutput();
    return () => debouncedCalculateOutput.cancel();
  }, [amountIn, tokenInAddress, tokenOutAddress, walletData.address, walletData.chainId, slippage, tokens]);

  const handleSwapTokens = () => {
    const tempToken = tokenInAddress;
    setTokenInAddress(tokenOutAddress);
    setTokenOutAddress(tempToken);
    setAmountIn('');
    setAmountOut('0');
    setPairPrice('');
    playFlippySound();
  };

  const handleTokenInSelect = (address) => {
    if (address === tokenOutAddress) {
      setTokenOutAddress(tokenInAddress);
      setTokenInAddress(address);
    } else {
      setTokenInAddress(address);
    }
    setShowTokenInList(false);
    playFlippySound();
  };

  const handleTokenOutSelect = (address) => {
    if (address === tokenInAddress) {
      setTokenInAddress(tokenOutAddress);
      setTokenOutAddress(address);
    } else {
      setTokenOutAddress(address);
    }
    setShowTokenOutList(false);
    playFlippySound();
  };

  const handleSwap = async () => {
    if (!walletData.address) {
      toast.error('Please connect your wallet first.', { position: 'bottom-left' });
      return;
    }
    if (walletData.chainId.toLowerCase() !== '0x40d9') {
      toast.error('Please switch to OG Galileo Testnet.', { position: 'bottom-left' });
      return;
    }
    if (!tokenInAddress || !tokenOutAddress || !amountIn) {
      toast.error('Please select tokens and enter an amount.', { position: 'bottom-left' });
      return;
    }
    if (parseFloat(amountIn) <= 0) {
      toast.error('Amount must be greater than 0.', { position: 'bottom-left' });
      return;
    }
    if (tokenInAddress === tokenOutAddress) {
      toast.error('Cannot swap the same token.', { position: 'bottom-left' });
      return;
    }
    if (tokenInAddress === '0x0000000000000000000000000000000000000000' || tokenOutAddress === '0x0000000000000000000000000000000000000000') {
      toast.info('Swapping with OG is coming soon.', { position: 'bottom-left' });
      return;
    }
    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gasPriceWei = ethers.utils.parseUnits(gasPrice, 'gwei');
      const tokenContract = new ethers.Contract(
        tokenInAddress,
        ['function approve(address spender, uint256 amount) external returns (bool)'],
        signer
      );
      const routerContract = new ethers.Contract(
        routerAddress,
        AINIMEDexRouterABI,
        signer
      );
      
      const amountInWei = ethers.utils.parseUnits(amountIn, 18);
      const amountOutMinWei = ethers.utils.parseUnits(amountOut, 18).mul(Math.floor((1 - parseFloat(slippage) / 100) * 100)).div(100);

      // Tahap 1: Lakukan approval terlebih dahulu
      const approveTx = await tokenContract.approve(routerAddress, amountInWei, { gasPrice: gasPriceWei });
      await approveTx.wait();
      toast.info('Approval successful. Initiating swap...', { position: 'bottom-left' });

      // Tahap 2: Lakukan swap
      const swapTx = await routerContract.swapExactTokensForTokens(
        amountInWei,
        amountOutMinWei,
        [tokenInAddress, tokenOutAddress],
        walletData.address,
        { gasPrice: gasPriceWei }
      );
      await swapTx.wait();

      toast.success('Swap successful!', { position: 'bottom-left' });
      playFlippySound();
      setAmountIn('');
      setAmountOut('0');
      setPairPrice('');
    } catch (error) {
      setError('Swap failed: ' + error.message);
      toast.error('Swap failed.', { position: 'bottom-left' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePercentage = (percentage) => {
    if (!walletData.address) {
      toast.error('Please connect your wallet first.', { position: 'bottom-left' });
      return;
    }
    if (walletData.chainId.toLowerCase() !== '0x40d9') {
      toast.error('Please switch to OG Galileo Testnet.', { position: 'bottom-left' });
      return;
    }
    if (balanceIn && parseFloat(balanceIn) > 0) {
      const amountToSet = (parseFloat(balanceIn) * (percentage / 100)).toFixed(6);
      setAmountIn(amountToSet);
    } else {
      toast.error('No balance available.', { position: 'bottom-left' });
    }
  };

  const handleTokenSearch = async () => {
    if (!walletData.address) {
      toast.error('Please connect your wallet first.', { position: 'bottom-left' });
      return;
    }
    if (!ethers.utils.isAddress(searchAddress)) {
      toast.error('Invalid token address.', { position: 'bottom-left' });
      return;
    }
    if (tokens.find(t => t.address.toLowerCase() === searchAddress.toLowerCase())) {
      toast.info('Token already in the list.', { position: 'bottom-left' });
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        searchAddress,
        ['function symbol() view returns (string)', 'function name() view returns (string)'],
        provider
      );
      const symbol = await contract.symbol();
      const name = await contract.name();
      const newToken = {
        address: searchAddress,
        symbol,
        name,
        logo: '',
        verified: false,
      };
      setTokens([...tokens, newToken]);
      handleTokenInSelect(searchAddress);
      toast.success(`Added ${symbol} to token list.`, { position: 'bottom-left' });
    } catch (error) {
      setError(`Failed to fetch token info: ${error.message}`);
      toast.error('Cannot fetch token info.', { position: 'bottom-left' });
    }
  };

  const selectedTokenIn = tokens.find((token) => token.address === tokenInAddress);
  const selectedTokenOut = tokens.find((token) => token.address === tokenOutAddress);

  if (error) {
    return (
      <div className={styles['error-card']}>
        <h2>Error</h2>
        <p>{error}</p>
        <button
          className={styles['swap-button']}
          onClick={() => {
            setError(null);
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles['swap-form']}>
      <div className={styles['swap-card']}>
        <div className={styles['swap-header']}>
          <div className={styles['swap-title']}>
            <h2>Swap</h2>
            <div className={styles['network-indicator']}>
              <span>{walletData.chainId.toLowerCase() === '0x40d9' ? 'OG Galileo Testnet' : 'Wrong Network'}</span>
              <div className={styles.pulse}></div>
            </div>
          </div>
          <div className={styles['header-buttons']}>
            <button className={styles['settings-btn']} onClick={() => setShowSettings(true)} aria-label="Open settings">
              <FaCog size={14} />
            </button>
            <button className={styles['history-btn']} aria-label="View history">
              <FaHistory size={14} />
            </button>
          </div>
        </div>
        <div className={styles['token-input-container']}>
          <div className={styles['token-input']}>
            <div className={styles['token-amount-wrapper']}>
              <input
                type="number"
                className={styles['token-amount']}
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                aria-label={`Enter amount for ${selectedTokenIn?.symbol || 'token'}`}
              />
              <button
                className={styles['token-selector']}
                onClick={() => setShowTokenInList(true)}
                aria-label={`Select token: ${selectedTokenIn?.symbol || 'token'}`}
              >
                <img src={selectedTokenIn?.logo || usdtLogo} alt={selectedTokenIn?.symbol || 'Token'} />
                <span className={styles['token-symbol']}>{selectedTokenIn?.symbol || 'Select'}</span>
                {selectedTokenIn?.verified && <FaCheckCircle className={styles['verified-icon']} size={10} />}
              </button>
            </div>
            <div className={styles['token-info']}>
              <div className={styles['token-balance']}>
                Balance: {parseFloat(balanceIn).toFixed(4)}
              </div>
              <div className={styles['percentage-buttons']}>
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    className={`${styles['percentage-btn']} ${amountIn === (parseFloat(balanceIn) * (p / 100)).toFixed(6) ? styles.selected : ''}`}
                    onClick={() => handlePercentage(p)}
                    aria-label={`Use ${p}% of balance`}
                  >
                    {p === 100 ? 'Max' : `${p}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={styles['swap-arrow']}>
          <button className={styles['swap-arrow-btn']} onClick={handleSwapTokens} aria-label="Swap tokens">
            <FaArrowDown size={14} />
          </button>
        </div>
        <div className={styles['token-input-container']}>
          <div className={styles['token-input']}>
            <div className={styles['token-amount-wrapper']}>
              <input
                type="number"
                className={styles['token-amount']}
                placeholder="0.0"
                value={amountOut}
                disabled
                aria-label={`Output amount for ${selectedTokenOut?.symbol || 'token'}`}
              />
              <button
                className={styles['token-selector']}
                onClick={() => setShowTokenOutList(true)}
                aria-label={`Select output token: ${selectedTokenOut?.symbol || 'token'}`}
              >
                <img src={selectedTokenOut?.logo || aineLogo} alt={selectedTokenOut?.symbol || 'Token'} />
                <span className={styles['token-symbol']}>{selectedTokenOut?.symbol || 'Select'}</span>
                {selectedTokenOut?.verified && <FaCheckCircle className={styles['verified-icon']} size={10} />}
              </button>
            </div>
            <div className={styles['token-info']}>
              <div className={styles['token-balance']}>
                Balance: {parseFloat(balanceOut).toFixed(4)}
              </div>
            </div>
          </div>
        </div>
        {pairPrice && (
          <div className={styles['pair-price']}>
            <span>{pairPrice}</span>
          </div>
        )}
        <button
          className={
            walletData.address && tokenInAddress && tokenOutAddress && amountIn
              ? `${styles['swap-button']} ${isLoading ? styles.loading : ''}`
              : styles['enter-amount-button']
          }
          onClick={handleSwap}
          disabled={!walletData.address || !tokenInAddress || !tokenOutAddress || !amountIn || isLoading}
          aria-label={walletData.address && tokenInAddress && tokenOutAddress && amountIn ? 'Perform swap' : 'Enter amount or connect wallet'}
        >
          {isLoading ? 'Processing...' : walletData.address ? (tokenInAddress && tokenOutAddress && amountIn ? 'Swap' : 'Enter amount') : 'Connect Wallet'}
        </button>
      </div>
      {showTokenInList && (
        <TokenListModal
          tokens={tokens}
          onSelect={handleTokenInSelect}
          onClose={() => setShowTokenInList(false)}
          searchAddress={searchAddress}
          setSearchAddress={setSearchAddress}
          handleTokenSearch={handleTokenSearch}
          tokenPrices={tokenPrices}
        />
      )}
      {showTokenOutList && (
        <TokenListModal
          tokens={tokens}
          onSelect={handleTokenOutSelect}
          onClose={() => setShowTokenOutList(false)}
          searchAddress={searchAddress}
          setSearchAddress={setSearchAddress}
          handleTokenSearch={handleTokenSearch}
          tokenPrices={tokenPrices}
        />
      )}
      {showSettings && (
        <SettingsModal
          gasPrice={gasPrice}
          setGasPrice={setGasPrice}
          slippage={slippage}
          setSlippage={setSlippage}
          deadline={deadline}
          setDeadline={setDeadline}
          expertMode={expertMode}
          setExpertMode={setExpertMode}
          flippySounds={flippySounds}
          setFlippySounds={setFlippySounds}
          interfaceSettings={interfaceSettings}
          setInterfaceSettings={setInterfaceSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default SwapForm;
