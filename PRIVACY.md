# Privacy Policy — GTools: Developer Swiss Army Knife

**Last updated:** February 20, 2026

## Overview

GTools is a Chrome extension that provides developer utility tools. All processing happens entirely within your browser. We do not collect, store, transmit, or share any user data.

## Data Collection

**We collect no data.** Specifically:

- No personal information (name, email, IP address)
- No usage analytics or telemetry
- No browsing history or tab information beyond the active tab when explicitly invoked
- No source code, tokens, JSON payloads, or any content you process through the tools
- No cookies, tracking pixels, or fingerprinting

## Data Processing

All operations — JSON formatting, JWT decoding, hashing, encoding, regex testing, diffing, and all other tool functions — are performed locally in your browser's JavaScript engine. No data is sent to any server, API, or third-party service.

## Permissions

GTools requests only 2 Chrome permissions:

| Permission | Purpose |
|---|---|
| `activeTab` | Used by "Ticket-to-Git" to read the current tab's title for branch name generation, and by "State Surgeon" to read the current tab's URL for query parameter editing. Only activated when you explicitly open and use these specific tools. |
| `scripting` | Used exclusively by "State Surgeon" to execute a local script that clears localStorage, sessionStorage, and cookies on the active tab when you explicitly click the "Nuke State" button. |

No background scripts run. No content scripts are injected. No network requests are made.

## Third-Party Services

GTools does not integrate with, send data to, or receive data from any third-party services, APIs, or analytics platforms.

## Data Storage

GTools does not use Chrome's `storage` API or any persistent storage mechanism. No preferences, history, or cached data is saved between sessions.

## Children's Privacy

GTools does not knowingly collect any information from children under 13.

## Changes to This Policy

If we update this policy, the changes will be reflected in this document with an updated date. Since GTools collects no data, meaningful changes to this policy are unlikely.

## Contact

For questions about this privacy policy, contact the authors:

**Venkat Dhurjati & Nandak Dhurjati**

## Open Source

GTools is open source under the MIT License. You can review the complete source code to verify these privacy claims.
