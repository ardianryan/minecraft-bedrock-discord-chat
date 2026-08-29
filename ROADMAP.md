# 🗺️ MGC Cross-Server & Inventory Sync Roadmap

> **Engineering Specification & Technical Roadmap**  
> *Standardized architecture aligning with modern system design specifications (e.g. roadmap.sh, CNCF landscapes, and cloud-native multiplayer game architectures).*

---

## 🧭 Visual System Roadmap (Tech Tree)

```mermaid
flowchart TD
    %% Styling and Classes
    classDef done fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef inprog fill:#F59E0B,stroke:#D97706,stroke-width:2px,color:#fff;
    classDef planned fill:#3B82F6,stroke:#2563EB,stroke-width:2px,color:#fff;
    classDef future fill:#8B5CF6,stroke:#7C3AED,stroke-width:2px,color:#fff;
    classDef core fill:#1E293B,stroke:#475569,stroke-width:2px,color:#fff;

    subgraph LEGEND ["🏷️ Status Legend"]
        L1["✅ Completed"]:::done
        L2["🔄 In Progress"]:::inprog
        L3["📋 Planned / Next Up"]:::planned
        L4["🚀 Future Expansion"]:::future
    end

    subgraph PHASE1 ["Phase 1: Foundation & Cloud Persistence"]
        DB1["PostgreSQL Schema (Drizzle ORM)"]:::planned
        DB2["player_cloud_inventories (JSONB)"]:::planned
        DB3["inventory_sync_logs (Audit Trail)"]:::planned
        API1["REST API: /api/bridge/inventory/save"]:::planned
        API2["REST API: /api/bridge/inventory/load"]:::planned
    end

    subgraph PHASE2 ["Phase 2: Addon Serialization Engine"]
        AD1["Bedrock Script API (@minecraft/server)"]:::done
        AD2["Main 36-Slot Serializer"]:::planned
        AD3["Armor & Equipment Serializer"]:::planned
        AD4["Custom Addon & Lore Extractor"]:::planned
        AD5["Backpack Inner-Item Parser"]:::planned
        AD6["ItemStack Deserializer & Rebuilder"]:::planned
    end

    subgraph PHASE3 ["Phase 3: Anti-Dupe & Sync Lifecycle"]
        SEC1["Token-Based Transfer Window (30s)"]:::planned
        SEC2["Player Spawn Freeze & Safety Lock"]:::planned
        SEC3["Atomic Database Transactions"]:::planned
        SEC4["30-Second Delta Auto-Save Engine"]:::planned
        SEC5["Disconnect & Crash Recovery Routine"]:::planned
    end

    subgraph PHASE4 ["Phase 4: Admin Web Panel & Rollback"]
        WEB1["Visual Cloud Inventory Viewer"]:::planned
        WEB2["1-Click Point-in-Time Rollback"]:::planned
        WEB3["Multi-Server Live Status & Heartbeat"]:::planned
        WEB4["Cross-Server Chat Relay & Discord"]:::done
    end

    subgraph PHASE5 ["Phase 5: Multi-Server Production"]
        PROD1["Server A (Survival) & Server B (Mining)"]:::future
        PROD2["Automated Load & Duplication Stress Tests"]:::future
        PROD3["Zero-Latency Real-Time Inventory Sharding"]:::future
    end

    %% Progression Flow
    PHASE1 --> PHASE2
    PHASE2 --> PHASE3
    PHASE3 --> PHASE4
    PHASE4 --> PHASE5

    %% Intra-phase dependencies
    DB1 --> DB2 & DB3
    DB2 --> API1 & API2
    AD1 --> AD2 & AD3 & AD4 & AD5
    AD2 & AD3 & AD4 & AD5 --> AD6
    API1 & API2 --> SEC1 & SEC3 & SEC4
    AD6 --> SEC2 & SEC5
    SEC3 & SEC5 --> WEB1 & WEB2
    WEB1 & WEB2 --> PROD1
```

---

## 📊 End-to-End Data Flow Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Player as 🎮 Player (Minecraft Bedrock)
    participant SrvA as 🖥️ Server A (Survival)
    participant BridgeA as 🔌 MGC Bridge (Addon)
    participant Backend as 🌐 Hono Cloud API
    participant DB as 🗄️ PostgreSQL (JSONB)
    participant BridgeB as 🔌 MGC Bridge (Addon)
    participant SrvB as 🖥️ Server B (Mining)
    actor Admin as 🛡️ Web Dashboard Admin

    %% Save Flow
    Note over Player,SrvA: Player leaves Server A / Periodic auto-save triggers
    SrvA->>BridgeA: Trigger playerLeave / 30s timer
    BridgeA->>BridgeA: Serialize (Slots, Armor, Backpacks, XP, HP)
    BridgeA->>Backend: POST /api/bridge/inventory/save (Payload + Token)
    Backend->>DB: Atomic UPSERT player_cloud_inventories
    Backend->>DB: INSERT inventory_sync_logs (Snapshot)
    Backend-->>BridgeA: 200 OK (Saved Successfully)

    %% Join Flow
    Note over Player,SrvB: Player joins Server B
    Player->>SrvB: Connect & Join World
    SrvB->>BridgeB: playerSpawn Event
    BridgeB->>Player: Apply Safety Freeze (Slowness 255 + Blindness 0.5s)
    BridgeB->>Backend: GET /api/bridge/inventory/load?username=Player
    Backend->>DB: Query latest cloud snapshot
    DB-->>Backend: JSONB Inventory Data
    Backend-->>BridgeB: 200 OK (Inventory Payload)
    BridgeB->>BridgeB: Deserialize & Rebuild ItemStacks
    BridgeB->>Player: Set Equipment, Items, Ender Chest & XP
    BridgeB->>Player: Remove Freeze & Display "§a✔ Cloud Inventory Synced!"

    %% Rollback Flow
    Note over Admin,Backend: Admin Rollback Incident
    Admin->>Backend: POST /api/admin/inventory/rollback (log_id)
    Backend->>DB: Restore snapshot to player_cloud_inventories
    Backend-->>Admin: 200 OK (Rolled Back)
