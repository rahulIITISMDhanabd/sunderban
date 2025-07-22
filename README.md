# Sundarban Geographic Data Viewer

A comprehensive web application for exploring the Sundarban region with interactive 3-layer geographic selection: District → SS → Village.

## 🌟 Features

- **2,180 Villages** displayed as accurate polygon shapes
- **3-Layer Hierarchical Selection**: District → SS (Sub-district) → Village
- **Interactive Search**: Find villages by name
- **Real-time Map Interaction**: Click any polygon to select
- **Village Name Correction**: Cleaned and standardized names
- **Area Calculations**: See village areas in km²
- **Multiple Map Views**: OpenStreetMap and Satellite imagery
- **Responsive Design**: Works on desktop and mobile

## 🗺️ Coverage

- **Total Villages**: 2,180
- **Total Area**: 9,106.94 km²
- **Main Region**: 24 Paraganas South (466 villages - core Sundarban area)
- **Additional Districts**: Korea, Devbhumi Dwarka, Kachchh, and others
- **SS Areas**: 27 sub-districts

## 🚀 Live Demo

Visit the live application: [Sundarban Viewer](https://your-username.github.io/sundarban-viewer/)

## 💻 Local Development

### Prerequisites
- Python 3.x (for local server)
- Modern web browser

### Quick Start
1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sundarban-viewer.git
   cd sundarban-viewer
   ```

2. **Start local server**:
   ```bash
   python server.py
   ```

3. **Open browser**: Go to `http://localhost:8000`

## 📁 Project Structure

```
sundarban-viewer/
├── index.html              # Main application page
├── styles.css              # Styling and responsive design
├── script.js               # JavaScript functionality
├── server.py              # Local development server
├── data/                  # Geographic data files
│   ├── districts.geojson  # District boundaries
│   ├── ss.geojson         # Sub-district boundaries
│   └── villages.geojson   # Village boundaries (2,180 villages)
├── package.json           # Project configuration
├── HOSTING_GUIDE.md       # Deployment instructions
└── README.md              # This file
```

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: Leaflet.js
- **Data Format**: GeoJSON
- **Backend**: Python HTTP server (development only)
- **Deployment**: Static site hosting

## 📊 Data Sources

- **Original Format**: Shapefiles (.shp, .dbf, .shx, .prj)
- **Converted Format**: GeoJSON for web compatibility
- **Coordinate System**: WGS84 (EPSG:4326)
- **Data Processing**: GeoPandas for conversion and cleaning

## 🎯 Usage

### Basic Navigation
1. **Select District**: Choose from dropdown (e.g., "24 Paraganas South" for main Sundarban)
2. **Select SS**: Pick a sub-district from the filtered list
3. **Select Village**: Choose from available villages in that SS area
4. **Search**: Use the search box to find specific villages quickly
5. **Map Interaction**: Click any polygon on the map to select it

### Advanced Features
- **Hover Effects**: Hover over villages to see names
- **Zoom to Selection**: Button to focus on selected area
- **Layer Toggle**: Show/hide different geographic layers
- **Base Map Switch**: Toggle between street map and satellite view
- **Area Information**: View village area calculations

## 🌐 Deployment

### GitHub Pages (Recommended)
1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Access at: `https://YOUR_USERNAME.github.io/sundarban-viewer/`

### Other Options
- **Netlify**: Drag and drop deployment
- **Vercel**: Git-based deployment
- **Firebase Hosting**: Google Cloud platform
- **Surge.sh**: Command-line deployment

See `HOSTING_GUIDE.md` for detailed deployment instructions.

## 🔧 Development

### Adding New Data
1. Place new shapefiles in the project directory
2. Run the conversion script:
   ```bash
   python convert_shapefiles_enhanced.py
   ```
3. Updated GeoJSON files will be created in the `data/` directory

### Customization
- **Colors**: Edit the `getVillageColor()` function in `script.js`
- **Styling**: Modify `styles.css` for visual changes
- **Functionality**: Extend `script.js` for new features

## 📱 Browser Support

- Chrome/Chromium 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure all files are properly uploaded
3. Verify GeoJSON files are accessible
4. Check network connectivity for map tiles

## 📈 Performance Notes

- **Large Dataset**: 2,180 villages require good internet connection for initial load
- **Optimization**: Village labels appear only at higher zoom levels
- **Caching**: Browser caches GeoJSON files for faster subsequent loads
- **Progressive Loading**: Consider implementing for very large datasets

## 🗺️ Geographic Information

### Main Sundarban Region (24 Paraganas South)
- **Villages**: 466
- **Key SS Areas**: Basanti, Gosaba, Canning, etc.
- **Significance**: Core mangrove forest region
- **Features**: River networks, protected areas, coastal villages

### Additional Coverage
- **Korea**: 443 villages
- **Devbhumi Dwarka**: 225 villages
- **Kachchh**: 186 villages
- **Others**: Various districts with complete administrative boundaries

---

## 🎉 Acknowledgments

- **Data Source**: Survey of India (SOI)
- **Mapping Library**: Leaflet.js
- **Base Maps**: OpenStreetMap, Esri
- **Development**: GeoPandas, Python ecosystem
