---
title: SRS document
description: Functional Requirements document.
---
SRS Document for Demo 1 as of 28 May 2025 - Will be updated as the project continues to change to fit with the Agile  methodology.

## Introduction

This document serves as a blueprint of our team's approach in defining the architectural framework for our API Threat Assessment Tool (or AT-AT for short). AT-AT is an innovative platformed designed to help secure and test web-based APIs.

With the growing reliance on APIs in digital systems, there is a critical need to be able to ensure that they are secure, and safe from attackers. AT-AT adresses this need by delivering a web-based platform that allows users to import their API specifications and dynamically scan and test and then generate a comprehensive assessment report of the results.

## Functional Requirements
### Authentication 
- R1: The users must be able to sign up
    - R1.1: Using a sign up form. The form should gather the following:
        - R1.1.1:**Email adress**
        - R1.1.2:**Password**
        - R1.1.3:**First Name**
        - R1.1.4:**Last Name**
    - R1.2 Using existing platforms:
        - R1.2.1: **Google account**
        - R1.2.2: **Apple account**

- R2: The user must be able to sign in
    - R2.1: Using their **email** and **password**
        - R2.1.1: **Credentials must be validated**
    - R2.2: Using existing platforms:
        - R2.2.1: **Google account**
        - R2.2.2: **Apple account**   

- R3: The user must be able to select "forgot password" 
    - R3.1: **The system must be able to use their email adress to identify if an account exists**
    - R3.2: **If an account exists an email should be sent with instructions on how to reset their password**

### Authorization
- R1: The system must provide restricted features based on roles
    - R1.1: **Basic users can scan APIs and view their own reports**
    - R1.2: **Admin users can view and manage all users and scan data**
    
### API Specification Input
- R1: Users must be able to submit API specifications
    - R1.1: **Upload OpenAPI/Swagger files**
    - R1.2: **Upload Postman Collections**
    - R1.3: **Provide URL to fetch the API Specification remotely**

### Heuristic API Discovery
- R1: The system must support specification-less scanning
    - R1.1: **Based on a target API domain**
    - R1.2: **User Heuristic and Traffic-based pattern detection to infer endpoints**
    - R1.3: **Automatically build testable endpoints for undocumented APIs**

### Scan Configuration
- R1 Users must be able to select a scan profile from a list of options
    - R1.1: **OWASP Top 10 Quick Scan**
    - R1.2: **Full Comprehensive Scan**
    - R1.3: **Authentication & Authorization Focus**

### API Vulnerability Scanning
- R1: The system must support automated scanning
    - R1.1: **Perform static analsysis on uploaded** specifications
    - R1.2: **Perform dynamic runtime analysis on live APIs**
    - R1.3: **Detect OWASP API Top 10 Vulnerabilities**

### Report Generation
- R1: After each scan, a report must be generated
    - R1.1: **Report must include a list of vulnerabilities found, severity levels and endpoints affected**
    - R1.2: **Report will include recommendations on how to improve security**
    - R1.3: **Allow report to be exported as a pdf**
    - R1.4: **Include a security score metric for the API**
    - R1.5: **Detailed summary for high-level overview**


## User Stories/Characteristics
##### A New User’s Characteristics
Any user who has not created an AT-AT account before.

As a New User I would like to:

- **Sign up with Google so that I can register quickly without filling out long forms**

- **Sign up with GitHub so that my developer identity is easily linked**

- **Sign up using an email and password so I can use AT-AT independently of other platforms**

##### An Existing User’s Characteristics
Any user who has previously registered on AT-AT.

As an Existing User I would like to:

- **Sign in with Google or GitHub to quickly access my account**

- **Log in using my email and password if I prefer traditional sign-in methods**

- **Change my password in case I want to improve my account security**

- **Update my profile information (name, organization, usage preferences)**

- **Delete my account if I no longer want to use the system**

##### A Developer’s Characteristics
A developer is someone preparing their API for production or release, and wants to ensure it's secure.

As a Developer I would like to:

- **Upload my API specification file (OpenAPI or Postman) so AT-AT can assess it**

- **Run a quick scan against the OWASP Top 10 so I can identify common vulnerabilities**

- **Select a scan profile based on depth or speed so I can test in different environments**

