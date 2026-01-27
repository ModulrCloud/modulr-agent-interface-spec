# Modulr Agent Interface Specification

A JSON Schema repository defining the communication protocol for Modulr agent interfaces. This specification provides type-safe, versioned message schemas for agent control, signalling, and system capabilities.

## Overview

The Modulr Agent Interface Specification defines a standardized protocol for communication between agents and control systems. All messages follow a common envelope structure with versioned, validated payloads.

### Message Categories

- **Agent**: Commands and responses for agent control (movement, ping/pong, capabilities)
- **Signalling**: WebRTC signalling messages (offer, answer, ICE candidates, capabilities)
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
  "version": "0.0",
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
  "version": "0.0",
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
  "version": "0.0",
  "payload": {
    "versions": ["0.0", "0.1"]
  }
}
```

### Signalling Messages

The correct protocol for signalling is as follows:

1. Robot sends `signalling.register` message to the signalling server to register its availability.
2. Server registers the robot and maintains its availability status.
3. Client wants to connect to a robot. Client sends `signalling.offer` with a generated session ID to the signalling server.
4. Server validates the client's permissions and forwards the offer to the robot.
5. Robot receives the offer and sends `signalling.answer` back through the server to the client.
6. Both sides exchange `signalling.ice_candidate` messages through the server until a valid connection can be achieved.
7. Both sides send `signalling.connected` messages to the server, then proceed to exchange control and media messages directly.
8. Once the connection drops, both sides send `signalling.disconnected` messages to the server.

#### signalling.register
Sent by the robot to register its availability with the signalling server.

```json
{
  "type": "signalling.register",
  "version": "0.0",
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
  "version": "0.0",
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
  "version": "0.0",
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

### Error Messages

Errors are category-specific: `agent.error` for agent errors and `signalling.error` for signalling errors.

#### agent.error

Agent-related errors with agent-specific error codes.

```json
{
  "type": "agent.error",
  "version": "0.0",
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
| `AGENT_UNAVAILABLE` | Agent is offline or unreachable |
| `CAPABILITY_MISMATCH` | Incompatible protocol versions |
| `INTERNAL_ERROR` | Unexpected agent error |

#### signalling.error

Signalling and WebRTC connection errors.

```json
{
  "type": "signalling.error",
  "version": "0.0",
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
