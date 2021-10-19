import {default as chalk} from 'chalk';
import * as commands from './commands';

const COMMANDS = commands as any;
const command = process.argv[2] || null;

if (!command) {
  showAvailablesCommands();
}

const commandKey: string | undefined = Object.keys(commands)
  .find((c: string) => COMMANDS[c].command === command);


if (!commandKey) {
  showAvailablesCommands();
} else {
  const commandInstance = new COMMANDS[commandKey];
  commandInstance.run().catch((error: any) => console.error(error, {depth: 5}))
}

function showAvailablesCommands() {
  console.log(chalk.green("Loopback Console \n"));
  console.log(chalk.green("Available Commands: \n\n"));

  for (const c in commands) {
    const command = COMMANDS[c];
    console.log(chalk.green(`- ${command?.command} - ${command?.description}`));
  }

  console.log("\n");
  process.exit();
}
