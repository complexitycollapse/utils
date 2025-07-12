import * as cluster from "./cluster.js";

let bootstrapped = false;
const topics = new Map();

cluster.setStart(function () {
  console.log("Leader status: " + cluster.iAmLeader());
  requestBootstrap();
});

cluster.setMsgHandlers(handleInternalMsg, handleExternalMsg);

function handleExternalMsg(msg) {
  const sent = cluster.sendToLeader(msg);
}

function handleInternalMsg(msg) {
  if (cluster.iAmLeader()) {
    handleInternalMsgAsLeader(msg);
  } else {
    handleInternalMsgAsFollower(msg);
  }
}

function handleInternalMsgAsLeader(msg) {
  switch (msg.type) {
    case "bootstrap request":
      // send a bootstrap response
      break;
    case "member request":
      const address = cluster.tcpDetails();
      cluster.broadcast({ type: "member response", host: address.host, port: address.port, clientId: msg.clientId });
      break;
    case "write":
      const topic = topics.get(msg.topic) ?? addTopic(msg.topic);
      const partition = topic.partitions.get(msg.key) ?? topic.addPartition(msg.key);
      const offset = partition.top;
      // TODO: write msg to disk using offset
      partition.enqueue(msg.payload);
      cluster.broadcast({ type: "commit", payload: msg.payload, offset, topic: msg.topic, key: msg.key });
      break;
    case "read": {
      const partition = topics.get(msg.topic)?.partitions.get(msg.key);
      if (partition) {
        const offset = partition.offsets.get(msg.consumerGroup);
        const payload = partition.messages[offset];
        if (payload) {
          reply(msg, {type: "read response", status: "ok", payload });
          // Incrementing the offset now means we are using at-most-once semantics.
          // Would be nice to have at-least-once as an option.
          partition.offsets.set(msg.consumerGroup, offset + 1);
          return;
        }
      }
      reply(msg, { type: "read response", status: "not found" });
      break;
    }
  }
}

function handleInternalMsgAsFollower(msg) {

}

function requestBootstrap() {
  if (bootstrapped) { return; }
  if (cluster.iAmLeader()) {
    bootstrap();
  } else {
    cluster.sendToLeader({ type: "bootstrap request" });
    setTimeout(requestBootstrap, 1000);
  }
}

function bootstrap() {
  bootstrapped = true;
}

function Topic(name) {
  const obj = {
    name,
    partitions: new Map(),
    addPartition(key) {
      const partition = Partition(key);
      obj.partitions.set(key, partition);
      return partition;
    }
  };

  return obj;
}

function addTopic(name) {
  const topic = Topic(name);
  topics.set(name, topic);
  return topic;
}

function Partition(key) {
  let obj = {
    key,
    offsets: new Map(),
    messages: [],
    ages: [],
    top: 0,
    enqueue(msg, offset) {
      if (offset != undefined) {
        obj.messages[offset] = msg;
        obj.ages[offset] = Date.now();
        return offset;
      }
      const top = obj.top++;
      obj.messages[top] = msg;
      obj.ages[top] = Date.now();
      return top;
    }
  };

  return obj;
}
