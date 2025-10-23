<div align="center">

# 🛡️ API Threat Assessment Tool (AT-AT)

**A comprehensive cybersecurity platform designed to automate the security testing of APIs, enabling organizations to identify vulnerabilities early, improve API resilience, and comply with industry security standards.**

[🌐 Live Website](https://www.apithreatassessment.co.za) • [📖 Documentation](https://documentation.at-atdocs.pages.dev/) • [🎬 Watch Video](https://youtu.be/U67WkEOBb90)

</div>

---

## 📋 Requirements & Design Document

**[Software Requirements Specification (SRS)](https://documentation.at-atdocs.pages.dev/)**

Comprehensive documentation detailing functional and non-functional requirements, user stories, system architecture, and technology stack.

---

## 💻 Coding Standards

**[View Coding Standards](https://documentation.at-atdocs.pages.dev/reference/coding-standards)**

Best practices and guidelines for writing clean, maintainable, and secure code for AT-AT, including development conventions and code quality standards.

---

## 🧪 Testing Policy

**[Testing Policy & Reports](https://documentation.at-atdocs.pages.dev/reference/testing-policy)**

Our comprehensive testing strategy with links to:
- **Testing Tools:** Pytest, Playwright, Cypress
- **Actual Tests:** Backend tests (`/backend/tests/`), Frontend tests (`/frontend/tests/`)
- **Test Reports:** [Coverage Reports](https://coveralls.io/github/COS301-SE-2025/API-Threat-Assessment-Tool), [CI/CD Results](https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool/actions)

---

## 📊 Project Management Tools

**[GitHub Project Board](https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool/projects)**

We follow **Agile Scrum methodology** with 2-week sprints, daily stand-ups, sprint reviews, and continuous integration.

**Tools Used:**
- **GitHub** - Version control and repository management
- **GitHub Projects** - Sprint planning and task management
- **Slack** - Team communication and collaboration

---

## 📚 User Manual

**[Complete User Manual](https://drive.google.com/file/d/1nnZuWLJ3689Pkl85kBw2pqISen5tsMIl/view?usp=sharing)**

Detailed guide on how to use the API Threat Assessment Tool, including installation, setup, feature walkthroughs, and troubleshooting.

---

## 👥 Team Members

<table>
<tr>
<td align="center" width="20%">
<img src="https://github.com/HenruMatthis.png" width="100px;" alt="Henru Matthis"/><br />
<b>Henru Matthis</b><br />
<sub>Team Leader & Full-Stack</sub><br />
<a href="https://github.com/HenruMatthis">GitHub</a> • <a href="https://www.linkedin.com/in/henru-matthis">LinkedIn</a>
</td>
<td align="center" width="20%">
<img src="https://github.com/SalmaanPatel777.png" width="100px;" alt="Salmaan Patel"/><br />
<b>Salmaan Patel</b><br />
<sub>Backend Developer</sub><br />
<a href="https://github.com/SalmaanPatel777">GitHub</a> • <a href="https://www.linkedin.com/in/salmaan-patel">LinkedIn</a>
</td>
<td align="center" width="20%">
<img src="https://github.com/Rhulani756.png" width="100px;" alt="Rhulani Matiane"/><br />
<b>Rhulani Matiane</b><br />
<sub>UI/UX Developer & Intergration Engineer</sub><br />
<a href="https://github.com/Rhulani756">GitHub</a> • <a href="https://www.linkedin.com/in/rhulani-matiane">LinkedIn</a>
</td>
<td align="center" width="20%">
<img src="https://github.com/DragonMage899.png" width="100px;" alt="Justin Bhana"/><br />
<b>Justin Bhana</b><br />
<sub>Security Specialist & DevOps</sub><br />
<a href="https://github.com/DragonMage899">GitHub</a> • <a href="https://www.linkedin.com/in/justin-bhana">LinkedIn</a>
</td>
<td align="center" width="20%">
<img src="https://github.com/u22593048.png" width="100px;" alt="Jacques van der Merwe"/><br />
<b>Jacques van der Merwe</b><br />
<sub>Full-Stack & Business Analyst</sub><br />
<a href="https://github.com/u22593048">GitHub</a> • <a href="http://linkedin.com/in/jacques-van-der-merwe007">LinkedIn</a>
</td>
</tr>
</table>

<div align="center">

📧 **Team Contact:** [skillissue.capstone@gmail.com](mailto:skillissue.capstone@gmail.com)

</div>

---

## 🎬 Demo Video

<div align="center">

[![Watch Demo Video](frontend/src/img/YESSSS.png)](https://youtu.be/U67WkEOBb90)

### [▶️ Watch Full Demonstration](https://youtu.be/U67WkEOBb90)

*Complete walkthrough of AT-AT's automated vulnerability scanning, endpoint discovery, and security reporting capabilities. Essential viewing for CS staff grading before project day.*

</div>

---

## 🔬 Research Contribution

**[Research Documentation](https://documentation.at-atdocs.pages.dev/reference/research/)**

Our research focuses on automated API security methodologies, heuristic endpoint discovery algorithms, and OWASP API Security Top 10 integration into scalable testing frameworks.

**Key Contributions:**
- 🎯 Novel approaches to undocumented API detection
- 🔍 Intelligent endpoint discovery algorithms
- 🛡️ Automated OWASP API Top 10 testing framework
- 📊 Context-aware vulnerability classification systems

---

## 🚀 Deployment

### 🌐 Live System

**Production Deployment:** [https://www.apithreatassessment.co.za](https://www.apithreatassessment.co.za)

The system is deployed using Docker and Kubernetes for scalability and reliability.

---

## 📦 Installation Instructions

### System Requirements
- **Docker** (recommended)
- **Node.js** 18+
- **Python** 3.9+
- **PostgreSQL**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool.git
cd API-Threat-Assessment-Tool

# 🐳 Using Docker (Recommended)
docker-compose up -d

# 🔧 Manual Setup - Backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload

# ⚛️ Manual Setup - Frontend
cd frontend
npm install
npm start
```

**Detailed Setup Instructions:** See [Installation Manual](https://documentation.at-atdocs.pages.dev/reference/install)

---

## 🤝 Contributing to Development

We welcome contributions from the community! Here's how to participate:

### Getting Started

1. 🍴 **Fork** the repository and create a feature branch
2. 📝 Follow our **[Coding Standards](https://documentation.at-atdocs.pages.dev/reference/coding-standards)**
3. ✅ Write tests for new features (maintain >80% coverage)
4. 🔍 Submit pull requests with clear descriptions
5. 💬 Join **[GitHub Discussions](https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool/discussions)** for questions

### Development Process
- **Methodology:** Agile Scrum with 2-week sprints
- **Code Review:** Required for all pull requests
- **Testing:** Automated CI/CD pipeline via GitHub Actions
- **Communication:** Slack for team coordination

### Reporting Issues
Found a bug or have a feature request? **[Open an Issue](https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool/issues)**

---

<div align="center">

### 🛡️ *Securing APIs, One Scan at a Time*

**Built with ❤️ by Team Skill Issue**

[![GitHub stars](https://img.shields.io/github/stars/COS301-SE-2025/API-Threat-Assessment-Tool?style=social)](https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/COS301-SE-2025/API-Threat-Assessment-Tool?style=social)](https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool/network)
[![GitHub issues](https://img.shields.io/github/issues/COS301-SE-2025/API-Threat-Assessment-Tool)](https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool/issues)

</div>

[![Build Status](https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool/actions/workflows/ci.yml/badge.svg)](https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool/actions)
[![Coverage Status](https://coveralls.io/repos/github/COS301-SE-2025/API-Threat-Assessment-Tool/badge.svg)](https://coveralls.io/github/COS301-SE-2025/API-Threat-Assessment-Tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

