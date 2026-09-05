# ZyrionOS
# Frontend Architecture & Folder/File Specification

Document ID: ZYRIONOS-DOC-02
Document Type: Frontend Architecture
Status: FINAL FOUNDATION
Version: 1.0.0

---

# 1. DOCUMENT PURPOSE

This document defines the official frontend architecture of ZyrionOS.

It explains:

- where every frontend responsibility belongs
- which files are responsible for which functionality
- how pages communicate with services
- how components are reused
- how routing is structured
- how layouts work
- how authentication is handled
- how backend APIs are accessed
- how the application should scale
- where future functionality must be implemented

This document exists to prevent architectural confusion.

No frontend file should contain responsibilities that belong to
another architectural layer.

---

# 2. ARCHITECTURAL PRINCIPLE

ZyrionOS follows a layered frontend architecture:

APPLICATION
    ↓
ROUTES
    ↓
LAYOUTS
    ↓
PAGES
    ↓
COMPONENTS
    ↓
SERVICES
    ↓
BACKEND APIs

Configuration and application-wide state support all layers.

The frontend must remain modular.

---

# 3. CURRENT FRONTEND ROOT

The current frontend root contains:

src/
├── components/
├── config/
├── context/
├── layouts/
├── pages/
├── routes/
├── services/
├── App.jsx
├── index.css
└── main.jsx

Root configuration files include:

.env.example
.env.production
.gitignore
README.md
index.html
package.json
package-lock.json
vite.config.js
wrangler.jsonc

These root files are part of the application infrastructure and
must not be casually modified during page-level redesign.

---

# 4. OFFICIAL DIRECTORY STRUCTURE

The current structure is the architectural baseline.

It contains:

src/
│
├── components/
│   ├── Sidebar/
│   │   ├── Sidebar.jsx
│   │   └── Sidebar.module.css
│   │
│   └── Topbar/
│       ├── Topbar.jsx
│       └── Topbar.module.css
│
├── config/
│   ├── constants.js
│   ├── navigation.js
│   └── theme.js
│
├── context/
│   └── AuthContext.jsx
│
├── layouts/
│   ├── AuthLayout/
│   │   ├── AuthLayout.jsx
│   │   └── AuthLayout.module.css
│   │
│   └── DashboardLayout/
│       ├── DashboardLayout.jsx
│       └── DashboardLayout.module.css
│
├── pages/
│   ├── auth/
│   │   ├── Login/
│   │   │   ├── Login.jsx
│   │   │   └── Login.module.css
│   │   │
│   │   └── Register/
│   │       ├── Register.jsx
│   │       └── Register.module.css
│   │
│   ├── billing/
│   │   └── Billing/
│   │       ├── Billing.jsx
│   │       └── Billing.module.css
│   │
│   ├── dashboard/
│   │   └── Dashboard/
│   │       ├── Dashboard.jsx
│   │       └── Dashboard.module.css
│   │
│   ├── deployments/
│   │   └── Deployments/
│   │       ├── Deployments.jsx
│   │       └── Deployments.module.css
│   │
│   ├── settings/
│   │   └── Settings/
│   │       ├── Settings.jsx
│   │       └── Settings.module.css
│   │
│   └── workspace/
│       └── Workspace/
│           ├── Workspace.jsx
│           └── Workspace.module.css
│
├── routes/
│   ├── AppRoutes.jsx
│   ├── ProtectedRoute.jsx
│   └── PublicRoute.jsx
│
├── services/
│   ├── aiService.js
│   ├── api.js
│   ├── authService.js
│   ├── billingService.js
│   ├── deploymentService.js
│   └── workspaceService.js
│
├── App.jsx
├── index.css
└── main.jsx

---

# 5. ARCHITECTURAL LAYERS

ZyrionOS frontend is divided into the following layers.

## Layer 1 — Application Bootstrap

Files:

main.jsx
App.jsx

Responsibility:

- start the application
- initialize React
- provide global application providers
- load routing
- establish the application root

