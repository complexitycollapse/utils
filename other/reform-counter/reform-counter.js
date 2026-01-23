import * as fs from "fs";

async function loop() {
  try {
    const response = await fetch("https://pro-worker.reformparty.uk/ticker/count");
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    const output = `${new Date(Date.now()).toISOString()} ${json["current_total"]}\n`;
    console.log(output);
    fs.appendFileSync("reform-counter.txt", output);
    setTimeout(loop, 1000 * 60 * 60);
  } catch (error) {
    console.error(error);
    setTimeout(loop, 1000 * 60 * 5);
  }
}

loop();
