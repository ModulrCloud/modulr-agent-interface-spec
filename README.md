# Modulr Agent Interface Specification

A JSON Schema repository defining the communication protocol for Modulr agent interfaces. This specification provides type-safe, versioned message schemas for agent control, signalling, and system capabilities.

## Overview

The Modulr Agent Interface Specification defines a standardized protocol for communication between agents and control systems. All messages follow a common envelope structure with versioned, validated payloads.

### Message Categories

- **Agent**: Commands and responses for agent control (movement, ping/pong, capabilities)
- **Signalling**: WebRTC signalling messages (offer, answer, ICE candidates, capabilities, ping/pong)
- **Common**: Shared infrastructure schemas (envelope, error)

## Validation Steps

This is only required for validating changes to the repo.

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

```bash
npm install
```

### Validation

Run the comprehensive validation suite:

```bash
npm run validate
```

This performs:
- **Schema Validation**: Validates all JSON schemas are well-formed
- **Example Validation**: Ensures all examples conform to their schemas
- **Semantic Versioning**: Checks version consistency across files
- **Example Coverage**: Verifies every message schema has an example
- **Index Completeness**: Ensures index.json references all schemas

## Schema Structure

### Message Envelope

All protocol messages share a common envelope:

```json
{
  "type": "category.message",
  "version": "0.1",
  "id": "unique-message-id",
  "timestamp": "2026-01-05T14:35:22Z",
  "payload": { },
  "meta": { }
}
```

- `type`: Fully-qualified message type (e.g., `agent.movement`)
- `version`: Protocol version in MAJOR.MINOR format
- `id`: Unique identifier for correlation and tracing
- `timestamp`: RFC 3339 timestamp
- `payload`: Message-specific data (optional for some messages)
- `correlationId`: Optional field for request/response correlation
- `meta`: Optional metadata not relevant to protocol semantics

## Message Reference

### Agent Messages

#### agent.movement
Controls agent movement with forward and turn velocities.

```json
{
  "type": "agent.movement",
  "version": "0.1",
  "payload": {
    "forward": 1.0,
    "turn": -0.3
  }
}
```

- `forward`: Forward velocity, range -1.0 to 1.0
- `turn`: Turn velocity, range -1.0 to 1.0

#### agent.ping / agent.pong
Health check messages without payload.

The web client can use this to check that the agent is available by sending a single ping message. The agent will then respond with a pong message, referencing the ID sent in the original ping.

#### agent.capabilities
Declares supported protocol versions.

```json
{
  "type": "agent.capabilities",
  "version": "0.1",
  "payload": {
    "versions": ["0.0", "0.1"]
  }
}
```

#### agent.location.* (CRUD Operations)

**Available in:** v0.1+

The location messages enable the webapp to manage named locations on the robot. Locations are identified by their unique name. Each location represents a saved position with optional orientation.

**Commands (webapp → robot):**

##### agent.location.create
Create a new location with a unique name.

```json
{
  "type": "agent.location.create",
  "version": "0.1",
  "payload": {
    "name": "Warehouse Loading Dock",
    "position": {
      "x": 12.5,
      "y": 8.3,
      "z": 0.0
    },
    "orientation": {
      "yaw": 1.57
    },
    "metadata": {
      "zone": "loading"
    }
  }
}
```

All fields match the shared location definition:
- `name`: Unique name of the location (required)
- `position`: Coordinates (x, y required; z optional)
- `orientation`: Optional orientation (yaw, pitch, roll in radians)
- `metadata`: Optional metadata object

##### agent.location.list
List all stored locations on the robot.

```json
{
  "type": "agent.location.list",
  "version": "0.1",
  "payload": {}
}
```

Returns all locations with their full data.

##### agent.location.update
Overwrite an existing location by name.

```json
{
  "type": "agent.location.update",
  "version": "0.1",
  "payload": {
    "name": "Warehouse Loading Dock",
    "position": {
      "x": 12.8,
      "y": 8.5
    }
  }
}
```

