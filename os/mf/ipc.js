let nextMessageId = 1;

export function messageStream(stream) {
  let conversations = new Map();

  let obj = {
    stream,
    send(payload, callback) {
      const message = { messageId: nextMessageId++, payload, action: "send" };
      if (callback) {
        conversations.set(message.messageId, callback);
      }
      const messageString = JSON.stringify(message) + '\n';
      stream.write(messageString);
      return nextMessageId;
    },
    reply(originalMessage, payload) {
      const reply = { messageId: originalMessage.messageId, payload, action: "reply" };
      const replyString = JSON.stringify(reply) + '\n';
      stream.write(replyString);
    },
    ack(message) {
      obj.reply({ type: "ack" }, message);
    },
    setHandler(callback) {
      obj.callback = callback;
    },
    setErrorHandler(callback) {
      obj.errorCallback = callback;
    },
    listen(callback, badMessageCallback) {
      obj.setHandler(callback);
      obj.setErrorHandler(badMessageCallback);
      listenOnDelimitedStream(
        stream,
        message => processMessage(message, obj.callback), message => obj.badMessageCallback(message));
    },
    end() {
      return stream.end();
    }
  };

  function processMessage(message, callback) {
    if (message.action === "reply") {
      const replyCallback = conversations.get(message.messageId);
      if (replyCallback) {
        conversations.delete(message.messageId);
        replyCallback(message);
        conversations.delete(message.messageId);
      } else {
        console.error("Unexpected reply. Message was: ", message);
      }
    } else {
      callback(message);
    }
  }

  return obj;
}

export function listenOnDelimitedStream(stream, callback, badMessageCallback) {
  let buffer = '';

  stream.on('data', (data) => {
    buffer += data.toString();

    let boundary;
    while ((boundary = buffer.indexOf('\n')) !== -1) {
      const message = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 1);

      let response;
      try {
        response = JSON.parse(message);
      } catch (err) {
        badMessageCallback(message);
        return;
      }

      callback(response);
    }
  });

  stream.on('end', () => {
    buffer = '';
  });
}

export function makeStreamPair() {
  const near = InternalStream(), far = InternalStream();
  near.other = far;
  far.other = near;
  return [near, far];
}

function InternalStream() {
  let stream = {
    onDataCallback,
    onEndCallback,
    write(messageString) {
      setImmediate(stream.other.onDataCallback?.(messageString));
    },
    end() {
      setImmediate(stream.other.onEndCallback?.());
    },
    on(event, callback) {
      switch (event) {
        case "data":
          stream.onDataCallback = callback;
          break;
        case "end":
          stream.onEndCallback = callback;
          break;
        default:
          throw new Error("InternalStream does not support event " + event);
      }
    }
  };

  return stream;
}
