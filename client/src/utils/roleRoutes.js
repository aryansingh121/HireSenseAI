export function normalizeRole(role) {
  if (["hr", "admin", "interviewer"].includes(role)) return "hiring_manager";
  return role;
}

export function normalizeUser(user) {
  if (!user) return null;
  const role = normalizeRole(user.role);

  return {
    ...user,
    role,
    demoInterviewsLeft:
      role === "candidate" ? user.demoInterviewsLeft ?? 3 : user.demoInterviewsLeft
  };
}

export function getRoleHomePath(role) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "candidate") return "/candidate";
  if (normalizedRole === "hiring_manager") return "/hr";
  return "/login";
}
