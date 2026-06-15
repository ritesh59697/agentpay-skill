// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AgentPay {
    address public owner;
    address public usdc;

    // Mapping from agent address to their maximum budget (in USDC)
    mapping(address => uint256) public budgets;
    // Mapping from agent address to their total spent amount (in USDC)
    mapping(address => uint256) public spent;

    event BudgetSet(address indexed agent, uint256 maxSpend);
    event Paid(address indexed agent, address indexed payTo, uint256 amount, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = _usdc;
    }

    // Set or update the budget for a specific agent
    function setBudget(address agent, uint256 maxSpend) external onlyOwner {
        budgets[agent] = maxSpend;
        emit BudgetSet(agent, maxSpend);
    }

    // Agent executes a payment to a receiver
    function pay(address token, address payTo, uint256 amount) external {
        require(token == usdc, "Only USDC supported");
        uint256 currentBudget = budgets[msg.sender];
        uint256 currentSpent = spent[msg.sender];
        
        require(currentSpent + amount <= currentBudget, "Budget exceeded");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient contract balance");

        spent[msg.sender] = currentSpent + amount;
        
        bool success = IERC20(token).transfer(payTo, amount);
        require(success, "USDC transfer failed");

        emit Paid(msg.sender, payTo, amount, block.timestamp);
    }

    // View remaining budget
    function getRemainingBudget(address agent) external view returns (uint256) {
        uint256 currentBudget = budgets[agent];
        uint256 currentSpent = spent[agent];
        if (currentSpent >= currentBudget) {
            return 0;
        }
        return currentBudget - currentSpent;
    }

    // View total spent by an agent
    function getSpent(address agent) external view returns (uint256) {
        return spent[agent];
    }

    // View budget of an agent
    function getBudget(address agent) external view returns (uint256) {
        return budgets[agent];
    }

    // Recover tokens if needed (emergency)
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        bool success = IERC20(token).transfer(owner, amount);
        require(success, "Recovery failed");
    }
}
