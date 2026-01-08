# Contributing to Turnover Analytics Platform

Thank you for your interest in contributing to this project!

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm 9+
- Supabase account (for authentication)

### Backend Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Copy environment template
copy .env.example .env  # Windows
cp .env.example .env  # Linux/Mac

# Start backend
python -m uvicorn backend.api:app --reload
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment template
copy frontend\.env.example frontend\.env.local  # Windows
cp frontend/.env.example frontend/.env.local  # Linux/Mac

# Start frontend
npm run dev
```

## Code Standards

### Python
- Follow PEP 8 style guide
- Use type hints for function signatures
- Add docstrings to all public functions
- Run `pytest` before submitting PRs

### TypeScript/React
- Use TypeScript for all new components
- Follow React hooks best practices
- Use functional components
- Run `npm run build` to verify no type errors

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pytest` and `npm run build`)
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

## Reporting Issues

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Python/Node versions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
