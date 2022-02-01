module.exports = {
  rest: {
    port: +(process.env.PORT ?? 3000),
    host: process.env.HOST,
    // The `gracePeriodForClose` provides a graceful close for http/https
    // servers with keep-alive clients. The default value is `Infinity`
    // (don't force-close). If you want to immediately destroy all sockets
    // upon stop, set its value to `0`.
    // See https://www.npmjs.com/package/stoppable
    gracePeriodForClose: 5000, // 5 seconds
    openApiSpec: {
      // useful when used with OpenAPI-to-GraphQL to locate your application
      setServersFromRequest: true,
    },
  },
  rabbitmq: {
    uri: process.env.RABBITMQ_URI,
    defaultHandlerError: parseInt(process.env.RABBITMQ_HANDLER_ERROR ?? '0'),
    exchanges: [{name: 'dlx.amq.topic', type: 'topic'}],
    queues: [
      {
        name: 'dlx.sync-videos',
        options: {
          deadLetterExchange: 'amq.topic',
          messageTtl: 20000
        },
        exchange: {
          name: 'dlx.amq.topic',
          routingKey: 'model.*.*',
        },
      }
    ],
  },
  jwt: {
    secret: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuoyalHCjvRJPCbZf+m1w+cko2lITMZnPjJa/Ctg9lQDJPSuaIjaDJIgokJeXfGsHPI7x6ib14yDgbHdusF8/xm9zQXFnYzHjOnAjBbMAM37n7F1A5tnz0AY5UIf273vNFHLWW0witRMTPOwCqRTsLOnBdpleCbrkbY0pGLapoZPF28+9mKizgIdbgihqNBK+ho0vYG26VzqKHsz5VLHPyWfX8lrglzc940Tf+NOVMlBeycYREL174imQF50ZlftrQYacThXTiUdVtJcsoE7QL935j7gwVchH/YMouK/Ldch9BUsI3euOKWX4o4kbYHzn4cEloV4smGeq1LXfCcbrnwIDAQAB\n-----END PUBLIC KEY-----",
    _algorithms: ["RS256"]
  }
};
