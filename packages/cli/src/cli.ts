import { cac } from "cac";
import chalk from "chalk";
import { serve } from "./commands/serve.js";

const cli = cac("llw");

// The only command needed - starts the daemon
cli
  .command("serve", "Start the background daemon")
  .option("-p, --port <port>", "WebSocket port", { default: 3001 })
  .action(async (options) => {
    await serve({
      port: Number(options.port),
    });
  });

// Default command (no args) - also starts the daemon
cli
  .command("[...args]", "Start the background daemon")
  .action(async () => {
    await serve({ port: 3001 });
  });

cli.help();
cli.version("0.1.0");

cli.parse();

process.on("unhandledRejection", (err) => {
  console.error(chalk.red("Error:"), err);
  process.exit(1);
});
