import { ProcessDefinition, ProcessInstance, Query } from "../lib/APIObjects";
import { OperateApiClient } from "../";

const c = new OperateApiClient();
jest.setTimeout(15000)

xtest("It can get the Incident", async () => {
    const res = await c.searchIncidents({
      filter: { 
        processInstanceKey: 2251799816400111
      }
    })
    console.log(JSON.stringify(res, null, 2))
    expect(res.total).toBe(1)
})
xtest("It can search process definitions", async () => {
  const query: Query<ProcessDefinition> = {
    filter: {},
    size: 50,
    sort: [
      {
        field: "bpmnProcessId",
        order: "ASC",
      },
    ],
  };
  const defs = await c.searchProcessDefinitions(query);
  expect(defs.total).toBeGreaterThanOrEqual(0);
});

xtest("It can get a specific process definition", async () => {
  const p = await c.getProcessDefinition(2251799817140074);
  expect(p).toBeTruthy();
});

xtest("It can get the process definition XML", async () => {
  const p = await c.getProcessDefinitionXML(2251799817140074);
  expect(p).toBeTruthy();
});

xtest("It can search for process instances", async () => {
  const query: Query<ProcessInstance>  = {
    filter: {
      processVersion: 1
    },
    size: 50,
    sort: [
      {
        field: "bpmnProcessId",
        order: "ASC",
      },
    ],
  };
  const defs = await c.searchProcessInstances(query);
  expect(defs).toBeTruthy();
  const d = await c.searchProcessInstances({});
  expect(d).toBeTruthy();
});

xtest("It can find a specific process instance", async () => {
  const query: Query<ProcessInstance> = {
    filter: {
      processVersion: 1,
      key: 2251799819847322,
    },
    size: 50,
    sort: [
      {
        field: "bpmnProcessId",
        order: "ASC",
      },
    ],
  };
  const defs = await c.searchProcessInstances(query);
  expect(defs).toBeTruthy();
});

xtest("It can get a specific process instance", async () => {
  const p = await c.getProcessInstance(2251799819847322);
  expect(p).toBeTruthy();
});

xtest("It can find incidents", async () => {
  const is = await c.searchIncidents();
  console.log(is)
  expect(is).toBeTruthy();
});

xtest("It can get a specific incident", async () => {
  const i = await c.getIncident(2251799818436725);
  expect(i).toBeTruthy();
});

xtest("It can get variables for a specific process", async () => {
  const vars = await c.getVariablesforProcess(4503599629029980)
  console.log(vars)
  expect(vars).toBeTruthy()
})

xtest("It can get variables as JSON", async () => {
  const vars = await c.getJSONVariablesforProcess(2251799816518834)
  console.log(vars)
  expect(vars).toBeTruthy()
})