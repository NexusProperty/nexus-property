# AppraisalHub

A modern real estate property appraisal platform with AI-powered market analysis, intelligent valuation algorithms, and comprehensive reporting features.

## Features

- **Authentication** - Secure user authentication and role-based access control
- **Property Management** - Create, update, and manage property listings with image uploads
- **Appraisal Workflows** - Step-by-step guided appraisal creation and management
- **Valuation Engine** - Intelligent property valuation using comparable properties and adjustments
- **AI-Powered Analysis** - Market trend analysis and insights using artificial intelligence
- **Interactive Reports** - Generate and customize professional PDF reports
- **Real-Time Updates** - Live status updates and notifications using Supabase Realtime
- **Collaboration Tools** - Team-based property access and workflow management

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Shadcn/UI, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: React Query, Context API
- **Testing**: Vitest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions
- **Deployment**: Docker, Nginx, Vercel/Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account and project
- (Optional) Docker and Docker Compose for containerized development

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/appraisalhub.git
cd appraisalhub
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:

```bash
npm run dev
```

### Docker Development

To run the application using Docker:

```bash
# Build and start containers
docker-compose up

# Run with detached mode
docker-compose up -d

# Stop containers
docker-compose down
```

## Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run component tests
npm run test:component

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## Deployment

See the [Deployment Guide](./docs/deployment-guide.md) for detailed instructions on deploying the application to various environments.

### Quick Deployment

```bash
# Deploy to preview environment
node scripts/deploy.js preview

# Deploy to production environment
node scripts/deploy.js production
```

## Project Structure

```
/
├── .github/workflows/   # GitHub Actions workflows
├── docs/                # Documentation
├── nginx/               # Nginx configuration
├── public/              # Static assets
├── scripts/             # Utility scripts
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities and libraries
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── styles/          # Global styles
│   ├── tests/           # Test files
│   └── types/           # TypeScript type definitions
├── supabase/
│   ├── functions/       # Edge Functions
│   ├── migrations/      # Database migrations
│   └── tests/           # Database tests (pgTAP)
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile           # Production Docker configuration
├── Dockerfile.test      # Testing Docker configuration
└── vite.config.ts       # Vite configuration
```

## Documentation

- [Database Schema](./docs/schema-documentation.md)
- [Deployment Guide](./docs/deployment-guide.md)
- [Development Plan](./implementation-plan.md)
- [Creative Phase Design](./creative-phase-design.md)
- [Supabase Connection Setup](./supabase-connection.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.