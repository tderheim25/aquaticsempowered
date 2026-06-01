import type { SvgIconComponent } from "@mui/icons-material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import CleaningServicesOutlinedIcon from "@mui/icons-material/CleaningServicesOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HandymanOutlinedIcon from "@mui/icons-material/HandymanOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import PoolOutlinedIcon from "@mui/icons-material/PoolOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SensorsOutlinedIcon from "@mui/icons-material/SensorsOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";

import type { AppViewKey } from "@/lib/auth/viewPermissions";
import type { UserRole } from "@/types/database";

export type DashboardNavLink = {
  label: string;
  href: string;
  icon: SvgIconComponent;
  soon?: boolean;
  pro?: boolean;
};

export type DashboardNavGroup = {
  label: string;
  viewKey: AppViewKey;
  href?: string;
  icon: SvgIconComponent;
  children?: DashboardNavLink[];
  roles?: UserRole[];
};

export const DASHBOARD_TOP_NAV: {
  label: string;
  href: string;
  viewKey: AppViewKey;
  icon: SvgIconComponent;
  roles?: UserRole[];
}[] = [
  { label: "Dashboard", href: "/app", viewKey: "dashboard_home", icon: DashboardOutlinedIcon },
  { label: "Team", href: "/app/team", viewKey: "dashboard_home", icon: GroupsOutlinedIcon, roles: ["org_admin"] },
];

export const DASHBOARD_POOL_OPS_GROUPS: DashboardNavGroup[] = [
  { label: "Pools", viewKey: "pools", href: "/app/pools", icon: PoolOutlinedIcon },
  {
    label: "Chemical Logs",
    viewKey: "chemical_logs",
    icon: ScienceOutlinedIcon,
    children: [
      { label: "Log Reading", href: "/app/chemical-logs", icon: EditNoteOutlinedIcon },
      { label: "History & Trends", href: "/app/chemical-logs/history", icon: TimelineOutlinedIcon },
      { label: "Calculator", href: "/app/chemical-logs/calculator", icon: CalculateOutlinedIcon },
      { label: "Reports", href: "/app/chemical-logs/reports", icon: AssessmentOutlinedIcon },
    ],
  },
  {
    label: "Maintenance",
    viewKey: "maintenance",
    icon: HandymanOutlinedIcon,
    children: [
      { label: "Tasks", href: "/app/maintenance", icon: TaskAltOutlinedIcon },
      { label: "Cleaning Log", href: "/app/maintenance/cleaning", icon: CleaningServicesOutlinedIcon },
      { label: "Inspections", href: "/app/maintenance/inspections", icon: FactCheckOutlinedIcon },
      { label: "Equipment", href: "/app/maintenance/equipment", icon: PrecisionManufacturingOutlinedIcon },
    ],
  },
  {
    label: "Monitoring",
    viewKey: "monitoring",
    icon: SensorsOutlinedIcon,
    children: [
      { label: "Status", href: "/app/monitoring", icon: SpeedOutlinedIcon },
      { label: "Alerts", href: "/app/monitoring/alerts", icon: NotificationsActiveOutlinedIcon },
      { label: "Sensors", href: "/app/monitoring/sensors", icon: SensorsOutlinedIcon },
    ],
  },
];

export const DASHBOARD_VENDOR_NAV: {
  label: string;
  href: string;
  viewKey: AppViewKey;
  icon: SvgIconComponent;
}[] = [
  { label: "Vendor dashboard", href: "/app/vendor", viewKey: "vendor_portal", icon: StorefrontOutlinedIcon },
  { label: "Support", href: "/app/support", viewKey: "support_center", icon: SupportAgentOutlinedIcon },
];

export const DASHBOARD_FACILITY_NAV: {
  label: string;
  href: string;
  viewKey: AppViewKey;
  icon: SvgIconComponent;
}[] = [
  { label: "Support Center", href: "/app/support", viewKey: "support_center", icon: SupportAgentOutlinedIcon },
  { label: "Vendor Directory", href: "/app/vendors", viewKey: "vendor_directory", icon: StorefrontOutlinedIcon },
  { label: "Community", href: "/community", viewKey: "community", icon: ForumOutlinedIcon },
  { label: "Procurement", href: "/app/procurement", viewKey: "procurement", icon: ShoppingCartOutlinedIcon },
  { label: "Energy Audits", href: "/app/energy-audits", viewKey: "energy_audits", icon: BoltOutlinedIcon },
  { label: "Training / CPO", href: "/app/training-cpo", viewKey: "training_cpo", icon: SchoolOutlinedIcon },
];

export const DASHBOARD_AE_CONSOLE_NAV = {
  label: "AE Console",
  href: "/private/ae-console",
  icon: AdminPanelSettingsOutlinedIcon,
};
