let nextMessageId = 1;

export function messageStream(stream) {
  let conversations = new Map();

  return {
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
    reply(payload, messageId) {
      const message = { messageId, payload, action: "reply" };
      const messageString = JSON.stringify(message) + '\n';
      stream.write(messageString);
    },
    listen(callback, badMessageCallback) {
      listenOnDelimitedStream(stream, message => processMessage(message, callback), badMessageCallback);
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
