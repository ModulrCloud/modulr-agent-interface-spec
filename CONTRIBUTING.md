# Contributing to Modulr Agent Interface Specification

This document outlines the process for proposing and implementing changes to the protocol schemas.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Workflow](#development-workflow)
- [Making Changes](#making-changes)
- [Semantic Versioning Guidelines](#semantic-versioning-guidelines)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project follows standard professional conduct expectations. Be respectful, constructive, and collaborative in all interactions.

## Development Workflow

We use a Jira-based workflow for all changes to the specification:

### 1. Create a Jira Ticket

Before making any changes, create a Jira ticket describing:

- **What**: The capability or change being requested
- **Why**: The business or technical justification
- **Impact**: Which message types or schemas will be affected
- **Version**: Whether this is a MAJOR or MINOR change (see [Semantic Versioning](#semantic-versioning-guidelines))

### 2. Create a Branch

Create a feature branch from `main` using the Jira ticket number:

```bash
git checkout main
git pull origin main
git checkout -b PROJ-123-add-status-message
```

### 3. Make Changes

#### Adding a New Message Type

1. Define the schema file. For example, `schemas/{category}/v0/{message}.json`

2. Create a corresponding example file, such as `examples/{category}/{message}.example.json`

3. **Update index.json:**
   Add a reference to your schema in `schemas/index.json`:
   ```json
   {
     "message_name": {
       "$ref": "./category/v0/message.json"
     }
   }
   ```

5. **Run validation:**
    ```bash
    # Install dependencies (if not already done)
    npm install

    # Run validation suite
    npm run validate
    ```

#### Modifying an Existing Schema

1. **Determine version impact** (see [Semantic Versioning](#semantic-versioning-guidelines))
2. **If MAJOR change**: Create new version directory (e.g., `v1`)
3. **If MINOR change**: Modify existing schema in place
4. **Update examples** to match schema changes
5. **Update CHANGELOG.md** with your changes
6. **Run validation** to ensure all checks pass

### 4. Test Locally

Before submitting your pull request, ensure:

```bash
# Install dependencies (if not already done)
npm install

# Run validation suite
npm run validate
```

The validation must pass with no errors.

### 5. Submit Pull Request

Create a pull request to merge your branch into `main`:

1. **Push your branch:**
   ```bash
   git push origin PROJ-123-your-branch-name
   ```

2. **Create PR on GitHub:**
   - Title: `[PROJ-123] Add status message schema`
   - Description: Reference the Jira ticket and describe changes
   - Link the Jira ticket in the PR description

3. **PR Description Template:**
   ```markdown
   ## Jira Ticket
   [PROJ-123](https://jira.example.com/browse/PROJ-123)

   ## Description
   Adds a new `agent.status` message type for reporting agent health status.

   ## Changes
   - Added schemas/agent/v0/status.json
   - Added examples/agent/status.example.json
   - Updated schemas/index.json
   - Updated CHANGELOG.md

   ## Testing
   - [ ] All validation checks pass locally
   - [ ] Examples validate against schema
   - [ ] Documentation updated

   ## Version Impact
   - [x] MINOR - Backward compatible addition
   - [ ] MAJOR - Breaking change
   ```

### 6. Code Review

Your pull request requires:

- ✅ **One approving review** from another team member
- ✅ **All CI tests passing** (GitHub Actions)
- ✅ **No merge conflicts** with main branch

**Reviewers should verify:**
1. Schema follows project conventions
2. Examples are clear and correct
3. Semantic versioning is appropriate
4. `index.json` is updated
5. `CHANGELOG.md` is updated
6. All validation checks pass

### 7. Merge

Once approved and all checks pass:

1. The PR will be **squashed and merged** into `main`
2. The branch will be automatically deleted
3. The Jira ticket should be moved to "Done"

## Semantic Versioning Guidelines

The protocol follows semantic versioning (MAJOR.MINOR):

### MINOR Version Changes (Backward Compatible)

Increment MINOR version for:
- Adding new message types
- Adding optional fields to payloads
- Adding new enum values
- Expanding validation ranges (e.g., -1 to 1 becomes -2 to 2)

**Implementation:**
- Modify schemas in place within existing version directories
- Add new schemas to existing version directories
- Update examples to show new features

### MAJOR Version Changes (Breaking Changes)

Increment MAJOR version for:
- Removing message types
- Removing or renaming fields
- Making optional fields required
- Changing field types
- Restricting validation ranges
- Changing message type identifiers

**Implementation:**
- Create new version directory for the component (e.g., `agent/v1/`)
- Copy and modify schemas in new directory
- Update schema `$id` URLs to reference new version
- Maintain old version for backward compatibility
- Update index.json with new version section

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Validation passes: `npm run validate`
- [ ] CHANGELOG.md is updated
- [ ] Examples are provided for all new schemas
- [ ] Index.json is updated
- [ ] Commit messages are clear and descriptive

### Review Checklist

Reviewers should verify:

- [ ] Schema follows JSON Schema 2020-12 specification
- [ ] Schema uses `allOf` with envelope reference
- [ ] Required fields are clearly marked
- [ ] Descriptions are clear and complete
- [ ] Examples validate against schema
- [ ] Semantic versioning is correctly applied
- [ ] `index.json` includes new schemas
- [ ] No breaking changes in MINOR versions
- [ ] `CHANGELOG.md` is updated

## Style Guidelines

### Schema Files

1. **Use consistent formatting:**
   - 2-space indentation
   - Double quotes for strings
   - Trailing commas allowed but not required

2. **Include complete metadata:**
   - `$id`: Full URL to schema
   - `$schema`: Reference to JSON Schema 2020-12
   - `title`: Clear, descriptive title
   - `description`: Include version (e.g., "v0.x")

3. **Use descriptive field names:**
   - Prefer clarity over brevity
   - Use camelCase for field names
   - Use snake_case for message type identifiers in file names

4. **Add descriptions to all fields:**
   - Explain purpose and usage
   - Include units where applicable
   - Note any constraints or validation rules

### Example Files

1. **Use realistic values:**
   - Make examples practical and useful
   - Show common use cases
   - Include all required fields

2. **Include metadata:**
   - Add `meta` object with contextual information
   - Use descriptive `source` values

3. **Follow naming convention:**
   - `{message}.example.json` for primary examples
   - `{message}-{variant}.example.json` for alternatives

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).
