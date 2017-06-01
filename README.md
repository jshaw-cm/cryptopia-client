# cryptopia-client

	[![NPM Version][npm-image]][npm-url]
  [![NPM Downloads][downloads-image]][downloads-url]
  [![Linux Build][travis-image]][travis-url]
  [![Windows Build][appveyor-image]][appveyor-url]
  [![Test Coverage][coveralls-image]][coveralls-url]

## The only methods that are currently finished and working are:
### Private:
		GetBalance

### Public:
		GetCurrencies

I have not tested sending params, so you should not expect anything to work if you send params..

## Installation
```bash
$ npm install --save cryptopia-client
```

## Usage
```js
var CryptopiaClient = require("cryptopia-client");
```
(These keys can be created at https://www.cryptopia.co.nz/Security when you are logged into your cryptopia account...)
```js
var keys = {
	api_key: "get your own damn api key",
	secret_key: "get your own damn secret key"
}

var client = new CryptopiaClient(keys);

client.GetBalance(callback);

function callback(error, data) {
	if(error) console.log("E!",error)

	console.log("Data: ", data);
}
```
or
```js
client.GetCurrencies(callback);

function callback(error, data) {
	if(error) console.log("Error", error)

	console.log("Data: ", data);
}
```

