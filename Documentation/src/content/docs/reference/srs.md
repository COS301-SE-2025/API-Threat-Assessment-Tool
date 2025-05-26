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
    - R1.2 Using their Google account

- R2: The user must be able to sign in
    - R2.1: Using their **email** and **password**
        - R2.1.1: **Credentials must be validated**
    - R2.2: Using their Google account

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


## Appendix