These files must remain lightweight.

They must NOT contain:

- page-specific UI
- API implementations
- large business logic
- project-specific UI logic

---

# 6. MAIN ENTRY FILE

File:

src/main.jsx

Responsibility:

The main React application entry point.

It should:

- mount React
- load global CSS
- initialize required providers
- render the application root

It should not contain application page logic.

---

# 7. APPLICATION ROOT

File:

src/App.jsx

Responsibility:

Application-level composition.

It should primarily connect:

- application routing
- global providers where appropriate
- application-level wrappers

It must not become a giant component.

---

# 8. COMPONENT LAYER

Directory:

src/components/

Purpose:

Reusable UI infrastructure.

Components are not complete pages.

They provide reusable application-level building blocks.

Current component groups:

components/
├── Sidebar/
└── Topbar/

---

# 9. SIDEBAR

Files:

src/components/Sidebar/Sidebar.jsx
src/components/Sidebar/Sidebar.module.css

Responsibility:

Primary authenticated application navigation.

The Sidebar must handle:

- navigation display
- active route indication
- primary navigation items
- workspace/application navigation
- responsive behavior
- collapse/expand behavior where designed

The Sidebar must NOT:

- fetch billing data
- perform deployment API calls
- contain project creation business logic
- contain authentication implementation
- directly implement backend business rules

Navigation definitions should come from:

src/config/navigation.js

where practical.

---

# 10. TOPBAR

Files:

src/components/Topbar/Topbar.jsx
src/components/Topbar/Topbar.module.css

Responsibility:

Global authenticated application controls.

Potential responsibilities:

- page/workspace identity
- search
- command access
- notifications
- system indicators
- account menu
- global actions

The Topbar must remain independent from individual pages.

It must NOT contain page-specific API logic.

---

# 11. CONFIGURATION LAYER

Directory:

src/config/

Files:

constants.js
navigation.js
theme.js

Purpose:

Centralized application configuration.

Configuration must prevent repeated hardcoded values across
multiple pages.

---

# 12. constants.js

File:

src/config/constants.js

Responsibility:

Application-wide constants.

Examples:

- application name
- supported frameworks
- status identifiers
- product constants
- reusable configuration values

Do not put secrets in this file.

Do not put private API keys in frontend source code.

---

# 13. navigation.js

File:

src/config/navigation.js

Responsibility:

Central definition of application navigation.

It should describe navigation destinations such as:

- Dashboard
- Workspace
- Deployments
- Billing
- Settings

Navigation metadata may include:

- label
- route
- icon reference
- access requirements
- navigation grouping

The Sidebar should consume this configuration rather than
duplicating route definitions unnecessarily.

---

# 14. theme.js

File:

src/config/theme.js

Responsibility:

Central theme-related configuration.

This file should support the application's design system.

It must NOT become a random collection of page-specific CSS.

The final design tokens will be formally defined in:

DOCUMENT 03
Enterprise Design System

---

# 15. CONTEXT LAYER

Directory:

src/context/

Current file:

AuthContext.jsx

Purpose:

Application-wide React context.

---

# 16. AuthContext.jsx

File:

src/context/AuthContext.jsx

Responsibility:

Authentication state management.

It may manage:

- current user
- authentication state
- loading state
- login state
- logout state
- session state
- authentication initialization

It should communicate with:

authService.js

It must NOT directly contain:

- complete login page UI
- billing logic
- deployment logic
- project creation logic

---

# 17. LAYOUT LAYER

Directory:

src/layouts/

Layouts define the structural shell surrounding pages.

Current layouts:

AuthLayout
DashboardLayout

---

# 18. AUTH LAYOUT

Files:

src/layouts/AuthLayout/AuthLayout.jsx
src/layouts/AuthLayout/AuthLayout.module.css

Responsibility:

Public authentication experience.

Used for:

- Login
- Register
- future authentication-related public screens

The AuthLayout should provide:

- authentication page structure
- responsive presentation
- brand identity
- consistent authentication visual system

