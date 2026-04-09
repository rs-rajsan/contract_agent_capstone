/**
 * Unified Context Manager for Frontend observability.
 * Stores and provides access to user, session, and tenant identifiers.
 */

// Generate a persistable session ID for the duration of the browser tab
const SESSION_ID = sessionStorage.getItem('diag_session_id') || `sess_${Math.random().toString(36).substring(2, 15)}`;
sessionStorage.setItem('diag_session_id', SESSION_ID);

export const getSessionId = () => SESSION_ID;

// In a real app, these would come from your Auth provider (e.g. Auth0, Clerk)
// For this capstone, we'll use a mock "Demo User" context
export const getUserId = () => "user_rajsa_demo";
export const getOrgId = () => "org_enterprise_corp";
export const getEnvironment = () => "development";

// Contract ID is dynamic based on what document the user is viewing
// This would be updated by your React state/router
let activeContractId = "";

export const setContractId = (id: string) => {
  activeContractId = id;
};

export const getContractId = () => activeContractId;
