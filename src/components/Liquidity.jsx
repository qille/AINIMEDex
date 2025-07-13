import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { FaSpinner, FaCog, FaHistory } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AINIMEDexFactoryABI from '../abi_json/AINIMEDex_Factory.json';
import AINIMEDexPairABI from '../abi_json/AINIMEDex_Pair.json';
import ogLogo from '../assets/evm-tokens/og-logo.png';
import aineLogo from '../assets/evm-tokens/aine-logo.gif';
import usdtLogo from '../assets/evm-tokens/usdt-logo.png';
import btcLogo from '../assets/evm-tokens/btc-logo.png';
import ethLogo from '../assets/evm-tokens/eth-logo.png';
import suiLogo from '../assets/evm-tokens/sui-logo.png';
import ogaineLogo from '../assets/evm-tokens/ogaine-logo.png';
import '../style/Liquidity.css';
import { showNotification, retryWithBackoff } from '../utils/helpers';

const tokens = [
  { address: '0xAACDf6B66B1b451B43FDA6270548783F642833C5', symbol: 'USDTaine', name: 'USDT', logo: usdtLogo, decimals: 18 },
  { address: '0x0000000000000000000000000000000000000000', symbol: 'OG', name: 'Native OG', logo: ogLogo, decimals: 18 },
  { address: '0x1a0326c89c000C18794dD012D5055d9D16900f77', symbol: 'AINIME', name: 'AINIME', logo: aineLogo, decimals: 18 },
  { address: '0xd2476F4d3D5479982Df08382A4063018A9b7483c', symbol: 'OGaine', name: 'OGaine', logo: ogaineLogo, decimals: 18 },
  { address: '0xA5e937cbEC05EB8F71Ae8388845976A16046667b', symbol: 'BTCaine', name: 'BITCOIN', logo: btcLogo, decimals: 18 },
  { address: '0x832b82d71296577E7b5272ef2884F2E5EAE66065', symbol: 'ETH', name: 'ETHEREUM', logo: ethLogo, decimals: 18 },
  { address: '0x4d3c3362397A8869C3EdD4d1c36B4Ccf20339a26', symbol: 'SUI', name: 'SUI', logo: suiLogo, decimals: 18 },
];

