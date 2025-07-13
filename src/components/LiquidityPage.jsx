import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import AddLiquidity from './AddLiquidity';
import RemoveLiquidity from './RemoveLiquidity';
import styles from '../style/AddLiquidity.module.css';
import { showNotification, retryWithBackoff } from '../utils/helpers';
import AINIMEDexPairABI from '../abi_json/AINIMEDex_Pair.json';
import { tokens } from '../utils/tokens'; // Impor tokens dari file terpusat

function LiquidityPage({ walletData }) {
  const { pairAddress } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [pairData, setPairData] = useState(null);

  useEffect(() => {
    const fetchPairData = async () => {
      if (!pairAddress || !ethers.utils.isAddress(pairAddress)) {
        console.error('Alamat pair tidak valid:', pairAddress);
        showNotification('Alamat pair tidak valid.', 'error');
        navigate('/liquidity');
        return;
      }

      try {
        console.log('Mengambil data untuk pairAddress:', pairAddress);
        const provider = new ethers.providers.JsonRpcProvider('https://evmrpc-testnet.0g.ai/', {
          chainId: parseInt('0x40d9', 16),
          name: 'OG Galileo Testnet',
          ensAddress: null,
        });
        const pairContract = new ethers.Contract(pairAddress, AINIMEDexPairABI, provider);

        const [token0Address, token1Address, lpDetails] = await Promise.all([
          retryWithBackoff(() => pairContract.token0()),
          retryWithBackoff(() => pairContract.token1()),
          retryWithBackoff(() => pairContract.getLPTokenDetails()),
        ]);
        console.log('Data kontrak:', { token0Address, token1Address, lpDetails });

        const token0 = tokens.find((t) => t.address.toLowerCase() === token0Address.toLowerCase());
        const token1 = tokens.find((t) => t.address.toLowerCase() === token1Address.toLowerCase());
        console.log('Token ditemukan:', { token0, token1 });

        if (!token0 || !token1) {
          console.error('Token tidak ditemukan:', { token0Address, token1Address });
          showNotification('Token tidak ditemukan dalam daftar.', 'error');
          navigate('/liquidity');
          return;
        }

        const token0IsLower = token0Address.toLowerCase() < token1Address.toLowerCase();
        const formattedReserves = {
          reserve0: ethers.utils.formatUnits(lpDetails._reserve0, token0.decimals),
          reserve1: ethers.utils.formatUnits(lpDetails._reserve1, token1.decimals),
        };

        const newPairData = {
          pairAddress: pairAddress, // Perbaikan typo
          pairName: `${token0.symbol}/${token1.symbol}`,
          token0,
          token1,
          reserve0: formattedReserves.reserve0,
          reserve1: formattedReserves.reserve1,
          totalSupply: ethers.utils.formatUnits(lpDetails._totalSupply, lpDetails._decimals),
          hasLiquidity: parseFloat(formattedReserves.reserve0) > 0 && parseFloat(formattedReserves.reserve1) > 0,
          status: 'Exists',
        };

        setPairData(newPairData);
      } catch (error) {
        console.error('Gagal memuat data pair:', error);
        showNotification('Gagal memuat data pair.', 'error');
        navigate('/liquidity');
      }
    };

    console.log('Location state:', location.state);
    console.log('Pair address:', pairAddress);
    if (location.state && location.state.pair) {
      console.log('Menggunakan state.pair:', location.state.pair);
      setPairData(location.state.pair);
    } else if (pairAddress && pairAddress !== 'Not Created' && ethers.utils.isAddress(pairAddress)) {
      fetchPairData();
    } else {
      console.error('Data pair tidak valid:', { pairAddress });
      showNotification('Data pair tidak ditemukan atau alamat tidak valid.', 'error');
      navigate('/liquidity');
    }
  }, [pairAddress, location.state, navigate]);

  return (
    <div className={styles['liquidity-page-wrapper']}>
      {pairData ? (
        <>
          <AddLiquidity walletData={walletData} pairData={pairData} />
          <RemoveLiquidity walletData={walletData} pairData={pairData} />
        </>
      ) : (
        <div className={styles.card}>
          <p>Loading pair data...</p>
        </div>
      )}
    </div>
  );
}

export default LiquidityPage;
