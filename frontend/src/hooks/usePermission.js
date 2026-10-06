/**
 * usePermission(moduleKey)
 * Returns { canRead, canWrite, canDelete } for the currently logged-in user.
 *
 * Priority:
 *  1. super_admin  -> always full access, cannot be restricted
 *  2. Stored perms -> what was set in the Privileges tab (localStorage.autolab_permissions_v2)
 *  3. HARDCODED fallback defaults below
 *
 * IMPORTANT: read: false means the module is hidden from sidebar AND shows
 *            "Access Denied" if navigated to directly.
 */

const STORAGE_KEY = "autolab_permissions_v2";

const ALL_MODULES = [
  "dashboard","appointments","jobs","customers","services",
  "inventory","billing","hr","reports","users","booking","whatsapp",
];

function buildPerms(readKeys, writeKeys, deleteKeys) {
  writeKeys  = writeKeys  || [];
  deleteKeys = deleteKeys || [];
  return Object.fromEntries(ALL_MODULES.map(m => [m, {
    read:   readKeys === "*"   || (Array.isArray(readKeys) && readKeys.includes(m)),
    write:  writeKeys === "*"  || (Array.isArray(writeKeys) && writeKeys.includes(m)),
    delete: deleteKeys === "*" || (Array.isArray(deleteKeys) && deleteKeys.includes(m)),
  }]));
}

/**
 * Role defaults used when nothing is stored in localStorage.autolab_permissions_v2.
 *
 * Role          | Read modules                                              | Write modules
 * super_admin   | ALL                                                       | ALL (+ delete)
 * manager       | ALL                                                       | ALL (no delete, cannot change matrix)
 * technician    | dashboard, jobs, inventory, services                      | jobs, inventory
 * receptionist  | dashboard, appointments, customers, services, booking, whatsapp | appointments, customers, booking, whatsapp
 * accountant    | dashboard, billing, reports, services                     | billing, reports
 * viewer        | dashboard only                                            | none
 */
const HARDCODED_DEFAULTS = {
  super_admin: null,

  manager: buildPerms(
    "*",
    ["dashboard","appointments","jobs","customers","services","inventory","billing","hr","reports","users","booking","whatsapp"],
    []
  ),

  technician: buildPerms(
    ["dashboard","jobs","inventory","services"],
    ["jobs","inventory"],
    []
  ),

  receptionist: buildPerms(
    ["dashboard","appointments","customers","services","booking","whatsapp"],
    ["appointments","customers","booking","whatsapp"],
    []
  ),

  accountant: buildPerms(
    ["dashboard","billing","reports","services"],
    ["billing","reports"],
    []
  ),

  viewer: buildPerms(
    ["dashboard"],
    [],
    []
  ),
};

function getSession() {
  try { return JSON.parse(localStorage.getItem("autolab_session") || "null") || {}; }
  catch { return {}; }
}

function getStoredPermissions() {
  try {
    // Purge obsolete legacy key that had read: true for all roles
    localStorage.removeItem("autolab_permissions");
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  catch { return null; }
}

function resolveRoleMap(role) {
  if (role === "super_admin") return null;
  const stored = getStoredPermissions();
  if (stored && stored[role]) return stored[role];
  return HARDCODED_DEFAULTS[role] || HARDCODED_DEFAULTS.viewer;
}

export function usePermission(moduleKey) {
  const session = getSession();
  const role    = session.role || "viewer";

  if (role === "super_admin") {
    return { canRead: true, canWrite: true, canDelete: true };
  }

  const roleMap = resolveRoleMap(role);
  const p       = (roleMap && roleMap[moduleKey]) || { read: false, write: false, delete: false };

  return {
    canRead:   !!p.read,
    canWrite:  !!p.write,
    canDelete: !!p.delete,
  };
}

export function useAllowedModules() {
  const session = getSession();
  const role    = session.role || "viewer";

  if (role === "super_admin") return null;

  const roleMap = resolveRoleMap(role);
  if (!roleMap) return null;

  return Object.entries(roleMap)
    .filter(([, p]) => p && p.read)
    .map(([k]) => k);
}

export function useIsSuperAdmin() {
  const session = getSession();
  return (session.role || "") === "super_admin";
}
