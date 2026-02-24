# Changelog

All notable changes to the Modulr Agent Interface Specification will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2] - 2026-02-24

### Added

#### Signalling Schemas - Ping/Pong Health Check
- `signalling.ping` - Health check request sent to the signalling server (no payload required)
- `signalling.pong` - Health check response from the signalling server (requires `correlationId`)

## [0.1] - 2026-02-17

### Added

#### Agent Schemas - Location CRUD Operations
- `agent.location.create` - Create a new named location with position and optional orientation
- `agent.location.list` - List all stored locations on the robot
- `agent.location.update` - Update/overwrite an existing location by name
- `agent.location.delete` - Delete a location by name
- `agent.location.response` - Success response for location operations
- Shared location definition schema (`common/v0/location.json`) with position, orientation, and metadata

#### Error Codes
- `LOCATION_NOT_FOUND` - Requested location does not exist
- `LOCATION_ALREADY_EXISTS` - Location with that name already exists
- `LOCATION_NAME_INVALID` - Location name contains invalid characters

#### Infrastructure
- Updated validation script to support nested message types with folder organization (e.g., `agent.location.create` → `agent/v0/location/create.json`)

## [0.0] - 2026-01-27

### Added

#### Common Schemas
- Common envelope schema for all protocol messages
- Error message schema with code, message, and details fields
- Support for optional payload field in envelope

#### Agent Schemas
- `agent.error` - Error description if any error occurs during agent operation
- `agent.movement` - Movement control with forward and turn velocities (range -1.0 to 1.0)
- `agent.ping` - Health check request (no payload)
- `agent.pong` - Health check response (no payload)
- `agent.capabilities` - Protocol version negotiation with versions array

#### Signalling Schemas#
- `signalling.register` - Robot registration message to the signalling server
- `signalling.error` - Error description if any error occurs during signalling protocol
- `signalling.offer` - WebRTC SDP offer with ID, sdp and sdpType fields
- `signalling.answer` - WebRTC SDP answer with ID, sdp and sdpType fields
- `signalling.connected` - Notify the signalling server that a connection has been successful, with ID
- `signalling.disconnected` - Notify the signalling server that a connection has been lost, with ID and reason for disconnection
- `signalling.ice_candidate` - ICE candidate with ID, candidate, sdpMid, and sdpMLineIndex fields
- `signalling.capabilities` - Protocol version negotiation with versions array

#### Validation & Tooling
- Comprehensive validation tool with 5 validation checks:
  - Schema validation and compilation
  - Example validation against schemas
  - Semantic versioning consistency checks
  - Example coverage verification
  - Index.json completeness validation
- GitHub Actions CI workflow for automated validation
- Example files for all message types

#### Documentation
- Complete README.md with usage examples and reference documentation
- CONTRIBUTING.md with Jira-based workflow
- Schema index (index.json) with all message type references

### Infrastructure
- JSON Schema 2020-12 based definitions
- Node.js validation tooling using AJV
- Example-driven schema development

### Notes
- Initial release of the protocol specification
- All schemas are in v0 (unstable, subject to breaking changes)
- Message envelope requires: type, version, id, timestamp
- Payload is optional at envelope level, required by specific message schemas
