const config = require('config');
const natUpnp = require('@runonflux/nat-upnp');
const serviceHelper = require('./serviceHelper');
const verificationHelper = require('./verificationHelper');

const log = require('../lib/log');

const client = new natUpnp.Client();

async function verifyUPNPsupport(apiport = config.apiport) {
  try {
    // run test on apiport + 1
    await client.getPublicIp();
    await client.getGateway();
    await client.createMapping({
      public: +apiport + 1,
      private: +apiport + 1,
      ttl: 0,
    });
    await client.removeMapping({
      public: +apiport + 1,
    });
    await client.getMappings();
    return true;
  } catch (error) {
    log.error(error);
    return false;
  }
}

async function setupUPNP(apiport = config.apiport) { // todo evaluate adding ssl port of + 1
  try {
    await client.createMapping({
      public: +apiport,
      private: +apiport,
      ttl: 0,
    });
    await client.createMapping({
      public: +apiport - 1,
      private: +apiport - 1,
      ttl: 0,
    });
    return true;
  } catch (error) {
    log.error(error);
    return false;
  }
}

async function mapUpnpPort(port) {
  try {
    await client.createMapping({
      public: port,
      private: port,
      ttl: 0,
      protocol: 'TCP',
    });
    await client.createMapping({
      public: port,
      private: port,
      ttl: 0,
      protocol: 'UDP',
    });
    return true;
  } catch (error) {
    log.error(error);
    return false;
  }
}

async function removeMapUpnpPort(port) {
  try {
    await client.removeMapping({
      public: port,
      protocol: 'TCP',
    });
    await client.removeMapping({
      public: port,
      protocol: 'UDP',
    });
    return true;
  } catch (error) {
    log.error(error);
    return false;
  }
}

async function mapPortApi(req, res) {
  try {
    const authorized = await verificationHelper.verifyPrivilege('adminandfluxteam', req);
    if (authorized) {
      let { port } = req.params;
      port = port || req.query.port;
      if (port === undefined || port === null) {
        throw new Error('No Port address specified.');
      }
      port = serviceHelper.ensureNumber(port);
      await client.createMapping({
        public: port,
        private: port,
        ttl: 0,
        protocol: 'TCP',
      });
      await client.createMapping({
        public: port,
        private: port,
        ttl: 0,
        protocol: 'UDP',
      });
      const message = serviceHelper.createSuccessMessage('Port mapped');
      res.json(message);
    } else {
      const errMessage = serviceHelper.errUnauthorizedMessage();
      res.json(errMessage);
    }
  } catch (error) {
    log.error(error);
    const errorResponse = serviceHelper.createErrorMessage(
      error.message || error,
      error.name,
      error.code,
    );
    res.json(errorResponse);
  }
}

async function removeMapPortApi(req, res) {
  try {
    const authorized = await verificationHelper.verifyPrivilege('adminandfluxteam', req);
    if (authorized) {
      let { port } = req.params;
      port = port || req.query.port;
      if (port === undefined || port === null) {
        throw new Error('No Port address specified.');
      }
      port = serviceHelper.ensureNumber(port);
      await client.removeMapping({
        public: port,
        protocol: 'TCP',
      });
      await client.removeMapping({
        public: port,
        protocol: 'UDP',
      });
      const message = serviceHelper.createSuccessMessage('Port unmapped');
      res.json(message);
    } else {
      const errMessage = serviceHelper.errUnauthorizedMessage();
      res.json(errMessage);
    }
  } catch (error) {
    log.error(error);
    const errorResponse = serviceHelper.createErrorMessage(
      error.message || error,
      error.name,
      error.code,
    );
    res.json(errorResponse);
  }
}

module.exports = {
  verifyUPNPsupport,
  setupUPNP,
  mapUpnpPort,
  removeMapUpnpPort,
  mapPortApi,
  removeMapPortApi,
};