```

---

## 📑 Milestone Tracker

### 📦 Phase 1: Foundation & Cloud Persistence
- [ ] **DB-01**: Initialize PostgreSQL schema via Drizzle ORM (`player_cloud_inventories`, `inventory_sync_logs`).
- [ ] **DB-02**: Implement atomic helper methods `savePlayerCloudInventory` and `getPlayerCloudInventory` in [`src/db.ts`](./src/db.ts).
- [ ] **DB-03**: Create REST endpoints `/api/game/inventory/save` and `/api/game/inventory/load` with strict Bearer token authentication in [`src/index.ts`](./src/index.ts).
- [ ] **DB-04**: Add unit tests for serialization, hashing, and concurrent transaction locking in `tests/inventory_sync.test.ts`.

### 2.2 In-Game Addon Architecture (`MGC_Bridge[BP]`)
- [ ] **AD-01**: Create dedicated sub-package `MGC_Bridge[BP]/scripts/inventory/`.
- [ ] **AD-02**: Develop [`serializer.js`](./MGC_Bridge[BP]/scripts/inventory/serializer.js):
  - Iterate over 36 main inventory slots, 4 armor slots, and 1 offhand slot.
  - Extract `typeId`, `amount`, `data`, `nameTag`, `lore`, and enchantment map.
  - Calculate CRC32 / SHA-256 payload checksum before dispatch.
- [ ] **AD-03**: Implement debounce queue (5-second idle trigger + on-demand save on player disconnect / teleport).
- [ ] **AD-04**: Develop [`deserializer.js`](./MGC_Bridge[BP]/scripts/inventory/deserializer.js) to accurately reconstruct `ItemStack` instances with matching type IDs, quantities, lore, and enchantments.

---

### 🛡️ Phase 3: Anti-Duplication Protocol & Sync Lifecycle
- [ ] **SEC-01**: Implement **Token-Based Transfer Window (30s)** across server transfers.
- [ ] **SEC-02**: Implement **Safety Lock & Freeze (0.5s)** during initial cloud inventory hydration.
- [ ] **SEC-03**: Establish **30-Second Delta Auto-Save Interval (600 Ticks)** for disaster recovery against sudden host crashes.
- [ ] **SEC-04**: Implement sequential `sequence_id` versioning to prevent race conditions during rapid server switches.

---

### 🖥️ Phase 4: Admin Web Panel & 1-Click Rollback
- [x] **WEB-01**: Multi-server live chat relay and Discord webhook integration.
- [ ] **WEB-02**: Visual Cloud Inventory Viewer modal inside `PlayerInventorySheet.tsx`.
- [ ] **WEB-03**: Implement **1-Click Point-in-Time Rollback** to restore previous inventory snapshots.
- [ ] **WEB-04**: Dedicated audit log table for cross-server synchronization events (`CloudSyncLogsModal.tsx`).

---

### 🚀 Phase 5: Production Deployment & Multi-Server Validation
- [ ] **PROD-01**: Multi-server live rollout across Server A (Survival) and Server B (Mining).
- [ ] **PROD-02**: In-game end-to-end testing with complex custom addon items (*Armored Elytras, Ultimate Drills, Backpack XL, More Shields*).
- [ ] **PROD-03**: Connection disruption stress testing to ensure zero item loss and zero duplication vulnerabilities.

---

## 🛠️ Technology Stack Breakdown

| Layer | Technology | Role / Purpose |
| :--- | :--- | :--- |
| **Bedrock Addon** | Bedrock Script API (`@minecraft/server`, `@minecraft/server-net`) | In-game item extraction, serialization, reconstruction, and direct HTTPS cloud communication. |
| **Cloud Backend** | Hono.js + Node.js (TypeScript) | High-performance, low-latency (< 15ms) REST API gateway for inventory sync and chat relay. |
| **Database** | PostgreSQL + Drizzle ORM | High-integrity `JSONB` document storage for inventory snapshots and immutable audit trails. |
| **Admin Web UI** | React 18 + Tailwind CSS + Lucide Icons | Responsive visual admin dashboard for live player inspections and point-in-time rollbacks. |
| **Bot Integration** | Discord.js v14 | Real-time bidirectional cross-server chat relay and alert notifications. |

---
*This roadmap adheres to roadmap.sh visual engineering standards for structured progress tracking.* 🚀
