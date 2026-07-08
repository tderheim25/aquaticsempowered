import type { SvgIconComponent } from "@mui/icons-material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FlightTakeoffOutlinedIcon from "@mui/icons-material/FlightTakeoffOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PoolOutlinedIcon from "@mui/icons-material/PoolOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";

export type AeConsoleSectionKey =
  | "overview"
  | "users"
  | "organizations"
  | "permissions"
  | "billing"
  | "pilot_import"
  | "pool_catalog"
  | "support"
  | "support_providers"
  | "vendors"
  | "training"
  | "jobs"
  | "community"
  | "ads"
  | "settings";

export type AeConsoleNavItem = {
  key: AeConsoleSectionKey;
  label: string;
  description: string;
  icon: SvgIconComponent;
  badgeKey?: "vendors" | "support";
};

export type AeConsoleNavGroup = {
  title: string;
  items: AeConsoleNavItem[];
};

export const AE_CONSOLE_NAV_GROUPS: AeConsoleNavGroup[] = [
  {
    title: "Platform",
    items: [
      {
        key: "overview",
        label: "Overview",
        description: "Platform health and quick metrics",
        icon: DashboardOutlinedIcon,
      },
      {
        key: "users",
        label: "Users",
        description: "Accounts, roles, and access",
        icon: PeopleOutlinedIcon,
      },
      {
        key: "organizations",
        label: "Organizations",
        description: "Facilities, plans, and assignments",
        icon: BusinessOutlinedIcon,
      },
      {
        key: "permissions",
        label: "Permissions",
        description: "Roles and view access",
        icon: AdminPanelSettingsOutlinedIcon,
      },
      {
        key: "billing",
        label: "Billing",
        description: "Plans and subscriptions",
        icon: PaymentsOutlinedIcon,
      },
      {
        key: "pilot_import",
        label: "Pilot import",
        description: "Bulk onboard pilot orgs and users",
        icon: FlightTakeoffOutlinedIcon,
      },
      {
        key: "pool_catalog",
        label: "Pool catalog",
        description: "Bodies of water and billable pool fees",
        icon: PoolOutlinedIcon,
      },
      {
        key: "support",
        label: "Support tickets",
        description: "Portal and facility requests",
        icon: SupportAgentOutlinedIcon,
        badgeKey: "support",
      },
      {
        key: "support_providers",
        label: "Support providers",
        description: "Pool service companies and technicians",
        icon: BusinessOutlinedIcon,
      },
    ],
  },
  {
    title: "Marketplace",
    items: [
      {
        key: "vendors",
        label: "Vendors",
        description: "Applications and directory",
        icon: StorefrontOutlinedIcon,
        badgeKey: "vendors",
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        key: "training",
        label: "Training",
        description: "Courses and video library",
        icon: SchoolOutlinedIcon,
      },
      {
        key: "jobs",
        label: "Job posts",
        description: "Community job board moderation",
        icon: WorkOutlineOutlinedIcon,
      },
      {
        key: "community",
        label: "Community",
        description: "Posts and comments",
        icon: ForumOutlinedIcon,
      },
      {
        key: "ads",
        label: "Advertisements",
        description: "Marketing placements",
        icon: CampaignOutlinedIcon,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        key: "settings",
        label: "Settings",
        description: "Notifications and platform configuration",
        icon: SettingsOutlinedIcon,
      },
    ],
  },
];

export const AE_CONSOLE_SECTION_META: Record<
  AeConsoleSectionKey,
  { label: string; description: string }
> = Object.fromEntries(
  AE_CONSOLE_NAV_GROUPS.flatMap((g) =>
    g.items.map((item) => [item.key, { label: item.label, description: item.description }]),
  ),
) as Record<AeConsoleSectionKey, { label: string; description: string }>;
