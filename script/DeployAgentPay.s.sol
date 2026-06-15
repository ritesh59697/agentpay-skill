// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/agentpay/AgentPay.sol";

contract DeployAgentPay is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envOr("USDC_ADDRESS", address(0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8));

        vm.startBroadcast(deployerPrivateKey);

        AgentPay agentPay = new AgentPay(usdcAddress);

        console.log("AgentPay deployed to:", address(agentPay));

        vm.stopBroadcast();
    }
}
