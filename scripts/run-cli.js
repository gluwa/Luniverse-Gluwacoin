const inquirer = require('inquirer')
const fs = require('fs')
const spawn = require('child_process').spawn

const fileContractsAddressDeployed = 'contractsAddressDeployed.json';
const fileContractsAddressDeployedHistory = 'contractsAddressDeployedHistory.json';
let contractsAddressDeployed = []
let contractsAddressDeployedHistory = []

let inquirerFileContractsAddressDeployed = {
    name: 'Get the previously deployed contracts address',
    disabled: 'Please deploy the contracts first'
}
if(fs.existsSync(fileContractsAddressDeployed)) {
    let rawdata = fs.readFileSync(fileContractsAddressDeployed)
    contractsAddressDeployed = JSON.parse(rawdata)
    inquirerFileContractsAddressDeployed = 'Get the previously deployed contracts address'
}
let inquirerFileContractsAddressDeployedHistory = {
    name: 'Get all the previously deployed contracts address',
    disabled: 'Please deploy the contracts first'
}
if(fs.existsSync(fileContractsAddressDeployedHistory)) {
    let rawdata = fs.readFileSync(fileContractsAddressDeployedHistory)
    contractsAddressDeployedHistory = JSON.parse(rawdata)
    inquirerFileContractsAddressDeployedHistory = 'Get all the previously deployed contracts address'
}

const contractsList = [
    'All contracts',
    'Luniverse-Gluwacoin',
    'Sandbox Luniverse-Gluwacoin'
]
const networksList = [
    'Local',
    'Kaleido',
    'Ethereum Mainet',
    'Ethereum Ropsten',
    'Ethereum Rinkeby',
    'Ethereum Kovan',
    'Polygon Mainet',
    'Polygon Mumbai'
]

const networkSelectionAndSpawn = (command, firstCommand) => {
    let commandFlag = ' --network hardhat';
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'networks',
                message: 'Select a network',
                choices: networksList
            }
        ]).then((networkAsnwer) => {
            if(networkAsnwer.networks === 'Kaleido') {
                commandFlag = ' --network kaleido'
            }
            if(networkAsnwer.networks === 'Ethereum Ropsten') {
                commandFlag = ' --network ropsten'
            }
            if(networkAsnwer.networks === 'Ethereum Rinkeby') {
                commandFlag = ' --network rinkeby'
            }
            if(networkAsnwer.networks === 'Ethereum Kovan') {
                commandFlag = ' --network kovan'
            }
            if(networkAsnwer.networks === 'Polygon Mainet') {
                commandFlag = ' --network polygon'
            }
            if(networkAsnwer.networks === 'Polygon Mumbai') {
                commandFlag = ' --network mumbai'
            }
            if (firstCommand != '') {
                console.log('\x1b[32m%s\x1b[0m', 'Command to run: ', firstCommand + commandFlag + ' && ' + command + commandFlag);
                console.log('Please wait...');
                spawn(firstCommand + commandFlag + ' && ' + command + commandFlag, {
                    stdio: 'inherit',
                    shell: true
                });
            } else {
                console.log('\x1b[32m%s\x1b[0m', 'Command to run: ', command + commandFlag);
                console.log('Please wait...');
                spawn(command + commandFlag, {
                    stdio: 'inherit',
                    shell: true
                });
            }
        });
}

