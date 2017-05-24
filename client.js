var request		= require('request');
var crypto		= require('crypto');
var querystring	= require('querystring');

/**
 * cryptopiaClient connects to the cryptopia.com API
 * @param {String} key    API Key
 * @param {String} secret API Secret
 * @param {String} [otp]  Two-factor password (optional) (also, doesn't work)
 */
function CryptopiaClient(keys, otp, params) {
	var self = this;

	var config = {
		url: 'https://www.cryptopia.co.nz',
		version: 'api',
		key: keys.api_key,
		secret: keys.secret_key,
		otp: otp,
		timeoutMS: 5000,
		nonce: Math.floor(new Date().getTime() / 1000)
	};

	/**
	 * This method makes a public or private API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	function api(method, params, callback) {
		var methods = {
			public: ['GetCurrencies', 'GetTradePairs', 'GetMarkets', 'GetMarket', 'GetMarketHistory', 'GetMarketOrders'],
			private: ['GetBalance', 'GetDepositAddress', 'GetOpenOrders', 'GetTradeHistory', 'GetTransactions', 'SubmitTrade', 'CancelTrade', 'SubmitTip']
		};

		if(params === null){
			params = {};
		}

		if(methods.public.indexOf(method) !== -1) {
			return publicMethod(method, params, callback);
		}
		else if(methods.private.indexOf(method) !== -1) {
			return privateMethod(method, params, callback);
		}
		else {
			throw new Error(method + ' is not a valid API method.');
		}
	}

	/**
	 * This method makes a public API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	function publicMethod(method, params, callback) {
		params = params || {};

		var path	= '/' + config.version + '/' + method;
		var url		= config.url + path;

		return rawGetRequest(url, {}, params, callback);
	}

	/**
	 * This method makes a private API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	function privateMethod(method, params, callback) {
		var path	= '/' + config.version + '/' + method;
		var url		= config.url + path;

		//params.nonce = new Date() * 1000; // spoof microsecond
		var signature = getMessageSignature(url, params, config.nonce);

		var headers = {
			'Authorization': signature
		};

		return rawRequest(url, headers, params, callback);
	}

	/**
	 * This method returns a signature for a request as a Base64-encoded string
	 * @param  {String}  path    The relative URL path for the request
	 * @param  {Object}  request The POST body
	 * @param  {Integer} nonce   A unique, incrementing integer
	 * @return {String}          The request signature
	 */
	function getMessageSignature(url, params, n) {
		var nonce = Math.floor(new Date().getTime() / 1000);
		var md5 = crypto.createHash('md5').update( JSON.stringify( params ) ).digest();
		var requestContentBase64String = md5.toString('base64');
		//console.log(requestContentBase64String)
		//EVERYTHING IS THE SAME AT THIS POINT! (except)
		var signature = config.key + "POST" + encodeURIComponent( url ).toLowerCase() + nonce + requestContentBase64String;
		var hmacsignature = crypto.createHmac('sha256', new Buffer( config.secret, "base64" ) ).update( signature ).digest().toString('base64');
		var header_value = "amx " + config.key + ":" + hmacsignature + ":" + nonce;

		/*var message	= querystring.stringify(request);
		var secret	= new Buffer(config.secret, 'base64');
		var hash	= new crypto.createHash('sha256');
		var hmac	= new crypto.createHmac('sha512', secret);

		var hash_digest	= hash.update(nonce + message).digest('binary');
		var hmac_digest	= hmac.update(path + hash_digest, 'binary').digest('base64');*/

		return header_value;
	}

	/**
	 * This method sends the actual HTTP request
	 * @param  {String}   url      The URL to make the request
	 * @param  {Object}   headers  Request headers
	 * @param  {Object}   params   POST body
	 * @param  {Function} callback A callback function to call when the request is complete
	 * @return {Object}            The request object
	 */
	function rawRequest(url, headers, params, callback) {
		// Set custom User-Agent string
		headers['Content-Type'] = 'application/json; charset=utf-8';

		var options = {
			host: "www.cryptopia.co.nz",
			path: '/api/GetBalance',
			method: 'POST',
			url: url,
			headers: headers
		};

		console.log(options)

		var req = request.post(options, function(error, response, body) {
			if(typeof callback === 'function') {
				var data;

				if(error) {
					return callback.call(self, new Error('Error in server response: ' + JSON.stringify(error) + " :response: " + error), null);
				}

				try {
					data = JSON.parse(body);
				}
				catch(e) {
					return callback.call(self, new Error('Could not understand response from server: ' + JSON.stringify(response.body)), null);
				}
				//If any errors occured, cryptopia will give back an array with error strings under
				//the key "error". We should then propagate back the error message as a proper error.
				if(data.error && data.error.length) {
					var cryptopiaError = null;
					data.error.forEach(function(element) {
						if (element.charAt(0) === "E") {
							cryptopiaError = element.substr(1);
							return false;
						}
					});
					if (cryptopiaError) {
						return callback.call(self, new Error('Cryptopia API returned error: ' + cryptopiaError), null);
					}
				}
				else {
					return callback.call(self, null, data);
				}
			}
		});
		return req;
	}

	function rawGetRequest(url, headers, params, callback) {
		// Set custom User-Agent string
		headers['Content-Type'] = 'application/json; charset=utf-8';

		var options = {
			url: url,
			method: 'GET',
			headers: headers,
			form: params,
			timeout: config.timeoutMS
		};

		console.log(options)

		var req = request.get(options, function(error, response, body) {
			if(typeof callback === 'function') {
				var data;

				if(error) {
					return callback.call(self, new Error('Error in server response: ' + JSON.stringify(error) + " :response: " + error), null);
				}

				try {
					data = JSON.parse(body);
				}
				catch(e) {
					return callback.call(self, new Error('Could not understand response from server: ' + body), null);
				}
				//If any errors occured, cryptopia will give back an array with error strings under
				//the key "error". We should then propagate back the error message as a proper error.
				if(data.error && data.error.length) {
					var cryptopiaError = null;
					data.error.forEach(function(element) {
						if (element.charAt(0) === "E") {
							cryptopiaError = element.substr(1);
							return false;
						}
					});
					if (cryptopiaError) {
						return callback.call(self, new Error('Cryptopia API returned error: ' + cryptopiaError), null);
					}
				}
				else {
					return callback.call(self, null, data);
				}
			}
		});
		return req;
	}

	self.api			= api;
	self.publicMethod	= publicMethod;
	self.privateMethod	= privateMethod;
}

module.exports = CryptopiaClient;
