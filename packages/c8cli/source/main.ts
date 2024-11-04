import { CamundaRestClient } from "@camunda8/sdk-rest";
import { commands, emitCommandHelp } from "./commands.ts";
import { parseArguments } from "./parse-arguments.ts";

const command = Deno.args[0];

const noCommand = !command;
const unknownCommand = !Object.keys(commands).includes(command);
const helpCommand = Deno.args[0] === "--help";

if (noCommand || unknownCommand || helpCommand) {
  console.log("\nCamunda 8 CLI\n");
  console.log("Usage:");
  for (const key of Object.keys(commands)) {
    console.log(`c8cli ${key}\t - ${commands[key].description}`);
  }
  console.log(`\n`);
  Deno.exit(0);
}

const commandToRun = commands[command];

const firstArg = Deno.args[1];

const helpRequested = firstArg === "--help";

if (helpRequested) {
  emitCommandHelp(commandToRun);
  exit(0);
} else {
  const args = parseArguments();
  const missingRequiredArgs = commandToRun.args.required.filter((key) =>
    !(key in args)
  );
  if (missingRequiredArgs.length > 0) {
    console.log(
      `\nERROR: Missing required argument(s): ${
        missingRequiredArgs.join(", ")
      }`,
    );
    emitCommandHelp(commandToRun);
    exit(1);
  }
  // TODO - unknown argument(s) passed
  // TODO - "One of" arguments
  const exitCode = await commandToRun.run(new CamundaRestClient(), args);
  console.log("\n");
  exit(exitCode);
}

function exit(code: number) {
  console.log("\n");
  Deno.exit(code);
}
