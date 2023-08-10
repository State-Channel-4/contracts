# Channel 4 Contracts

This directory contains all the Channel 4 contracts, tests and deploy scripts.
It is worth pointing out that the data workflow of the application at the moment is [here](https://www.figma.com/file/PfdR0GjZpuqVpZKcI7kZBn/Channel4-Data-flow?type=whiteboard&node-id=0-1&t=p83aHlZTVidHNGx2-0).


The smart contract arquitecture is defined here (it is a work in progress): [here](https://www.figma.com/file/fVNtk4IxFvwGsaWJLSHjQd/Channel4Contract.sol?type=whiteboard&node-id=0%3A1&t=NkDONU2w5wtdCEdk-1)

To install:
```shell
npm install
```


Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

