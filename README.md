# DevOps Monitoring Platform

A comprehensive microservices-based DevOps monitoring platform with AI-powered insights and intelligent alerting using **100% FREE services**.

## Architecture

### Services
- **User Service** (Port 3001): Authentication, user management, teams
- **Monitoring Service** (Port 3002): Server monitoring, metrics collection, alerting
- **AI Service** (Port 3003): RAG system, predictive analytics, recommendations
- **Notification Service** (Port 3004): Multi-channel notifications, templates, subscriptions
- **Gateway** (Port 80): Nginx reverse proxy with rate limiting and load balancing

### Infrastructure
- **PostgreSQL**: Primary database for all services
- **Redis**: Queue management and caching
- **Nginx**: API gateway and reverse proxy

## Quick Start

1. **Clone and Setup**
   \`\`\`bash
   git clone <repository>
   cd devops-monitoring-platform
   \`\`\`

2. **Environment Configuration**
   \`\`\`bash
   # Copy environment files
   cp services/user/.env.example services/user/.env
   cp services/monitoring/.env.example services/monitoring/.env
   cp services/ai/.env.example services/ai/.env
   cp services/notification/.env.example services/notification/.env
   
   # Update with your configuration
   \`\`\`

3. **Start Services**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. **Initialize Database**
   \`\`\`bash
   # Run setup scripts
   docker exec -i devops_postgres psql -U devops_user -d devops_monitoring < scripts/monitoring-setup.sql
   docker exec -i devops_postgres psql -U devops_user -d devops_monitoring < scripts/inter-service-setup.sql
   \`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification

### Monitoring
- `GET /api/servers` - List servers
- `POST /api/servers` - Add server
- `GET /api/metrics/server/:id` - Get server metrics
- `GET /api/alerts` - List alerts

### AI Services
- `POST /api/rag/query` - Query knowledge base
- `POST /api/predictions/generate` - Generate predictions
- `POST /api/recommendations/generate/:serverId` - Get recommendations
- `POST /api/chat/message` - Chat with AI assistant

### Notifications
- `POST /api/notifications/send` - Send notification
- `GET /api/channels` - List notification channels
- `GET /api/templates` - List templates

## Features

### Core Monitoring
- Real-time server metrics (CPU, memory, disk, network)
- Customizable alerting with multiple severity levels
- Historical data analysis and trending
- Server health checks and status monitoring

### AI-Powered Insights
- RAG-based knowledge system for DevOps best practices
- Predictive analytics for resource planning
- Intelligent recommendations based on metrics
- Natural language chat interface for queries

### Multi-Channel Notifications
- Email notifications (Free SMTP with Gmail - 500 emails/day)
- SMS alerts (Free email-to-SMS gateways via carrier networks)
- Webhook integrations
- Customizable templates and rules

### Enterprise Features
- Team-based access control
- Role-based permissions
- Audit logging
- Service-to-service authentication
- Circuit breaker patterns for resilience

## Configuration

### Environment Variables

**Required for all services:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `SERVICE_SECRET` - Inter-service authentication

**AI Service:**
- `GEMINI_API_KEY` - Google Gemini API key (Free tier: 60 requests/minute)

**Notification Service:**
- **Email (Free)**: Gmail SMTP settings (500 emails/day free)
  - `SMTP_HOST=smtp.gmail.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=your-email@gmail.com`
  - `SMTP_PASS=your-app-password`
- **SMS (Free)**: Email-to-SMS gateways (no API keys needed)
- `REDIS_URL` - Redis connection for queues

## Free Service Setup Guide

### 1. Google Gemini API (AI Service)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a free API key
3. Set `GEMINI_API_KEY` in your environment
4. **Free Tier**: 60 requests per minute, no cost

### 2. Gmail SMTP (Email Notifications)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Account Settings → Security → App Passwords
3. Use your Gmail address as `SMTP_USER`
4. Use the app password as `SMTP_PASS`
5. **Free Tier**: 500 emails per day

### 3. SMS via Email Gateways (SMS Notifications)
- **No setup required** - uses carrier email gateways
- Supports: Verizon, AT&T, T-Mobile, Sprint, and more
- **Completely free** - no API keys or accounts needed
- Format: `phonenumber@carriergatewy.com`

## Development

### Adding New Services
1. Create service directory in `services/`
2. Add Dockerfile and package.json
3. Update docker-compose.yml
4. Add routes to nginx.conf
5. Update shared types and service client

### Inter-Service Communication
Services communicate via HTTP using the shared ServiceClient class with:
- Circuit breaker patterns
- Automatic retries
- Health monitoring
- Authentication tokens

### Database Migrations
Each service manages its own database schema using Prisma:
\`\`\`bash
cd services/[service-name]
npx prisma migrate dev
\`\`\`

## Monitoring & Observability

- Structured logging with Winston
- Request/response logging in gateway
- Service health checks
- Circuit breaker monitoring
- Performance metrics collection

## Security

- JWT-based user authentication
- Service-to-service token authentication
- Rate limiting per endpoint
- CORS configuration
- Security headers
- Input validation with Zod

## Deployment

### Production Checklist
- [ ] Update all environment variables
- [ ] Configure proper database credentials
- [ ] Set up SSL certificates
- [ ] Configure monitoring and alerting
- [ ] Set up backup strategies
- [ ] Review security configurations
- [ ] Set up Google Gemini API key (free tier)
- [ ] Configure Gmail SMTP credentials
- [ ] Test email-to-SMS gateway functionality

### Scaling
- Services are stateless and can be horizontally scaled
- Database can be scaled with read replicas
- Redis can be clustered for high availability
- Nginx can be load balanced

## Cost Breakdown

**Total Monthly Cost: $0** 🎉

- **AI Service**: Google Gemini (Free tier - 60 req/min)
- **Email**: Gmail SMTP (Free - 500 emails/day)
- **SMS**: Email-to-SMS gateways (Free - unlimited)
- **Database**: PostgreSQL (Self-hosted)
- **Cache**: Redis (Self-hosted)
- **Hosting**: Docker containers (Self-hosted)

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit pull request

## License

MIT License - see LICENSE file for details
