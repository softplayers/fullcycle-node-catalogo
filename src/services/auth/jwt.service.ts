// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/authentication-jwt
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {TokenService} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {promisify} from 'util';
import {JwtBindings} from '../../keys';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class JWTService implements TokenService {
  constructor(
    @inject(JwtBindings.CONFIG)
    private jwtConfig: {
      secret: string;
      algorithms: string[]
    }
  ) { }

  async verifyToken(token: string): Promise<any> {
    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : 'token' is null`,
      );
    }

    let userProfile: UserProfile;

    try {
      // decode user profile from token
      const decodedToken = await verifyAsync(token, this.jwtConfig.secret, this.jwtConfig.algorithms);
      // don't copy over  token field 'iat' and 'exp', nor 'email' to user profile
      userProfile = Object.assign(
        {[securityId]: '', name: ''},
        {
          [securityId]: decodedToken.id,
          name: decodedToken.name,
          id: decodedToken.id,
        },
      );
    } catch (error: any) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error?.message}`,
      );
    }
    return userProfile;
  }

  async generateToken(userProfile: any): Promise<string> {
    throw new Error("Not implemented");
  }
}
