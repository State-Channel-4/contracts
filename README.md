# Channel 4 Contracts

This directory contains all the Channel 4 contracts, tests and deploy scripts.
It is worth pointing out that the data workflow of the application at the moment is [here](https://www.figma.com/file/PfdR0GjZpuqVpZKcI7kZBn/Channel4-Data-flow?type=whiteboard&node-id=0-1&t=p83aHlZTVidHNGx2-0).

The smart contract arquitecture is defined here (it is a work in progress): [here](https://www.figma.com/file/fVNtk4IxFvwGsaWJLSHjQd/Channel4Contract.sol?type=whiteboard&node-id=0%3A1&t=NkDONU2w5wtdCEdk-1)

To install:

```shell
npm install
```

To deploy to Sepolia:

```shell
npm run deploy:sepolia
```

Last deployment message:

```
====================================
Deploying Channel4Contract to sepolia (11155111)...
====================================
Channel4Contract deployed to '0x6189a62161FEDfFeBc5A56ffA419978937618843'
Deployment parameters:
 - First URL Title: "Privacy & Scaling Explorations"
 - First URL: "https://pse.dev/"
 - First Tag: "zero-knowledge"
 - Slashing Fee: 0.001 ether
 - Backend Registration Fee: 0.01 ether
 - Time Threshold: 30 seconds
====================================
Registered contract deployer 0xb4a5714dd934a3391Bc670BEc9aee18b821e1Fd5 as backend
====================================
```

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
