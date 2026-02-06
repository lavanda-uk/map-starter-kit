/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log("Script started successfully");

let currentPopup: any = undefined;
let incidentPopup: any = undefined;

// Waiting for the API to be ready
WA.onInit()
  .then(() => {
    console.log("Scripting API ready");
    console.log("Player tags: ", WA.player.tags);
    console.log("New script added!!!");

    WA.room.area.onEnter("clock").subscribe(() => {
      console.log("🕐 [clock] Entering clock area");
      const today = new Date();
      const time = today.getHours() + ":" + today.getMinutes();
      console.log("🕐 [clock] Opening popup with time:", time);
      currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
      console.log("🕐 [clock] Popup opened");
    });

    WA.room.area.onLeave("clock").subscribe(() => {
      console.log("🕐 [clock] Leaving clock area");
      closePopup();
    });

    // Open Jira board in a new tab when entering the area
    WA.room.area.onEnter("argosJiraBoard").subscribe(() => {
      console.log("✅ [argosJiraBoard] Entering argosJiraBoard area - opening Jira board in new tab");
      try {
        WA.nav.openTab("https://getlavanda.atlassian.net/jira/software/c/projects/BAS/boards/155");
        console.log("✅ [argosJiraBoard] Jira board opened in new tab successfully");
      } catch (error) {
        console.error("❌ [argosJiraBoard] Error opening Jira board:", error);
      }
    });

    WA.room.area.onLeave("argosJiraBoard").subscribe(() => {
      console.log("📋 [argosJiraBoard] Leaving argosJiraBoard area");
      // Note: We can't close a new tab programmatically, so we just log the event
    });

    // Open Grafana dashboard in a new tab when entering the area
    WA.room.area.onEnter("openGrafana").subscribe(() => {
      console.log("📊 [openGrafana] Entering openGrafana area - opening Grafana dashboard in new tab");
      try {
        WA.nav.openTab("https://grafana.lavanda.app/d/booking-creations-overview/booking-creations-overview?orgId=1&from=now-24h&to=now&timezone=browser&refresh=30s");
        console.log("📊 [openGrafana] Grafana dashboard opened in new tab successfully");
      } catch (error) {
        console.error("❌ [openGrafana] Error opening Grafana dashboard:", error);
      }
    });

    WA.room.area.onLeave("openGrafana").subscribe(() => {
      console.log("📊 [openGrafana] Leaving openGrafana area");
      // Note: We can't close a new tab programmatically, so we just log the event
    });

    // Incident Management System
    setupIncidentManagement();

    // The line below bootstraps the Scripting API Extra library that adds a number of advanced properties/features to WorkAdventure
    console.log("🚀 [bootstrapExtra] Starting bootstrapExtra...");
    bootstrapExtra()
      .then(() => {
        console.log("✅ [bootstrapExtra] Scripting API Extra ready");
      })
      .catch((e) => {
        console.error("❌ [bootstrapExtra] Error:", e);
      });
  })
  .catch((e) => {
    console.error("❌ [WA.onInit] Error initializing WorkAdventure API:", e);
  });

function closePopup() {
  console.log("🔲 [closePopup] closePopup() called");
  if (currentPopup !== undefined) {
    console.log("🔲 [closePopup] Closing popup");
    currentPopup.close();
    currentPopup = undefined;
    console.log("🔲 [closePopup] Popup closed");
  } else {
    console.log("🔲 [closePopup] No popup to close");
  }
}

function closeIncidentPopup() {
  if (incidentPopup !== undefined) {
    incidentPopup.close();
    incidentPopup = undefined;
  }
}

function setupIncidentManagement() {
  console.log("🚨 [Incident] Setting up incident management system");

  // Listen for incident-triggered event
  WA.event.on("incident-triggered").subscribe((event) => {
    console.log("🚨 [Incident] Incident triggered event received", event.data);
    
    const payload = event.data as { incidentUrl?: string };
    const incidentUrl = payload?.incidentUrl || "No URL provided";
    
    // Close any existing incident popup
    closeIncidentPopup();
    
    // Display popup with incident URL
    const message = `🚨 Incident Alert!\n\nIncident URL: ${incidentUrl}\n\nClick to view details.`;
    incidentPopup = WA.ui.openPopup("incidentAlert", message, [
      {
        label: "View Incident",
        callback: () => {
          if (incidentUrl && incidentUrl !== "No URL provided") {
            WA.nav.openTab(incidentUrl);
          }
        },
      },
      {
        label: "Close",
        callback: () => {
          closeIncidentPopup();
        },
      },
    ]);
    
    console.log("🚨 [Incident] Incident alert popup displayed");
  });

  // Listen for incident-resolved event
  WA.event.on("incident-resolved").subscribe((event) => {
    console.log("✅ [Incident] Incident resolved event received", event.data);
    
    const payload = event.data as { message?: string };
    const message = payload?.message || "Incident has been resolved";
    
    // Close any existing incident popup
    closeIncidentPopup();
    
    // Display resolution popup
    incidentPopup = WA.ui.openPopup("incidentResolved", `✅ ${message}`, [
      {
        label: "Close",
        callback: () => {
          closeIncidentPopup();
        },
      },
    ]);
    
    console.log("✅ [Incident] Incident resolution popup displayed");
  });

  // Listen for incidentTriggered variable changes
  WA.state.onVariableChange("incidentTriggered").subscribe((value) => {
    console.log("🔔 [Incident] incidentTriggered variable changed:", value);
    
    const isTriggered = value === true;
    
    if (isTriggered) {
      console.log("🚨 [Incident] Triggering incident animation");
      triggerIncidentAnimation();
    } else {
      console.log("✅ [Incident] Stopping incident animation");
      stopIncidentAnimation();
    }
  });

  // Check initial state
  const initialValue = WA.state.loadVariable("incidentTriggered");
  if (initialValue === true) {
    console.log("🚨 [Incident] Incident is already triggered on load");
    triggerIncidentAnimation();
  }
}

function triggerIncidentAnimation() {
  // Try to find and show an "incident" layer if it exists
  // This is a simple animation - you can customize this based on your map structure
  try {
    console.log("🚨 [Incident] Animation triggered - you can customize this based on your map");
    
    // Example: You could toggle layer visibility if you have an "incident" layer
    // WA.room.showLayer("incident");
    
    // Or trigger a sound effect if available
    // WA.sound.playSound("incident-alert");
  } catch (error) {
    console.error("❌ [Incident] Error triggering animation:", error);
  }
}

function stopIncidentAnimation() {
  // Stop/reset the animation
  try {
    console.log("✅ [Incident] Animation stopped - you can customize this based on your map");
    
    // Example: Hide the incident layer
    // WA.room.hideLayer("incident");
    
    // Or stop sound effects
    // WA.sound.stopSound("incident-alert");
  } catch (error) {
    console.error("❌ [Incident] Error stopping animation:", error);
  }
}

export {};
