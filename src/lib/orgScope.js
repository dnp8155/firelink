// Organization scoping helpers — RLS already limits reads, this narrows queries
// to the signed-in user's organization when their profile has one.
export function orgQuery(user) {
  const id = user?.data?.organization_id;
  return id ? { organization_id: id } : {};
}

export function orgIdentity(user) {
  return {
    organization_id: user?.data?.organization_id || "",
    organization_name: user?.data?.organization_name || "",
  };
}

export function nextNumber(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}