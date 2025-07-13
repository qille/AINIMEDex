import ogLogo from '../assets/evm-tokens/og-logo.png';
import aineLogo from '../assets/evm-tokens/aine-logo.gif';
import usdtLogo from '../assets/evm-tokens/usdt-logo.png';
import btcLogo from '../assets/evm-tokens/btc-logo.png';
import ethLogo from '../assets/evm-tokens/eth-logo.png';
import suiLogo from '../assets/evm-tokens/sui-logo.png';
import ogaineLogo from '../assets/evm-tokens/ogaine-logo.png';

export const tokens = [
  {
    address: '0xAACDf6B66B1b451B43FDA6270548783F642833C5',
    symbol: 'USDTaine',
    name: 'USDT',
    logo: usdtLogo,
    decimals: 6,
  },
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'OG',
    name: 'Native OG',
    logo: ogLogo,
    decimals: 18,
  },
  {
    address: '0x1a0326c89c000C18794dD012D5055d9D16900f77',
    symbol: 'AINIME',
    name: 'AINIME',
    logo: aineLogo,
    decimals: 18,
  },
  {
    address: '0xd2476F4d3D5479982Df08382A4063018A9b7483c',
    symbol: 'OGaine',
    name: 'OG AINIME',
    logo: ogaineLogo,
    decimals: 18,
  },
  {
    address: '0xA5e937cbEC05EB8F71Ae8388645976A16046667b',
    symbol: 'BTCaine',
    name: 'BITCOIN',
    logo: btcLogo,
    decimals: 18,
  },
  {
    address: '0x832b82d71296577E7b5272ef2884F2E5EAE66065',
    symbol: 'ETHaine',
    name: 'ETHEREUM',
    logo: ethLogo,
    decimals: 18,
  },
  {
    address: '0x4d3c3362397A8869C3EdD4d1c36B4Ccf20339a26',
    symbol: 'SUIaine',
    name: 'SUI AINIME',
    logo: suiLogo,
    decimals: 18,
  },
];