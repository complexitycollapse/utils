/*
  The cluster communicates over a multicast UDP port. Each node heartbeats to
  the port. One node is elected leader and if it goes down, another will be
  elected (bully algorithm). Once a node has connected to the cluster, it opens
  a TCP port for clients to connect.
  
  To become a client of the cluster, the prospective client broadcasts a member
  request to the UDP port and the leader responds with the TCP details of a
  member.
*/

import dgram     from 'node:dgram';
import { startServer } from "../../net/tcp-server.js";

export function iAmLeader() {
  return leader === procId;
}

let leader;
const procId = process.pid;
const peers = new Map();
let electionInProgress, joining = true, started = false, startFn, externalTcp;
let externalMsgFn, internalMsgFn;

console.log(`My PID is ${procId}`);

// UDP
const udp = dgram.createSocket({ type: 'udp4', reuseAddr: true });

udp.on('message', buf => {
  try { handleUdp(JSON.parse(buf)); } catch (e) { console.error(e); }
});

udp.bind(4242, () => {
  udp.addMembership("239.255.42.99");
  console.log(`UDP bound`);
});

// Send a message to all nodes
export function broadcast(obj) {
  const buf = Buffer.from(JSON.stringify(obj) + "\n");
  udp.send(buf, 0, buf.length, 4242, "239.255.42.99");
}

// Heartbeating
const HEARTBEAT_MS = 1000, DEAD_MS = 5000;
setInterval(() => {
  broadcast({
    type: 'heartbeat',
    procId, ts: Date.now(),
    leader: leader === procId,
    tcp: tcpDetails()
  });

  for (const [pid, p] of peers) if (Date.now() - p.lastSeen > DEAD_MS) {
    peers.delete(pid);
    console.log(`Peer ${pid} timed-out`);
    if (pid === leader) startElection();
  }
}, HEARTBEAT_MS);

// If we still haven't managed to contact any other nodes, become the leader.
setTimeout(() => {
  if (joining) {
    startElection();
  }
}, 1500);

function handleUdp(pkt) {
  if (pkt.procId === procId) return; // ignore own 

  switch (pkt.type) {
    case 'heartbeat':
      if (!peers.has(pkt.procId)) {
        console.log(`Received heartbeat from new node ${pkt.procId}`);
        if (joining && pkt.leader) {
          leader = pkt.procId;
          joining = false;
          console.log(`👑  Found leader: ${leader}`);
          start();
        }
      }
      peers.set(pkt.procId, { lastSeen: Date.now() });
      break;

    case 'election':
      if (pkt.procId < procId) {
        console.log(`Received election msg from ${pkt.procId}. Responding ok.`);
        broadcast({type: "ok", procId});
      } else {
        console.log(`Received election msg from ${pkt.procId}. Ignoring.`);
      }
      break;

    case "ok":
      console.log("Received ok from " + pkt.procId);
      electionInProgress = false;
      break;

    case 'winner':
      leader = pkt.procId;
      electionInProgress = false;
      console.log(`👑  New leader: ${leader}`);
      start();
      break;
    default:
      internalMsgFn(pkt);
      break;
  }
}

function startElection() {
  console.log('🔄  Starting election');
  joining = false;
  leader = null;
  electionInProgress = true;
  broadcast({ type: 'election', procId });
  // If nobody higher responds in 2 s, declare yourself leader
  setTimeout(() => { if (electionInProgress) announceWinner(); }, 2000);
}

function announceWinner() {
  leader = procId;
  broadcast({ type: 'winner', procId });
  console.log(`👑  I am the new leader (${procId})`);
  start();
}

function start() {
  if (started) {
    return;
  }

  started = true;
  console.log("Starting server");

  externalTcp = startServer(0, {
    onMsg: (msg, sock) => {
      try {
        console.log(`MSG from ${sock.remotePort}:`, JSON.stringify(msg));
        externalMsgFn(msg);
      } catch (e) {
        console.error(e);
      }
    },
    onConnected: socket => {
      console.log(`Connection from ${socket.remoteHost}:${socket.remotePort}`);
    },
    onListening: () => {
      console.log(`External TCP listening on ${externalTcp.address().port}`);
      startFn();
      startFn = undefined;
    }
  });
}

export function setStart(fn) {
  startFn = fn;
}

export function setMsgHandlers(internalFn, externalFn) {
  internalMsgFn = function(msg) {
    try {
      internalFn(msg);
    } catch (e) {
      console.error(e);
    }
  };

  externalMsgFn = function(msg) {
    try {
      externalFn(msg);
    } catch (e) {
      console.error(e);
    }
  };
}

export function sendToLeader(msg) {
  msg.procId = procId;
  msg.forLeader = true;

  if (iAmLeader()) {
    internalMsgFn(msg);
    return true;
  }

  const target = peers.get(leader);

  if (!target) {
    return false;
  }

  broadcast(msg);
  return true;
}

export function tcpDetails() {
  if (externalTcp) {
    return { host: externalTcp.address().host, port: externalTcp.address().port };
  }
}
