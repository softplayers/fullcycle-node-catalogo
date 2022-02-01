//import {SequenceHandler} from './'
//export class MySequence extends SequenceHandler {}

import {AuthenticateFn, AuthenticationBindings, AUTHENTICATION_STRATEGY_NOT_FOUND, USER_PROFILE_NOT_FOUND} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {FindRoute, InvokeMethod, ParseParams, Reject, RequestContext, Send, SequenceActions, SequenceHandler} from '@loopback/rest';
export class MySequence implements SequenceHandler {

  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject(AuthenticationBindings.AUTH_ACTION) private authenticationRequest: AuthenticateFn
  ) { }


  async handle(context: RequestContext): Promise<void> {
    try {
      const {request, response} = context;
      const route = this.findRoute(request);
      await this.authenticationRequest(request);
      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (error: any) {
      if (error.code === AUTHENTICATION_STRATEGY_NOT_FOUND || error.code === USER_PROFILE_NOT_FOUND) {
        Object.assign(error, {statusCode: 401});
      }
      this.reject(context, error);
    }
  }
}
