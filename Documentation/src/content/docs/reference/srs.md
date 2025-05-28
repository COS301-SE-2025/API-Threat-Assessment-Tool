---
title: SRS document
description: Functional Requirements document.
---
SRS Document for Demo 1 as of 28 May 2025 - Will be updated as the project continues to change to fit with the Agile  methodology.

## Table of Contents

- [Introduction](#introduction)
- [Functional Requirements](#functional-requirements)
- [User Stories](#user-storiescharacteristics)
- [Domain Model](#domain-model)
- [Use Case Diagrams](#use-case-diagram)
- [Architectural Constraints](#architectural-constraints)
- [Architectural Quality Requirements](#architectural-quality-requirements)
- [Architectural Patterns](#architectural-patterns)
- [Technology Requirements](#technology-requirements)
- [Service Contracts](#service-contracts)
- [Testing Policy Document](../testingpolicy)
- [Appendix](#appendix)

## Introduction

This document serves as a blueprint of our team's approach in defining the architectural framework for our API Threat Assessment Tool (or AT-AT for short). AT-AT is an innovative platformed designed to help secure and test web-based APIs.

With the growing reliance on APIs in digital systems, there is a critical need to be able to ensure that they are secure, and safe from attackers. AT-AT adresses this need by delivering a web-based platform that allows users to import their API specifications and dynamically scan and test and then generate a comprehensive assessment report of the results.

## Functional Requirements
### Authentication 
- R1: The users must be able to sign up
    - R1.1: Using a sign up form. The form should gather the following:
        - R1.1.1:Email adress
        - R1.1.2:Password
        - R1.1.3:First Name
        - R1.1.4:Last Name
    - R1.2 Using existing platforms:
        - R1.2.1: Google account
        - R1.2.2: Apple account

- R2: The user must be able to sign in
    - R2.1: Using their email and password
        - R2.1.1: Credentials must be validated
    - R2.2: Using existing platforms:
        - R2.2.1: Google account
        - R2.2.2: Apple account   

- R3: The user must be able to select "forgot password" 
    - R3.1: The system must be able to use their email adress to identify if an account exists
    - R3.2: If an account exists an email should be sent with instructions on how to reset their password

### Authorization
- R1: The system must provide restricted features based on roles
    - R1.1: Basic users can scan APIs and view their own reports
    - R1.2: Admin users can view and manage all users and scan data
    
### API Specification Input
- R1: Users must be able to submit API specifications
    - R1.1: Upload OpenAPI/Swagger files
    - R1.2: Upload Postman Collections
    - R1.3: Provide URL to fetch the API Specification remotely

### Heuristic API Discovery
- R1: The system must support specification-less scanning
    - R1.1: Based on a target API domain
    - R1.2: User Heuristic and Traffic-based pattern detection to infer endpoints
    - R1.3: Automatically build testable endpoints for undocumented APIs

### Scan Configuration
- R1 Users must be able to select a scan profile from a list of options
    - R1.1: OWASP Top 10 Quick Scan
    - R1.2: Full Comprehensive Scan
    - R1.3: Authentication & Authorization Focus

### API Vulnerability Scanning
- R1: The system must support automated scanning
    - R1.1: Perform static analsysis on uploaded specifications
    - R1.2: Perform dynamic runtime analysis on live APIs
    - R1.3: Detect OWASP API Top 10 Vulnerabilities

### API Behavior & Health Monitoring

- R1: The system must analyze API responses during scanning
    - R1.1: Identify abnormal HTTP status codes (e.g., 5xx, 4xx where unexpected)
    - R1.2: Detect insecure default configurations or misbehavior (e.g., exposing stack traces, reflection of payloads)

- R2: The system must detect and flag usage of outdated or insecure packages
    - R2.1: Scan dependency metadata in OpenAPI/Swagger specs
    - R2.2: Use vulnerability databases (e.g., CVE, Snyk API, GitHub Advisory DB) to check for known issues
    - R2.3: Highlight specific libraries and their affected versions

- R3: The system must correlate scan output with known vulnerability patterns
    - R3.1: Use rule-based or AI-assisted pattern matching to increase detection accuracy
    - R3.2: Provide contextual information on abnormal responses (e.g., unexpected content-type, slow response time, inconsistent structure)

### Report Generation
- R1: After each scan, a report must be generated
    - R1.1: Report must include a list of vulnerabilities found, severity levels and endpoints affected
    - R1.2: Report will include recommendations on how to improve security
    - R1.3: Allow report to be exported as a pdf
    - R1.4: Include a security score metric for the API
    - R1.5: Detailed summary for high-level overview


## User Stories/Characteristics
### A New User’s Characteristics
Any user who has not created an AT-AT account before.

As a New User I would like to:

- Sign up with Google so that I can register quickly without filling out long forms

- Sign up with GitHub so that my developer identity is easily linked

- Sign up using an email and password so I can use AT-AT independently of other platforms

### An Existing User’s Characteristics
Any user who has previously registered on AT-AT.

As an Existing User I would like to:

- Sign in with Google or GitHub to quickly access my account

- Log in using my email and password if I prefer traditional sign-in methods

- Change my password in case I want to improve my account security

- Update my profile information (name, organization, usage preferences)

- Delete my account if I no longer want to use the system

### A Developer’s Characteristics
A developer is someone preparing their API for production or release, and wants to ensure it's secure.

As a Developer I would like to:

- Upload my API specification file (OpenAPI or Postman) so AT-AT can assess it

- Run a quick scan against the OWASP Top 10 so I can identify common vulnerabilities

- Select a scan profile based on depth or speed so I can test in different environments

- View a vulnerability report that highlights issues and suggests fixes

- Export the report in PDF so I can use it/look at it later

- Save the scan session so I can review or share results later

### A Security Analyst’s Characteristics
A security analyst is responsible for verifying and auditing the security posture of APIs across multiple teams.

As a Security Analyst I would like to:

- Run deep scans on production and staging APIs to uncover hidden vulnerabilities

- Use heuristic scanning to discover undocumented endpoints that might be exposed

- Customize scanning profiles to target specific threat models or attack vectors

- Review detailed vulnerability metadata and logs for compliance auditing

- Export reports in JSON so I can ingest results into my existing SIEM system

- View a visual dashboard of historical scans and trends to monitor system health over time

### A Penetration Tester’s Characteristics
A pentester actively simulates attacks against APIs to discover exploitable flaws.

As a Penetration Tester I would like to:

- Launch manual attack simulations like brute force, token theft, and injection attempts

- Enable red team mode to simulate multi-step attack chains for a more realistic threat assessment

- Use the CLI version of AT-AT so I can integrate it into my own automated testing pipelines

- Validate authentication flows to find weaknesses in token or session handling

- Test different input payloads and see how the API behaves under fuzzing conditions

## Domain Model
###### Right click on image and press on open imnage in new tab if you want to read it more clearly/in larger scale
![Domain Model](/images/domain-model.png)
## Use case Diagram

### Authentication
![Authentication](/images/Authentication.jpg)
### API Specification Input
![APISpecification](/images/APISpecificationInput.jpg)
### Scanning
![Scanning](/images/Scanning.jpg)
### Heuristic Discovery
![HeuristicDiscovery](/images/HeuristicAPIDiscovery.jpg)
### Reports
![Reports](/images/ReportGeneration.jpg) 
### Account Management System
![AccountManagement](/images/Account-Management-System.jpg)
## Architectural Constraints
### Deployment

The AT-AT system will be deployed on a VPS provided by BITM, using Docker for containerization. This ensures consistent development, testing, and production environments. The use of Docker Compose simplifies orchestration and deployment of backend and frontend services.

### Security

The system uses industry-standard authentication protocols such as OAuth 2.0 and JWTs for secure login and authorization. Sensitive data is encrypted at rest (AES) and in transit (TLS). Role-Based Access Control (RBAC) restricts access to features and reports.

### Cost

Since hosting infrastructure is provided by the client (BITM), the team must remain within resource limits and avoid using excessive third-party APIs. Optional integrations (e.g., Snyk, Burp Suite API) will only be added if budget and technical feasibility allow.

### Reliability

Docker and GitHub Actions ensure high reliability through automated CI/CD and consistent builds. Uptime monitoring tools like Uptime Robot and fail-safe error handling mechanisms help ensure continuous availability and reduce downtime.

## Architectural Quality Requirements
### Security
Security is paramount for a vulnerability assessment platform. The system must enforce strong authentication, secure transmission and storage of data, and role-based access to restrict sensitive information. This ensures trust, regulatory compliance, and protection from malicious users.

**Measured by:**
maybe add percentage of data stored in plaintext

currently, mentioned oauth 2,0 in archtitectural constraints but the current version uses passwords and hashes, architectural constraints are of the end protect and quality requirements are of current version
probably drop compatibility
- Access control test results

- Penetration testing

- Static and dynamic vulnerability scans

- R1.1: Secure Authentication
    - R1.1.1: Users must authenticate with hashed credentials.  
**Implementation:** Bcrypt will be used for password hashing with appropriate salting.
    - R1.1.2: Sessions must be stateless and securely maintained.  
**Implementation:** JWTs (signed with a private key) will be used and stored securely on the client side.

- R1.2: Role-Based Access Control (RBAC)
    - R1.2.1: Different access levels must exist for users, analysts, and admins.  
**Implementation:** Endpoints will be guarded using middleware that checks role claims embedded in the JWT.

- R1.3: Secure Transmission and Storage
    - R1.3.1: All API requests and responses must be encrypted in transit.  
**Implementation:** HTTPS (TLS 1.2+) will be enforced via nginx or similar reverse proxy.

    - R1.3.2: Sensitive data must be encrypted at rest.  
**Implementation:** AES-256 encryption will be used for storing API keys, scan configs, and user tokens.

### Performance
Performance is critical due to the compute-intensive nature of scanning APIs. Users expect fast feedback without interface lag or failure during long scans.

**Measured by:**

- Scan completion time

- File processing speed

- API latency benchmarks

- R2.1: Responsive UI During Scans
    - R2.1.1: Users should see real-time feedback during scans.  
**Implementation:** A status polling system using WebSockets or polling will be integrated into the frontend.

    - R2.1.2: The UI should not freeze during uploads or scans.  
**Implementation:** All operations will be asynchronous, with loading indicators and retry logic.

- R2.2: Scan Completion Targets
    - R2.2.1: 90% of scans should complete within 2 minutes on stable networks.  
**Implementation:** Smart scan throttling and resource allocation will be used server-side.

    - R2.2.2: Large files (up to 5MB) should be accepted without timeout.  
**Implementation:** Chunked file upload and streaming to disk will be employed.

### Usability
For both developers and security professionals, the interface must be intuitive, concise, and reduce friction in task execution. The goal is to maximize system adoption by minimizing confusion and learning curve.

**Measured by:**

- User feedback

- Support queries

- Task completion rates

- R3.1: Simple Navigation
    - R3.1.1: Users must easily find scanning and reporting features.  
**Implementation:** Clear sidebar and breadcrumb navigation using a consistent component library (e.g., MUI or shadcn).

    - R3.1.2: Form inputs must guide the user through step-by-step scan setup.  
**Implementation:** Tooltips and progressive form sections will be used.

- R3.2: Visual Feedback
    - R3.2.1: Users must receive confirmation for actions.  
**Implementation:** Toast messages and modals will display confirmation or error results.  

    - R3.2.2: Critical errors must show remediation suggestions.  
**Implementation:** Structured messages with documentation links will be displayed in scan reports.

### Compatibility
AT-AT must run in any modern browser and allow specification imports from common formats.

**Measured by:**

- Browser/device testing

- File support validation

- Mobile responsiveness

- R4.1: Browser and Device Compatibility
    - R4.1.1: The system must work in Chrome, Firefox, and Edge.  
**Implementation:** Regular browser testing and linting with ESLint + Prettier + browserlist.

    - R4.1.2: Pages must adapt to mobile and tablets.  
**Implementation:** CSS Grid/Flexbox and responsive breakpoints will be used.

- R4.2: Supported File Formats
    - R4.2.1: Upload of OpenAPI, Swagger, and Postman collections is required.  
**Implementation:** File validation logic will parse .json, .yaml, and .zip correctly before processing.

### Reliability
As a critical assessment tool, users must trust AT-AT to always be available, recover gracefully from crashes, and log all operations for audit purposes.

**Measured by:**

- Uptime percentage

- Recovery time objective (RTO)

- System logs and error rates

- R5.1: High Availability
    - R5.1.1: The system must maintain >99% uptime post-deployment.  
**Implementation:** Docker containers will be monitored with auto-restart policies.

- R5.2: Deployment and Update Resilience
    - R5.2.1: New features must deploy with zero downtime.  
**Implementation:** GitHub Actions + reverse proxy blue-green deployment setup.

- R5.3: Error Monitoring and Alerts
    - R5.3.1: System errors must be logged and developers notified.  
**Implementation:** A log aggregator like Logtail or custom webhook will track critical backend crashes.

## Architectural Patterns

### Client-Server Architecture

AT-AT adopts a traditional Client–Server model where responsibilities are cleanly split between a React-based frontend and a Python FastAPI backend. The frontend is responsible for presenting the UI and initiating user actions (e.g., initiating scans, uploading specs), while the backend handles all business logic, authentication, and database operations.

This separation allows independent development, testing, and deployment of the frontend and backend systems.
- Client: React (browser-based UI)
- Server: FastAPI (REST API)
- Benefits: Decoupled development, scalability, clear role separation

### Rest API
The communication between the frontend and backend is implemented through a RESTful API design. Each resource (e.g., scan, report, user) is accessible via predictable endpoints and HTTP methods (GET, POST, PATCH, DELETE).

REST principles such as statelessness, resource-based URIs, and standard response codes are followed to ensure interoperability and scalability.
- Example: POST /api/scan/start, GET /api/report/{scan_id}
- Benefits: Loose coupling, platform independence, caching, easy documentation


### Model–View–Controller (MVC) Pattern in React
While React is not strictly bound to MVC, AT-AT’s implementation applies the MVC pattern conceptually:
- Model: App state and API responses (e.g., scan configs, reports)
- View: React components responsible for rendering UI
- Controller: Event handlers and React hooks controlling business interaction (e.g., handleScanSubmit())

This logical separation improves maintainability and reusability, especially in complex UI flows.
- Benefits: Clear state management, modularity, separation of concerns
### Layered (n-Tier) Architecture
AT-AT is organized into a 3-tier architecture, where each layer is responsible for a specific concern. This is a natural consequence of combining a React frontend with a FastAPI backend and PostgreSQL database.

|Layer | Description |
|-|-|
|Presentation Layer |	The React frontend (UI) where users interact |
|Business Logic Layer |	The FastAPI service layer handling validation, auth, scan orchestration |
|Persistence Layer |	PostgreSQL storing users, scan history, specs, reports |

These layers are loosely coupled but highly cohesive internally, improving maintainability and scalability. The client-server model sits atop this architecture as a deployment pattern.

- Benefits: Scalability, separation of concerns, easy testing, modular growth




## Service contracts
### User Authentication Service
| Element| Description|
|-|-|
| **Purpose**| Handles secure user registration, login, and token-based session handling|
| **Input**| JSON with `email`, `password` or third-party OAuth token (Google/GitHub)|
| **Output**| JWT access token or error message|
| **Endpoint**| `POST /api/auth/login` and `POST /api/auth/register`|
### API Specification Import Service
| Element| Description|
|-|-|
| **Purpose**| Allows users to upload API specs in OpenAPI, Swagger, or Postman formats |
| **Input**| File upload via `multipart/form-data` |
| **Output**| Parsed API structure or error message |
| **Endpoint**| `POST /api/spec/upload`|
### Report Generation Service
| Element| Description|
|-|-|
| **Purpose**| Generates a formatted report of scan results |
| **Input**| Path param: `scan_id`, Query: `?format=pdf/json/html` |
| **Output**| Report download or inline display |
| **Endpoint**| `GET /api/report/{scan_id}`|
### User Account Management Service
| Element| Description|
|-|-|
| **Purpose**| Enables user profile editing and account deletion|
| **Input**| JSON with updated user fields |
| **Output**| Success/failure confirmation |
| **Endpoint**| `PATCH /api/user/me`, `DELETE /api/user/me`|
### Heuristic API Discovery Service
| Element| Description|
|-|-|
| **Purpose**| Automatically discovers undocumented endpoints via heuristics |
| **Input**| JSON with API base URL |
| **Output**| List of discovered endpoints and metadata |
| **Endpoint**| `POST /api/spec/heuristic-scan`|
### Vulnerability Scanning Servic
| Element| Description|
|-|-|
| **Purpose**| Executes selected test profile on an imported or discovered API |
| **Input**| JSON with `api_id`, `scan_profile_id` |
| **Output**| Scan ID and queued scan status |
| **Endpoint**| `POST /api/scan/start`|
## Technology Requirements

#### Mono Repository Management
# Markdown badges on github
**Tool:** GitHub (Monorepo)

 **Advantage**: Enables centralized version control, seamless collaboration, and simplified CI/CD workflows by organizing all backend, frontend, and shared libraries in a single unified repository.

#### Backend Framework
**Tool:** Python

**Advantage:** Provides high-performance asynchronous capabilities, automatic documentation generation via OpenAPI, and easy integration with security testing libraries.

#### Frontend Framework
**Tool:** React

**Advantage:** Offers a component-based architecture and real-time UI updates, enabling the development of responsive and intuitive interfaces for users to manage scans and view reports.

**Considered Alternative:** Angular

**Reason for choice over Alternative:** React had more flexibility as well as our UX Engineers being more experienced in using it


#### API
**Tool:** JavaScript(Express.js/Node.js)

**Advantage:**  Enables rapid development of RESTful endpoints with clean routing, middleware support, and integration with authentication and CI/CD systems.

#### Containerization
**Tool:** Docker

**Advantage:** Ensures consistent environments across development, testing, and production, making it easy to deploy and scale microservices securely and efficiently.

#### Database
**Tool:** PostgreSQL

**Advantage:** Offers strong ACID compliance and advanced querying capabilities, suitable for storing structured vulnerability data, scan logs, user credentials, and role-based access settings.

**Considered Alternative:**MongoDB

**Reason for choice over Alternative:**MongoDB’s schema-less design would have introduced complexity in managing relational scan data.


#### Authentication
**Tool:** OAuth 2.0 (Google/GitHub), JWT

**Advantage:** Supports secure, standardized login mechanisms with token-based sessions, enabling flexible integration with external identity providers.

#### Security Testing Tools
**Tool:** SQLMap, Burp Suite (optional), OWASP ZAP

**Advantage:** Automates discovery of injection vulnerabilities, misconfigurations, and broken authentication flows as part of the scan engine.

#### Unit / Integration Testing
**Tool:** Pytest

**Advantage:** Provides lightweight and scalable test automation with rich plugin support for testing scanning logic, service layers, and database interactions.

#### End-to-End Testing
**Tool:** Playwright or Cypress

**Advantage:** Enables full workflow simulation and test coverage of the frontend-backend integration, ensuring real-world reliability.

#### CI/CD Pipeline
**Tool:** GitHub Actions

**Advantage:** Automates testing, linting, building, and deployment with workflows triggered by pull requests and merges, ensuring continuous integration and delivery.


#### Documentation: Wiki & Guides
**Tool:** Github + Markdown + Starlight (Astro)

**Advantage:** Allows clean, navigable documentation hosted alongside the codebase, supporting developer onboarding and client transparency.

#### Design and Wireframes
**Tool:** Figma

**Advantage:** Enables collaborative UX/UI design and iteration before development, ensuring clear structure and stakeholder feedback.


## Testing Policy Document
- [Go To Testing Policy Document](../testingpolicy)
## Appendix