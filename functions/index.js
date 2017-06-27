
'use strict';

process.env.DEBUG = 'actions-on-google:*';

const Assistant = require('actions-on-google').ApiAiAssistant;
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
global.fetch = require('node-fetch');

// API.AI Intent names
const GET_PRICE_INTENT = 'get-price';
const QUIT_INTENT = 'quit';

// Contexts
const WELCOME_CONTEXT = 'welcome';
const GET_PRICE_CONTEXT = 'get-price';

// Context Parameters
const CRYPTO_COIN = 'crypto-coin';
// const CRYPTO_COIN2 = 'crypto-coin2'; - may need to add back in to solve for crypto to crypto conversion
const CURRENCY_NAME = 'currency-name';

const coinFullNames = {
  ETH: 'Ethereum',
  BTC: 'Bitcoin',
  SC: 'Siacoin',
  EUR: 'Euros',
  USD: 'US Dollars',
};

exports.cryptoCurrencyPrices = functions.https.onRequest((request, response) => {
   console.log('headers: ' + JSON.stringify(request.headers));
   console.log('body: ' + JSON.stringify(request.body));

   const assistant = new Assistant({request: request, response: response});

   let actionMap = new Map();
   actionMap.set(GET_PRICE_INTENT, getPrice);
   assistant.handleRequest(actionMap);

   function fetchJSON(url) {
     return fetch(url)
       .then(res => res.json())
       .then(body => {
         console.log('JSON fetch return');
         if (body.Response === 'Error') throw body.Message;
         return body;
       });
   }

   function price(fromCoin, toCoin, options) {
     options = options || {};
     const baseUrl = 'https://min-api.cryptocompare.com/data/';
     let url = `${baseUrl}price?fsym=${fromCoin}&tsyms=${toCoin}`;
    //  if (options.exchanges) url += `&e=${options.exchanges}`;
    //  if (options.tryConversion === false) url += '&tryConversion=false';
     return fetchJSON(url);
   }

   function getPrice(assistant) {
     let fromCoin = assistant.getArgument(CRYPTO_COIN);
     let toCoin = assistant.getArgument(CURRENCY_NAME) /* || assistant.getArgument(CRYPTO_COIN2) */ || 'USD';

     let getPrice = price(fromCoin, toCoin)
     .then((body) => body[toCoin])
     .then(toCoinPrice => {
       return `The current price of ${coinFullNames[fromCoin]} is $${toCoinPrice} ${coinFullNames[toCoin]}`
     })
     .then(message => assistant.tell(message))
     .catch(console.error);
   }
});
