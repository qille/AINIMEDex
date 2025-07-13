// src/constants/tokens.js
import aineLogo from '../assets/evm-tokens/aine-logo.gif';
import usdtLogo from '../assets/evm-tokens/usdt-logo.png';
import btcLogo from '../assets/evm-tokens/btc-logo.png';
import ethLogo from '../assets/evm-tokens/eth-logo.png';
import ogLogo from '../assets/evm-tokens/og-logo.png';
import suiLogo from '../assets/evm-tokens/sui-logo.png';

export const TOKEN_INFO = {
  '0x0000000000000000000000000000000000000000': { symbol: 'OG', name: 'OG GALILEO', logo: ogLogo, verified: true, decimals: 18, address: '0x0000000000000000000000000000000000000000' },
  '0x7F2aD0e0b4dD4DCABED3Bfa2eF33c29b6FF8E961': { symbol: 'AINE', name: 'AINIME', logo: aineLogo, verified: true, decimals: 18, address: '0x7F2aD0e0b4dD4DCABED3Bfa2eF33c29b6FF8E961' },
  '0x3893BfDC29e3Ce42569C2D670738d94CEc4e0B01': { symbol: 'USDTaine', name: 'USDT AINIME', logo: usdtLogo, verified: true, decimals: 18, address: '0x3893BfDC29e3Ce42569C2D670738d94CEc4e0B01' },
  '0xFaf376eF145Aa71802fA4909dEA4cc93f3f2DeD3': { symbol: 'BTCaine', name: 'BITCOIN AINIME', logo: btcLogo, verified: true, decimals: 18, address: '0xFaf376eF145Aa71802fA4909dEA4cc93f3f2DeD3' },
  '0x118722D254483d8A346C1Dc1E6EF4f2f2Ec9e055': { symbol: 'ETHaine', name: 'ETHEREUM AINIME', logo: ethLogo, verified: true, decimals: 18, address: '0x118722D254483d8A346C1Dc1E6EF4f2f2Ec9e055' },
  '0x4672aD176B54B2AFB86Ad955Ed1283B6F0e3D047': { symbol: 'SUIaine', name: 'SUI AINIME', logo: suiLogo, verified: true, decimals: 18, address: '0x4672aD176B54B2AFB86Ad955Ed1283B6F0e3D047' },
};

export const PREDEFINED_PAIRS = [
  { tokenA: '0x7F2aD0e0b4dD4DCABED3Bfa2eF33c29b6FF8E961', tokenB: '0x3893BfDC29e3Ce42569C2D670738d94CEc4e0B01' }, // AINE/USDTaine
  { tokenA: '0x7F2aD0e0b4dD4DCABED3Bfa2eF33c29b6FF8E961', tokenB: '0xFaf376eF145Aa71802fA4909dEA4cc93f3f2DeD3' }, // AINE/BTCaine
  { tokenA: '0x7F2aD0e0b4dD4DCABED3Bfa2eF33c29b6FF8E961', tokenB: '0x118722D254483d8A346C1Dc1E6EF4f2f2Ec9e055' }, // AINE/ETHaine
  { tokenA: '0x7F2aD0e0b4dD4DCABED3Bfa2eF33c29b6FF8E961', tokenB: '0x4672aD176B54B2AFB86Ad955Ed1283B6F0e3D047' }, // AINE/SUIaine
  { tokenA: '0x3893BfDC29e3Ce42569C2D670738d94CEc4e0B01', tokenB: '0xFaf376eF145Aa71802fA4909dEA4cc93f3f2DeD3' }, // USDTaine/BTCaine
  { tokenA: '0x3893BfDC29e3Ce42569C2D670738d94CEc4e0B01', tokenB: '0x118722D254483d8A346C1Dc1E6EF4f2f2Ec9e055' }, // USDTaine/ETHaine
  { tokenA: '0x3893BfDC29e3Ce42569C2D670738d94CEc4e0B01', tokenB: '0x4672aD176B54B2AFB86Ad955Ed1283B6F0e3D047' }, // USDTaine/SUIaine
  { tokenA: '0xFaf376eF145Aa71802fA4909dEA4cc93f3f2DeD3', tokenB: '0x118722D254483d8A346C1Dc1E6EF4f2f2Ec9e055' }, // BTCaine/ETHaine
  { tokenA: '0xFaf376eF145Aa71802fA4909dEA4cc93f3f2DeD3', tokenB: '0x4672aD176B54B2AFB86Ad955Ed1283B6F0e3D047' }, // BTCaine/SUIaine
  { tokenA: '0x118722D254483d8A346C1Dc1E6EF4f2f2Ec9e055', tokenB: '0x4672aD176B54B2AFB86Ad955Ed1283B6F0e3D047' }, // ETHaine/SUIaine

  // Pair dengan OG (Native). Tetap Coming Soon jika belum ada WOG atau pair belum dibuat.
  { tokenA: '0x0000000000000000000000000000000000000000', tokenB: '0x7F2aD0e0b4dD4DCABED3Bfa2eF33c29b6FF8E961', comingSoon: true }, // OG/AINE
  { tokenA: '0x0000000000000000000000000000000000000000', tokenB: '0x3893BfDC29e3Ce42569C2D670738d94CEc4e0B01', comingSoon: true }, // OG/USDTaine
  { tokenA: '0x0000000000000000000000000000000000000000', tokenB: '0xFaf376eF145Aa71802fA4909dEA4cc93f3f2DeD3', comingSoon: true }, // OG/BTCaine
  { tokenA: '0x0000000000000000000000000000000000000000', tokenB: '0x118722D254483d8A346C1Dc1E6EF4f2f2Ec9e055', comingSoon: true }, // OG/ETHaine
  { tokenA: '0x0000000000000000000000000000000000000000', tokenB: '0x4672aD176B54B2AFB86Ad955Ed1283B6F0e3D047', comingSoon: true }, // OG/SUIaine
];

// Alamat Kontrak
export const FACTORY_ADDRESS = '0x489249546958E8d3c5250017B1495ab05a283312';
export const ROUTER_ADDRESS = '0x3C9aCC370F35593fEc8fdE3CDFe759304a03398B';
export const FAUCET_ADDRESS = '0x452cAcf56b5411eAF2A3260910BB49396bCe528d';
export const WETH_ADDRESS = '0x0000000000000000000000000000000000000000'; // Alamat token native (OG) di 0G EVM Testnet