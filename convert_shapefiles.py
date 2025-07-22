# Shapefile to GeoJSON Converter for Sundarban Web App
# This script converts the shapefiles to GeoJSON format for web use

import geopandas as gpd
import json
import os

def convert_shapefile_to_geojson(shapefile_path, output_path):
    """
    Convert a shapefile to GeoJSON format
    """
    try:
        # Read the shapefile
        gdf = gpd.read_file(shapefile_path)
        
        # Convert to WGS84 (EPSG:4326) for web mapping
        if gdf.crs != 'EPSG:4326':
            gdf = gdf.to_crs('EPSG:4326')
        
        # Convert to GeoJSON
        geojson = gdf.to_json()
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            # Pretty print the JSON
            geojson_dict = json.loads(geojson)
            json.dump(geojson_dict, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully converted {shapefile_path} to {output_path}")
        
        # Print some info about the data
        print(f"  - Features: {len(gdf)}")
        print(f"  - Columns: {list(gdf.columns)}")
        print(f"  - CRS: {gdf.crs}")
        print()
        
        return True
        
    except Exception as e:
        print(f"Error converting {shapefile_path}: {str(e)}")
        return False

def main():
    """
    Convert all shapefiles to GeoJSON
    """
    # Get the current directory
    current_dir = os.getcwd()
    
    # Define shapefile mappings
    shapefiles = {
        'Districtt.shp': 'data/districts.geojson',
        'ss.shp': 'data/ss.geojson', 
        'village.shp': 'data/villages.geojson'
    }
    
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    print("Converting Sundarban shapefiles to GeoJSON...")
    print("=" * 50)
    
    success_count = 0
    total_count = len(shapefiles)
    
    for shapefile, geojson_path in shapefiles.items():
        shapefile_path = os.path.join(current_dir, shapefile)
        
        if os.path.exists(shapefile_path):
            if convert_shapefile_to_geojson(shapefile_path, geojson_path):
                success_count += 1
        else:
            print(f"Warning: {shapefile_path} not found")
    
    print("=" * 50)
    print(f"Conversion complete: {success_count}/{total_count} files converted successfully")
    
    if success_count > 0:
        print(f"\nGeoJSON files created in the 'data' directory:")
        for shapefile, geojson_path in shapefiles.items():
            if os.path.exists(geojson_path):
                print(f"  - {geojson_path}")
        
        print(f"\nNext steps:")
        print(f"1. Update the loadSampleData() function in script.js to load these GeoJSON files")
        print(f"2. Use fetch() or XMLHttpRequest to load the GeoJSON data")
        print(f"3. Replace the sample data with your actual converted data")

def analyze_shapefiles():
    """
    Analyze the structure of the shapefiles to understand the data
    """
    current_dir = os.getcwd()
    shapefiles = ['Districtt.shp', 'ss.shp', 'village.shp']
    
    print("Analyzing Sundarban shapefiles...")
    print("=" * 50)
    
    for shapefile in shapefiles:
        shapefile_path = os.path.join(current_dir, shapefile)
        
        if os.path.exists(shapefile_path):
            try:
                gdf = gpd.read_file(shapefile_path)
                print(f"{shapefile}:")
                print(f"  - Features: {len(gdf)}")
                print(f"  - Columns: {list(gdf.columns)}")
                print(f"  - CRS: {gdf.crs}")
                
                # Show sample data
                if len(gdf) > 0:
                    print(f"  - Sample feature attributes:")
                    for col in gdf.columns:
                        if col != 'geometry':
                            sample_val = gdf[col].iloc[0] if not gdf[col].empty else 'N/A'
                            print(f"    {col}: {sample_val}")
                
                print()
                
            except Exception as e:
                print(f"Error reading {shapefile}: {str(e)}")
        else:
            print(f"{shapefile}: File not found")
    
    print("=" * 50)

if __name__ == "__main__":
    # First analyze the shapefiles
    try:
        analyze_shapefiles()
    except ImportError:
        print("GeoPandas not installed. Installing required packages...")
        print("Run: pip install geopandas")
        print()
    
    # Then convert them
    try:
        main()
    except ImportError as e:
        print(f"Required package not installed: {e}")
        print("Please install required packages:")
        print("pip install geopandas")
        print("pip install fiona")
        print("pip install pyproj")
