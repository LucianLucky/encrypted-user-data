// IMPORTANT: Copy the ABI from deployments/sepolia/EncryptedUserData.json after deployment.
// Do not import JSON files in frontend per requirements.

export const CONTRACT_ADDRESS = ""; // Fill with deployed address on Sepolia

// ABI copied from compile output of EncryptedUserData.sol (identical to deployments JSON's abi field)
export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "uint32", "name": "countryId", "type": "uint32" },
      { "internalType": "uint32", "name": "cityId", "type": "uint32" },
      { "internalType": "uint64", "name": "minSalary", "type": "uint64" },
      { "internalType": "uint64", "name": "maxSalary", "type": "uint64" },
      { "internalType": "uint16", "name": "minBirthYear", "type": "uint16" },
      { "internalType": "uint16", "name": "maxBirthYear", "type": "uint16" }
    ],
    "name": "createApplication",
    "outputs": [{ "internalType": "uint256", "name": "appId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "appId", "type": "uint256" }
    ],
    "name": "submitApplication",
    "outputs": [ { "internalType": "ebool", "name": "result", "type": "bytes32" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "appId", "type": "uint256" }, { "internalType": "address", "name": "user", "type": "address" } ],
    "name": "getApplicationResult",
    "outputs": [ { "internalType": "ebool", "name": "", "type": "bytes32" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "appId", "type": "uint256" } ],
    "name": "getApplication",
    "outputs": [
      { "internalType": "address", "name": "creator", "type": "address" },
      { "internalType": "bool", "name": "active", "type": "bool" },
      { "internalType": "uint32", "name": "countryId", "type": "uint32" },
      { "internalType": "uint32", "name": "cityId", "type": "uint32" },
      { "internalType": "uint64", "name": "minSalary", "type": "uint64" },
      { "internalType": "uint64", "name": "maxSalary", "type": "uint64" },
      { "internalType": "uint16", "name": "minBirthYear", "type": "uint16" },
      { "internalType": "uint16", "name": "maxBirthYear", "type": "uint16" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "address", "name": "user", "type": "address" } ],
    "name": "getUser",
    "outputs": [
      { "internalType": "string", "name": "username", "type": "string" },
      { "internalType": "euint32", "name": "country", "type": "bytes32" },
      { "internalType": "euint32", "name": "city", "type": "bytes32" },
      { "internalType": "euint64", "name": "salary", "type": "bytes32" },
      { "internalType": "euint16", "name": "birthYear", "type": "bytes32" },
      { "internalType": "bool", "name": "registered", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "username", "type": "string" },
      { "internalType": "externalEuint32", "name": "countryExt", "type": "bytes32" },
      { "internalType": "externalEuint32", "name": "cityExt", "type": "bytes32" },
      { "internalType": "externalEuint64", "name": "salaryExt", "type": "bytes32" },
      { "internalType": "externalEuint16", "name": "birthYearExt", "type": "bytes32" },
      { "internalType": "bytes", "name": "inputProof", "type": "bytes" }
    ],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  { "inputs": [], "name": "nextAppId", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability": "view", "type": "function" },
  { "anonymous": false, "inputs": [ {"indexed": true, "internalType":"uint256","name":"appId","type":"uint256"}, {"indexed": true, "internalType":"address","name":"applicant","type":"address"}, {"indexed": false, "internalType":"ebool","name":"result","type":"bytes32"} ], "name": "Applied", "type": "event" },
  { "anonymous": false, "inputs": [ {"indexed": true, "internalType":"uint256","name":"appId","type":"uint256"}, {"indexed": true, "internalType":"address","name":"creator","type":"address"} ], "name": "ApplicationCreated", "type": "event" },
  { "anonymous": false, "inputs": [ {"indexed": true, "internalType":"address","name":"user","type":"address"}, {"indexed": false, "internalType":"string","name":"username","type":"string"} ], "name": "UserRegistered", "type": "event" }
];