function Liquidity({ walletData }) {
  const [pairs, setPairs] = useState([]);
  const [userPositions, setUserPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [activeTab, setActiveTab] = useState('pools');
  const navigate = useNavigate();

  const factoryContractAddress = '0xc8EE2ae053970546bE8A59767864ce4e79133176';
  const routerContractAddress = '0x677d3823c98E47776eB46BFc0A4C6dF5758BBeC5';

  // Function to generate OG pairs with Coming Soon status statically
  const generateOGPairs = () => {
    const ogPairs = [];
    const ogToken = tokens.find((t) => t.symbol === 'OG');
    tokens.forEach((token) => {
      if (token.symbol !== 'OG') {
        const pair = {
          pairAddress: 'Not Created',
          pairName: `OG/${token.symbol}`,
          lpName: 'AINE_LP_Assets',
          lpSymbol: 'AINE_LP',
          token0: ogToken,
          token1: token,
          reserve0: '0',
          reserve1: '0',
          totalSupply: '0',
          hasLiquidity: false,
          status: 'Coming Soon',
        };
        ogPairs.push(pair);
      }
    });
    return ogPairs;
  };

  // Initialize provider for 0G Galileo Testnet
  useEffect(() => {
    const initProvider = async () => {
      try {
        const staticProvider = new ethers.providers.JsonRpcProvider('https://evmrpc-testnet.0g.ai/');
        setProvider(staticProvider);
      } catch (error) {
        console.error('Failed to initialize provider:', error);
        showNotification('Cannot connect to network.', 'error');
      }
    };
    initProvider();
  }, []);

  const fetchPairs = async () => {
    if (!provider) {
      const fallbackProvider = new ethers.providers.JsonRpcProvider('https://evmrpc-testnet.0g.ai/');
      setProvider(fallbackProvider);
    }

    setIsLoading(true);
    try {
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));
      const factoryContract = new ethers.Contract(factoryContractAddress, AINIMEDexFactoryABI, provider);
      const lpPairs = await retryWithBackoff(() => factoryContract.getAllLPPairs());

      const fetchedPairs = await Promise.all(
        lpPairs.map(async (lpPair) => {
          if (!lpPair.pair || lpPair.pair === ethers.constants.AddressZero) return null;
          try {
            const pairContract = new ethers.Contract(lpPair.pair, AINIMEDexPairABI, provider);
            const lpDetails = await retryWithBackoff(() => pairContract.getLPTokenDetails());

            const token0 = tokens.find((t) => t.address.toLowerCase() === lpPair.token0.toLowerCase());
            const token1 = tokens.find((t) => t.address.toLowerCase() === lpPair.token1.toLowerCase());

            if (!token0 || !token1) return null;

            // Skip pairs involving OG as they are handled statically
            if (token0.symbol === 'OG' || token1.symbol === 'OG') return null;

            const reserve0Formatted = ethers.utils.formatUnits(lpPair.reserve0, token0.decimals);
            const reserve1Formatted = ethers.utils.formatUnits(lpPair.reserve1, token1.decimals);
            const totalSupplyFormatted = ethers.utils.formatUnits(lpDetails[3], lpDetails[2]);

            const priorityOrder = ['USDTaine', 'AINIME', 'OGaine', 'BTCaine', 'ETH', 'SUI'];
            const pairName = priorityOrder.indexOf(token0.symbol) <= priorityOrder.indexOf(token1.symbol)
              ? `${token0.symbol}/${token1.symbol}`
              : `${token1.symbol}/${token0.symbol}`;

            return {
              pairAddress: lpPair.pair,
              pairName,
              lpName: lpDetails[0],
              lpSymbol: lpDetails[1],
              token0: priorityOrder.indexOf(token0.symbol) <= priorityOrder.indexOf(token1.symbol) ? token0 : token1,
              token1: priorityOrder.indexOf(token0.symbol) <= priorityOrder.indexOf(token1.symbol) ? token1 : token0,
              reserve0: reserve0Formatted,
              reserve1: reserve1Formatted,
              totalSupply: totalSupplyFormatted,
              hasLiquidity: lpPair.reserve0.gt(0) && lpPair.reserve1.gt(0),
              status: lpPair.reserve0.gt(0) && lpPair.reserve1.gt(0) ? 'Exists' : 'Not Created',
            };
          } catch (err) {
            console.error(`Failed to access pair details ${lpPair.pair}:`, err);
            return null;
          }
        })
      );

      let validPairs = fetchedPairs.filter((pair) => pair !== null && pair.status === 'Exists');

      // Add OG pairs with Coming Soon status statically
      const ogPairs = generateOGPairs();
      validPairs = [...validPairs, ...ogPairs];

      // Sort pairs based on priority
      validPairs = validPairs.sort((a, b) => {
        const priorityOrder = ['USDTaine', 'AINIME', 'OGaine', 'BTCaine', 'ETH', 'SUI', 'OG'];
        if (a.status === 'Coming Soon' && b.status !== 'Coming Soon') return 1;
        if (b.status === 'Coming Soon' && a.status !== 'Coming Soon') return -1;
        const aToken = a.pairName.split('/')[0];
        const bToken = b.pairName.split('/')[0];
        return priorityOrder.indexOf(aToken) - priorityOrder.indexOf(bToken);
      });

      setPairs(validPairs);
      await minLoadingTime;
    } catch (err) {
      console.error('Error in fetchPairs:', err);
      showNotification('Cannot load liquidity pairs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPositions = async () => {
    if (!walletData.address || walletData.chainId.toLowerCase() !== '0x40d9') {
      setUserPositions([]);
      return;
    }
    try {
      const positions = [];
      for (const pair of pairs.filter(p => p.status === 'Exists')) {
        const pairContract = new ethers.Contract(pair.pairAddress, AINIMEDexPairABI, provider);
        try {
          const balance = await retryWithBackoff(() => pairContract.getLPBalance(walletData.address));
          if (balance.gt(0)) {
            positions.push({
              pairAddress: pair.pairAddress,
              pairName: pair.pairName,
              lpName: pair.lpName,
              lpSymbol: pair.lpSymbol,
              token0: pair.token0,
              token1: pair.token1,
              balance: ethers.utils.formatUnits(balance, 18),
              totalLiquidity: `${parseFloat(pair.reserve0).toFixed(2)} ${pair.token0.symbol} / ${parseFloat(pair.reserve1).toFixed(2)} ${pair.token1.symbol}`,
            });
          }
        } catch (err) {
          console.error(`Failed to load balance for pair ${pair.pairName}:`, err);
        }
      }
      setUserPositions(positions);
    } catch (err) {
      showNotification('Cannot load your liquidity positions.', 'error');
    }
  };

  useEffect(() => {
    if (provider) {
      fetchPairs();
    }
  }, [provider]);

  useEffect(() => {
    if (provider && walletData.address && walletData.chainId.toLowerCase() === '0x40d9') {
      fetchUserPositions();
    } else {
      setUserPositions([]);
    }
  }, [provider, walletData.address, walletData.chainId, pairs]);

  return (
    <div className="liquidity-container">
      <div className="liquidity-header">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'pools' ? 'active' : ''}`}
            onClick={() => setActiveTab('pools')}
            aria-label="Show Liquidity Pool"
          >
            Liquidity Pool
          </button>
          <button
            className={`tab-button ${activeTab === 'my-pools' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-pools')}
            aria-label="Show My Liquidity Pool"
          >
            My Liquidity Pool
          </button>
        </div>
        <div className="header-actions">
          <button className="settings-btn" aria-label="Settings">
            <FaCog size={14} />
          </button>
          <button className="history-btn" aria-label="History">
            <FaHistory size={14} />
          </button>
        </div>
      </div>
      <div className="pools-content">
        <h2>{activeTab === 'pools' ? 'Liquidity Pool' : 'My Liquidity Pool'}</h2>
        <div className="pools-grid">
          {activeTab === 'pools' &&
            (isLoading ? (
              <div className="loading-message">
                <FaSpinner className="spinner" size={16} />
                <span>Loading Pairs...</span>
              </div>
            ) : pairs.length === 0 ? (
              <p className="no-pools">No liquidity pairs found.</p>
            ) : (
              pairs.map((pair, index) => (
                <div key={index} className="pool-card">
                  <div className="pool-info">
                    <div className="token-logos">
                      <img src={pair.token0.logo} alt={pair.token0.symbol} className="token-logo" />
                      <img src={pair.token1.logo} alt={pair.token1.symbol} className="token-logo" />
                    </div>
                    <span className="pair-name">{pair.pairName}</span>
                    <span className="lp-details">LP: {pair.lpName} ({pair.lpSymbol})</span>
                    {pair.status === 'Coming Soon' && <span className="coming-soon">Coming Soon</span>}
                  </div>
                  <div className="pool-details">
                    <span className="total-liquidity">
                      Total Liquidity: {parseFloat(pair.reserve0 || 0).toFixed(2)} {pair.token0.symbol} /{' '}
                      {parseFloat(pair.reserve1 || 0).toFixed(2)} {pair.token1.symbol}
                    </span>
                  </div>
                  <div className="pool-actions">
                    <button
                      className="action-button deposit"
                      aria-label={`Deposit to ${pair.pairName}`}
                      onClick={() => {
                        if (pair.status === 'Coming Soon') {
                          showNotification('This pair is not available yet.', 'info');
                          return;
                        }
                        if (!walletData.address || walletData.chainId.toLowerCase() !== '0x40d9') {
                          showNotification('Please connect your wallet to 0G Galileo Testnet.', 'error');
                          return;
                        }
                        navigate(`/liquidity/${pair.pairAddress}`, {
                          state: {
                            pair: {
                              pairAddress: pair.pairAddress,
                              pairName: pair.pairName,
                              lpName: pair.lpName,
                              lpSymbol: pair.lpSymbol,
                              token0: pair.token0,
                              token1: pair.token1,
                              reserve0: pair.reserve0,
                              reserve1: pair.reserve1,
                              totalSupply: pair.totalSupply,
                              hasLiquidity: pair.hasLiquidity,
                              status: pair.status,
                            },
                            isNewPair: false,
                          },
                        });
                      }}
                      disabled={isLoading || pair.status === 'Coming Soon'}
                    >
                      Deposit
                    </button>
                  </div>
                </div>
              ))
            ))}
          {activeTab === 'my-pools' &&
            (isLoading ? (
              <div className="loading-message">
                <FaSpinner className="spinner" size={16} />
                <span>Loading your positions...</span>
              </div>
            ) : walletData.address && walletData.chainId.toLowerCase() === '0x40d9' ? (
              userPositions.length > 0 ? (
                userPositions.map((position, index) => (
                  <div key={index} className="pool-card my-pool-card">
                    <div className="pool-info">
                      <div className="token-logos">
                        <img src={position.token0.logo} alt={position.token0.symbol} className="token-logo" />
                        <img src={position.token1.logo} alt={position.token1.symbol} className="token-logo" />
                      </div>
                      <span className="pair-name">{position.pairName}</span>
                      <span className="lp-details">LP: {position.lpName} ({position.lpSymbol})</span>
                    </div>
                    <div className="pool-details">
                      <span className="total-liquidity">Your LP: {parseFloat(position.balance).toFixed(6)}</span>
                      <span className="total-liquidity">{position.totalLiquidity}</span>
                    </div>
                    <div className="pool-actions">
                      <button
                        className="action-button deposit"
                        aria-label={`Deposit to ${position.pairName}`}
                        onClick={() => {
                          if (!walletData.address || walletData.chainId.toLowerCase() !== '0x40d9') {
                            showNotification('Please connect your wallet to 0G Galileo Testnet.', 'error');
                            return;
                          }
                          navigate(`/liquidity/${position.pairAddress}`, {
                            state: {
                              pair: {
                                pairAddress: position.pairAddress,
                                pairName: position.pairName,
                                lpName: position.lpName,
                                lpSymbol: position.lpSymbol,
                                token0: position.token0,
                                token1: position.token1,
                                reserve0: position.reserve0,
                                reserve1: position.reserve1,
                                totalSupply: position.totalSupply,
                                hasLiquidity: position.hasLiquidity,
                                status: 'Exists',
                              },
                              isNewPair: false,
                            },
                          });
                        }}
                        disabled={isLoading}
                      >
                        Deposit
                      </button>
                      <button
                        className="action-button withdraw"
                        aria-label={`Withdraw from ${position.pairName}`}
                        onClick={() => {
                          if (!walletData.address || walletData.chainId.toLowerCase() !== '0x40d9') {
                            showNotification('Please connect your wallet to 0G Galileo Testnet.', 'error');
                            return;
                          }
                          navigate(`/liquidity/${position.pairAddress}`, {
                            state: {
                              pair: {
                                pairAddress: position.pairAddress,
                                pairName: position.pairName,
                                lpName: position.lpName,
                                lpSymbol: position.lpSymbol,
                                token0: position.token0,
                                token1: position.token1,
                                reserve0: position.reserve0,
                                reserve1: position.reserve1,
                                totalSupply: position.totalSupply,
                                hasLiquidity: position.hasLiquidity,
                                status: 'Exists',
                              },
                              isNewPair: false,
                            },
                          });
                        }}
                        disabled={isLoading}
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="loading-message">
                  <FaSpinner className="spinner" size={16} style={{ display: isLoading ? 'inline-block' : 'none' }} />
                  <span>You have no liquidity positions.</span>
                </div>
              )
            ) : (
              <p className="no-pools">Please connect your wallet to 0G Galileo Testnet to view your positions.</p>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Liquidity;
