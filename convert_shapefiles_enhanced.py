"""
Advanced Shapefile to GeoJSON Converter for Sundarban Villages
This script converts shapefiles to GeoJSON with village name cleaning and validation
"""

import geopandas as gpd
import json
import os
import re
from unidecode import unidecode

def clean_village_name(name):
    """
    Clean and standardize village names
    """
    if not name or pd.isna(name):
        return "Unknown Village"
    
    # Convert to string and strip whitespace
    name = str(name).strip()
    
    # Remove extra spaces
    name = re.sub(r'\s+', ' ', name)
    
    # Capitalize properly (first letter of each word)
    name = name.title()
    
    # Fix common abbreviations
    replacements = {
        ' Ct': ' (Census Town)',
        'Ct ': '(Census Town) ',
        ' Pt ': ' Part ',
        ' Pt.': ' Part',
        ' No ': ' No. ',
        ' No.': ' No.',
        'Gram Panchayat': 'GP',
        ' Gp': ' GP',
        ' Gp ': ' GP '
    }
    
    for old, new in replacements.items():
        name = name.replace(old, new)
    
    return name

def convert_villages_with_cleaning(shapefile_path, output_path):
    """
    Convert village shapefile to GeoJSON with name cleaning and validation
    """
    try:
        print(f"Loading village data from {shapefile_path}...")
        gdf = gpd.read_file(shapefile_path)
        
        # Convert to WGS84 if needed
        if gdf.crs != 'EPSG:4326':
            print("Converting to WGS84 coordinate system...")
            gdf = gdf.to_crs('EPSG:4326')
        
        # Clean village names
        print("Cleaning village names...")
        gdf['village_clean'] = gdf['village'].apply(clean_village_name)
        
        # Add additional useful columns
        gdf['village_code'] = gdf['vlcode'] if 'vlcode' in gdf.columns else ''
        gdf['block_name'] = gdf['block'] if 'block' in gdf.columns else ''
        gdf['subdistric_name'] = gdf['subdistric'] if 'subdistric' in gdf.columns else ''
        gdf['district_name'] = gdf['district'] if 'district' in gdf.columns else ''
        
        # Calculate area (in square kilometers)
        gdf['area_km2'] = gdf.geometry.to_crs('EPSG:3857').area / 1000000
        
        # Simplify geometry slightly to reduce file size while maintaining shape
        print("Optimizing geometry...")
        gdf['geometry'] = gdf.geometry.simplify(tolerance=0.0001, preserve_topology=True)
        
        # Select only the columns we need for the web app
        columns_to_keep = [
            'village_clean', 'village', 'village_code', 'block_name', 
            'subdistric_name', 'district_name', 'area_km2', 'geometry'
        ]
        
        # Only keep columns that exist
        existing_columns = [col for col in columns_to_keep if col in gdf.columns]
        gdf_clean = gdf[existing_columns]
        
        # Sort by district, then subdistric, then village name
        sort_columns = []
        if 'district_name' in gdf_clean.columns:
            sort_columns.append('district_name')
        if 'subdistric_name' in gdf_clean.columns:
            sort_columns.append('subdistric_name')
        sort_columns.append('village_clean')
        
        gdf_clean = gdf_clean.sort_values(sort_columns)
        
        # Convert to GeoJSON
        geojson_str = gdf_clean.to_json()
        geojson_dict = json.loads(geojson_str)
        
        # Write to file with proper formatting
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson_dict, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully converted {len(gdf_clean)} villages to {output_path}")
        print(f"Villages by district:")
        if 'district_name' in gdf_clean.columns:
            district_counts = gdf_clean['district_name'].value_counts()
            for district, count in district_counts.items():
                print(f"  {district}: {count} villages")
        
        # Show some statistics
        total_area = gdf_clean['area_km2'].sum() if 'area_km2' in gdf_clean.columns else 0
        print(f"Total area covered: {total_area:.2f} km²")
        
        return True
        
    except Exception as e:
        print(f"Error converting villages: {str(e)}")
        return False

def convert_all_shapefiles():
    """
    Convert all shapefiles with enhanced village processing
    """
    current_dir = os.getcwd()
    
    # Create data directory
    os.makedirs('data', exist_ok=True)
    
    print("Converting Sundarban shapefiles to GeoJSON with enhanced processing...")
    print("=" * 70)
    
    # Convert districts
    if os.path.exists('Districtt.shp'):
        print("Converting districts...")
        gdf = gpd.read_file('Districtt.shp')
        if gdf.crs != 'EPSG:4326':
            gdf = gdf.to_crs('EPSG:4326')
        
        # Simplify and clean
        gdf['geometry'] = gdf.geometry.simplify(tolerance=0.001, preserve_topology=True)
        geojson = gdf.to_json()
        
        with open('data/districts.geojson', 'w', encoding='utf-8') as f:
            geojson_dict = json.loads(geojson)
            json.dump(geojson_dict, f, indent=2, ensure_ascii=False)
        print(f"Districts converted: {len(gdf)} features")
    
    # Convert SS areas
    if os.path.exists('ss.shp'):
        print("Converting SS areas...")
        gdf = gpd.read_file('ss.shp')
        if gdf.crs != 'EPSG:4326':
            gdf = gdf.to_crs('EPSG:4326')
        
        # Simplify and clean
        gdf['geometry'] = gdf.geometry.simplify(tolerance=0.0005, preserve_topology=True)
        geojson = gdf.to_json()
        
        with open('data/ss.geojson', 'w', encoding='utf-8') as f:
            geojson_dict = json.loads(geojson)
            json.dump(geojson_dict, f, indent=2, ensure_ascii=False)
        print(f"SS areas converted: {len(gdf)} features")
    
    # Convert villages with enhanced processing
    if os.path.exists('village.shp'):
        print("Converting villages with enhanced processing...")
        convert_villages_with_cleaning('village.shp', 'data/villages.geojson')
    
    print("=" * 70)
    print("Conversion complete!")

if __name__ == "__main__":
    try:
        import pandas as pd
        from unidecode import unidecode
    except ImportError:
        print("Installing required packages...")
        import subprocess
        import sys
        
        packages = ['pandas', 'unidecode']
        for package in packages:
            try:
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            except:
                print(f"Failed to install {package}")
    
    convert_all_shapefiles()
