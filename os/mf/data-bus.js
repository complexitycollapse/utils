let idCounter = 0;

export function DataBus() {
  let obj = {
    state: "uninitialised",
    processesByName: new Map(),
    processesById: new Map(),
    start() {
      obj.state = "running";
    },
    stop() {
      obj.state = "stopping";
      obj.processesById.forEach(p => obj.stopProcess(p.id));
      obj.state = "stopped";
    },
    startProcess(name, callback) {
      if (obj.state !== "running") {
        console.log("DataBus is not running");
        return;
      }

      const instances = obj.processesByName.get(name);
      let instanceNumber;

      if (!instances) {
        instanceNumber = 1;
        obj.processesByName.set(name, new Map());
      } else {
        instanceNumber = Math.max(0, ...instances.keys()) + 1;
      }

      const process = Process(++idCounter, name, instanceNumber, callback);
      obj.processesByName.get(name).set(instanceNumber, process);
      obj.processesById.set(process.id, process);
      return process.id;
    },
    stopProcess(id) {
      const process = obj.processesById.get(id);
      obj.processesById.delete(id);
      obj.processesByName.get(process.name).delete(process.instance);
      process.state = "stopped";
    },
    getProcessDetails(id) {
      return obj.processesById.get(id);
    },
    getInstances(name) {
      return obj.processesByName.get(name) ?? [];
    },
    getAllProcesses() {
      return Array.from(obj.processesById.values());
    }
  };

  return obj;
}

function Process(id, name, instance, callback) {
  let obj = {
    id,
    name,
    instance,
    callback,
    state: "uninitialised"
  };

  return obj;
}

export function dataBusCommand(parms, dataBus) {
  const command = parms.command;
  if (command === "start") {
    dataBus.start();
    console.log("Data bus started");
  } else if (command === "stop") {
    dataBus.stop();
    console.log("Data bus stopped");
  } else if (command === "startprocess") {
    const id = dataBus.startProcess("test", () => console.log("Test process running"));
    if (id) {
      console.log("Process started with id: " + id);
    }
  } else if (command === "stopprocess") {
    ensureParm(parms, "id", id => {
      dataBus.stopProcess(id);
      console.log("Process stopped with id: " + id);
    });
  } else if (command === "details") {
    ensureParm(parms, "id", id => {
      const process = dataBus.getProcessDetails(id);
      console.log(process ?? "Process not found");
    });
  } else if (command === "instances") {
    ensureParm(parms, "name", name => {
      const instances = dataBus.getInstances(name);
      console.log(instances ?? "No instances found");
    });
  } else if (command === "list") {
    const processes = dataBus.getAllProcesses();
    console.log(processes);
  }
}

function ensureParm(parms, name, callback) {
  const parm = parms[name];
  if (parm === undefined) {
    console.log(`Missing ${name} parameter`);
    return;
  }
  return callback(parm);
}