It must not contain login-specific API logic.

---

# 19. DASHBOARD LAYOUT

Files:

src/layouts/DashboardLayout/DashboardLayout.jsx
src/layouts/DashboardLayout/DashboardLayout.module.css

Responsibility:

Authenticated application shell.

Conceptually:

┌─────────────────────────────────────────┐
│                  TOPBAR                 │
├────────────┬────────────────────────────┤
│            │                            │
│  SIDEBAR   │       PAGE CONTENT         │
│            │                            │
│            │                            │
└────────────┴────────────────────────────┘

The layout must support:

- Sidebar
- Topbar
- main content
- responsive behavior
- page-level content

---

# 20. FULL-PAGE RULE

DashboardLayout must NOT force every page into a small fixed-width
central card.

Primary pages must be allowed to use the available application
viewport efficiently.

Examples:

Dashboard
→ complete dashboard surface

Workspace
→ complete workspace surface

Deployments
→ complete deployments surface

Billing
→ complete billing surface

Settings
→ complete settings surface

---

# 21. PAGE LAYER

Directory:

src/pages/

Pages represent complete product destinations.

A page owns:

- page-specific UI
- page-specific local state
- page-specific interaction logic
- calls to relevant service functions

A page should NOT own:

- global navigation implementation
- authentication infrastructure
- generic API client implementation
- unrelated page logic

---

# 22. AUTH PAGES

Directory:

src/pages/auth/

Contains:

Login
Register

These are public-facing authentication pages.

---

# 23. LOGIN PAGE

Files:

Login.jsx
Login.module.css

Responsibilities:

- email/credential input
- authentication action
- validation
- loading state
- authentication errors
- navigation after successful authentication
- professional authentication UX

Backend communication must go through:

authService.js

Login.jsx must NOT create its own Axios instance.

---

# 24. REGISTER PAGE

Files:

Register.jsx
Register.module.css

Responsibilities:

- account registration
- form validation
- loading state
- registration errors
- successful registration behavior

Backend communication must go through:

authService.js

---

# 25. BILLING PAGE

Files:

Billing.jsx
Billing.module.css

Location:

src/pages/billing/Billing/

Responsibility:

Complete billing/subscription experience.

It should represent real backend billing information.

Potential responsibilities:

- current plan
- plans
- pricing
- usage
- subscription status
- payment state
- upgrade actions
- billing history where supported

Backend communication:

billingService.js

The Billing page must be a complete application page.

---

# 26. DASHBOARD PAGE

Files:

Dashboard.jsx
Dashboard.module.css

Location:

src/pages/dashboard/Dashboard/

Responsibility:

Primary ZyrionOS operational overview.

It may consume:

- project information
- deployment information
- billing information
- account information
- system status

The Dashboard must not fabricate data.

Backend communication should occur through appropriate services.

---

# 27. DEPLOYMENTS PAGE

Files:

Deployments.jsx
Deployments.module.css

Location:

src/pages/deployments/Deployments/

Responsibility:

Deployment management and operational visibility.

Potential information:

- project
- deployment state
- deployment history
- deployment URL
- build status
- deployment errors
- deployment actions

Backend communication:

deploymentService.js

---

# 28. SETTINGS PAGE

Files:

Settings.jsx
Settings.module.css

Location:

src/pages/settings/Settings/

Responsibility:

Complete account/application settings experience.

Potential sections:

- Profile
- Account
- Security
- Preferences
- Notifications
- AI preferences
- Workspace preferences
- Connected services

Only real supported settings should be interactive.

---

# 29. WORKSPACE PAGE

Files:

Workspace.jsx
Workspace.module.css

Location:

src/pages/workspace/Workspace/

Responsibility:

Primary project creation and software-building environment.

Workspace is a high-priority product surface.

It may contain:

- project rail
- AI builder
- prompt interface
- project files
- code editor
- preview
- project inspector
- deployment controls
- project status

Backend services:

workspaceService.js
aiService.js
deploymentService.js

depending on operation.

