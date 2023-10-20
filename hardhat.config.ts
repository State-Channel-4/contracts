import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-solhint';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/<YOUR_INFURA_ID>`,
      accounts: [
        'bd0cef31fef0e40085b0f2801744057feb0a6b3d3a7d96d01eac0c08eea2e596',
      ],
    },
    localhost: {
      url: `http://localhost:8545`,
      accounts: [
        '2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
      ],
    },
  },
};

export default config;
