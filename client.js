var	https 				= require("https"),
	crypto 				= require("crypto");

function CryptopiaClient(keys){
	var self 	= this;
	self.keys 	= keys;

	function fetch_data(api_method, callback, is_private, params) {

		//If it's a public method, make public request
		if(!is_private){
			return public_request(callback, api_method, params);
		} else {
			//If it's a private method, make a private request
			//If any keys are missing, throw an error...
			if(!self.keys.api_key || !self.keys.secret_key){
				throw new Error("I couldn't find one of the keys.");
			} else {
				return private_request(callback, api_method, params);
			}
		} 
	}

	function public_request(callback, api_method, params) {
		var params = params || {}

		var options = {
			host: 'www.cryptopia.co.nz',
			path: '/Api/' + api_method,
			method: 'GET'
		}
		sendRequestCallback(callback, options, '');
		
	}

	function private_request(callback, api_method, params) {
		var params = params || {}
		var amx_value = generate_amx(params, api_method);
		var body = JSON.stringify(params);
		var headers = { 
		 'Authorization': amx_value, 
		 'Content-Type':'application/json; charset=utf-8',
		 'Content-Length' : Buffer.byteLength(body),
		};

		var options = {
			host: 'www.cryptopia.co.nz',
			path: '/Api/' + api_method,
			method: 'POST',
			headers: headers
		}
		//console.log(options)
		sendRequestCallback(callback, options, body);
	}
	
	
    var sendRequestCallback = function(callback, options, body) {
		var req = https.request(options, (res) => {
			var json = "";
			res.setEncoding('utf8');
			res.on('data', (chunk) => {
				json += chunk;
			});
			res.on('end', () => {
				console.log(json);
				result = JSON.parse(json);
				//if (result.Success) {
				callback.call(this, null, result.Data);
				//} else {
					// it is actually an error
					//callback.call(this, e, null);
				//}
			})
		});

		req.on('error', (e) => {
			callback.call(this, e, null);
		});

		req.write(body);
		req.end();
    };

	function generate_amx(params, api_method) {
			//I made this function out of a block of code that can be found here https://www.cryptopia.co.nz/Forum/Thread/262
			var nonce = Math.floor(new Date().getTime() /10);
			var md5 = crypto.createHash('md5').update( JSON.stringify( params ) ).digest();
			var requestContentBase64String = md5.toString('base64');
			var signature = self.keys.api_key + "POST" + encodeURIComponent( 'https://www.cryptopia.co.nz/Api/' + api_method ).toLowerCase() + nonce + requestContentBase64String;
			var hmacsignature = crypto.createHmac('sha256', new Buffer( self.keys.secret_key, "base64" ) ).update( signature ).digest().toString('base64');
			var amx = "amx " + self.keys.api_key + ":" + hmacsignature + ":" + nonce;

			return amx;
	}

	// public methods
	self.GetCurrencies = (callback, params) => {
		fetch_data('GetCurrencies', callback, false);
	};
	
	self.GetMarketOrders = (callback, market, count) => {
		if (market) {
			market = market.replace('/', '_');
		}
		fetch_data( 'GetMarketOrders/' + market + '/' + count, callback, false);
	};

	// private methods
	self.GetBalance = (callback, currency) => {
		var params = {Currency : currency};
		
		fetch_data('GetBalance', callback, true, params);
	};

	self.GetOpenOrders = (callback, market) => {
		var params = {Market : market};
		fetch_data('GetOpenOrders', callback, true, params);
	};
	
	self.GetTradeHistory = (callback, market, count) => {
		var params = {Market : market, Count: count};
		fetch_data('GetTradeHistory', callback, true, params);
	};

	self.SubmitTrade = (callback, market, tradeType, rate, amount) => {
		var params = {Market : market, Type : tradeType, Rate : rate, Amount : amount};
		fetch_data('SubmitTrade', callback, true, params);
	};

	self.CancelTrade = (callback, orderId) => {
		var params = {Type : 'Trade', OrderId : orderId};
		fetch_data('CancelTrade', callback, true, params);
	};

	self.CancelAllTrades = (callback) => {
		var params = {Type : 'All'};
		fetch_data('CancelTrade', callback, true, params);
	};
	
}

module.exports = CryptopiaClient;