---

# 30. WORKSPACE FULL-SCREEN PRINCIPLE

Workspace is NOT a small dashboard widget.

When a user selects:

New Project

the application must navigate/open the Workspace as the primary
authenticated application page.

The Workspace must use the available content area efficiently.

It must not be visually trapped inside a small card.

---

# 31. ROUTING LAYER

Directory:

src/routes/

Files:

AppRoutes.jsx
ProtectedRoute.jsx
PublicRoute.jsx

Purpose:

Central routing architecture.

---

# 32. AppRoutes.jsx

Responsibility:

Define the application's route tree.

It should connect:

Public routes
+
Protected routes
+
Application pages

It should not contain large page implementations.

---

# 33. ProtectedRoute.jsx

Responsibility:

Protect authenticated application routes.

Protected destinations include conceptually:

- Dashboard
- Workspace
- Deployments
- Billing
- Settings

Authentication enforcement must ultimately be trusted to the backend.

The frontend route guard exists primarily for user experience
and application flow.

---

# 34. PublicRoute.jsx

Responsibility:

Handle routes intended for unauthenticated users.

Examples:

- Login
- Register

If an authenticated user attempts to access a public authentication
page, the application may redirect them according to the final
authentication specification.

---

# 35. SERVICE LAYER

Directory:

src/services/

Purpose:

Centralized communication between frontend and backend.

Current services:

api.js
authService.js
aiService.js
workspaceService.js
deploymentService.js
billingService.js

---

# 36. api.js

File:

src/services/api.js

Responsibility:

Centralized Axios/API client.

It controls:

- backend base URL
- request configuration
- credentials
- timeout
- request interceptors
- response interceptors
- common error normalization

Pages should NOT create separate Axios clients.

Components should NOT create separate Axios clients.

Services should use the centralized API client.

---

# 37. authService.js

Responsibility:

Authentication API operations.

Examples:

- login
- register
- logout
- current user/session
- authentication-related operations

Authentication API calls belong here.

---

# 38. aiService.js

Responsibility:

AI-related backend operations.

Potential operations:

- AI chat
- code generation
- AI deployment agent
- thumbnail generation
- future AI capabilities

The service communicates with real backend AI endpoints.

It must not fabricate AI responses.

---

# 39. workspaceService.js

Responsibility:

Project/workspace backend operations.

Potential operations:

- create project
- get projects
- get project
- update project
- delete project
- deploy project where the backend contract defines deployment
  through the workspace service

The exact endpoint contract is defined in:

DOCUMENT 07
Frontend ↔ Backend API Contract

---

# 40. deploymentService.js

Responsibility:

Deployment-specific backend operations.

Examples:

- deployment listing
- deployment details
- deployment status
- deployment history
- deployment actions

Deployment business logic remains on the backend.

---

# 41. billingService.js

Responsibility:

Billing/subscription API communication.

Potential operations:

- current subscription
- plans
- checkout
- subscription changes
- payment state
- billing history
- usage

The service must use real backend responses.

---

# 42. SERVICE BOUNDARY

Pages should follow:

PAGE
→ SERVICE FUNCTION
→ API CLIENT
→ BACKEND

Not:

PAGE
→ AXIOS DIRECTLY
→ BACKEND

This keeps the frontend architecture maintainable.

---

# 43. CSS ARCHITECTURE

Page and component styling uses CSS Modules where appropriate.

Examples:

Workspace.module.css
Dashboard.module.css
Sidebar.module.css
Topbar.module.css

CSS Modules must prevent accidental global style collisions.

Global styles belong primarily in:

src/index.css

---

# 44. index.css

Responsibility:

Global application styling foundation.

Potential responsibilities:

- CSS reset
- global box sizing
- document defaults
- body behavior
- root sizing
- global typography foundation
- global accessibility defaults

It must not contain huge page-specific styling blocks.

---

# 45. PAGE CSS RULE

Page-specific CSS belongs with its page.

Example:

Workspace.jsx
Workspace.module.css

