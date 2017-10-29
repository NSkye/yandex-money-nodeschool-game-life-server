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
const WS = require('ws');
const LifeGameVirtualDom = require('../lib/LifeGameVirtualDom');

const socket = new WS.Server({port: 3001});

const gameInstance = new LifeGameVirtualDom();
gameInstance.sendUpdates = data => {
  const type = "UPDATE_STATE";
  try {
    let i = socket.clients.length;
    while (socket.clients[i]) {
      if(clients[i].readyState === WS.OPEN) {
        clients[i].send(JSON.stringify({type, data}));
      }
      i--;
    }
  } catch (e) {
    console.log(e.message);
  }
};

const types = {
  'ADD_POINT': data => {
    gameInstance.applyUpdates(data);
  }
}

const generateColor = (color) => {
  if (color)
    return `#${color}`;
  const getHex = () => Math.floor(Math.random() * 16).toString(16);
  color = [];
  let i = 3;
  while(i) {
    color.push(getHex());
    i--;
  }
  return `#${color.join('')}`
}

const parseInternalURL = (url, parameter) => {
  const params = {};
  url.replace('/?', '').split('&').map(a => {a = a.split('='), params[a[0]]=a[1]});
  if (parameter) {
    if (!params.hasOwnProperty(parameter))
      throw new Error(`Parameter ${parameter} not found`);
    return params[parameter];
  }
  return params;
}

socket.on("connection", (socket, req) => {
  const token = parseInternalURL(req.url, 'token');
  const color = (token.match(/^([0-9]|[A-F]){3}$/)) ? generateColor(token) : generateColor(); //Если имя позволяет сгенерировать из него цвет, то почему бы и нет
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

  socket.on("message", msg => {
    try {
      const msgdata = JSON.parse(msg);
      if (!types[msgdata.type])
        throw new Error(`Message type error. Expected one of following types: ${Object.keys(types)}; got: ${msgdata.type}`);
      if (!msgdata.data)
        throw new Error(`Message data error. No data.`)
      types[msgdata.type](msgdata.data);
    } catch (e) {
      return console.log(e.message);
    }
  });
});
