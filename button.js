/**
 * Aframe button with text entity
 */
AFRAME.registerComponent('button', {
  schema: {
    label: {default: 'label'},
    width: {default: 0.26},
  },

  init: function () {

    // Set this element to be a box
    var el = this.el;
    const DEFAULT_COLOR = '#3a50c5';
    const HIGHLIGHT_COLOR = '#1b2870';
    el.setAttribute('material', {color: DEFAULT_COLOR});
    el.setAttribute('geometry', {
      primitive: 'box',
      width: this.data.width,
      height: 0.05,
      depth: 0.04
    });

    // Change color on mouse hover
    el.addEventListener('mouseenter', function () {
      el.setAttribute('material', {color: HIGHLIGHT_COLOR});
    });
    el.addEventListener('mouseleave', function () {
      el.setAttribute('material', {color: DEFAULT_COLOR});
    });

    // Create text element
    var elementLabel = this.elementLabel = document.createElement('a-entity');
    elementLabel.setAttribute('position', '0 0 0.02');
    elementLabel.setAttribute('scale', '0.5 0.5 0.5');
    elementLabel.setAttribute('material', {color: '#3a50c5'});
    elementLabel.setAttribute('text', {
      value: this.data.label,
      color: 'white',
      align: 'center'
    });
    this.el.appendChild(elementLabel);
  },
});

/**
 * JavaScript code for Web3 wallets
 */

 // Use Unpkg imports
const Web3Modal = window.Web3Modal.default;
const evmChains = window.evmChains;

// Web3modal instance
let web3Modal

// Chosen wallet provider given by the dialog window
let provider;

// Address of the selected account
let selectedAccount;


/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData() {

  // Get a Web3 instance for the wallet
  const web3 = new Web3(provider);
  console.log("Web3 instance is", web3);

  // Get connected chain id from Ethereum node
  const chainId = await web3.eth.getChainId();

  // Load chain information over an HTTP API
  const chainData = evmChains.getChain(chainId);
  // call chainData.name for Chain name

  // Get list of accounts of the connected wallet
  const accounts = await web3.eth.getAccounts();

  // MetaMask does not give you all accounts, only the selected account
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];

  var elementLabel = this.elementLabel = document.createElement('a-entity');
  elementLabel.setAttribute('position', '0 0 0');
  elementLabel.setAttribute('scale', '0.35 0.35 0.35');
  elementLabel.setAttribute('material', {color: '#3a50c5'});
  elementLabel.setAttribute('text', {
    value: selectedAccount,
    color: 'white',
    align: 'center'
  });
  dataAccount.appendChild(elementLabel);

  // Go through all accounts and get their ETH balance
  const rowResolvers = accounts.map(async (address) => {
    const balance = await web3.eth.getBalance(address);
    const ethBalance = web3.utils.fromWei(balance, "ether");
    const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
  });

  // Wait for data to be resolved
  await Promise.all(rowResolvers);

  // Display fully loaded UI for wallet data
  btnConnect.setAttribute("visible", false);
  btnDisconnect.setAttribute("visible", true);
  dataAccount.setAttribute("visible", true);
}



/**
 * Fetch account data for UI when
 * - User switches accounts in wallet
 * - User switches networks in wallet
 * - User connects wallet initially
 */
async function refreshAccountData() {

  // If any current data is displayed when
  // the user is switching acounts in the wallet
  // immediate hide this data
  btnConnect.setAttribute("visible", false);
  btnDisconnect.setAttribute("visible", true);

  // Disable button while UI is loading.
  // fetchAccountData() will take a while as it communicates
  // with Ethereum node via JSON-RPC and loads chain data
  // over an API call.
  btnConnect.setAttribute("disabled", "disabled")
  await fetchAccountData(provider);
  btnConnect.removeAttribute("disabled")
}


/**
 * Connect wallet button
 */
async function onConnect() {

  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
  } catch(e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

  await refreshAccountData();
}

/**
 * Disconnect wallet button
 */
async function onDisconnect() {

  console.log("Killing the wallet connection", provider);

  // TODO: Which providers have close method?
  if(provider.close) {
    await provider.close();
    provider = null;
  }

  await web3Modal.clearCachedProvider();
  selectedAccount = null;

  // Set the UI back to the initial state
  btnConnect.setAttribute("visible", true);
  btnDisconnect.setAttribute("visible", false);
  dataAccount.setAttribute("visible", false);
}


/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
  console.log("window.web3 is", window.web3, "window.ethereum is", window.ethereum);

  // Ensure HTTPS or Metamask won't work
  if(location.protocol !== 'https:') {
    const alert = document.querySelector("#alert-error-https");
    alert.style.display = "block";
    btnConnect.setAttribute("disabled", "disabled")
    return;
  }

  // Configure web3Modal instance
  const providerOptions = {};
  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
    disableInjectedProvider: false,
  });
  console.log("Web3Modal instance is", web3Modal);

  // Global variables for aframe elements
  btnConnect = document.querySelector("#btn-connect");
  btnDisconnect = document.querySelector("#btn-disconnect");
  dataAccount = document.querySelector("#data-account");

  // Add event for mouse click
  btnConnect.addEventListener('click', function () {
    onConnect();
  });
  btnDisconnect.addEventListener('click', function () {
    onDisconnect();
  });

  // Connect wallet if previously logged in already
  if (web3Modal.cachedProvider) {
    provider = await web3Modal.connect();
    fetchAccountData();
  }
});
