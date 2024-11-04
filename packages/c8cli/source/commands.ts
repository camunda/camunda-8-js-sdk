import { CamundaRestClient } from "@camunda8/sdk-rest";
import type { ParsedArguments } from "./parse-arguments.ts";

type CliCommandExecutor = (
  camunda: CamundaRestClient,
  args: ParsedArguments,
) => Promise<number>;

type CliArgs = {
  required: string[];
  optional: string[];
};

export type CliCommand = {
  description: string;
  usage: string;
  args: CliArgs;
  run: CliCommandExecutor;
};

export function emitCommandHelp(command: CliCommand) {
  console.log(`\nDescription: ${command.description}`);
  console.log(`Usage: ${command.usage}`);
  console.log(`Required Arguments: `, command.args.required.join(", "));
  console.log(`Optional Arguments: `, command.args.optional.join(", "));
}

export const commands: {
  [key: string]: CliCommand;
} = {
  "topology": {
    description: "Get the Camunda 8 cluster topology",
    usage: "c8cli topology",
    args: {
      required: [],
      optional: [],
    },
    run: async (camunda: CamundaRestClient) => {
      const topology = await camunda.getTopology();
      console.log(topology);
      return 0;
    },
  },
  "license": {
    description: "Get the Camunda 8 cluster license status",
    usage: "c8cli license",
    args: {
      required: [],
      optional: [],
    },
    run: async (camunda: CamundaRestClient) => {
      const status = await camunda.getLicenseStatus();
      console.log(status);
      return 0;
    },
  },
  "deploy-resource": {
    description:
      "Deploy a resource (BPMN | DMN | Form) from a file to a Camunda 8 cluster",
    usage: "c8cli deploy-resource --file <filename> --tenantId <tenantId>",
    args: {
      required: ["file"],
      optional: ["tenantId"],
    },
    run: async (camunda: CamundaRestClient, args: ParsedArguments) => {
      const content = Deno.readFileSync(args.file as string);
      const response = await camunda.deployResources({
        resources: { content, name: args.file },
        tenantId: args.tenantId,
      });
      console.log(response);
      return 0;
    },
  },
};