The location name identifies which location to update. All fields must be provided to completely overwrite the location.

##### agent.location.delete
Delete a location by name.

```json
{
  "type": "agent.location.delete",
  "version": "0.1",
  "payload": {
    "name": "Old Warehouse Location"
  }
}
```

**Response (robot → webapp):**

##### agent.location.response
Success response for location operations.

```json
{
  "type": "agent.location.response",
  "version": "0.1",
  "correlationId": "original-request-id",
  "payload": {
    "operation": "list",
    "locations": [
      {
        "name": "Warehouse Loading Dock",
        "position": {
          "x": 12.5,
          "y": 8.3,
          "z": 0.0
        },
        "orientation": {
          "yaw": 1.57
        }
      },
      {
        "name": "Assembly Station 1",
        "position": {
          "x": 5.2,
          "y": 10.8
        }
      }
    ]
  }
}
```

- `operation`: The operation performed (create, list, update, delete)
- `locations`: Array of all locations (for list operation)

If locations are not specified, the message signifies that the operation completed successfully. If there is an error, the `agent.error` message is returned instead.

##### agent.error (for location errors)
On failure, robot sends `agent.error` with `correlationId` matching the request.

```json
{
  "type": "agent.error",
  "version": "0.1",
  "correlationId": "original-request-id",
  "payload": {
    "code": "LOCATION_NOT_FOUND",
    "message": "Location 'Warehouse A' does not exist",
    "details": {
      "operation": "update",
      "requestedName": "Warehouse A"
    }
  }
}
```

#### agent.navigation.* (Navigation)

**Available in:** v0.4+

The navigation messages enable the webapp to command the robot to navigate to a saved location by name. The robot reports status updates via a response message correlated to the original request.

**Commands (webapp → robot):**

##### agent.navigation.start
Start navigating to a saved location.

```json
{
  "type": "agent.navigation.start",
  "version": "0.4",
  "payload": {
    "name": "Warehouse Loading Dock"
  }
}
```

- `name`: Name of the saved location to navigate to (required)

##### agent.navigation.cancel
Cancel the current navigation.

```json
{
  "type": "agent.navigation.cancel",
  "version": "0.4",
  "payload": {}
}
```

No payload fields — cancels whatever navigation is currently in progress.

**Response (robot → webapp):**

##### agent.navigation.response
Status update for a navigation operation.

```json
{
  "type": "agent.navigation.response",
  "version": "0.4",
  "correlationId": "original-request-id",
  "payload": {
    "status": "started",
    "name": "Warehouse Loading Dock"
  }
}
```

- `status`: Navigation status — `started`, `completed`, `cancelled`, or `failed`
- `name`: Name of the location being navigated to (required)
- `message`: Optional human-readable detail (e.g. failure reason)

If the robot is not currently navigating when a cancel is received, it returns `agent.error` with code `NAVIGATION_NOT_ACTIVE`.

### Signalling Messages

The correct protocol for signalling is as follows:

1. Robot sends `signalling.register` message to the signalling server to register its availability.
2. Server registers the robot and maintains its availability status.
3. Server may send a `signalling.pki_challenge` to verify the robot's identity. The robot must respond with a `signalling.pki_response` containing the signed challenge. If verification succeeds, the server sends `signalling.pki_verified`. Registration is not considered complete until verification is confirmed.
4. Client wants to connect to a robot. Client sends `signalling.offer` with a generated session ID to the signalling server.
5. Server validates the client's permissions and forwards the offer to the robot.
6. Robot receives the offer and sends `signalling.answer` back through the server to the client.
7. Both sides exchange `signalling.ice_candidate` messages through the server until a valid connection can be achieved.
8. Both sides send `signalling.connected` messages to the server, then proceed to exchange control and media messages directly.
9. Once the connection drops, both sides send `signalling.disconnected` messages to the server.

