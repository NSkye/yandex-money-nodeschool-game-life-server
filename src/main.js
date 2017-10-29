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
const QS = require('querystring');
const WS = require('ws');
const LifeGameVirtualDom = require('../lib/LifeGameVirtualDom');

const socket = new WS.Server({port: 3001});

const gameInstance = new LifeGameVirtualDom();
gameInstance.sendUpdates = data => {
  const type = "UPDATE_STATE";
  try {
    socket.clients.forEach(client => {
      if (client.readyState === WS.OPEN) {
        client.send(JSON.stringify({type, data}));
      }
    });
  } catch (e) {
    console.log(e.message);
  }
};

const executeScenario = (msgdata) => {
  const allowedTypes = ['ADD_POINT'];
  const type = msgdata.type;
  const data = msgdata.data;
  switch (type) {
    case 'ADD_POINT':
      if (!data)
        throw new Error(`Message data error. No data.`);
      gameInstance.applyUpdates(data);
      break;
    default:
      throw new Error(`Message type error. Expected one of following types: ${allowedTypes}; got: ${type}`);
  }
}
const generateColor = (color) => {
  const getHex = () => Math.floor(Math.random() * 16).toString(16);
  color = [];
  let i = 3;
  while(i) {
    color.push(getHex());
    i--;
  }
  return `#${color.join('')}`
}
const handleConnection = (socket, req) => {
  const token = QS.parse(req.url.slice(2)).token;
  const color = (token.match(/^([0-9]|[A-F]){3}$/)) ? `#${token}` : generateColor(); //Если имя позволяет сгенерировать из него цвет, то почему бы и нет
  try {
    const data = {
      state: gameInstance.state,
      settings: gameInstance.settings,
      user: {token, color}
    };
    socket.send(JSON.stringify({type: 'INITIALIZE', data}));
  } catch (e) {
    console.log(e.message);
  }
  const handleMessage = msg => {
    try {
      const msgdata = JSON.parse(msg);
      executeScenario(msgdata);
    } catch (e) {
      return console.log(e.message);
    }
  }
  socket.on("message", handleMessage);
}

socket.on("connection", handleConnection);
