# CryptoPrices
CryptoPrices is a Google Assistant app that provides the current price of a given cryptocoin in relation to a fiat (traditional) currency or another cryptocurrency. Prices are averaged across top exchanges to make sure the most accurate prices are returned to the user.

If a relative coin or currency ("to coin") is not specified, the default response will be in USD.


## Usage
Example app invovations include:

"Ok Google, what's the price of Ethereum in Bitcoin"

"Ok Google, ask CryptoPrices for the price of Neo in U.S. Dollars"

"Ok Google, ask CryptoPrices for the price of Ripple in EUR"

"Ok Google, ask CryptoPrices to get me the price of Bitcoin"


The user can ask for a cryptocurrency on it's own (price is returned in US dollars), or in relation to other currencies. The user is also able to use the abbreviated "symbol" of the currency if instead of the long-form name in the request.

## Future Developments
* Add caching layer to increase spead, using Firebase Database
* Develop a more sustainable way to support coins that are newly added to the CryptoCompare API.

Author
Lexis Hanson, lexishanson@gmail.com
