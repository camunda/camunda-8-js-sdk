const args = Deno.args;
export type ParsedArguments = { [key: string]: string | boolean };
const parsedArgs: ParsedArguments = {};

export function parseArguments() {
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const key = arg.replace("--", "");
      // Check for the next argument
      if (i + 1 < args.length) {
        const nextArg = args[i + 1];
        if (nextArg.startsWith("--")) {
          parsedArgs[key] = true;
        } else {
          parsedArgs[key] = nextArg;
          i++;
        }
      } else {
        parsedArgs[key] = "";
      }
    }
  }
  return parsedArgs;
}
