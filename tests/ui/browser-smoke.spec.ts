import { test, expect, chromium } from "@playwright/test";
import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";

const TEST_PORT = 4173;
const TEST_URL = `http://localhost:${TEST_PORT}`;

let serverProcess: ChildProcess | null = null;

test.beforeAll(async () => {
  // Start http-server - use npx on Windows to avoid path issues
  const docsPath = path.join(__dirname, "..", "..", "docs");
  const isWindows = process.platform === "win32";
  
  // Use node to run http-server directly to avoid Windows .cmd issues
  const httpServerMain = path.join(
    __dirname,
    "..",
    "..",
    "node_modules",
    "http-server",
    "bin",
    "http-server"
  );

  serverProcess = spawn(
    "node",
    [httpServerMain, "-p", TEST_PORT.toString(), docsPath],
    {
      cwd: docsPath,
      stdio: "pipe",
      shell: isWindows,
    }
  );

  // Wait for server to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      // Check if server is actually running by trying to connect
      const http = require("http");
      const checkServer = http.get(`http://localhost:${TEST_PORT}`, (res) => {
        clearTimeout(timeout);
        resolve();
      });
      checkServer.on("error", () => {
        reject(new Error("Server failed to start within 10 seconds"));
      });
    }, 10000);

    let serverReady = false;
    
    const checkReady = (data: Buffer) => {
      const message = data.toString();
      if (message.includes("Available on") || 
          message.includes("Hit CTRL-C") ||
          message.includes("Starting up http-server") ||
          message.includes("http-server version")) {
        if (!serverReady) {
          serverReady = true;
          clearTimeout(timeout);
          // Give it a moment to fully bind
          setTimeout(() => resolve(), 500);
        }
      }
    };

    serverProcess?.stdout?.on("data", checkReady);
    serverProcess?.stderr?.on("data", (data) => {
      const message = data.toString();
      // Check stderr too - sometimes startup messages go there
      checkReady(data);
      // Ignore some common messages that aren't errors
      if (!message.includes("getaddrinfo") && 
          !message.includes("EADDRINUSE") &&
          !message.includes("DeprecationWarning")) {
        // Only log if it's not a startup message
        if (!message.includes("Starting up") && !message.includes("http-server")) {
          console.error("Server stderr:", message);
        }
      }
    });

    serverProcess?.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start server: ${err.message}`));
    });
  });

  // Additional wait to ensure server is fully ready
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

test.afterAll(async () => {
  // Cleanup: kill server process
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

test("browser UI can analyze Dockerfile and detect smells", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console errors
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  // Navigate to the local server
  await page.goto(TEST_URL, { waitUntil: "networkidle" });

  // Wait for Monaco editor to be ready
  await page.waitForFunction(
    () => typeof (window as any).monacoEditor !== "undefined",
    { timeout: 15000 }
  );

  // Load test Dockerfile
  const testDockerfilePath = path.join(
    __dirname,
    "..",
    "data",
    "087ced569a2e70e178c18bcf18426fa8fbc4f098.Dockerfile"
  );
  const dockerfileContent = fs.readFileSync(testDockerfilePath, "utf8");

  // Set the Dockerfile content in Monaco editor
  await page.evaluate((content) => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      editor.getModel().setValue(content);
    }
  }, dockerfileContent);

  // Wait for analysis to complete (check for smell cards)
  // The analysis is triggered automatically by the watch on dockerfile scope
  await page.waitForSelector("#collapseViolations .card", {
    timeout: 30000,
    state: "attached",
  }).catch(() => {
    // If no cards found, check for errors
    if (consoleErrors.length > 0) {
      throw new Error(
        `Analysis failed with errors: ${consoleErrors.join("; ")}`
      );
    }
    throw new Error("No smell cards found - analysis may have failed");
  });

  // Verify at least one smell is detected
  const smellCards = await page.$$("#collapseViolations .card");
  expect(smellCards.length).toBeGreaterThan(0);

  // Verify dockerParfum.dinghy.nodeType is accessible (critical check)
  const nodeTypeAccessible = await page.evaluate(() => {
    const dockerParfum = (window as any).dockerParfum;
    return (
      dockerParfum &&
      dockerParfum.dinghy &&
      typeof dockerParfum.dinghy.nodeType !== "undefined" &&
      typeof dockerParfum.dinghy.nodeType.Q === "function"
    );
  });

  expect(nodeTypeAccessible).toBe(true);

  // Verify no critical console errors (nodeType undefined errors)
  const criticalErrors = consoleErrors.filter((error) =>
    error.includes("Cannot read properties of undefined") ||
    error.includes("nodeType") ||
    error.includes("reading 'Q'")
  );

  expect(criticalErrors).toHaveLength(0);

  await browser.close();
});

test("browser UI can apply fixes", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(TEST_URL, { waitUntil: "networkidle" });

  await page.waitForFunction(
    () => typeof (window as any).monacoEditor !== "undefined",
    { timeout: 15000 }
  );

  // Use a simpler Dockerfile for this test
  const simpleDockerfile = `FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y curl
`;

  await page.evaluate((content) => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      editor.getModel().setValue(content);
    }
  }, simpleDockerfile);

  // Wait for smells to be detected
  await page.waitForSelector("#collapseViolations .card", {
    timeout: 30000,
    state: "attached",
  });

  // Get initial content
  const initialContent = await page.evaluate(() => {
    return (window as any).monacoEditor?.getModel()?.getValue() || "";
  });

  // Click the first "Apply fix" button
  const applyButton = page.locator('#collapseViolations .card button').filter({ hasText: 'Apply fix' }).first();
  
  if (await applyButton.count() > 0) {
    await applyButton.click();

    // Wait a bit for the content to update
    await page.waitForTimeout(1000);

    // Verify content changed
    const updatedContent = await page.evaluate(() => {
      return (window as any).monacoEditor?.getModel()?.getValue() || "";
    });

    expect(updatedContent).not.toBe(initialContent);
  }

  await browser.close();
});