- **View a vulnerability report that highlights issues and suggests remediation steps**

- **Export the report in PDF so I can attach it to a documentation bundle or client brief**

- **Save the scan session so I can review or share results later**

##### A Security Analyst’s Characteristics
A security analyst is responsible for verifying and auditing the security posture of APIs across multiple teams.

As a Security Analyst I would like to:

- **Run deep scans on production and staging APIs to uncover hidden vulnerabilities**

- **Use heuristic scanning to discover undocumented endpoints that might be exposed**

- **Customize scanning profiles to target specific threat models or attack vectors**

- **Review detailed vulnerability metadata and logs for compliance auditing**

- **Export reports in JSON so I can ingest results into my existing SIEM system**

- **View a visual dashboard of historical scans and trends to monitor system health over time**

##### A Penetration Tester’s Characteristics
A pentester actively simulates attacks against APIs to discover exploitable flaws.

As a Penetration Tester I would like to:

- **Launch manual attack simulations like brute force, token theft, and injection attempts**

- **Enable red team mode to simulate multi-step attack chains for a more realistic threat assessment**

- **Use the CLI version of AT-AT so I can integrate it into my own automated testing pipelines**

- **Validate authentication flows to find weaknesses in token or session handling**

- **Test different input payloads and see how the API behaves under fuzzing conditions**

## Domain Model

## Use case Diagram

## Service contracts


## Technology Requirements

#### Mono Repository Management

**Tool:** GitHub (Monorepo)

 **Advantage**: Enables centralized version control, seamless collaboration, and simplified CI/CD workflows by organizing all backend, frontend, and shared libraries in a single unified repository.

#### Backend Framework
**Tool:** FastAPI (Python)

**Advantage:** Provides high-performance asynchronous capabilities, automatic documentation generation via OpenAPI, and easy integration with security testing libraries.

#### Frontend Framework
**Tool:** React

**Advantage:** Offers a component-based architecture and real-time UI updates, enabling the development of responsive and intuitive interfaces for users to manage scans and view reports.

#### Containerization
**Tool:** Docker

**Advantage:** Ensures consistent environments across development, testing, and production, making it easy to deploy and scale microservices securely and efficiently.

#### Database
**Tool:** PostgreSQL

**Advantage:** Offers strong ACID compliance and advanced querying capabilities, suitable for storing structured vulnerability data, scan logs, user credentials, and role-based access settings.

#### Authentication
**Tool:** OAuth 2.0 (Google/GitHub), JWT

**Advantage:** Supports secure, standardized login mechanisms with token-based sessions, enabling flexible integration with external identity providers.

#### Security Testing Tools
**Tool:** SQLMap, Burp Suite (optional), OWASP ZAP

**Advantage:** Automates discovery of injection vulnerabilities, misconfigurations, and broken authentication flows as part of the scan engine.

Unit / Integration Testing
Tool: Pytest
Advantage: Provides lightweight and scalable test automation with rich plugin support for testing scanning logic, service layers, and database interactions.

End-to-End Testing
Tool: Playwright or Cypress
Advantage: Enables full workflow simulation and test coverage of the frontend-backend integration, ensuring real-world reliability.

#### CI/CD Pipeline
**Tool:** GitHub Actions

**Advantage:** Automates testing, linting, building, and deployment with workflows triggered by pull requests and merges, ensuring continuous integration and delivery.

Linting & Formatting
Tool: ESLint (frontend), Flake8 or Ruff (backend)
Advantage: Maintains consistent code style and prevents common coding errors across frontend and backend.

Documentation: Inline
Tool: docstrings (Python) & JSDoc (React)
Advantage: Improves maintainability and clarity by providing developer-facing documentation directly in the codebase.

#### Documentation: Wiki & Guides
**Tool:** Markdown + Starlight (Astro)

**Advantage:** Allows clean, navigable documentation hosted alongside the codebase, supporting developer onboarding and client transparency.

#### Design and Wireframes
**Tool:** Figma

**Advantage:** Enables collaborative UX/UI design and iteration before development, ensuring clear structure and stakeholder feedback.

Deployment
Tool: VPS via Docker Compose (BITM-provided server)
Advantage: Delivers an isolated, reproducible production environment with simplified deployment and monitoring.


## Appendix