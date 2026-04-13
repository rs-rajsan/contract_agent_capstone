# Project Roadmap: Contract Agent Capstone

This document tracks the milestones and individual tasks required to stabilize, enhance, and scale the agentic contract analysis platform.

## 🏁 Milestone 1: Admin & Role Orchestration (COMPLETED)
- [x] Implement nested vertical sidebar (Admin Persistence).
- [x] Construct Category-based Role Management (Business, Legal, Technical).
- [x] Design Role Profile UI with detailed capability/permission mappings.
- [x] Centralize 10-role tiered hierarchy in `src/constants/roles.ts`.
- [x] Implement democratization logic (remove role-guards for portal accessibility).

## 👤 Milestone 2: User Identity Management (IN PROGRESS)
- [x] Construct 4-Tab Portal Infrastructure (Manage Users, Add, Edit, Audit).
- [x] Implement Premium Identity Directory with real-time Search/Filter.
- [x] Develop `useAdminUsers` hook for centralized state management.
- [x] Upgrade `UserForm` to support dual-mode (Provisioning & Modification).
- [x] Orchestrate Manage-to-Edit transition workflow.
- [/] Functional Account Revocation (Soft-delete backend implementation).
- [ ] Implement Session Re-validation logic upon role modification.

## 🔍 Milestone 3: Forensic Audit & Observability (PENDING)
- [x] Implement Unified Audit Logging logic in Python backend.
- [x] Integrate regex-based PII Masking in security trails.
- [ ] Build Real-time Audit Viewer within the User Management Portal.
- [ ] Categorize Audit Events by Severity (Critical, Warning, Info).
- [ ] Implement Forensic Export functionality (CSV/JSON).

## 🚀 Milestone 4: Agentic Pipeline Transparency (PENDING)
- [ ] Implement "Agent Pulse" Dashboard for real-time processing tracking.
- [ ] Enable Correlation ID tracking across Frontend and Backend spans.
- [ ] Design Document Ingestion Retry engine with visual error feedback.
- [ ] Integrate Multi-agent reasoning trace visualization.

## 📊 Milestone 5: Advanced Analytics & Strategic Dashboards (PENDING)
- [ ] Develop TCV Trend Analysis visualizations.
- [ ] Build Risk Baseline Tuning interface for Legal Managers.
- [ ] Create Automated Compliance Reporting Engine.

## 🛡️ Milestone 6: System Stability & Security (ON-GOING)
- [x] Implement Robust Health Check / Full-screen Diagnostic UI.
- [x] Resolve `AttributeError` in Audit Logger (Service Restoration).
- [ ] Security Hardening: JWT Secret rotation & Environment isolation.
- [ ] Infrastructure: Optimize Docker image sizes and layer caching.

---

> [!NOTE]
> All administrative mutations are logged to `unified_agent_audit.jsonl` with critical severity flags for expert oversight.
