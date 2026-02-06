/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log("Script started successfully");

let currentPopup: any = undefined;
let incidentPopup: any = undefined;
let incidentSound: any = undefined;

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

    // Trigger incident when entering triggerIncident area
    WA.room.area.onEnter("triggerIncident").subscribe(async () => {
      console.log("🚨 [triggerIncident] Entering triggerIncident area - triggering incident");
      try {
        // Check current value before setting
        const currentValue = WA.state.loadVariable("incidentTriggered");
        console.log("🚨 [triggerIncident] Current incidentTriggered value:", currentValue);
        
        // Set the incidentTriggered variable to true
        await WA.state.saveVariable("incidentTriggered", true);
        console.log("✅ [triggerIncident] Variable 'incidentTriggered' set to true");

        // Broadcast the incident-triggered event
        const incidentUrl = "https://app.spike.sh/incidents/argo-12";
        WA.event.broadcast("incident-triggered", { incidentUrl });
        console.log("✅ [triggerIncident] Event 'incident-triggered' broadcasted");
        
        // Trigger animation directly (in case variable was already true and change listener doesn't fire)
        console.log("🚨 [triggerIncident] Triggering animation directly from area handler");
        triggerIncidentAnimation();
        
        // Show confirmation to the user
        WA.ui.openPopup("incidentTriggered", "🚨 Incident triggered!", [
          {
            label: "OK",
            callback: (popup) => {
              popup.close();
            },
          },
        ]);
      } catch (error) {
        console.error("❌ [triggerIncident] Error triggering incident:", error);
      }
    });

    // Resolve incident when entering resolveIncident area
    WA.room.area.onEnter("resolveIncident").subscribe(async () => {
      console.log("✅ [resolveIncident] Entering resolveIncident area - resolving incident");
      try {
        // Set the incidentTriggered variable to false
        await WA.state.saveVariable("incidentTriggered", false);
        console.log("✅ [resolveIncident] Variable 'incidentTriggered' set to false");

        // Broadcast the incident-resolved event
        WA.event.broadcast("incident-resolved", { message: "Incident has been resolved" });
        console.log("✅ [resolveIncident] Event 'incident-resolved' broadcasted");
        // Note: The popup will be shown by the event listener to all players
      } catch (error) {
        console.error("❌ [resolveIncident] Error resolving incident:", error);
      }
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
    const incidentUrl = payload?.incidentUrl || "https://app.spike.sh/incidents/argo-12";
    
    // Close any existing incident popup
    closeIncidentPopup();
    
    // Display popup with incident URL
    const message = `🚨 Incident Alert!\n\nIncident URL: ${incidentUrl}\n\nClick to view details.`;
    incidentPopup = WA.ui.openPopup("incidentAlert", message, [
      {
        label: "View Incident",
        callback: (popup) => {
          if (incidentUrl && incidentUrl !== "No URL provided") {
            WA.nav.openTab(incidentUrl);
          }
          popup.close();
          incidentPopup = undefined;
        },
      },
      {
        label: "Close",
        callback: (popup) => {
          popup.close();
          incidentPopup = undefined;
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
        callback: (popup) => {
          popup.close();
          incidentPopup = undefined;
        },
      },
    ]);
    
    console.log("✅ [Incident] Incident resolution popup displayed");
  });

  // Listen for incidentTriggered variable changes
  console.log("🔔 [Incident] Setting up variable change listener for 'incidentTriggered'");
  WA.state.onVariableChange("incidentTriggered").subscribe((value) => {
    console.log("🔔 [Incident] incidentTriggered variable changed to:", value, "(type:", typeof value, ")");
    
    const isTriggered = value === true;
    console.log("🔔 [Incident] isTriggered:", isTriggered);
    
    if (isTriggered) {
      console.log("🚨 [Incident] Variable is true - triggering incident animation");
      triggerIncidentAnimation();
    } else {
      console.log("✅ [Incident] Variable is false - stopping incident animation");
      stopIncidentAnimation();
    }
  });
  console.log("🔔 [Incident] Variable change listener registered");

  // Check initial state (but don't play sound on load - only on actual triggers)
  const initialValue = WA.state.loadVariable("incidentTriggered");
  if (initialValue === true) {
    console.log("🚨 [Incident] Incident is already triggered on load (variable is true)");
    console.log("🚨 [Incident] Note: Sound will not play automatically on page load");
    // Don't trigger animation on load - only trigger when variable changes or event is received
    // This prevents sound from playing when page loads with an existing incident state
  }
}