inquirer
    .prompt([{
        type: 'list',
        name: 'action',
        message: 'What will you like to do?',
        choices: [
            'Run tests',
            'Deploy contracts',
            'Upgrade contracts',
            new inquirer.Separator(),
            'Deploy all contracts and run the tests',
            'Upgrade all contracts and run the tests',
            new inquirer.Separator(),
            'Get account balance',
            new inquirer.Separator(),
            inquirerFileContractsAddressDeployed,
            inquirerFileContractsAddressDeployedHistory
        ]
    }])
    .then((answer) => {
        let command = 'npx hardhat compile';
        
        if(answer.action == 'Run tests') {
            inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'tests',
                        message: 'Select a test to run',
                        choices: [
                            'All tests',
                            'Luniverse-Gluwacoin - BasicERC20',
                            'Luniverse-Gluwacoin - Boundary',
                            'Luniverse-Gluwacoin - Emit Events',
                            'Luniverse-Gluwacoin - Roles',
                            'Luniverse-Gluwacoin - Ethless',
                            new inquirer.Separator(),
                            'Sandbox Luniverse-Gluwacoin - BasicERC20',
                            'Sandbox Luniverse-Gluwacoin - Ethless'
                        ]
                    }
                ]).then((contractsTestAsnwer) => {
                    if(contractsTestAsnwer.tests === 'All tests') {
                        command = 'npx hardhat test'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - BasicERC20') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.basicERC20.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Boundary') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.boundary.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Emit Events') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.emitEvent.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Roles') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.roles.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Ethless') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.signFunction.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Sandbox Luniverse-Gluwacoin - BasicERC20') {
                        command = 'npx hardhat test test/SandboxLuniverseGluwacoin.basicERC20.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Sandbox Luniverse-Gluwacoin - Ethless') {
                        command = 'npx hardhat test test/SandboxLuniverseGluwacoin.signFunction.test.js'
                    }
                    networkSelectionAndSpawn(command, '');
                });
        }
        if(answer.action === 'Deploy contracts') {
            inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'contracts',
                        message: 'Select a contract',
                        choices: contractsList
                    }
                ]).then((contractsDeploymentAsnwer) => {
                    if(contractsDeploymentAsnwer.contracts === 'All contracts') {
                        command = 'npx hardhat run scripts/multipleContracts/deployAllContracts.js'
                    }
                    if(contractsDeploymentAsnwer.contracts === 'Luniverse-Gluwacoin') {
                        command = 'npx hardhat run scripts/singleContract/deployLuniverseGluwacoin.js'
                    }
                    if(contractsDeploymentAsnwer.contracts === 'Sandbox Luniverse-Gluwacoin') {
                        command = 'npx hardhat run scripts/singleContract/deploySandboxLuniverseGluwacoin.js'
                    }
                    networkSelectionAndSpawn(command, '');
                });
        }
        if(answer.action === 'Upgrade contracts') {
            inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'contracts',
                        message: 'Select a contract',
                        choices: contractsList
                    }
                ]).then((contractsDeploymentAsnwer) => {
                    if(contractsDeploymentAsnwer.contracts === 'All contracts') {
                        command = 'npx hardhat run scripts/multipleContracts/upgradeAllContracts.js'
                    }
                    if(contractsDeploymentAsnwer.contracts === 'Luniverse-Gluwacoin') {
                        command = 'npx hardhat run scripts/singleContract/upgradeLuniverseGluwacoin.js'
                    }
                    if(contractsDeploymentAsnwer.contracts === 'Sandbox Luniverse-Gluwacoin') {
                        command = 'npx hardhat run scripts/singleContract/upgradeSandboxLuniverseGluwacoin.js'
                    }
                    networkSelectionAndSpawn(command, '');
                });
        }
        if(answer.action == 'Deploy all contracts and run the tests') {
            const firstCommand = 'npx hardhat run scripts/multipleContracts/deployAllContracts.js'
            inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'tests',
                        message: 'Select a test to run',
                        choices: [
                            'All tests',
                            'Luniverse-Gluwacoin - BasicERC20',
                            'Luniverse-Gluwacoin - Boundary',
                            'Luniverse-Gluwacoin - Emit Events',
                            'Luniverse-Gluwacoin - Fee',
                            'Luniverse-Gluwacoin - Roles',
                            'Luniverse-Gluwacoin - Ethless',
                            new inquirer.Separator(),
                            'Sandbox Luniverse-Gluwacoin - BasicERC20'
                        ]
                    }
                ]).then((contractsTestAsnwer) => {
                    if(contractsTestAsnwer.tests === 'All tests') {
                        command = 'npx hardhat test'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - BasicERC20') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.basicERC20.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Boundary') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.boundary.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Emit Events') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.emitEvent.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Fee') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.fee.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Roles') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.roles.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Ethless') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.signFunction.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Sandbox Luniverse-Gluwacoin - BasicERC20') {
                        command = 'npx hardhat test test/SandboxLuniverseGluwacoin.basicERC20.test.js'
                    }
                    networkSelectionAndSpawn(command, firstCommand);
                });
        }
        if(answer.action == 'Upgrade all contracts and run the tests') {
            const firstCommand = 'npx hardhat run scripts/multipleContracts/upgradeAllContracts.js'
            inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'tests',
                        message: 'Select a test to run',
                        choices: [
                            'All tests',
                            'Luniverse-Gluwacoin - BasicERC20',
                            'Luniverse-Gluwacoin - Boundary',
                            'Luniverse-Gluwacoin - Emit Events',
                            'Luniverse-Gluwacoin - Fee',
                            'Luniverse-Gluwacoin - Roles',
                            'Luniverse-Gluwacoin - Ethless',
                            new inquirer.Separator(),
                            'Sandbox Luniverse-Gluwacoin - BasicERC20'
                        ]
                    }
                ]).then((contractsTestAsnwer) => {
                    if(contractsTestAsnwer.tests === 'All tests') {
                        command = 'npx hardhat test'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - BasicERC20') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.basicERC20.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Boundary') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.boundary.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Emit Events') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.emitEvent.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Fee') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.fee.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Roles') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.roles.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Luniverse-Gluwacoin - Ethless') {
                        command = 'npx hardhat test test/LuniverseGluwacoin.signFunction.test.js'
                    }
                    if(contractsTestAsnwer.tests === 'Sandbox Luniverse-Gluwacoin - BasicERC20') {
                        command = 'npx hardhat test test/SandboxLuniverseGluwacoin.basicERC20.test.js'
                    }
                    networkSelectionAndSpawn(command, firstCommand);
                });
        }
        if(answer.action == 'Get the previously deployed contracts address') {
            console.log('Recent Contracts Address Deployed');
            console.table(contractsAddressDeployed);
            spawn('npx hardhat run scripts/run-cli.js', {
                stdio: 'inherit',
                shell: true
            });
        }
        if(answer.action == 'Get all the previously deployed contracts address') {
            console.log('All Contracts Address Deployed');
            console.table(contractsAddressDeployedHistory);
            spawn('npx hardhat run scripts/run-cli.js', {
                stdio: 'inherit',
                shell: true
            });
        }
        if(answer.action == 'Get account balance') {
            command = 'npx hardhat run scripts/get-accountBalance.js';
            networkSelectionAndSpawn(command, '');
        }
    });