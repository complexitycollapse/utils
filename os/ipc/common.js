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
