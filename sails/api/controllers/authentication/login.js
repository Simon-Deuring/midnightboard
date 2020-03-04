module.exports = {

  friendlyName: 'Login user',

  description: 'Login existing user, using username OR email. When successfully logged in,'
    + ' a JWT Access Token, and a JWT Refresh token is returned.',

  inputs: {
    userName: {
      description: 'Username used to log in.',
      type: 'string'
    },
    email: {
      description: 'Email used to log in',
      type: 'string'
    },
    password: {
      description: 'Password used to log in.',
      type: 'string'
    }
  },

  exits: {
    success: {
      responseType: '',
      statusCode: 200
    },
    missingParams: {
      description: 'Missing parameters',
      statusCode: 400
    },
    invalidLogin: {
      description: 'Invalid E-Mail address',
      statusCode: 403
    },
    serverError: {
      description: 'An unexpected server error occured',
      statusCode: 500
    }
  },

  fn: async function(inputs, exits) {
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');

    var usr = null;
    if(!inputs.password) {
      return exits.missingParams('password and email or userName are required');
    }
    if(inputs.userName) {
      usr = await Member.findOne({userName: inputs.userName});
    } else if(inputs.email) {
      usr = await Member.findOne({email: inputs.email});
    } else {
      return exits.missingParams('password and email or userName are required');
    }
    if(!usr) {
      return exits.invalidLogin('Incorrect username or password');
    }

    try {
      sails.log.verbose('AUTH_LOGIN::: Trying to log in user ' + usr.userName);
      if(await bcrypt.compare(inputs.password, usr.password)) {
        const tokenData = {name: usr.userName, id: usr.id}; // Data that is stored within each JWT

        const acessToken = jwt.sign(tokenData, sails.config.jwts.ACCESS_TOKEN_SECRET,
          { expiresIn: sails.config.jwts.EXPIRATION_TIME });
        const refreshToken = jwt.sign(tokenData, sails.config.jwts.REFRESH_TOKEN_SECRET);
        await RefreshToken.create({uid: usr.id, refreshToken: refreshToken}); // Save refresh token to database

        return exits.success({accessToken: acessToken, refreshToken: refreshToken});
      } else {
        return exits.invalidLogin('Incorrect username or password');
      }
    } catch(err) {
      sails.log.debug('AUTH_LOGIN_ERR::: ' + err);
      return exits.serverError();
    }
  }
};