Do not put Workspace-specific layout rules into:

index.css

unless the rule is genuinely global.

---

# 46. ROOT CONFIGURATION FILES

The following files belong to project infrastructure:

.env.example
.env.production
.gitignore
README.md
index.html
package.json
package-lock.json
vite.config.js
wrangler.jsonc

They must be modified only when their specific responsibility
requires it.

---

# 47. ENVIRONMENT VARIABLES

Frontend environment configuration must use approved Vite
environment variables.

Example concept:

VITE_API_URL

Secrets must NOT be placed in frontend environment variables
unless the value is explicitly safe for public exposure.

Frontend environment variables are not secret storage.

---

# 48. API URL ARCHITECTURE

The application must have one centralized API base configuration.

Current architecture:

VITE_API_URL
    ↓
api.js
    ↓
services
    ↓
pages/components

Do not hardcode multiple backend URLs throughout the application.

---

# 49. DATA FLOW

Standard data flow:

User Interaction
        ↓
Page / Component
        ↓
Service Function
        ↓
Central API Client
        ↓
Backend
        ↓
API Response
        ↓
Service
        ↓
Page State
        ↓
UI

This pattern should remain consistent.

---

# 50. ERROR FLOW

Backend/API failure:

Backend
↓
API Client
↓
Service
↓
Page
↓
User-facing error state

The frontend must transform technical errors into understandable
messages where appropriate.

---

# 51. LOADING FLOW

Example:

User clicks Build
↓
Page sets loading state
↓
Service request
↓
Backend processing
↓
Response
↓
Page updates state
↓
UI displays result

Loading must always be explicitly represented.

---

# 52. REAL DATA RULE

No service or page may invent backend production data.

Forbidden examples:

- fake project IDs
- fake deployment URLs
- fake deployment status
- fake project files
- fake billing information
- fake infrastructure health

When real data is unavailable:

show:

- empty state
- unavailable state
- loading state
- error state

as appropriate.

---

# 53. STATE OWNERSHIP

Local page state belongs to the page when it is only relevant
to that page.

Global state belongs to Context or another approved application
state mechanism.

Examples:

Authentication
→ AuthContext

Workspace prompt
→ Workspace page

Selected project
→ Workspace/project state unless global persistence is required

Global theme preference
→ approved global state/configuration

---

# 54. COMPONENT STATE RULE

Reusable components should avoid owning application-wide business state.

A reusable Button should not know about billing.

A Sidebar should not know how deployment works.

A Topbar should not know how projects are created.

Separation of concerns is mandatory.

---

# 55. PAGE RESPONSIBILITY RULE

A page may coordinate multiple services when the product flow
requires it.

Example:

Workspace may coordinate:

AI generation
+
Project creation
+
Deployment

However, each backend operation must still remain inside its
appropriate service.

---

# 56. NO GIANT COMPONENT RULE

A single JSX file must not become the permanent home of the
entire application.

When a page becomes sufficiently complex,
reusable page-specific components should be extracted.

Examples for Workspace:

WorkspaceHeader
ProjectRail
BuilderCanvas
AICommandBar
ProjectInspector
CodeExplorer
PreviewPanel
DeploymentPanel

The exact component extraction plan will be defined during
implementation.

---

# 57. REUSABILITY RULE

Extract a component when:

- it is reused
- it has a clear independent responsibility
- it improves readability
- it has meaningful independent state
- it represents a stable UI pattern

Do not create components solely to make the folder tree larger.

---

# 58. NO USELESS ABSTRACTION RULE

Architecture must be enterprise-grade,
but unnecessary abstraction is forbidden.

Do not create:

- meaningless wrapper components
- one-function abstraction layers with no value
- duplicate services
- duplicate API clients
- duplicate configuration files

Every architectural layer must have a reason.

---

# 59. NAVIGATION OWNERSHIP

Navigation structure:

config/navigation.js
        ↓
Sidebar
        ↓
React Router
        ↓
Page

The Sidebar should not manually duplicate every route's business
logic.

