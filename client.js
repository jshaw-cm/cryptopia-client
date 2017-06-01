var	https 				= require("https"),
		crypto 				= require("crypto");

function CryptopiaClient(keys){
	var self 		= this;
	self.keys 	= keys;

	function fetch_data(api_method, callback, params) {
		var methods = {
			private: 'GetBalance',
			public: 'GetCurrencies'
		}

		//If it's a public method, make public request
		if(methods.public.indexOf(api_method) > -1){
			return public_request(callback, api_method, params);
		} 

		//If it's a private method, make a private request
		else if(methods.private.indexOf(api_method) > -1){
			//If any keys are missing, throw an error...
			if(!self.keys.api_key || !self.keys.secret_key){
				throw new Error("I couldn't find one of the keys.");
			} else {
				return private_request(callback, api_method, params);
			}
		} 

		//Throw error if the api method doesn't exist
		else {
			throw new Error("The api method '" + api_method + "' isn't currently supported by this client.");
		}
	}

	function public_request(callback, api_method) {
		var params = params || {}

		var options = {
			host: 'www.cryptopia.co.nz',
			path: '/Api/' + api_method,
			method: 'GET'
		}

		var req = https.request(options, (res) => {
		  res.setEncoding('utf8');
		  res.on('data', (chunk) => {
				callback.call(this, null, chunk);
		  }); 	
		});

		req.on('error', (e) => {
			callback.call(this, e, null);
		});

		req.end();
	}

	function private_request(callback, api_method) {
		var params = params || {}
		var amx_value = generate_amx(params, api_method);

		var headers = { 
		 'Authorization': amx_value, 
		 'Content-Type':'application/json; charset=utf-8',
		};

		var options = {
			host: 'www.cryptopia.co.nz',
			path: '/Api/' + api_method,
			method: 'POST',
			headers: headers
		}
		console.log(options)
		var req = https.request(options, (res) => {
			var json = null;
		  res.setEncoding('utf8');
		  res.on('data', (chunk) => {
				json = chunk;
		  });
		  res.on('end', () => {
		  	callback.call(this, null, json);
		  })
		});

		req.on('error', (e) => {
			callback.call(this, e, null);
		});

		//write data to request body
		//This wouldn't work until I used this line...
		req.write(JSON.stringify(params));
		req.end();

	}

	function generate_amx(params, api_method) {
			//I made this function out of a block of code that can be found here https://www.cryptopia.co.nz/Forum/Thread/262
			var nonce = Math.floor(new Date().getTime() / 1000);
			var md5 = crypto.createHash('md5').update( JSON.stringify( params ) ).digest();
			var requestContentBase64String = md5.toString('base64');
			var signature = self.keys.api_key + "POST" + encodeURIComponent( 'https://www.cryptopia.co.nz/Api/' + api_method ).toLowerCase() + nonce + requestContentBase64String;
			var hmacsignature = crypto.createHmac('sha256', new Buffer( self.keys.secret_key, "base64" ) ).update( signature ).digest().toString('base64');
			var amx = "amx " + self.keys.api_key + ":" + hmacsignature + ":" + nonce;

			return amx;
	}

	self.GetCurrencies = (callback, params) => {
		fetch_data('GetCurrencies', callback);
	};

	self.GetBalance = (callback) => {
		fetch_data('GetBalance', callback);
	};
}

module.exports = CryptopiaClient;