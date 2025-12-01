#!/usr/bin/env node

import { readSync } from "fs";
import { Command } from "commander";
import { Matcher } from "../rule-matcher";
import * as Diff from "diff";

import { ALL_RULES } from "../rules";
import { File, DockerParser, parseDocker } from "@tdurieux/dinghy";
import { writeFile } from "fs/promises";
import { normalizeLineEndings } from "../utils/line-endings";

const program = new Command();

program
  .command("rules")
  .description("List the supported rules")
  .action(function () {
    for (const rule of ALL_RULES) {
      console.log(`${rule.name}`);
    }
  });

program
  .command("repair")
  .description("Detect and repair smells in a Dockerfile (default: detect + repair)")
  .argument("[file]", "The filepath to the Dockerfile")
  .option("--stdin", "Read the Dockerfile from stdin", false)
  .option("-o, --output <output>", "Write repaired output to <output>")
  .option("-i, --in-place", "Modify the input file directly", false)
  .option("-q, --quiet", "Suppress smell information", false)
  .option("-p, --patch <file>", "Write diff to <file>")
  .option("--detect-only", "Only detect smells (no repair, no diff)", false)
  .option("--repair-only", "Only apply repairs (suppress detection output)", false)
  .action(async function (
    file: string,
    options: {
      patch: string;
      quiet: boolean;
      inPlace: boolean;
      output: string;
      stdin: boolean;
      detectOnly: boolean;
      repairOnly: boolean;
    }
  ) {

    // conflict rules
    if (options.detectOnly && options.repairOnly) {
      console.error("Error: --detect-only and --repair-only cannot be used together.");
      process.exit(1);
    }

    if (!options.stdin && !file) {
      console.error("Please provide a Dockerfile file");
      process.exit(1);
    }

    if (options.stdin && options.inPlace) {
      console.error("Cannot write in-place when reading from stdin");
      process.exit(1);
    }

    if (options.stdin && !file) {
      file = stdinToString();
    }

    const parser = new DockerParser(new File(file));
    const dockerfile = parser.parse();
    const matcher = new Matcher(dockerfile);

    const smells = matcher.matchAll();

    //
    // 1. DETECT-ONLY MODE
    //
    if (options.detectOnly) {
      console.log(`Detect-only mode: scanning ${file}`);
      if (smells.length === 0) {
        console.log(`No smells found in ${file}.`);
      } else {
        console.log(`Found ${smells.length} smell(s) in ${file}.`);
        smells.forEach((e) => console.log(e.toString()));
      }
      return; // STOP — do not repair
    }

    //
    // 2. NORMAL & REPAIR-ONLY MODES
    //
    if (!options.repairOnly && !options.quiet) {
      // default mode: detect + repair, OR repair-only with quiet false
      if (smells.length === 0) {
        console.log(`No smells found in ${file}.`);
      } else {
        console.log(`Found ${smells.length} smell(s) in ${file}.`);
        smells.forEach((e) => console.log(e.toString()));
      }
    }

    // Apply repairs only if smells exist
    for (const smell of smells) {
      try {
        await smell.repair();
      } catch (error) {
        // swallow individual repair errors
      }
    }

    const repairedOutput = normalizeLineEndings(matcher.node.toString(true));
    const diff = Diff.createTwoFilesPatch(
      file,
      file,
      parser.file.content,
      repairedOutput
    );

    //
    // Output handling
    //
    if (options.output) {
      await writeFile(options.output, repairedOutput, { encoding: "utf-8" });
      console.log(`Repaired Dockerfile written to ${options.output}`);
    }

    if (options.inPlace) {
      await writeFile(file, repairedOutput, { encoding: "utf-8" });
      console.log(`Repaired Dockerfile written to ${file}`);
    }

    if (!options.quiet && !options.repairOnly) {
      console.log("The changes:\n");
    }

    if (options.patch) {
      await writeFile(options.patch, diff, { encoding: "utf-8" });
      console.log(`Diff written to ${options.patch}`);
    } else {
      console.log(diff);
    }
  });

function stdinToString(): string {
  const BUFSIZE = 256;
  const buf = Buffer.alloc(BUFSIZE);
  let stdin = "";
  while (true) {
    let bytesRead = 0;
    try {
      bytesRead = readSync(process.stdin.fd, buf, 0, BUFSIZE, null);
    } catch (e) {
      if (e.code === "EAGAIN") {
        throw "ERROR: interactive stdin is not supported.";
      } else if (e.code === "EOF") {
        break;
      }
      throw e;
    }
    if (bytesRead === 0) break;
    stdin += buf.toString(undefined, 0, bytesRead);
  }
  return stdin;
}

program
  .command("analyze")
  .description("Analyze a Dockerfile file for smells")
  .option("--stdin", "Read Dockerfile from stdin", false)
  .argument("[file]", "The filepath to the Dockerfile")
  .action((file: string, options: { stdin: boolean }) => {
    if (!options.stdin && !file) {
      console.error("Please provide a Dockerfile file");
      process.exit(1);
    }
    if (options.stdin && !file) {
      file = stdinToString();
    }
    console.log(`Analyzing ${file}`);
    const dockerfile = parseDocker(file);
    const matcher = new Matcher(dockerfile);
    const smells = matcher.matchAll();
    if (smells.length == 0) {
      console.log(`No smells found in ${file}!`);
    } else {
      console.log(`Found ${smells.length} smell(s).`);
      smells.forEach((e) => console.log(e.toString()));
    }
  });

program.parse();