---

# 60. AUTHENTICATION OWNERSHIP

Authentication structure:

Login/Register
        ↓
authService
        ↓
api
        ↓
Backend
        ↓
AuthContext
        ↓
ProtectedRoute
        ↓
Authenticated Application

---

# 61. WORKSPACE OWNERSHIP

Workspace structure:

Dashboard / New Project
        ↓
Workspace Route
        ↓
Workspace Page
        ↓
AI / Project / Deployment Services
        ↓
Backend
        ↓
Workspace State
        ↓
Workspace UI

---

# 62. BILLING OWNERSHIP

Billing structure:

Billing Route
        ↓
Billing Page
        ↓
billingService
        ↓
Backend Billing System
        ↓
Real Subscription Data
        ↓
Billing UI

---

# 63. DEPLOYMENT OWNERSHIP

Deployment structure:

Deployment Page / Workspace
        ↓
deploymentService
        ↓
Backend Deployment System
        ↓
Deployment Result
        ↓
Deployment UI

---

# 64. SETTINGS OWNERSHIP

Settings structure:

Settings Route
        ↓
Settings Page
        ↓
Approved Settings Service/API
        ↓
Backend
        ↓
Persisted Settings
        ↓
Settings UI

No unsupported setting should be represented as functional.

---

# 65. RESPONSIVE ARCHITECTURE

Every page and major component must support:

Desktop
Tablet
Mobile

Responsive behavior belongs primarily to the component/page
that owns the UI.

Global responsive rules belong in the design system/global layer.

---

# 66. MOBILE ARCHITECTURE

Mobile must not be treated as:

"desktop but smaller."

When necessary, desktop structures may transform into:

- drawers
- tabs
- stacked sections
- collapsible panels
- bottom navigation
- modal/drawer inspectors

The primary user task must remain accessible.

---

# 67. DESKTOP ARCHITECTURE

Desktop should exploit available screen space.

Primary operational screens may use multi-column layouts when
that improves productivity.

Workspace is the strongest example.

---

# 68. ACCESSIBILITY ARCHITECTURE

All interactive components must support:

- keyboard navigation
- visible focus
- semantic HTML
- accessible labels
- appropriate ARIA attributes
- meaningful disabled states

Accessibility must not be added as an afterthought.

---

# 69. PERFORMANCE ARCHITECTURE

The frontend should prioritize:

- minimal unnecessary network requests
- controlled state updates
- efficient rendering
- code splitting where useful
- lazy loading for suitable routes
- avoiding unnecessary dependencies

Performance optimization must not destroy maintainability.

---

# 70. SECURITY ARCHITECTURE

Frontend security is not backend authorization.

The frontend may:

- hide unauthorized UI
- protect routes
- manage user experience

The backend must enforce:

- authorization
- ownership
- permissions
- billing rules
- deployment permissions
- sensitive business logic

---

# 71. FILE NAMING RULE

Existing conventions should remain consistent.

React components:

PascalCase.jsx

Examples:

Dashboard.jsx
Workspace.jsx
Sidebar.jsx

Styles:

ComponentName.module.css

Services:

camelCase.js

Examples:

authService.js
aiService.js
workspaceService.js

Configuration:

camelCase.js

---

# 72. FOLDER NAMING RULE

Feature/page folders should use a consistent naming convention.

Current structure:

pages/workspace/Workspace/
pages/dashboard/Dashboard/
pages/settings/Settings/

This structure should not be randomly renamed during redesign.

Any architectural migration must be intentional and documented.

---

# 73. IMPORT RULE

Imports should use clear relative paths according to the final
project structure.

Avoid unnecessary circular dependencies.

Examples of forbidden architecture:

Sidebar importing Dashboard page
Dashboard importing Sidebar
Service importing page
API client importing UI components

---

# 74. CIRCULAR DEPENDENCY RULE

The following dependency direction is preferred:

config
  ↓
components
  ↓
layouts
  ↓
pages
  ↓
services

