# Quality Traceability Matrix

A comprehensive application for tracking the relationship between requirements and test cases in software development projects. This tool helps teams maintain visibility into test coverage, automation status, and release readiness.

## Features

- **Dashboard**: Overview of release quality metrics, health scores, and risk areas
- **Traceability Matrix**: Visual mapping between requirements and test cases
- **Test Depth Analysis**: Calculate required test coverage based on business impact, complexity, and other factors
- **Quality Gates**: Define and track quality criteria that must be met before release
- **Risk Assessment**: Automatically identify high-risk areas based on test coverage and failure rates

## Project Structure

The application is organized into the following structure:

```
quality-traceability-matrix/
├── public/                 # Static files
├── src/
│   ├── assets/             # Images and static resources
│   ├── components/         # Reusable UI components
│   │   ├── Dashboard/      # Dashboard related components
│   │   ├── Layout/         # Layout components (sidebar, header)
│   │   └── TraceabilityMatrix/ # Matrix related components
│   ├── data/               # Sample data
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   └── utils/              # Utility functions
├── App.jsx                 # Main application component
└── main.jsx               # Application entry point
```

## Technology Stack

- **React 19**: For building the user interface
- **React Router 7**: For application routing
- **Recharts**: For data visualization
- **TailwindCSS**: For styling
- **Vite**: For fast development and building

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/quality-traceability-matrix.git
cd quality-traceability-matrix
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Building for Production

To build the application for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Customizing the Application

### Adding Real Data

Replace the sample data in the `src/data/` directory with your actual requirements, test cases, and version information:

- `requirements.js`: Update with your project requirements
- `testcases.js`: Add your actual test cases
- `versions.js`: Configure your release versions
- `mapping.js`: Define the relationships between requirements and test cases

### Customizing Metrics

The Test Depth Factor (TDF) calculation can be customized in `src/utils/coverage.js` based on your specific project needs.

## Planned Enhancements

- User authentication and role-based access
- Requirements and test case management
- Integration with test automation tools (Jenkins, CircleCI)
- Export to PDF/Excel functionality
- Historical trend analysis

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React 19 and TailwindCSS
- Inspired by industry standard quality management practices