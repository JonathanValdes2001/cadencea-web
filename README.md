# Cadencea Web - Marketing & Account Management Website

The official marketing website and account management portal for Cadencea products. Built with Next.js 15, Supabase, and TypeScript.

> **IMPORTANT**: This is NOT a web version of Cadencea Vault. Cadencea Vault is a **desktop-only application** (Electron-based). This website provides:
> - Marketing and landing pages
> - Desktop app download page
> - User account management (profile, settings, billing)
> - Future: E-commerce for VST software and sample packs
>
> **Project management is done exclusively in the Cadencea Vault desktop app.**

## 🚀 Features

### Authentication & Security
- **Email/Password Authentication** - Secure user registration and login
- **Profile Management** - Auto-created user profiles with editable information
- **Secure Email/Password Changes** - Safe account modification flows
- **Route Protection** - Middleware-based authentication for protected areas
- **Row Level Security** - Database-enforced data access control
- **Audit Logging** - Complete activity tracking for compliance

### User Experience
- **Order History** - Real-time order tracking with RLS protection
- **Newsletter System** - Double opt-in subscription with compliance features
- **Responsive Design** - Mobile-first approach with modern aesthetics
- **Error Handling** - Comprehensive error states and user feedback
- **Loading States** - Smooth user interactions with proper feedback

### Technical Excellence
- **TypeScript** - Full type safety throughout the application
- **Next.js 15.3.4** - Latest App Router with server-side functionality
- **Supabase Integration** - Modern BaaS with real-time capabilities
- **Input Validation** - Zod schemas for secure data processing
- **Production Ready** - Security, performance, and scalability focused

## 🛠 Tech Stack

- **Frontend**: Next.js 15.3.4, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with custom flows
- **Validation**: Zod for input validation and type safety
- **State Management**: React Context with custom auth provider

## 📁 Project Structure

```
nextjs-boilerplate/
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes (Server-side)
│   │   ├── auth/              # Authentication endpoints
│   │   │   ├── signup/        # User registration
│   │   │   ├── change-email/  # Secure email changes
│   │   │   └── change-password/ # Password updates
│   │   └── newsletter/        # Newsletter management
│   │       ├── subscribe/     # Double opt-in subscription
│   │       ├── confirm/       # Email confirmation
│   │       └── unsubscribe/   # Unsubscribe handling
│   ├── account/               # Protected user area
│   │   ├── settings/          # Profile management
│   │   └── subscription/      # Plan and invoices
│   ├── login/                 # Authentication pages
│   ├── signup/                # User registration
│   └── layout.tsx             # Root layout with auth provider
├── lib/                       # Core utilities
│   ├── auth-context.tsx       # React auth context
│   ├── supabase.ts           # Database client
│   └── database.types.ts     # TypeScript definitions
├── supabase/                  # Database schema
│   └── migrations/           # SQL migrations with RLS
├── docs/                      # Documentation
│   └── UPGRADE_PLAN.md       # Comprehensive upgrade details
├── middleware.ts             # Route protection
└── .env.example             # Environment template
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Basic understanding of Next.js and React

### 1. Environment Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd nextjs-boilerplate

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. Configure Supabase
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys from Project Settings > API
3. Update `.env.local` with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Database Setup
Run the SQL migrations in your Supabase SQL editor (in order):

1. **Schema Creation**: `supabase/migrations/001_initial_schema.sql`
2. **Security Policies**: `supabase/migrations/002_rls_policies.sql`
3. **Sample Data**: `supabase/migrations/003_seed_data.sql`

### 4. Start Development
```bash
npm run dev
```

Navigate to `http://localhost:3000` and start using the application!

## 🔐 Security Features

### Database Security
- **Row Level Security (RLS)** - Users can only access their own data
- **Service Role Protection** - Admin operations isolated to server-side
- **Input Validation** - All API inputs validated with Zod schemas
- **SQL Injection Prevention** - Parameterized queries via Supabase

### Authentication Security
- **Secure Password Handling** - Supabase Auth with industry standards
- **Session Management** - Automatic token refresh and secure storage
- **Route Protection** - Middleware prevents unauthorized access
- **CSRF Protection** - Built-in Next.js security features

### Compliance Features
- **Audit Logging** - All critical operations tracked
- **GDPR Ready** - User data deletion via Supabase
- **Email Consent Tracking** - Newsletter subscription compliance
- **Data Minimization** - Only collect necessary user information

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration with profile creation
- `POST /api/auth/change-email` - Secure email update with verification
- `POST /api/auth/change-password` - Password change with current password check

### Newsletter
- `POST /api/newsletter/subscribe` - Double opt-in email subscription
- `GET /api/newsletter/confirm?token=` - Email confirmation (HTML response)
- `GET /api/newsletter/unsubscribe?email=` - One-click unsubscribe

## 🎯 Available Routes

### Public Routes
- `/` - Homepage with feature overview
- `/login` - User authentication
- `/signup` - Account registration
- `/products` - Product showcase

### Protected Routes (Require Authentication)
- `/account/settings` - Profile management
- `/account/subscription` - Plan details and payment history
- `/account/*` - All account-related pages

## 🧪 Testing & Development

### Manual Testing Checklist
- [ ] User signup creates account and profile
- [ ] Login redirects to dashboard
- [ ] Profile editing works with validation
- [ ] Order history shows user-specific data only
- [ ] Newsletter subscription requires confirmation
- [ ] Protected routes require authentication
- [ ] RLS prevents cross-user data access

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

## 🔄 Future Enhancements (Database Ready)

### Payment Integration
- Stripe webhook processing (database table ready)
- Order creation and fulfillment
- Download entitlements management

### Advanced Features
- B2 signed download URLs
- Admin dashboard for user management
- Email marketing automation
- Advanced analytics and reporting

## 📚 Documentation

- **[Upgrade Plan](./docs/UPGRADE_PLAN.md)** - Detailed implementation overview
- **[Database Schema](./supabase/migrations/)** - SQL migrations and structure
- **[API Reference](./app/api/)** - Server-side endpoint implementations

## 🆘 Troubleshooting

### Common Issues
1. **Database Connection**: Verify Supabase URL and keys in `.env.local`
2. **RLS Errors**: Ensure migrations ran successfully and RLS is enabled
3. **Authentication**: Check middleware configuration and route protection
4. **CORS Issues**: Verify Supabase project settings allow your domain

### Support
For issues and questions:
1. Check the [Upgrade Plan](./docs/UPGRADE_PLAN.md) documentation
2. Review database migration files
3. Verify environment variables are correctly set
4. Test API endpoints with proper authentication

## 🏗 Architecture

This application follows modern best practices:
- **Secure by Design** - Security integrated from the ground up
- **Type-Safe** - End-to-end TypeScript for reliability
- **Scalable** - Database and API design supports growth
- **Maintainable** - Clear separation of concerns and documentation
- **Production Ready** - Error handling, logging, and monitoring

Built with ❤️ for the music production community.
