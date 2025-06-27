---
title: Testing Policy Document
description: Document describing Skill Issue's Testing Policy.
---
## Table of Contents

- [Introduction](#introduction)  
- [Purpose](#purpose)  
- [Objectives](#objectives)  
- [Testing Process](#testing-process)  
- [Unit Testing](#unit-testing)  
- [Integration Testing](#integration-testing)  
- [Automation and CI Pipeline](#automation-and-ci-pipeline)

## Introduction
The AT-AT (API Threat Assessment Tool) is a web-based security platform designed to assess the vulnerabilities of RESTful APIs through both specification-based and heuristic scanning. With a focus on security, usability, and automation, the tool must operate reliably under varying loads and configurations.

Given its role in vulnerability detection, accuracy and stability are paramount. This document outlines how AT-AT will be tested across all dimensions — from component-level unit tests to user-facing integration and performance tests — to ensure trust and usability.

## Purpose
This Testing Policy defines the testing strategy for validating the functional and non-functional requirements of AT-AT. It ensures a consistent and structured approach to identifying, diagnosing, and resolving defects, with automation at the core of the testing pipeline.

Through this policy, we aim to:
- Reduce regression risks
- Improve user confidence
- Ensure compliance with industry best practices for software quality and security

## Objectives
The testing strategy aims to:
- Validate API import and scan functionality under various input conditions
- Simulate user workflows such as uploading API specs, running scans, and exporting reports
- Prevent critical failures (e.g., report generation breaking mid-scan)
- Ensure security features (e.g., RBAC, token handling) are unexploitable
- Continuously test new code commits via GitHub Actions

Edge cases include:
- Users uploading invalid/malformed files
- Scans interrupted mid-execution
- Concurrent users starting scans simultaneously
- API reports with unusually large output sets

## Testing Process
Our core testing stack includes:
- Pytest for backend unit/integration tests
- Playwright for frontend E2E tests
- GitHub Actions for CI/CD integration
- Postman (manual API tests) + schema validation

We aim for 75%+ test coverage across core components by the final sprint, focusing first on scanning logic, spec parsing, and user authentication.

## Unit Testing
Unit testing is done using pytest (Python) and Jest (if needed for the frontend). Each critical function — such as parse_spec, run_scan, generate_report, validate_token — has its own isolated tests. 
Stubs/mocks are used for:
- API imports (mocked spec objects)
- Database writes/reads
- External API calls (e.g., threat DBs)

For UI elements (React), individual components (e.g., UploadBox, ScanSelector) are also tested in isolation with mock props and event simulations.

## Integration Testing
Integration tests validate interactions between:

- Backend routes and DB
- Scan profiles and scan execution engine
- Auth flows across protected endpoints

We use:
- Postman collections with dummy JWTs
- Pytest + FastAPI's TestClient
- Realistic scan submissions via Playwright (UI > spec upload > scan > report)

Mocked vs. Live:
- Heuristic scan tests use mocked domain responses
- Auth and DB tests run against seeded containers

## Automation and CI Pipeline
All tests are run on GitHub Actions:

- On pull requests: run pytest, eslint, playwright install + test
- On merges: deploy Docker image + run end-to-end tests
- Test reports and logs are stored in build artifacts

Live external dependencies (e.g., Snyk or GitHub Advisory DBs) are simulated unless available during build.

If any test fails, the pipeline blocks the merge and provides logs via GitHub summary output.