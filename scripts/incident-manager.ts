#!/usr/bin/env node

import { createRoomApiClient } from "@workadventure/room-api-client";

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Parse --url flag if present
function parseArgs() {
  const urlIndex = args.indexOf("--url");
  const url = urlIndex !== -1 && args[urlIndex + 1] ? args[urlIndex + 1] : null;
  return { command, url };
}

// Get environment variables
const apiKey = process.env.ROOM_API_SECRET_KEY;
const roomUrl = process.env.ROOM_URL;
const roomApiHost = process.env.ROOM_API_HOST || "room-api.workadventu.re";
const roomApiPort = process.env.ROOM_API_PORT ? parseInt(process.env.ROOM_API_PORT) : 443;

// Validate required environment variables
if (!apiKey) {
  console.error("❌ Error: ROOM_API_SECRET_KEY environment variable is required");
  console.error("   Set it with: export ROOM_API_SECRET_KEY='your-api-key'");
  process.exit(1);
}

if (!roomUrl) {
  console.error("❌ Error: ROOM_URL environment variable is required");
  console.error("   Set it with: export ROOM_URL='https://play.workadventu.re/@/org/world/room'");
  process.exit(1);
}

// Create the client
const client = createRoomApiClient(apiKey, roomApiHost, roomApiPort);

const VARIABLE_NAME = "incidentTriggered";

/**
 * Trigger an incident alert
 */
async function triggerIncident(incidentUrl: string) {
  try {
    console.log("🚨 Triggering incident alert...");
    console.log(`   Room: ${roomUrl}`);
    console.log(`   Incident URL: ${incidentUrl}`);

    // Set the incidentTriggered variable to true
    await client.saveVariable({
      name: VARIABLE_NAME,
      room: roomUrl,
      value: true,
    });
    console.log("✅ Variable 'incidentTriggered' set to true");

    // Broadcast the incident-triggered event
    await client.broadcastEvent({
      name: "incident-triggered",
      room: roomUrl,
      data: { incidentUrl },
    });
    console.log("✅ Event 'incident-triggered' broadcasted");

    console.log("🎉 Incident alert triggered successfully!");
  } catch (error) {
    console.error("❌ Error triggering incident:", error);
    process.exit(1);
  }
}

/**
 * Resolve an incident alert
 */
async function resolveIncident() {
  try {
    console.log("✅ Resolving incident alert...");
    console.log(`   Room: ${roomUrl}`);

    // Set the incidentTriggered variable to false
    await client.saveVariable({
      name: VARIABLE_NAME,
      room: roomUrl,
      value: false,
    });
    console.log("✅ Variable 'incidentTriggered' set to false");

    // Broadcast the incident-resolved event
    await client.broadcastEvent({
      name: "incident-resolved",
      room: roomUrl,
      data: { message: "Incident has been resolved" },
    });
    console.log("✅ Event 'incident-resolved' broadcasted");

    console.log("🎉 Incident resolved successfully!");
  } catch (error) {
    console.error("❌ Error resolving incident:", error);
    process.exit(1);
  }
}

// Main command handler
async function main() {
  const { command: cmd, url } = parseArgs();
  
  if (cmd === "trigger") {
    const incidentUrl = url || args[1];
    if (!incidentUrl) {
      console.error("❌ Error: Incident URL is required");
      console.error("   Usage: npm run trigger-incident -- --url <incident-url>");
      process.exit(1);
    }
    await triggerIncident(incidentUrl);
  } else if (cmd === "resolve") {
    await resolveIncident();
  } else {
    console.error("❌ Error: Unknown command");
    console.error("   Usage:");
    console.error("     npm run trigger-incident -- --url <incident-url>");
    console.error("     npm run resolve-incident");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
