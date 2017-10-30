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
const Koa = require('koa');
const app = new Koa();
const server = require('http').createServer(app.callback());
const io = require('socket.io')(server, {
  transport: ['websocket'],
  path: '/'
});
app.use(ctx => {
  ctx.body = 'sry, websockets only :c'
});

const applyGameUpdates = data => {
  if (!data)
    throw new Error(`Message data error: no data`);
  gameInstance.applyUpdates(data);
}

const executeScenario = message => {
  const allowedTypes = ['ADD_POINT'];
  const type = message.type;
  const data = message.data;
  switch (type) {
    case 'ADD_POINT':
      applyGameUpdates(data);
      break;
    default:
      throw new Error(`Message type error: expected one of types ${allowedTypes}; got: ${type}`);
  }
}
const generateColor = () => {
  const getHex = () => Math.floor(Math.random() * 16).toString(16);
  let color = [];
  let i = 3;
  while(i) {
    color.push(getHex());
    i--;
  }
  return `#${color.join('')}`;
}
const handleMessage = message => {
  try {
    executeScenario(message);
  }
  catch (e) {
    console.log(e.message);
  }
}
const handleConnection = socket => {
  socket.on('message', handleMessage);
  try {
    const token = socket.handshake.query.token;
    console.log(`Someone connected. Token: ${token}`)
    const color = (token.match(/^([0-9]|[A-F]){3}$/)) ? `#${token}` : generateColor();
    const data = {
      state: gameInstance.state,
      settings: gameInstance.settings,
      user: { token, color }
    }
    socket.emit('message', {type: "INITIALIZE", data});
  } catch (e) {
    console.log(e.message);
  }
}

server.listen(3001);

io.on('connection', handleConnection);

const gameInstance = new LifeGameVirtualDom();
gameInstance.sendUpdates = data => {
  const type = "UPDATE_STATE";
  try {
    io.emit('message', {type, data});
  } catch (e) {
    console.log(e.message);
  }
};
