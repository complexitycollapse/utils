// A test client

import dgram     from 'node:dgram';
import net       from 'node:net';
import * as tcp from "../../net/tcp-client.js";

const pid = process.pid;
const udp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
let client;

udp.on('message', buf => {
  try { handleUdp(JSON.parse(buf)); } catch (e) { console.error(e); }
});

udp.bind(4242, () => {
  udp.addMembership("239.255.42.99");
  console.log(`UDP bound`);
  broadcast({ type: "member request", clientId: pid });
});

function broadcast(obj) {
  const buf = Buffer.from(JSON.stringify(obj));
  udp.send(buf, 0, buf.length, 4242, "239.255.42.99");
}

function handleUdp(msg) {
  if (msg.type != "member response" || msg.clientId != pid ) { return; }
  console.log(msg);

  const { host, port } = msg;

  tcp.connect(host, port, msg => {
    console.log(msg);
  }, socket => {
    client = socket;
    tcp.send(client, { type: "write", topic: "foo", key: "bar", payload: {x: "y"}, consumerGroup: "me" });
  });
}

// TODO: create consumer groups (automatic), external TCP in server,
// lots more resilience, persistence, bootstrapping
