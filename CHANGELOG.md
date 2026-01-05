# Changelog

All notable changes to the Modulr Agent Interface Specification will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0] - 2026-01-05

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