function triggerIncidentAnimation() {
  try {
    console.log("🚨 [Incident] Triggering incident animation with sound");
    
    // Load and play the incident sound
    try {
      console.log("🔊 [Incident] Loading sound: ./isengard.mp3");
      incidentSound = WA.sound.loadSound("./isengard.mp3");
      console.log("🔊 [Incident] Sound loaded successfully, sound object:", incidentSound);
      
      console.log("🔊 [Incident] Attempting to play sound with config: { volume: 0.5, loop: false }");
      incidentSound.play({
        volume: 0.5,
        loop: false,  // Play once
        rate: 1,
        detune: 0,
        delay: 0,
        seek: 0,
        mute: false
      });
      console.log("🔊 [Incident] Sound 'isengard.mp3' play() called successfully");
    } catch (soundError) {
      console.error("❌ [Incident] Error loading/playing sound:", soundError);
      console.error("❌ [Incident] Sound error details:", {
        message: soundError instanceof Error ? soundError.message : String(soundError),
        stack: soundError instanceof Error ? soundError.stack : undefined
      });
    }
    
    // Show the eye_of_sauron layer
    try {
      console.log("🎨 [Incident] Showing eye_of_sauron layer");
      WA.room.showLayer("eye_of_sauron");
      console.log("🎨 [Incident] Layer 'eye_of_sauron' shown successfully");
    } catch (layerError) {
      console.error("❌ [Incident] Error showing layer:", layerError);
      console.error("❌ [Incident] Layer error details:", {
        message: layerError instanceof Error ? layerError.message : String(layerError),
        stack: layerError instanceof Error ? layerError.stack : undefined
      });
    }
  } catch (error) {
    console.error("❌ [Incident] Error triggering animation:", error);
    console.error("❌ [Incident] Animation error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

function stopIncidentAnimation() {
  try {
    console.log("✅ [Incident] Stopping incident animation");
    
    // Stop the sound if it's playing
    if (incidentSound) {
      console.log("🔇 [Incident] Sound object exists, attempting to stop");
      try {
        incidentSound.stop();
        console.log("🔇 [Incident] Sound stop() called successfully");
        incidentSound = undefined;
        console.log("🔇 [Incident] Sound reference cleared");
      } catch (soundError) {
        console.error("❌ [Incident] Error stopping sound:", soundError);
        console.error("❌ [Incident] Stop sound error details:", {
          message: soundError instanceof Error ? soundError.message : String(soundError),
          stack: soundError instanceof Error ? soundError.stack : undefined
        });
      }
    } else {
      console.log("🔇 [Incident] No sound object to stop (incidentSound is undefined)");
    }
    
    // Hide the eye_of_sauron layer
    try {
      console.log("🎨 [Incident] Hiding eye_of_sauron layer");
      WA.room.hideLayer("eye_of_sauron");
      console.log("🎨 [Incident] Layer 'eye_of_sauron' hidden successfully");
    } catch (layerError) {
      console.error("❌ [Incident] Error hiding layer:", layerError);
      console.error("❌ [Incident] Layer error details:", {
        message: layerError instanceof Error ? layerError.message : String(layerError),
        stack: layerError instanceof Error ? layerError.stack : undefined
      });
    }
  } catch (error) {
    console.error("❌ [Incident] Error stopping animation:", error);
    console.error("❌ [Incident] Stop animation error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

export {};
