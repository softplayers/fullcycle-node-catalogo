import {AuthorizationContext, AuthorizationDecision, AuthorizationMetadata, Authorizer} from '@loopback/authorization';
import {Provider} from '@loopback/context';

export class SubscriberAuthorizationProvider implements Provider<Authorizer> {

  constructor() {}

  value() {
    return this.authorize.bind(this)
  }

  async authorize(authorizationCtx: AuthorizationContext, metadata: AuthorizationMetadata) {

    const allowedRoles = metadata.allowedRoles;
    const userRoles = authorizationCtx.principals[0].roles;
    return allowedRoles?.find(r => userRoles.includes(r))
      ? AuthorizationDecision.ALLOW
      : AuthorizationDecision.DENY;
  }

}
