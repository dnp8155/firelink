import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from '@/lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from '@/components/ScrollToTop';
import RouteSeo from '@/components/RouteSeo';
import SiteSchema from '@/components/SiteSchema';
import SplashScreen from '@/components/app/SplashScreen';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGate from '@/components/app/RoleGate';
import ErrorBoundary from '@/components/ErrorBoundary';
import { RoleProvider } from '@/lib/state/RoleContext';
import { CartProvider } from '@/lib/state/CartContext';
// App shell + vendor layout (migrated from the FireLink project)
import AppLayout from '@/components/AppLayout';
import VendorLayout from '@/components/vendor/VendorLayout';
// Vendor portal pages (migrated from the FireLink project)
import VendorLogin from '@/pages/vendor/Login';
import VendorSettings from '@/pages/vendor/Settings';
import VendorDigitalSignature from '@/pages/vendor/DigitalSignature';
import VendorTeam from '@/pages/vendor/Team';
import Inventory from '@/pages/vendor/Inventory';
import VendorAnalytics from '@/pages/vendor/Analytics';
import VendorRFQs from '@/pages/vendor/RFQs';
import VendorVerification from '@/pages/vendor/Verification';
import VendorShipments from '@/pages/vendor/Shipments';
import Settlements from '@/pages/vendor/Settlements';
import VendorDashboard from '@/pages/vendor/Dashboard';
import VendorProducts from '@/pages/vendor/Products';
import VendorOrders from '@/pages/vendor/Orders';
import VendorRegister from '@/pages/vendor/Register';
import VendorCompanyProfile from '@/pages/vendor/CompanyProfile';
import VendorWarehouses from '@/pages/vendor/Warehouses';
import VendorReturns from '@/pages/vendor/Returns';
import VendorCustomers from '@/pages/vendor/Customers';
import VendorCertificates from '@/pages/vendor/Certificates';
import VendorDocuments from '@/pages/vendor/Documents';
import VendorPayments from '@/pages/vendor/Payments';
import VendorAmcPlans from '@/pages/vendor/AmcPlans';
import VendorOffers from '@/pages/vendor/Offers';
import VendorJobVacancies from '@/pages/vendor/JobVacancies';
import VendorWallet from '@/pages/vendor/Wallet';
import VendorSubscription from '@/pages/vendor/Subscription';
import VendorTechnicians from '@/pages/vendor/Technicians';
import VendorServiceRequests from '@/pages/vendor/ServiceRequests';
import VendorServices from '@/pages/vendor/Services';
// Organization admin portal + shared workspace pages (migrated from the FireLink project)
import OrgDashboard from '@/pages/org/Dashboard';
import OrgCompliance from '@/pages/org/Compliance';
import Sites from '@/pages/org/Sites';
import CapaPage from '@/pages/org/CAPA';
import Reports from '@/pages/shared/Reports';
import FireNOC from '@/pages/shared/FireNOC';
import Maintenance from '@/pages/shared/Maintenance';
import ComplianceCalendar from '@/pages/shared/ComplianceCalendar';
import Renewals from '@/pages/shared/Renewals';
import Notifications from '@/pages/shared/Notifications';
import Support from '@/pages/shared/Support';
import Documents from '@/pages/shared/Documents';
import Profile from '@/pages/shared/Profile';
// Technician portal (migrated from the FireLink project)
import TechnicianDashboard from '@/pages/technician/Dashboard';
import ScanQR from '@/pages/technician/ScanQR';
import Inspections from '@/pages/technician/Inspections';
import InspectionRun from '@/pages/technician/InspectionRun';
import TechnicianSchedule from '@/pages/technician/Schedule';
// Engineer suite (migrated from the FireLink project)
import EngineerDashboard from '@/pages/engineer/Dashboard';
import EngineerFireLoad from '@/pages/engineer/FireLoad';
import EngineerHydraulic from '@/pages/engineer/Hydraulic';
import EngineerBOQ from '@/pages/engineer/BOQ';
import EngineerAiAssistant from '@/pages/engineer/AiAssistant';
import EngineerProjects from '@/pages/engineer/Projects';
import EngineerReports from '@/pages/engineer/Reports';
// Platform admin command center (migrated from the FireLink project)
import AdminDashboard from '@/pages/admin/Dashboard';
import VendorApprovals from '@/pages/admin/VendorApprovals';
import ProductApprovals from '@/pages/admin/ProductApprovals';
// Super admin suite (migrated from the FireLink project)
import SystemDashboard from '@/pages/admin/SystemDashboard';
import RolesMatrix from '@/pages/admin/RolesMatrix';
import FeatureFlags from '@/pages/admin/FeatureFlags';
import SystemHealth from '@/pages/admin/SystemHealth';
import RevenueModel from '@/pages/admin/RevenueModel';
import Integrations from '@/pages/admin/Integrations';
// Platform admin operations suite (migrated from the FireLink project)
import AdminOrganizations from '@/pages/admin/AdminOrganizations';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminTickets from '@/pages/admin/AdminTickets';
import AdminDisputes from '@/pages/admin/AdminDisputes';
import AuditLogs from '@/pages/admin/AuditLogs';
// Platform admin console — catalog & marketplace governance (migrated from the FireLink project)
import Categories from '@/pages/admin/Categories';
import Customers from '@/pages/admin/Customers';
import Commissions from '@/pages/admin/Commissions';
import Advertisements from '@/pages/admin/Advertisements';
import JobApprovals from '@/pages/admin/JobApprovals';

