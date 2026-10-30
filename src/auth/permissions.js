export function getPermissions(role) {
  const isAdmin = role === "admin";
  return {
    isAdmin,
    isAdvance: false,
    isAdvanceOrAdmin: isAdmin,
    isGeneral: !isAdmin,
  };
}
