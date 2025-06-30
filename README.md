# Political Contribution Monitor

A comprehensive web application for monitoring and analyzing political contributions using open-source FEC (Federal Election Commission) data. Built with React frontend and Node.js backend.

![image](https://github.com/user-attachments/assets/5dfde2a6-400e-46d4-adca-f94cb27a4853)
![image](https://github.com/user-attachments/assets/0c0e1a2c-c1de-495b-a1dc-8ace7d2e6eeb)
![image](https://github.com/user-attachments/assets/ad64e921-315e-4739-85e5-f7390724262b)


## Features

- **Individual Search**: Search for specific contributors with fuzzy matching
- **Bulk Search**: Search multiple names simultaneously
- **Advanced Filtering**: Filter by amount, date range, location, and more
- **Export Functionality**: Export search results to CSV format
- **Analytics Dashboard**: Visualize contribution patterns and trends
- **Risk Scoring**: Automated risk assessment based on contribution patterns
- **FEC Data Support**: Native support for official FEC pipe-delimited format

## Data Format Support

The application supports the official FEC (Federal Election Commission) data format:

### FEC Pipe-Delimited Format
The application natively supports the official FEC contributions by individuals file format, which includes:

- **File Format**: Pipe-delimited (|) text files
- **Header Row**: Contains field names matching FEC specification
- **21 Fields**: Complete mapping of all FEC data fields including:
  - Contributor information (name, city, state, zip, employer, occupation)
  - Transaction details (amount, date, recipient committee)
  - FEC-specific fields (amendment indicator, report type, transaction type, etc.)

### Supported Fields
- `CMTE_ID`: Committee ID (recipient)
- `NAME`: Contributor name
- `CITY`: Contributor city
- `STATE`: Contributor state
- `ZIP_CODE`: ZIP code
- `EMPLOYER`: Employer
- `OCCUPATION`: Occupation
- `TRANSACTION_DT`: Transaction date (MMDDYYYY format)
- `TRANSACTION_AMT`: Transaction amount
- `ENTITY_TP`: Entity type (IND for individuals)
- And all other FEC specification fields

### Data Requirements
- **Minimum Amount**: $200+ (2015-present), $200+ (1989-2014), $500+ (1975-1988)
- **File Extension**: `.txt`, `.dat`, or `.csv`
- **Encoding**: UTF-8 recommended
- **Location**: Place files in `backend/data/` directory

## Installation

1. **Clone the repository**:
   ```bash
   # SSH (requires GitHub SSH key)
   git clone git@github.com:ZhenWang-Jen/political-contribution-monitor.git

   # or HTTPS
   git clone https://github.com/ZhenWang-Jen/political-contribution-monitor.git
   ```

2. **Install dependencies**:
   Run the `install-all` script from the root directory. This will install dependencies for the root, backend, and frontend.
   ```bash
   npm run install-all
   ```

3. **Add your FEC data files**:
   - Place your FEC data files (pipe-delimited `.txt` format) in the `backend/data/` directory.
   - The application will automatically detect and process all `.txt` files in this directory on startup.

## Usage

To start both the backend server and the frontend development server concurrently, run the following command from the root directory:

```bash
npm run dev
```

- The backend server will be available at `http://localhost:5000`.
- The frontend application will be available at `http://localhost:3000`.

The application automatically:
- Loads all data files from `backend/data/` on startup.
- Builds an in-memory search index using Fuse.js for fast, fuzzy matching.

## API Endpoints

### Search
- `GET /api/search` - Individual contributor search
- `GET /api/bulk-search` - Bulk search multiple names
- `GET /api/export` - Export search results to CSV
- `GET /api/analytics` - Get analytics data

### Parameters
- `name`: Contributor name (fuzzy matching)
- `city`: City filter
- `state`: State filter (2-letter code)
- `minAmount`: Minimum contribution amount
- `maxAmount`: Maximum contribution amount
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

## Frontend Features

### Pages
- **Dashboard**: Overview and quick search
- **Individual Search**: Search for specific contributors
- **Bulk Search**: Search multiple names at once
- **Analytics**: Visualizations and trend analysis

### Components
- **ContributionTable**: Displays search results
- **AnalyticsChart**: Interactive charts and graphs
- **Navbar**: Navigation and search functionality

## Data Sources

The application is designed to work with official FEC data:
- **FEC Bulk Data**: https://www.fec.gov/data/browse-data/
- **Contributions by Individuals**: Individual contribution records
- **Real-time Updates**: Supports amendment indicators and report types

## Development

### Project Structure
```
political-contribution-monitor/
├── backend/
│   ├── data/                # FEC data files
│   ├── routes/              # API endpoints
│   ├── scripts/             # Data processing scripts
│   ├── utils/               # Data processing utilities
│   ├── create_indexes.js
│   ├── createFTS.js
│   ├── package.json
│   └── server.js            # Express server
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   └── pages/           # Page components
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── .gitignore
├── package.json
├── README.md
├── WRITEUP.md
```

### Technologies Used
- **Backend**: Node.js, Express, Fuse.js (fuzzy search)
- **Frontend**: React, TypeScript, Tailwind CSS
- **Data Processing**: csv-parser, moment.js
- **Search**: Fuzzy matching with configurable thresholds

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the documentation
2. Review the FEC data format specifications
3. Ensure your data files match the expected format
4. Open an issue with details about your problem 