A lower-level layer should not import a higher-level UI layer.

---

# 75. BACKEND INDEPENDENCE

Frontend pages must not implement backend business rules.

For example:

The frontend may display:

"Free Plan"

but backend determines:

- actual subscription
- actual limits
- actual permissions

---

# 76. API CONTRACT DEPENDENCY

The service architecture defined here depends on the real backend
API contract.

Endpoint assumptions must be verified before final implementation.

The official API mapping will be defined in:

DOCUMENT 07
Frontend ↔ Backend API Contract

---

# 77. DESIGN SYSTEM DEPENDENCY

All major UI components and pages must follow:

DOCUMENT 03
Enterprise Design System

No page should invent its own:

- typography system
- spacing system
- button system
- card system
- status system

without architectural justification.

---

# 78. PAGE SPECIFICATION DEPENDENCY

Individual page layouts will be defined in:

DOCUMENT 05
Page-by-Page UI Specification

Therefore:

Document 02
= where functionality lives

Document 05
= what each page contains and how it behaves

---

# 79. WORKSPACE DEPENDENCY

Workspace-specific architecture will be expanded in:

DOCUMENT 06
Workspace & AI Builder Specification

Document 02 defines ownership.

Document 06 defines the complete Workspace experience.

---

# 80. AUTHENTICATION DEPENDENCY

Authentication-specific security behavior will be expanded in:

DOCUMENT 08
Authentication, Security & Access Specification

---

# 81. BILLING / DEPLOYMENT DEPENDENCY

Operational behavior will be expanded in:

DOCUMENT 09
Billing, Deployment & Operational Specification

---

# 82. QA DEPENDENCY

Final acceptance criteria will be defined in:

DOCUMENT 10
QA, Acceptance & Production Release Specification

---

# 83. ARCHITECTURAL CHANGE RULE

After the final architecture is implemented,
new architectural changes must have a clear reason.

Do not introduce random:

- folders
- services
- contexts
- duplicate APIs
- duplicate pages
- duplicate components

Every major change must preserve architectural clarity.

---

# 84. EXISTING FILE REPLACEMENT RULE

During the upgrade process:

1. Existing file is inspected.
2. Its responsibility is confirmed.
3. Corresponding document specification is checked.
4. Backend/API dependency is confirmed.
5. Replacement code is written.
6. Build is tested.
7. Runtime behavior is tested.
8. Only then is the file considered complete.

---

# 85. NO HALF-UPGRADE RULE

A page should not be considered complete if:

- JSX is upgraded but CSS is old
- CSS is upgraded but routing is broken
- UI is upgraded but API calls are fake
- API is connected but loading/error states are missing
- desktop works but mobile is broken

Implementation must be treated as a complete feature.

---

# 86. PRODUCTION READINESS RULE

A frontend feature is production-ready only when:

- architecture is correct
- UI is complete
- API integration is real
- authentication behavior is correct
- loading state works
- empty state works
- error state works
- responsive behavior works
- accessibility basics work
- build succeeds
- runtime behavior is verified

---

# 87. FINAL ARCHITECTURAL MAP

                         ZYRIONOS FRONTEND
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
        APPLICATION                            CONFIG
              │                                   │
       ┌──────┴──────┐                 ┌──────────┼──────────┐
       │             │                 │          │          │
    main.jsx      App.jsx          constants  navigation  theme
       │
    ROUTES
       │
 ┌─────┴─────────────┐
 │                   │
PublicRoute      ProtectedRoute
 │                   │
Auth Pages       App Pages
 │                   │
AuthLayout      DashboardLayout
                     │
             ┌───────┼────────┐
             │       │        │
          Sidebar  Topbar   Page
                              │
              ┌───────────────┼────────────────┐
              │               │                │
          Dashboard       Workspace        Billing
              │               │                │
        Deployments       Settings        Services
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                aiService workspace deployment
                    │         │         │
                    └─────────┼─────────┘
                              │
                           api.js
                              │
                       REAL BACKEND
