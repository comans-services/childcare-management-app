import { lazy } from "react";

// Centralized lazy loading registry for all route components
// This allows for better code splitting and performance optimization

// Main App Pages
export const TimesheetPage = lazy(() => import("@/pages/TimesheetPage"));
export const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
export const TeamPage = lazy(() => import("@/pages/TeamPage"));
export const WorkSchedulePage = lazy(() => import("@/pages/WorkSchedulePage"));
export const HolidayManagementPage = lazy(() => import("@/pages/HolidayManagementPage"));
export const PayrollSettingsPage = lazy(() => import("@/pages/PayrollSettingsPage"));
export const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

// Auth Pages
export const AuthPage = lazy(() => import("@/pages/AuthPage"));

// Management Hub
export const ManagementHubPage = lazy(() => import("@/pages/ManagementHubPage"));

// Mass Mailer Pages
export const MassMailerPage = lazy(() => import("@/pages/MassMailerPage"));

// Childcare Monitor Pages
export const ChildcareMonitorIndex = lazy(() => import("@/pages/childcare-monitor/ChildcareMonitorIndex"));
export const RoomMonitor = lazy(() => import("@/pages/childcare-monitor/RoomMonitor"));
export const DeviceSetup = lazy(() => import("@/pages/childcare-monitor/DeviceSetup"));
export const DeviceManagement = lazy(() => import("@/pages/childcare-monitor/DeviceManagement"));
