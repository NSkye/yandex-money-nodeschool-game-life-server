'use strict';

//
// YOUR CODE GOES HERE...
//
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ░░░░░░░░░░▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄░░░░░░░░░░░
// ░░░░░░░░▄▀░░░░░░░░░░░░▄░░░░░░░▀▄░░░░░░░░
// ░░░░░░░░█░░▄░░░░▄░░░░░░░░░░░░░░█░░░░░░░░
// ░░░░░░░░█░░░░░░░░░░░░▄█▄▄░░▄░░░█░▄▄▄░░░░
// ░▄▄▄▄▄░░█░░░░░░▀░░░░▀█░░▀▄░░░░░█▀▀░██░░░
// ░██▄▀██▄█░░░▄░░░░░░░██░░░░▀▀▀▀▀░░░░██░░░
// ░░▀██▄▀██░░░░░░░░▀░██▀░░░░░░░░░░░░░▀██░░
// ░░░░▀████░▀░░░░▄░░░██░░░▄█░░░░▄░▄█░░██░░
// ░░░░░░░▀█░░░░▄░░░░░██░░░░▄░░░▄░░▄░░░██░░
// ░░░░░░░▄█▄░░░░░░░░░░░▀▄░░▀▀▀▀▀▀▀▀░░▄▀░░░
// ░░░░░░█▀▀█████████▀▀▀▀████████████▀░░░░░░
// ░░░░░░████▀░░███▀░░░░░░▀███░░▀██▀░░░░░░░
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
//
// Nyan cat lies here...
//
const LifeGameVirtualDom = require('../lib/LifeGameVirtualDom');
const http = require('http');
const socket_io = require('socket.io');

class LifeGameServer extends LifeGameVirtualDom {
  constructor(port, auth) {
    super();
    this.server = http.createServer(this.requestHandler);
    this.io = socket_io(this.server, {
      transports: ['websocket'],
      path: '/'
    });
    if (auth) {
      this.enableAuthentification();
    }
    this.bindListeners();
    this.server.listen(port);
  }

  requestHandler(req, res) {
    res.writeHead(200);
  }

  enableAuthentification() {
    this.io.use((socket, next) => {
      if (socket.handshake.query.token) {
        return next();
      }
      console.log('Refused connection: no token');
      next(new Error('Authentification error'));
    });
  }

  sendUpdates(data) {
    const type = 'UPDATE_STATE';
    try {
      this.io.emit('message', {type, data});
    } catch (e) {
      console.log(e.message);
    }
  }

  executeScenario(msg) {
    switch (msg.type) {
      case 'ADD_POINT':
        this.applyUpdates(msg.data);
        break;
      default:
        throw new Error(`Message type error: invalid message type ${msg.type}`);
    }
  }

  initializeGameOnClient(socket, token, color) {
    const data = {
      state: this.state,
      settings: this.settings,
      user: {token, color}
    };
    try {
      socket.emit('message', {type: 'INITIALIZE', data});
    } catch (e) {
      console.log(e.message);
    }
  }

  handleMessage(msg) {
      try {
        this.executeScenario(msg);
      } catch (e) {
        console.log(e.message);
      }
  }

  bindListeners() {
    this.io.on('connection', socket => {
      const token = socket.handshake.query.token;
      const color = (token.match(/^([0-9]|[A-F]){3}$/)) ? `#${token}` : this.generateColor();
      socket.on('message', this.handleMessage.bind(this));
      this.initializeGameOnClient(socket, token, color);
      console.log(`Someone connected. Token: ${token}`);
    });
  }

  generateColor() {
    return '#'+[0,0,0].map(rgb => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

new LifeGameServer(3001, true);
