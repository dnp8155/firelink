// Shared helpers for the scheduling functions (preventive maintenance and SLA
// enforcement): who the calling actor may act on, list normalisation, and the
// response window each priority level is entitled to.

export const SLA_HOURS = { critical: 4, high: 24, medium: 72, low: 168 };

export function hoursForPriority(priority) {
  return SLA_HOURS[priority] || SLA_HOURS.medium;
}

export function asList(result) {
  return Array.isArray(result) ? result : (result && result.items) || [];
}

// Platform admins act on one organization at a time (or on everything when they
// explicitly ask for a cross-organization sweep), vendor staff on their own
// queue, organization users on their own requests.
export function actorScope(user, payload) {
  const isAdmin = user.role === 'admin';
  const ownOrg = (user.data && user.data.organization_id) || '';
  const ownVendor = (user.data && user.data.vendor_id) || '';
  const allOrganizations = isAdmin && payload.all_organizations === true;

  if (isAdmin) {
    const organizationId = payload.organization_id || (allOrganizations ? '' : ownOrg);
    if (!organizationId && !allOrganizations) {
      return { isAdmin, allOrganizations, organizationId: '', vendorId: '', error: 'An organization is required.' };
    }
    return { isAdmin, allOrganizations, organizationId, vendorId: '' };
  }

  const organizationId = ownOrg || payload.organization_id || '';
  const vendorId = organizationId ? '' : ownVendor;
  if (!organizationId && !vendorId) {
    return { isAdmin, allOrganizations: false, organizationId: '', vendorId: '', error: 'No organization or vendor on your profile.' };
  }
  return { isAdmin, allOrganizations: false, organizationId, vendorId };
}