#### signalling.register
Sent by the robot to register its availability with the signalling server.

```json
{
  "type": "signalling.register",
  "version": "0.1",
  "payload": {
    "agentId": "robot-001",
    "capabilities": {
      "videoCodecs": ["H264", "VP8"],
      "audioCodecs": ["opus"]
    },
    "metadata": {
      "model": "MR-5000",
      "firmwareVersion": "2.1.0"
    }
  }
}
```

- `agentId`: Unique identifier for the robot
- `capabilities`: Optional capabilities for session negotiation
- `metadata`: Optional metadata about the robot (model, firmware version, etc.)

#### signalling.offer
WebRTC SDP offer for connection establishment.

#### signalling.answer
WebRTC SDP answer in response to offer.

#### signalling.ice_candidate
ICE candidate for WebRTC connection.

#### signalling.connected
Indicates that a WebRTC connection has been successfully established.

```json
{
  "type": "signalling.connected",
  "version": "0.1",
  "payload": {
    "connectionId": "conn-9876543210",
    "iceConnectionState": "connected",
    "dataChannelState": "open"
  }
}
```

- `connectionId`: Unique identifier for this connection session
- `iceConnectionState`: The ICE connection state (connected or completed)
- `dataChannelState`: Optional state of the data channel

#### signalling.disconnected
Indicates that a WebRTC connection has been lost or closed.

```json
{
  "type": "signalling.disconnected",
  "version": "0.1",
  "payload": {
    "connectionId": "conn-9876543210",
    "reason": "timeout",
    "iceConnectionState": "disconnected",
    "details": {
      "duration": "900s"
    }
  }
}
```

- `connectionId`: Unique identifier for the connection that was lost
- `reason`: Reason for disconnection (closed, failed, timeout)
- `iceConnectionState`: Optional ICE connection state at time of disconnection
- `details`: Optional additional details about the disconnection

#### signalling.capabilities
Declares supported signalling protocol versions.

#### signalling.ping / signalling.pong

**Available in:** v0.2+

Health check messages for the signalling server connection. Either side can send a `signalling.ping` to verify the signalling server is reachable. The server responds with a `signalling.pong`, referencing the ID of the original ping via `correlationId`.

```json
{
  "type": "signalling.ping",
  "version": "0.2",
  "id": "b5c7d9e1-f3a5-6b7c-8d9e-0f1a2b3c4d5e",
  "timestamp": "2026-01-06T12:00:00Z"
}
```

#### signalling.pki_challenge / signalling.pki_response / signalling.pki_verified

**Available in:** v0.3+

After a robot sends `signalling.register`, the server may issue a `signalling.pki_challenge` to verify the robot's identity. The robot must sign the challenge string and reply with a `signalling.pki_response`. If verification succeeds, the server sends `signalling.pki_verified` to confirm the robot is registered. Registration is not considered complete until `pki_verified` is received.

```json
{
  "type": "signalling.pki_challenge",
  "version": "0.3",
  "id": "c6d8e0f2-a4b6-7c8d-9e0f-1a2b3c4d5e6f",
  "timestamp": "2026-01-06T12:00:01Z",
  "payload": {
    "challenge": "3q2+7w==base64encodedchallengestring=="
  }
}
```

```json
{
  "type": "signalling.pong",
  "version": "0.2",
  "id": "b5c7d9e1-f3a5-6b7c-8d9e-0f1a2b3c4d5f",
  "correlationId": "b5c7d9e1-f3a5-6b7c-8d9e-0f1a2b3c4d5e",
  "timestamp": "2026-01-06T12:00:01Z"
}
  "type": "signalling.pki_response",
  "version": "0.3",
  "id": "c6d8e0f2-a4b6-7c8d-9e0f-1a2b3c4d5e70",
  "correlationId": "c6d8e0f2-a4b6-7c8d-9e0f-1a2b3c4d5e6f",
  "timestamp": "2026-01-06T12:00:02Z",
  "payload": {
    "signature": "base64encodedsignatureofchallenge=="
  }
}
```

