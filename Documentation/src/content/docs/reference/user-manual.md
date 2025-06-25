---
title: User Manual
description: Document describing how to use AT-AT.
---
# User Manual – API Threat Assessment Tool (AT-AT)

## Table of Contents

** TO DO **
---

## Introduction

Welcome to the API Threat Assessment Tool (AT-AT), a web-based platform that helps developers and security teams analyze OpenAPI specifications for potential threats and vulnerabilities. Whether you're validating third-party APIs, auditing your own endpoints, or tagging security-critical operations, AT-AT provides a seamless interface and actionable insights.

The system is designed with clarity and usability in mind. Users can upload their API specifications, initiate automated scans, view structured results, and organize findings with tags. It’s fast, flexible, and essential for secure API development.

---

## App Usage

### Landing Page

When you visit the site, you’ll arrive at the Landing Page, which gives you an overview of the tool. From here, you can choose to either sign up for a new account or log in if you already have one.

### Sign Up

New users can register using a password and a valid email that is not already used for a different account. Optionally, OAuth options (Google login) is available for those who wish to use it.

### Log In

Log in using your registered credentials. After successful login, you are redirected to your personal dashboard.

### Light / Dark Mode

You can change your theme from a simply button in the top right to toggle between light and dark mode, depending on your preference.

### Dashboard

The Dashboard displays a summary of your uploaded API specifications and their scan statuses. You’ll see buttons to “Upload New API”, “View Past Reports”, or “Manage Tags”.

### Upload API Spec

1. Click **Upload New API**.
2. Select a valid OpenAPI file (`.json` or `.yaml`) from your device.
3. Click **Submit**.
4. If the upload is valid, you will see a message indicating success along with a unique API ID.
5. AT-AT automatically scans the file for potential threats.

### Scan Results

After upload:

* A summary of scan results will be displayed.
* You can click on an API to view its **list of endpoints**.
* Each endpoint shows path, method, security posture, and any issues discovered.

### Tag Endpoints

1. From an endpoint’s detail page, click **Add Tags**.
2. Choose from existing tags or create new ones.
3. Click **Save**. Tags help classify endpoints (e.g., `authentication`, `public`, `admin-only`).

### Manage Tags

From the **Tags** page:

* View all tags in use across your APIs.
* Remove unused tags.
* Rename or merge tags for consistency.

### Profile Page

1. Click on your avatar in the top-right corner and select **Profile**.
2. From here, you can:

   * Change your display name
   * Update your password
   * Delete your account (if needed)

---

Thank you for using AT-AT!