import { LanguageProvider } from '@/lib/i18n';
// Screens built out from the earlier placeholders
import RoleSelector from '@/pages/RoleSelector';
import AdminMarketplace from '@/pages/admin/Marketplace';
import AdminPayments from '@/pages/admin/Payments';
// Vendor quotations & certificate generation, and platform-side monitoring (migrated from the FireLink project)
import VendorQuotations from '@/pages/vendor/Quotations';
import VendorCertificateGenerate from '@/pages/vendor/CertificateGenerate';
import QuotationMonitoring from '@/pages/admin/QuotationMonitoring';
import CertificateVerification from '@/pages/admin/CertificateVerification';
import PlatformAnalytics from '@/pages/admin/PlatformAnalytics';
// Public storefront — landing + shared public layout
import PublicLayout from '@/components/site/PublicSiteLayout';
import PublicLanding from '@/pages/PublicLanding';
// Trust pages — public About & Contact
import About from '@/pages/About';
import Contact from '@/pages/Contact';
// Public storefront pages (migrated from the FireLink project)
import Services from '@/pages/public/Services';
import ServiceDetail from '@/pages/public/ServiceDetail';
import Vendors from '@/pages/public/Vendors';
// Customer portal — commerce core (migrated from the FireLink project)
import Marketplace from '@/pages/customer/Marketplace';
import ProductDetail from '@/pages/customer/ProductDetail';
import Cart from '@/pages/customer/Cart';
import Wishlist from '@/pages/customer/Wishlist';
import Orders from '@/pages/customer/Orders';
import OrderDetail from '@/pages/customer/OrderDetail';
// Customer portal — assets, compliance, services & AI (migrated from the FireLink project)
import CustomerDashboard from '@/pages/customer/Dashboard';
import RFQs from '@/pages/customer/RFQs';
import CustomerQuotations from '@/pages/customer/Quotations';
import Assets from '@/pages/customer/Assets';
import AssetDetail from '@/pages/customer/AssetDetail';
import Certificates from '@/pages/customer/Certificates';
import QRScanner from '@/pages/customer/QRScanner';
import ServiceBook from '@/pages/customer/ServiceBook';
import AmcSubscribe from '@/pages/customer/AmcSubscribe';
import FireAuditRequest from '@/pages/customer/FireAuditRequest';
import JobApply from '@/pages/customer/JobApply';
import VendorCompare from '@/pages/customer/VendorCompare';
import CustomerAiAssistant from '@/pages/customer/AiAssistant';
import Settings from '@/pages/customer/Settings';
// Public QR verification page
import Verify from '@/pages/Verify';
import VerifyLanding from '@/pages/VerifyLanding';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-slate-200 border-t-rose-600 rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-slate-500">Loading FireLink...</span>
        </div>
      </div>
    );
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }


  return (
    <RoleProvider>
      <LanguageProvider>
      <CartProvider>
        <RouteSeo />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify/:qrCode" element={<Verify />} />

          {/* Public website — browse without login */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicLanding />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/products" element={<Marketplace />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/verify" element={<VerifyLanding />} />
          </Route>

          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            <Route path="/select-role" element={<RoleSelector />} />
            <Route element={<AppLayout />}>
              {/* Customer */}
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/rfqs" element={<RFQs />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/fire-noc" element={<FireNOC />} />
              <Route path="/compliance-calendar" element={<ComplianceCalendar />} />
              <Route path="/renewals" element={<Renewals />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/ai-assistant" element={<CustomerAiAssistant />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/support" element={<Support />} />

              {/* Customer Portal */}
              <Route element={<RoleGate allowed={["customer", "platform_admin", "super_admin"]} />}>
                <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                <Route path="/customer/marketplace" element={<Marketplace />} />
                <Route path="/customer/marketplace/:id" element={<ProductDetail />} />
                <Route path="/customer/orders" element={<Orders />} />
                <Route path="/customer/orders/:id" element={<OrderDetail />} />
                <Route path="/customer/rfqs" element={<RFQs />} />
                <Route path="/customer/quotations" element={<CustomerQuotations />} />
                <Route path="/customer/assets" element={<Assets />} />
                <Route path="/customer/assets/:id" element={<AssetDetail />} />
                <Route path="/customer/qr-scanner" element={<QRScanner />} />
                <Route path="/customer/certificates" element={<Certificates />} />
                <Route path="/customer/compliance" element={<OrgCompliance />} />
                <Route path="/customer/fire-noc" element={<FireNOC />} />
                <Route path="/customer/maintenance" element={<Maintenance />} />
                <Route path="/customer/service-requests" element={<Maintenance />} />
                <Route path="/customer/documents" element={<Documents />} />
                <Route path="/customer/ai-assistant" element={<CustomerAiAssistant />} />
                <Route path="/customer/notifications" element={<Notifications />} />
                <Route path="/customer/support" element={<Support />} />
                <Route path="/customer/profile" element={<Profile />} />
                <Route path="/customer/services" element={<ServiceBook />} />
                <Route path="/customer/amc" element={<AmcSubscribe />} />
                <Route path="/customer/fire-audit" element={<FireAuditRequest />} />
                <Route path="/customer/jobs" element={<JobApply />} />
                <Route path="/customer/compare-vendors" element={<VendorCompare />} />
                <Route path="/customer/settings" element={<Settings />} />
              </Route>

              {/* Organization Admin */}
              <Route path="/organization/dashboard" element={<OrgDashboard />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/compliance" element={<OrgCompliance />} />
              <Route path="/capa" element={<CapaPage />} />
              <Route path="/reports" element={<Reports />} />

              {/* Vendor Portal */}
              <Route element={<RoleGate allowed={["vendor", "vendor_admin", "platform_admin", "super_admin"]} />}>
                <Route element={<VendorLayout />}>
                  <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                  <Route path="/vendor/company" element={<VendorCompanyProfile />} />
                  <Route path="/vendor/verification" element={<VendorVerification />} />
                  <Route path="/vendor/products" element={<VendorProducts />} />
                  <Route path="/vendor/inventory" element={<Inventory />} />
                  <Route path="/vendor/warehouses" element={<VendorWarehouses />} />
                  <Route path="/vendor/rfqs" element={<VendorRFQs />} />
                  <Route path="/vendor/quotations" element={<VendorQuotations />} />
                  <Route path="/vendor/orders" element={<VendorOrders />} />
                  <Route path="/vendor/shipments" element={<VendorShipments />} />
                  <Route path="/vendor/returns" element={<VendorReturns />} />
                  <Route path="/vendor/service-requests" element={<VendorServiceRequests />} />
                  <Route path="/vendor/technicians" element={<VendorTechnicians />} />
                  <Route path="/vendor/customers" element={<VendorCustomers />} />
                  <Route path="/vendor/certificates" element={<VendorCertificates />} />
                  <Route path="/vendor/documents" element={<VendorDocuments />} />
                  <Route path="/vendor/payments" element={<VendorPayments />} />
                  <Route path="/vendor/settlements" element={<Settlements />} />
                  <Route path="/vendor/analytics" element={<VendorAnalytics />} />
                  <Route path="/vendor/team" element={<VendorTeam />} />
                  <Route path="/vendor/support" element={<Support />} />
                  <Route path="/vendor/notifications" element={<Notifications />} />
                  <Route path="/vendor/services" element={<VendorServices />} />
                  <Route path="/vendor/amc-plans" element={<VendorAmcPlans />} />
                  <Route path="/vendor/offers" element={<VendorOffers />} />
                  <Route path="/vendor/job-vacancies" element={<VendorJobVacancies />} />
                  <Route path="/vendor/wallet" element={<VendorWallet />} />
                  <Route path="/vendor/subscription" element={<VendorSubscription />} />
                  <Route path="/vendor/digital-signature" element={<VendorDigitalSignature />} />
                  <Route path="/vendor/certificate-generate" element={<VendorCertificateGenerate />} />
                  <Route path="/vendor/settings" element={<VendorSettings />} />
                </Route>
              </Route>

              {/* Technician */}
              <Route element={<RoleGate allowed={["technician", "platform_admin", "super_admin"]} />}>
                <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
                <Route path="/technician/scan" element={<ScanQR />} />
                <Route path="/technician/inspections" element={<Inspections />} />
                <Route path="/technician/inspection/:assetId" element={<InspectionRun />} />
                <Route path="/technician/schedule" element={<TechnicianSchedule />} />
              </Route>

              {/* Engineer */}
              <Route element={<RoleGate allowed={["engineer", "platform_admin", "super_admin"]} />}>
                <Route path="/engineering/dashboard" element={<EngineerDashboard />} />
                <Route path="/engineering/projects" element={<EngineerProjects />} />
                <Route path="/engineering/fire-load" element={<EngineerFireLoad />} />
                <Route path="/engineering/hydraulic" element={<EngineerHydraulic />} />
                <Route path="/engineering/boq" element={<EngineerBOQ />} />
                <Route path="/engineering/ai" element={<EngineerAiAssistant />} />
                <Route path="/engineering/reports" element={<EngineerReports />} />
              </Route>

              {/* Platform Admin */}
              <Route element={<RoleGate allowed={["platform_admin", "super_admin"]} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/organizations" element={<AdminOrganizations />} />
                <Route path="/admin/vendors" element={<VendorApprovals />} />
                <Route path="/admin/product-approvals" element={<ProductApprovals />} />
                <Route path="/admin/marketplace" element={<AdminMarketplace />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/disputes" element={<AdminDisputes />} />
                <Route path="/admin/tickets" element={<AdminTickets />} />
                <Route path="/admin/audit" element={<AuditLogs />} />
                <Route path="/admin/analytics" element={<PlatformAnalytics />} />
              </Route>

              {/* Super Admin */}
              <Route element={<RoleGate allowed={["super_admin"]} />}>
                <Route path="/admin/system" element={<SystemDashboard />} />
                <Route path="/admin/roles" element={<RolesMatrix />} />
              </Route>
              <Route path="/admin/categories" element={<Categories />} />
              <Route path="/admin/customers" element={<Customers />} />
              <Route path="/admin/commissions" element={<Commissions />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/advertisements" element={<Advertisements />} />
              <Route path="/admin/job-approvals" element={<JobApprovals />} />
              <Route path="/admin/quotations" element={<QuotationMonitoring />} />
              <Route path="/admin/certificate-verification" element={<CertificateVerification />} />
              <Route path="/admin/feature-flags" element={<FeatureFlags />} />
              <Route path="/admin/integrations" element={<Integrations />} />
              <Route path="/admin/system-health" element={<SystemHealth />} />
              <Route path="/admin/revenue" element={<RevenueModel />} />

              {/* Shared */}
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </CartProvider>
      </LanguageProvider>
    </RoleProvider>
  );
};


function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <SplashScreen>
            <Router>
              <ScrollToTop />
              <SiteSchema />
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </SplashScreen>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App