```json
{
  "type": "signalling.pki_verified",
  "version": "0.3",
  "id": "c6d8e0f2-a4b6-7c8d-9e0f-1a2b3c4d5e71",
  "correlationId": "c6d8e0f2-a4b6-7c8d-9e0f-1a2b3c4d5e70",
  "timestamp": "2026-01-06T12:00:03Z",
  "payload": {
    "agentId": "robot-001"
  }
}
```

- `challenge`: The challenge string the robot must sign
- `signature`: The robot's cryptographic signature of the challenge
- `agentId`: The agent ID confirmed as verified

### Error Messages

Errors are category-specific: `agent.error` for agent errors and `signalling.error` for signalling errors.

#### agent.error

Agent-related errors with agent-specific error codes.

```json
{
  "type": "agent.error",
  "version": "0.1",
  "payload": {
    "code": "MOVEMENT_FAILED",
    "message": "Agent movement command failed: obstacle detected",
    "details": {
      "obstacleType": "wall",
      "sensorReading": 0.15
    }
  }
}
```

**Agent Error Codes:**

| Code | Description |
|------|-------------|
| `INVALID_MESSAGE` | Message structure is malformed |
| `UNSUPPORTED_VERSION` | Protocol version not supported |
| `VALIDATION_FAILED` | Message failed schema validation |
| `INVALID_PAYLOAD` | Payload doesn't match message schema |
| `UNSUPPORTED_MESSAGE_TYPE` | Unknown message type |
| `MOVEMENT_FAILED` | Movement command failed (obstacle, limit, hardware) |
| `LOCATION_NOT_FOUND` | Requested location does not exist |
| `LOCATION_ALREADY_EXISTS` | Location with that name already exists |
| `LOCATION_NAME_INVALID` | Location name contains invalid characters |
| `NAVIGATION_ALREADY_ACTIVE` | Navigation already in progress |
| `NAVIGATION_NOT_ACTIVE` | No navigation in progress to cancel |
| `AGENT_UNAVAILABLE` | Agent is offline or unreachable |
| `CAPABILITY_MISMATCH` | Incompatible protocol versions |
| `INTERNAL_ERROR` | Unexpected agent error |

#### signalling.error

Signalling and WebRTC connection errors.

```json
{
  "type": "signalling.error",
  "version": "0.1",
  "payload": {
    "code": "CONNECTION_FAILED",
    "message": "WebRTC connection failed to establish",
    "details": {
      "iceState": "failed"
    }
  }
}
```

**Signalling Error Codes:**

| Code | Description |
|------|-------------|
| `INVALID_MESSAGE` | Message structure is malformed |
| `UNSUPPORTED_VERSION` | Protocol version not supported |
| `VALIDATION_FAILED` | Message failed schema validation |
| `INVALID_PAYLOAD` | Payload doesn't match message schema |
| `UNSUPPORTED_MESSAGE_TYPE` | Unknown message type |
| `CONNECTION_FAILED` | WebRTC connection failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `TIMEOUT` | Operation timed out |
| `CAPABILITY_MISMATCH` | Incompatible protocol versions |
| `ICE_FAILED` | ICE candidate gathering or connectivity failed |
| `SDP_INVALID` | SDP offer/answer is invalid |
| `INTERNAL_ERROR` | Unexpected signalling error |

The `details` field provides additional context specific to each error.

## Semantic Versioning

The protocol follows semantic versioning (MAJOR.MINOR):

- **MAJOR version**: Incompatible API changes
- **MINOR version**: Backward-compatible functionality additions

### Version Consistency Rules

1. Schema `$id` version must match file path version
2. Schema descriptions should reference the correct version
3. All schemas in a version directory must use that version

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and guidelines.

## License

MIT License - see LICENSE file for details.
