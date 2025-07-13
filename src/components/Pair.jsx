import { NavLink } from 'react-router-dom';
import usdtLogo from 'D:/AINIMEDexV7/ainimedex/src/assets/evm-tokens/usdt-logo.png';
import ogaineLogo from 'D:/AINIMEDexV7/ainimedex/src/assets/evm-tokens/ogaine-logo.png';
import aineLogo from 'D:/AINIMEDexV7/ainimedex/src/assets/evm-tokens/aine-logo.png';
import btcLogo from 'D:/AINIMEDexV7/ainimedex/src/assets/evm-tokens/btc-logo.png';
import ethLogo from 'D:/AINIMEDexV7/ainimedex/src/assets/evm-tokens/eth-logo.png';
import solLogo from 'D:/AINIMEDexV7/ainimedex/src/assets/evm-tokens/sol-logo.png';
import suiLogo from 'D:/AINIMEDexV7/ainimedex/src/assets/evm-tokens/sui-logo.png';
import '../index.css';

function Pair() {
  // Define the 7 tokens
  const tokens = [
    { address: '0x14E050F9A7d52BaB599659806204D41887621101', symbol: 'USDTaine', logo: usdtLogo },
    { address: '0x0e11F40f975F0ecbe6b9aa57102965167c32d6A9', symbol: 'OGaine', logo: ogaineLogo },
    { address: '0xb618bEdfAf810Debd5826b515f9ba5aa44AF3216', symbol: 'AINIME', logo: aineLogo },
    { address: '0xA63ab674aCeDc5ad6cd44248cb72571015b4df97', symbol: 'BTCaine', logo: btcLogo },
    { address: '0xf87186a9e1fd9A6955251dC24B922d8f0642984c', symbol: 'ETHaine', logo: ethLogo },
    { address: '0xc89261015260dcA1abF2213434A0a774Ed8D8d75', symbol: 'SOLaine', logo: solLogo },
    { address: '0xfC7CEbDEA649612aFd3bEd0b9f624a915E709CCA', symbol: 'SUIaine', logo: suiLogo },
  ];

  // Generate all unique pairs (21 pairs)
  const pairs = [];
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      pairs.push({
        tokenA: tokens[i],
        tokenB: tokens[j],
      });
    }
  }

  return (
    <div className="pair-page">
      <h2>Token Pairs</h2>
      <div className="pair-list">
        {pairs.map((pair, index) => (
          <NavLink
            key={index}
            to={`/pair/${pair.tokenA.symbol}/${pair.tokenB.symbol}`}
            className="pair-item"
          >
            <div className="pair-logo">
              <img src={pair.tokenA.logo} alt={pair.tokenA.symbol} className="token-logo" />
              <img src={pair.tokenB.logo} alt={pair.tokenB.symbol} className="token-logo overlap" />
            </div>
            <div className="pair-info">
              <span>{`${pair.tokenA.symbol}/${pair.tokenB.symbol}`}</span>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default Pair;