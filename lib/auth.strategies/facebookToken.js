/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth2,
    url = require("url"),
    http = require('http');

module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};

  // Construct the internal OAuth client
  my._oAuth= new OAuth(options.appId,  options.appSecret,  "https://graph.facebook.com");
  my._redirectUri= options.callback;
  my.scope= options.scope || "";
  my.display =options.display || "page";

  // Give the strategy a name
  that.name  = options.name || "facebookToken";

  // Build the authentication routes required
  that.setupRoutes= function(app) {
    app.use('/auth/facebook_callback', function(req, res){
      req.authenticate([that.name], function(error, authenticated) {
        res.writeHead(303, { 'Location': req.session.facebook_redirect_url });
        res.end('');
      });
    });
  }

  // Declare the method that actually does the authentication
  that.authenticate= function(request, response, callback) {
    //todo: makw the call timeout ....
    var parsedUrl = url.parse(request.originalUrl, true);
    // console.log('parsedUrl:', parsedUrl, request.getAuthDetails());
    var self = this;

    if(parsedUrl.query && parsedUrl.query.access_token) {
      if( parsedUrl.query.error_reason == 'user_denied' ) {
        // console.log('user_denied');
        self._facebook_fail(callback);
      } else {
        request.session["access_token"]= parsedUrl.query.access_token;

        my._oAuth.getProtectedResource("https://graph.facebook.com/me", request.session["access_token"], function (error, data, response) {
          if( error ) {
            // console.error('error:', error);
            self.fail(callback);
          }else {
            // console.error('success:', data);
            self.success(JSON.parse(data), callback)
          }
        });
      }
    }else{
      // console.log('miss criteria parsedUrl.query:', parsedUrl.query);
      self.fail(callback);
    }

  }
  return that;
};
