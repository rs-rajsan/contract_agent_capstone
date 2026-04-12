/**
 * CHILD REGISTRY: High-performance TypeScript mirror of MasterStatusCodes.
 * This file is restricted to the numeric enum only. 
 * All human-readable metadata must be resolved via the Master (error_cd_status_master.py).
 */
export enum StatusChild {
  OK = 200,

  // Client/Configuration Errors (4xx)
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TIMEOUT = 408,
  CONFIG_ERROR = 412,
  RATE_LIMIT = 429,

  // Server/Infrastructure Errors (5xx)
  INTERNAL_ERROR = 500,
  BAD_GATEWAY = 502,
  MODEL_BUSY = 503,
  NETWORK_ERROR = 504,
  DEPENDENCY_MISSING = 505,

  // Component Specific (6xx)
  DATABASE_LOCKED = 603,
  PROTOCOL_ERROR = 601,

  // Frontend / UI Specific (7xx)
  UI_LOAD_ERROR = 701,
  NAV_ERROR = 702,
  AUTH_CLIENT_ERROR = 703,

  // Agentic / Workflow Specific (8xx)
  PLAN_FAILURE = 801,
  VAL_FAILURE = 802,
  AGENT_TIMEOUT = 803,
}
