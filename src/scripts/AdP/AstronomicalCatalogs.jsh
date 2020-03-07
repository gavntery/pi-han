/*
   Astronomical Catalogs

   This file is part of ImageSolver and AnnotateImage scripts

   Copyright (C) 2012-2019, Andres del Pozo
   All rights reserved.

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this
      list of conditions and the following disclaimer.
   2. Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
   ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
   (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
   ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

#define NULLMAG 1000

function CatalogRegister()
{
   this.catalogs = new Array();

   this.Register = function( catalog, id )
   {
      this.catalogs.push( { id:          id ? id : catalog.id,
                            name:        catalog.name,
                            constructor: catalog.GetConstructor() } );
   };

   this.FindById = function( catalogId )
   {
      if ( !catalogId )
         return null;
      for ( let i = 0; i < this.catalogs.length; ++i )
         if ( this.catalogs[i].id == catalogId )
            return this.catalogs[i];
      return null;
   };

   this.FindByName = function( catalogName )
   {
      if ( !catalogName )
         return null;
      catalogName = catalogName.trim();
      for ( let i = 0; i < this.catalogs.length; ++i )
         if ( this.catalogs[i].name == catalogName )
            return this.catalogs[i];
      return null;
   };

   this.GetCatalog = function( idx )
   {
      if ( typeof( idx ) == "string" )
      {
         let cat = this.FindById( idx );
         if ( cat === null )
            cat = this.FindByName( idx );
         if ( cat === null )
            return null;
         return eval( cat.constructor );
      }
      else
         return eval( this.catalogs[idx].constructor );
   };
}

var __catalogRegister__ = new CatalogRegister();

// ******************************************************************
// CatalogRecord: Stores the information of a record of a catalog
// ******************************************************************

function CatalogRecord( positionRD, diameter, name, magnitude )
{
   this.posRD = positionRD;  // Position where x=RA(deg) and y=Dec(deg)
   this.diameter = diameter; // Diameter of the object in degrees
   this.name = name;         // Name of the object
   if ( magnitude )
      this.magnitude = magnitude;  // Magnitude of the object. Can be undefined
}

// ******************************************************************
// Catalog: Base class for all catalogs
// ******************************************************************

function Catalog( id, name )
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      id,
      new Array( ["visible", DataType_Boolean] )
   );

   this.id = id;
   this.name = name;
   this.properties = new Array();
   this.objects = null;

   this.GetDefaultLabels = function()
   {
      return [null, null, null, null, this.fields[0], null, null, null];
   };
}

Catalog.prototype = new ObjectWithSettings;

// ******************************************************************
// NullCatalog
// ******************************************************************

function NullCatalog()
{
   this.__base__ = Catalog;
   this.__base__( "null", "null" );

   this.GetConstructor = function()
   {
      return "new NullCatalog()";
   };
};

NullCatalog.prototype = new Catalog;

// ******************************************************************
// VisiblePlanets: Geometric (ICRS) positions of the main planets.
// ******************************************************************

function VisiblePlanets()
{
   this.description = "Visible planets (ICRS/J2000.0 coordinates)";
   this.fields = [ "Name", "Coordinates", "Magnitude" ];

   this.__base__ = Catalog;
   this.__base__( "Planets", "Planets" );

   this.Validate = function()
   {
      return true;
   };

   this.Load = function( metadata )
   {
      this.objects = [];
      if ( metadata.observationTime )
      {
         let planets = ["Me", "Ve", "Ma", "Ju", "Sa", "Ur", "Ne", "Pl"];
         let objectNames = [];
         let E = EphemerisFile.fundamentalEphemerides;
         let P = new Position( metadata.observationTime, "UTC" );
         if ( metadata.obsLongitude != null )
            P.observer = new ObserverPosition( metadata.obsLongitude, metadata.obsLatitude,
                                               (metadata.obsHeight != null) ? metadata.obsHeight : 0 );
         for ( let i = 0; i < planets.length; ++i )
         {
            let H = new EphemerisHandle( E, planets[i], "SSB" );
            let q = P.geometric( H ).toSpherical2Pi();
            let posRD = new Point( Math.deg( q[0] ), Math.deg( q[1] ) );
            let posI = metadata.Convert_RD_I( posRD );
            if ( posI != null && posI.x > 0 && posI.y > 0 && posI.x < metadata.width && posI.y < metadata.height )
            {
               this.objects.push( new CatalogRecord(
                        posRD, 0/*diameter*/, H.objectName, P.apparentVisualMagnitude( H ) ) );
               objectNames.push( H.objectName );
            }
         }

         if ( objectNames.length > 0 )
            console.writeln( "<end><cbr><b>Visible planets</b>: ", objectNames.join( ", " ) );
      }
   };

   this.GetEditControls = function( parent )
   {
      return [];
   };

   this.GetDefaultLabels = function()
   {
      return [null, null, null, null, "Name", null, null, "Magnitude"];
   };

   this.GetConstructor = function()
   {
      return "new VisiblePlanets()";
   };
}

VisiblePlanets.prototype = new Catalog;

__catalogRegister__.Register( new VisiblePlanets );

// ******************************************************************
// VisibleAsteroids: Geometric (ICRS) positions of core asteroids.
// ******************************************************************

function VisibleAsteroids()
{
   this.description = "DE430 asteroids (343 objects, ICRS/J2000.0 coordinates)";
   this.fields = [ "Name", "Coordinates", "Magnitude" ];

   this.__base__ = Catalog;
   this.__base__( "Asteroids", "Asteroids" );

   this.Validate = function()
   {
      return true;
   };

   this.Load = function( metadata )
   {
      this.objects = [];
      if ( metadata.observationTime )
      {
         let asteroids = EphemerisFile.asteroidEphemerides.objects;
         let objectNames = [];
         let E = EphemerisFile.asteroidEphemerides;
         let P = new Position( metadata.observationTime, "UTC" );
         if ( metadata.obsLongitude != null )
            P.observer = new ObserverPosition( metadata.obsLongitude, metadata.obsLatitude,
                                               (metadata.obsHeight != null) ? metadata.obsHeight : 0 );
         for ( let i = 0; i < asteroids.length; ++i )
         {
            let H = new EphemerisHandle( E, asteroids[i][0], "SSB" );
            let q = P.geometric( H ).toSpherical2Pi();
            let posRD = new Point( Math.deg( q[0] ), Math.deg( q[1] ) );
            let posI = metadata.Convert_RD_I( posRD );
            if ( posI != null && posI.x > 0 && posI.y > 0 && posI.x < metadata.width && posI.y < metadata.height )
            {
               let objectName = asteroids[i][0] + ' ' + asteroids[i][2]; // e.g. '1 Ceres'
               this.objects.push( new CatalogRecord(
                        posRD, 0/*diameter*/, objectName, P.apparentVisualMagnitude( H ) ) );
               objectNames.push( objectName );
            }
         }

         if ( objectNames.length > 0 )
            console.writeln( "<end><cbr><b>Visible asteroids</b>: ", objectNames.join( ", " ) );
      }
   };

   this.GetEditControls = function( parent )
   {
      return [];
   };

   this.GetDefaultLabels = function()
   {
      return [null, null, null, null, "Name", null, null, "Magnitude"];
   };

   this.GetConstructor = function()
   {
      return "new VisibleAsteroids()";
   };
}

VisibleAsteroids.prototype = new Catalog;

__catalogRegister__.Register( new VisibleAsteroids );

// ******************************************************************
// NGCICCatalog: Catalog NGC/IC. Uses a file to store the info
// ******************************************************************

function LocalFileCatalog(id, name, filename)
{
   this.__base__ = Catalog;
   this.__base__( id, name );

   this.catalogPath = File.extractDrive( #__FILE__ ) + File.extractDirectory( #__FILE__ );
   if ( this.catalogPath[this.catalogPath.length-1] != '/' )
      this.catalogPath += '/';
   this.catalogPath += filename;

   this.Validate = function()
   {
      if ( !this.catalogPath || this.catalogPath.trim().length == 0 || !File.exists( this.catalogPath ) )
      {
         let badPath = this.catalogPath;
         this.setDefaultCatalogPath();
         if ( badPath && badPath.trim().length > 0 )
            console.warningln( "<end><cbr>** Warning: the NGC/IC catalog file does not exist: " + badPath +
                               "\n** Falling back to the default local catalog file: " + this.catalogPath );
      }
      if ( !File.exists( this.catalogPath ) ) {
         (new MessageBox( "Unable to load NGC/IC catalog file.", TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return false;
      }
      return true;
   };

   this.Load = function( metadata )
   {
      let bounds = metadata.FindImageBounds();

      let file = new File();
      if ( !this.catalogPath )
         return false;
      file.openForReading( this.catalogPath );
      if ( !file.isOpen )
         return false;

      let s = file.read( DataType_ByteArray, file.size );
      file.close();
      let str = s.toString();
      if ( str.indexOf( "\r\n" ) >= 0 )
         this.catalogLines = str.split( "\r\n" );
      else if ( str.indexOf( "\r" ) >= 0 )
         this.catalogLines = str.split( "\r" );
      else
         this.catalogLines = str.split( "\n" );

      this.objects = new Array;
      for ( let i = 1; i < this.catalogLines.length; ++i )
      {
         let fields = this.catalogLines[i].split( "\t" );
         if ( fields.length < 5 )
            continue;
         let posRD = new Point( parseFloat( fields[1] )*15, parseFloat( fields[2] ) );
         let posI = metadata.Convert_RD_I( posRD );

         if ( posI != null
           && posI.x > 0
           && posI.y > 0
           && posI.x < metadata.width
           && posI.y < metadata.height )
         {
            let diameter = parseFloat( fields[3] )/60;
            let name = fields[0];
            let record = new CatalogRecord( posRD, diameter, name );
            this.objects.push( record );
            for ( let f = 2; f < this.fields.length; ++f )
            {
               let col = f + 3;
               if ( fields.length > col )
                  record[this.fields[f]] = fields[col].trim();
            }
         }
      }

      console.writeln( "\n<b>Catalog ", this.name, " size</b>: ", this.objects.length, " of ", this.catalogLines.length-1, " objects" );

      return true;
   };

   this.GetEditControls = function( parent )
   {
      return [];
   };

   this.GetDefaultLabels = function()
   {
      return [null, null, null, null, "Name", null, null, "Common name"];
   };
}

LocalFileCatalog.prototype = new Catalog;

// ******************************************************************
// MessierCatalog: Catalog Messier. Uses a file to store the info
// ******************************************************************

function MessierCatalog()
{
   this.description = "Messier catalog (109 objects)";
   this.fields = [ "Name", "Coordinates", "Common name" ];

   this.__base__ = LocalFileCatalog;
   this.__base__("Messier", "Messier", "messier.txt");

   this.GetConstructor = function()
   {
      return "new MessierCatalog()";
   };
}

MessierCatalog.prototype = new LocalFileCatalog;

__catalogRegister__.Register( new MessierCatalog );

// ******************************************************************
// NGCICCatalog: Catalog NGC/IC. Uses a file to store the info
// ******************************************************************

function NGCICCatalog()
{
   this.description = "NGC and IC catalogs (9900 objects)";
   this.fields = [ "Name", "Coordinates", "Common name" ];

   this.__base__ = LocalFileCatalog;
   this.__base__("NGC-IC", "NGC-IC", "ngc2000.txt");

   this.GetConstructor = function()
   {
      return "new NGCICCatalog()";
   };
}

NGCICCatalog.prototype = new LocalFileCatalog;

__catalogRegister__.Register( new NGCICCatalog );

// ******************************************************************
// NamedStarsCatalog
// ******************************************************************

function NamedStarsCatalog()
{
   this.description = "Named stars catalog (3685 objects)";
   this.fields = [ "Name", "Coordinates", "HD", "HIP", "Common name" ];

   this.__base__ = LocalFileCatalog;
   this.__base__("NamedStars", "NamedStars", "namedStars.txt");

   this.GetConstructor = function()
   {
      return "new NamedStarsCatalog()";
   };

   this.GetDefaultLabels = function()
   {
      return [null, null, null, null, "Common name", null, null, null];
   };
}

NamedStarsCatalog.prototype = new LocalFileCatalog;

__catalogRegister__.Register( new NamedStarsCatalog );


// ******************************************************************
// VizierCache: Cache of Vizier queries
// ******************************************************************

function VizierCache()
{
   "use strict";
   this.queries = [];
   this.maxSize = 20;

   this.Add = function( center, fov, id, queryResult )
   {
      this.queries.push( {center: center, fov: fov, id: id, queryResult: queryResult} );
      if ( this.queries.length > this.maxSize )
         this.queries = this.queries.slice( 1 );
   };

   this.Get = function( center, fov, id )
   {
      for ( let i = 0; i < this.queries.length; ++i )
      {
         let q = this.queries[i];
         if ( q.id == id )
         {
            let dist = ImageMetadata.Distance( center, q.center );
            if ( dist + fov < q.fov )
            {
               this.queries.splice( i, 1 );
               this.queries.push( q );
               return q.queryResult;
            }
         }
      }
      return null;
   };

   this.Clear = function()
   {
      this.queries = [];
   };
}

var __vizier_cache__;

// ******************************************************************
// VizierCatalog: Base class for all the catalogs downloaded from
//                VizieR servers
// ******************************************************************

function VizierCatalog( id, name )
{
   this.__base__ = Catalog;
   this.__base__( id, name );

   this.UrlBuilder = null;
   this.ParseRecord = null;
   this.position = null;
   this.catalogMagnitude = null;
   this.magMin = NULLMAG;
   this.magMax = NULLMAG;
   this.epoch = null;
   this.maxRecords = 200000;
   this.queryMargin = 1.2;
   this.maxFov = null;

   this.Load = function( metadata, mirrorServer )
   {
      let center = new Point( metadata.ra, metadata.dec );
      let fov = this.CalculateFOV( metadata );

      if ( metadata.observationTime != null )
      {
         this.position = new Position( metadata.observationTime, "UTC" );
         this.epoch = (metadata.observationTime - Math.complexTimeToJD( 2000, 1, 1 ))/365.25 + 2000;
      }
      else
         this.epoch = null;

      let cacheid = this.GetCacheDescriptor();

      if ( __vizier_cache__ == undefined )
         __vizier_cache__ = new VizierCache();

      this.objects = __vizier_cache__.Get( center, fov, cacheid );
      if ( this.objects != null )
      {
         console.writeln( "Catalog ", this.name, " already loaded." );
      }
      else
      {
         // Increase the size of the query by a small factor in order to be able to use it in similar images
         fov = Math.min( 180, fov*this.queryMargin );

         if ( !this.DoLoad( center, metadata.observationTime, fov, mirrorServer ) )
         {
            this.objects = null;
            return;
         }
         let actual_fov = 0;
         for ( let i = 0; i < this.objects.length; ++i )
         {
            let dist = ImageMetadata.Distance( center, this.objects[i].posRD );
            if ( dist > actual_fov )
               actual_fov = dist;
         }
         console.writeln( format( "FOV:%.3f actual:%.3f", fov, actual_fov ) );

         __vizier_cache__.Add( center, actual_fov, cacheid, this.objects );
      }

      if ( metadata.ref_I_G )
      {
         let insideObjects = 0;
         for ( let s = 0; s < this.objects.length; ++s )
            if ( this.objects[s] )
            {
               let posI = metadata.Convert_RD_I( this.objects[s].posRD );
               if ( posI
                 && posI.x > 0
                 && posI.y > 0
                 && posI.x < metadata.width
                 && posI.y < metadata.height ) insideObjects++;
            }
         console.writeln( "<b>Catalog ", this.name, " size</b>: ", insideObjects, " objects inside the image\n" );
      }
      else
         console.writeln( "<b>Catalog ", this.name, " size</b>: ", this.objects.length, " objects\n" );
   };

   this.DoLoad = function( center, epoch, fov, mirrorServer )
   {
      if ( epoch != null )
         this.epoch = (epoch - Math.complexTimeToJD(2000, 1, 1))/365.25 + 2000;
      else
         this.epoch = null;

      this.objects = new Array;
      this.bounds = null;

      let url = this.UrlBuilder( center, fov, mirrorServer );

      let outputFileName = File.systemTempDirectory + "/VizierQueryResult.tsv";

      console.writeln( "<end>\n<b>Downloading Vizier data</b>:" );
      console.writeln( "<raw>" + url + "</raw>" );
      let consoleAbort = console.abortEnabled
      console.abortEnabled = true;
      console.show();

      // Send request
      let download = new FileDownload( url, outputFileName );
      try
      {
         download.perform();
      }
      catch ( e )
      {
         (new MessageBox( e.toString(), TITLE, StdIcon_Error, StdButton_Ok )).execute();
      }

      console.abortEnabled = consoleAbort;
      //console.hide();

      if ( !download.ok )
         return false;

      let file = File.openFileForReading( outputFileName );
      if ( !file.isOpen )
         return false;
      let s = file.read( DataType_ByteArray, file.size );
      file.close();
      let catalogLines = s.toString().split( "\n" );

      if ( catalogLines.length < 20 )
      {
         // Vizier always returns at least 20 comment lines
         console.criticalln( "There has been an unknown error in the catalog server: Too short response" );
         return false;
      }

      let querySize = 0;
      try
      {
         for ( let i = 0; i < catalogLines.length; ++i )
         {
            let line = catalogLines[i];
            if ( line.length == 0 || line.charAt(0) == "#" ) //comment
               continue;
            let tokens = line.split( "|" );
            let object = this.ParseRecord( tokens, this.position );
            if ( object
              && object.posRD.x >= 0
              && object.posRD.x <= 360
              && object.posRD.y >= -90
              && object.posRD.y <= 90 )
            {
               this.objects.push( object );
               if ( this.bounds )
                  this.bounds = this.bounds.union( object.posRD.x, object.posRD.y, object.posRD.x, object.posRD.y );
               else
                  this.bounds = new Rect( object.posRD.x, object.posRD.y, object.posRD.x, object.posRD.y );
            }
            querySize++;
            // processEvents();
            // if ( console.abortRequested )
            //    throw "Process aborted";
         }
      }
      catch ( e )
      {
         new MessageBox( e.toString(), TITLE, StdIcon_Error, StdButton_Ok ).execute();
         return false;
      }
      //if ( this.bounds )
      //   console.writeln( format( "Bounds: %f;%f;%f;%f / %f;%f;%f;%f", this.bounds.x0, this.bounds.x1, this.bounds.y0, this.bounds.y1,
      //      this.bounds.x0 - center.x, this.bounds.x1 - center.x, this.bounds.y0 - center.y, this.bounds.y1 - center.y ) );
      if ( this.PostProcessObjects )
         this.PostProcessObjects( this.objects );

      if ( querySize > this.maxRecords - 100 )
         console.warningln( "<end><cbr>** Warning: The server has returned an incomplete query. Please reduce the value of the magnitude filter." );

      return true;
   };

   this.GetCacheDescriptor = function()
   {
      let filter = this.magnitudeFilter ? this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax ) : "";
      if ( this.epoch == null )
         return format( "%ls&%ls", this.name, filter );
      return format( "%ls&e=%.2f%ls", this.name, this.epoch, filter );
   };

   this.CalculateFOV = function( metadata )
   {
      let fov = Math.max( metadata.width, metadata.height )*metadata.resolution;

      if ( metadata.ref_I_G && fov < 100 )
      {
         let fov1 = metadata.DistanceI( new Point( metadata.width/2, metadata.height/2 ),
                                        new Point( 0, 0 ) );
         let fov2 = metadata.DistanceI( new Point( metadata.width/2, metadata.height/2 ),
                                        new Point( metadata.width, 0 ) );
         let fov3 = metadata.DistanceI( new Point( metadata.width/2, metadata.height/2 ),
                                        new Point( 0, metadata.height ) );
         let fov4 = metadata.DistanceI( new Point( metadata.width/2, metadata.height/2 ),
                                        new Point( metadata.width, metadata.height ) );
         if ( !fov1 || !fov2 || !fov3 || !fov4 )
            return 180;
         return Math.max( fov1, fov2, fov3, fov4 );
      }

      return fov;
   };

   this.CreateMagFilter = function( field, min, max )
   {
      if ( min != NULLMAG && max != NULLMAG )
         return "&" + field + format( "=%g..%g", min, max );
      if ( max != NULLMAG )
         return "&" + field + format( "=<%g", max );
      if ( min != NULLMAG )
         return "&" + field + format( "=>%g", min );
      return "";
   };

   this.Validate = function()
   {
      if ( this.catalogMagnitude != null && this.magMin != NULLMAG && this.magMax != NULLMAG )
         if ( this.magMin > this.magMax )
         {
            (new MessageBox( "Invalid magnitude filter: The minimum cannot be greater than the maximum", TITLE, StdIcon_Error, StdButton_Ok )).execute();
            return false;
         }
      return true;
   };

   this.GetEditControls = function( parent )
   {
      if ( this.filters != null )
      {
         let magnitude_Label = new Label( parent );
         magnitude_Label.text = "Magnitude filter:";
         magnitude_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
         magnitude_Label.minWidth = parent.labelWidth1;

         let filter_combo = null;
         if( this.filters.length > 1 )
         {
            filter_combo = new ComboBox( parent );
            filter_combo.editEnabled = false;
            filter_combo.toolTip = "<p>Filter used in the magnitude test.</p>";
            filter_combo.onItemSelected = function()
            {
               this.dialog.activeFrame.object.catalog.magnitudeFilter = filter_combo.itemText( filter_combo.currentItem );
               this.dialog.activeFrame.object.catalog.bounds = null;
            };
            for ( let f = 0; f < this.filters.length; ++f )
            {
               filter_combo.addItem( this.filters[f] );
               if ( this.filters[f] == this.magnitudeFilter )
                  filter_combo.currentItem = filter_combo.numberOfItems-1;
            }
         }

         let magnitudeMin_Edit = new Edit( parent );
         magnitudeMin_Edit.setFixedWidth( parent.editWidth );
         if ( this.magMin != NULLMAG )
            magnitudeMin_Edit.text = format( "%g", this.magMin );
         magnitudeMin_Edit.toolTip = "<p>Draw only objects with a magnitude dimmer than this value.<br/>" +
            "It can be empty.</p>";
         magnitudeMin_Edit.onTextUpdated = function( value )
         {
            if ( value != null && value.trim().length > 0 )
               this.dialog.activeFrame.object.catalog.magMin = parseFloat( value );
            else
               this.dialog.activeFrame.object.catalog.magMin = NULLMAG;
            this.dialog.activeFrame.object.catalog.bounds = null;
         };

         let magnitudeMax_Edit = new Edit( parent );
         magnitudeMax_Edit.setFixedWidth( parent.editWidth );
         if ( this.magMax != NULLMAG )
            magnitudeMax_Edit.text = format( "%g", this.magMax );
         magnitudeMax_Edit.toolTip = "<p>Draw only objects with a magnitude brighter than this value.<br />" +
            "It can be empty.</p>";
         magnitudeMax_Edit.onTextUpdated = function( value )
         {
            if ( value != null && value.trim().length>0 )
               this.dialog.activeFrame.object.catalog.magMax = parseFloat( value );
            else
               this.dialog.activeFrame.object.catalog.magMax = NULLMAG;
            this.dialog.activeFrame.object.catalog.bounds = null;
         };

         let magnitudeSeparator_Label = new Label( parent );
         magnitudeSeparator_Label.text = " - ";

         let magnitudeSizer = new HorizontalSizer;
         magnitudeSizer.scaledSpacing = 4;
         magnitudeSizer.add( magnitude_Label );
         if ( filter_combo )
            magnitudeSizer.add( filter_combo );
         magnitudeSizer.add( magnitudeMin_Edit );
         magnitudeSizer.add( magnitudeSeparator_Label );
         magnitudeSizer.add( magnitudeMax_Edit );
         magnitudeSizer.addStretch();
         magnitudeSizer.setAlignment( magnitudeSeparator_Label, Align_Center );

         return [ magnitudeSizer ];
      }
      else
         return [];
   };

   // Removes objects that are in the same position with the given tolerance
   this.RemoveDuplicates = function( objects, tolerance )
   {
      objects.sort(  function( a, b )
                     {
                        return (a.posRD.y < b.posRD.y) ? -1 : ((a.posRD.y > b.posRD.y) ? 1 : 0);
                     } );

      let duplicate = 0;
      for ( let i = 0; i < objects.length; ++i )
      {
         let a = objects[i];
         let posRD = a.posRD;
         let cosy = DMath.cos( posRD.y );
         for ( let j = i + 1; j < objects.length; )
         {
            let b = objects[j];
            let dy = Math.abs( b.posRD.y - posRD.y );
            if ( dy > tolerance )
               break;
            let dx = Math.abs( b.posRD.x - posRD.x )*cosy;
            if ( dx < tolerance )
            {
               if ( a.magnitude > b.magnitude )
                  objects[i] = b;
               objects.splice( j, 1 );
               duplicate++;
            }
            else
               j++;
         }
      }
      console.writeln( format( "Removed %d duplicate objects", duplicate ) );
   };
}

VizierCatalog.prototype = new Catalog;

VizierCatalog.mirrors = [
   {name:"VizieR (vizier.u-strasbg.fr) Strasbourg, France", address:"http://vizier.u-strasbg.fr/"},
   {name:"CDS (cdsarc.u-strasbg.fr) Strasbourg, France", address:"http://cdsarc.u-strasbg.fr/"},
   {name:"ADAC (vizier.nao.ac.jp) Tokyo, Japan", address:"http://vizier.nao.ac.jp/"},
   {name:"CADC (vizier.hia.nrc.ca) Victoria, Canada ", address:"http://vizier.hia.nrc.ca/"},
   {name:"Cambridge (vizier.ast.cam.ac.uk) UK", address:"http://vizier.ast.cam.ac.uk/"},
   {name:"IUCAA (vizier.iucaa.ernet.in) Pune, India", address:"http://vizier.iucaa.ernet.in/"},
   {name:"NAOC (VizieR.china-vo.org) Beijing, China", address:"http://VizieR.china-vo.org/"},
   {name:"INASAN (vizier.inasan.ru) Moscow, Russia", address:"http://vizier.inasan.ru/"},
   {name:"CFA Harvard (vizier.cfa.harvard.edu) Cambridge, USA", address:"http://vizier.cfa.harvard.edu/"},
   {name:"JAC (www.ukirt.hawaii.edu) Hilo, Hawaii, USA", address:"http://www.ukirt.hawaii.edu/"},
   {name:"SAAO (viziersaao.chpc.ac.za) SAAO, South Africa", address:"http://viziersaao.chpc.ac.za/"}
];

// ******************************************************************
// HR_Catalog
// ******************************************************************

function HR_Catalog()
{
   this.description = "Bright Star Catalog, 5th ed. (Hoffleit+, 9110 stars)";

   this.__base__ = VizierCatalog;
   this.__base__( "BrightStars", "Bright Stars" );

   this.catalogMagnitude = 7;
   this.magMin = NULLMAG;
   this.magMax = 7;
   this.fields = [ "Name", "Coordinates", "HR", "HD", "DM", "SAO", "Vmag", "B-V", "U-B", "R-I", "SpType" ];

   this.properties.push( ["magMin",DataType_Double] );
   this.properties.push( ["magMax",DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = [ "Vmag"];
   this.magnitudeFilter = "Vmag";

   this.GetConstructor = function()
   {
      return "new HR_Catalog()";
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=V/50/catalog&-c=" +
         format( "%f %f",center.x, center.y ) +
         "&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         "&-out.add=_RAJ,_DEJ&-out=pmRA&-out=pmDE&-out=Name&-out=HR&-out=HD&-out=DM&-out=SAO" +
         "&-out=Vmag&-out=B-V&-out=U-B&-out=R-I&-out=SpType" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax );
   };

   this.ParseRecord = function( tokens, position )
   {
      if ( tokens.length >= 14 && parseFloat( tokens[0] ) > 0 )
      {
         let x = parseFloat( tokens[0] );
         let y = parseFloat( tokens[1] );
         if ( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         if ( position != null )
         {
            let pmX = parseFloat( tokens[2] ) * 1000 * Math.cos( Math.rad( y ) ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[3] ) * 1000; // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let name = tokens[4].trim();
         if ( name == null || name.length == 0 )
            name = "HR"+tokens[5].trim();
         let record = new CatalogRecord( new Point( x, y ), 0, name, parseFloat(tokens[9]) );
         record["HR"] = "HR"+tokens[5].trim();
         record["HD"] = "HD"+tokens[6].trim();
         record["DM"] = tokens[7].trim();
         record["SAO"] = "SAO"+tokens[8].trim();
         record["Vmag"] = tokens[9].trim();
         record["B-V"] = tokens[10].trim();
         record["U-B"] = tokens[11].trim();
         record["R-I"] = tokens[12].trim();
         record["SpType"] = tokens[13].trim();
         if ( record[this.magnitudeFilter] )
            record.magnitude = parseFloat(record[this.magnitudeFilter]);

         return record;
      }

      return null;
   };
}

HR_Catalog.prototype = new VizierCatalog;

__catalogRegister__.Register( new HR_Catalog );


// ******************************************************************
// HipparcosCatalog
// ******************************************************************

function HipparcosCatalog()
{
   this.description = "Hipparcos Main catalog (118,218 stars)";

   this.__base__ = VizierCatalog;
   this.__base__( "Hipparcos", "Hipparcos" );

   this.catalogMagnitude = 14;

   this.fields = [ "Name", "Coordinates", "Magnitude", "BT magnitude", "VT magnitude", "B-V color", "V-I index", "Spectral type", "Parallax" ];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = [ "VTmag", "BTmag" ];
   this.magnitudeFilter = "VTmag";

   this.GetConstructor = function()
   {
      return "new HipparcosCatalog()";
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=I/239/hip_main&-c=" +
         format( "%f %f", center.x, center.y ) +
         "&-c.eq=J2000&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         format( "&-out.max=%d", this.maxRecords ) +
         "&-out.add=_RAJ,_DEJ&-out=HIP&-out=Vmag&-out=Plx&-out=pmRA&-out=pmDE&-out=BTmag&-out=VTmag&-out=B-V&-out=V-I&-out=SpType" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax );
   };

   this.ParseRecord = function( tokens, position )
   {
      if ( tokens.length >= 12 && parseFloat( tokens[0] ) > 0 )
      {
         let x = parseFloat( tokens[0] );
         let y = parseFloat( tokens[1] );
         if( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         if ( position != null )
         {
            let pmX = parseFloat( tokens[5] ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[6] ); // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let name = "HIP" + tokens[2].trim();
         let record = new CatalogRecord( new Point( x, y ), 0, name, parseFloat( tokens[3] ) );
         record["BT magnitude"]=tokens[7].trim();
         record["VT magnitude"]=tokens[8].trim();
         record["B-V color"]=tokens[9].trim();
         record["V-I index"]=tokens[10].trim();
         record["Spectral type"]=tokens[11].trim();
         record["Parallax"]=tokens[4].trim();
         if ( record[this.magnitudeFilter] )
            record.magnitude = parseFloat( record[this.magnitudeFilter] );

         return record;
      }

      return null;
   };
}

HipparcosCatalog.prototype = new VizierCatalog;

__catalogRegister__.Register( new HipparcosCatalog );

// ******************************************************************
// TychoCatalog
// ******************************************************************

function TychoCatalog()
{
   this.description = "Tycho-2 catalog (2,539,913 stars)";

   this.__base__ = VizierCatalog;
   this.__base__( "TYCHO-2", "TYCHO-2" );

   this.catalogMagnitude = 16;

   this.fields = [ "Name", "Coordinates", "Magnitude", "VTmag", "BTmag", "HIP", "Vmag", "Bmag", "B-V index" ];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = [ "VTmag", "BTmag" ];
   this.magnitudeFilter = "VTmag";

   this.GetConstructor = function()
   {
      return "new TychoCatalog()";
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=I/259/tyc2&-c=" +
         format( "%f %f", center.x, center.y ) +
         "&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         format( "&-out.max=%d", this.maxRecords ) +
         "&-out=TYC1&-out=TYC2&-out=TYC3&-out=RAmdeg&-out=DEmdeg&-out=pmRA&-out=pmDE&-out=VTmag&-out=BTmag&-out=HIP" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax );
   };

   this.ParseRecord = function( tokens, position )
   {
      if ( tokens.length >= 5 && parseFloat( tokens[0] ) > 0 )
      {
         let x = parseFloat( tokens[3] );
         let y = parseFloat( tokens[4] );
         if( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         if ( position != null )
         {
            let pmX = parseFloat( tokens[5] ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[6] ); // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let name = "TYC" + tokens[0].trim() + "-" + tokens[1].trim() + "-" + tokens[2].trim();
         let record = new CatalogRecord( new Point( x, y ), 0, name, parseFloat( tokens[7] ) );
         record.VTmag = tokens[7];
         record.BTmag = tokens[8];
         if ( tokens[9] )
            record.HIP = "HIP" + tokens[9].trim();
         if ( tokens[7].trim().length > 0 && tokens[8].trim().length > 0 )
         {
            let VT = parseFloat( tokens[7] );
            let BT = parseFloat( tokens[8] );
            let V = VT-0.090*(BT-VT);
            let BV = 0.850*(BT-VT);
            let B = BV+V;
            record.Vmag = format( "%.3f", V );
            record.Bmag = format( "%.3f", B );
            record["B-V index"] = format( "%.3f", BV );
         }
         if ( record[this.magnitudeFilter] )
            record.magnitude = parseFloat( record[this.magnitudeFilter] );

         return record;
      }

      return null;
   };
}

TychoCatalog.prototype=new VizierCatalog;

__catalogRegister__.Register( new TychoCatalog );

// ******************************************************************
// PGCCatalog
// ******************************************************************

function PGCCatalog()
{
   this.description = "PGC HYPERLEDA I catalog of galaxies (983,261 galaxies)";

   this.__base__ = VizierCatalog;
   this.__base__( "PGC", "PGC" );

   this.fields = [ "Name", "Coordinates" ];

   this.GetConstructor = function()
   {
      return "new PGCCatalog()";
   };

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=VII/237/pgc&-c=" +
         format( "%f %f", center.x, center.y ) +
         "&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         format( "&-out.max=%d", this.maxRecords ) +
         "&-out=PGC&-out=RAJ2000&-out=DEJ2000&-out=logD25";
   };

   this.ParseRecord = function( tokens )
   {
      if ( tokens.length >= 4 && parseFloat( tokens[0] ) > 0)
      {
         let x = DMSangle.FromString(tokens[1]).GetValue()*360/24;
         let y = DMSangle.FromString(tokens[2]).GetValue();
         if( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;
         let diameter = parseFloat( tokens[3] )/60*2;
         //let diameter = Math.exp( parseFloat( tokens[3] ) )/60;
         return new CatalogRecord( new Point( x, y ), diameter, "PGC" + tokens[0].trim() );
      }

      return null;
   };
}

PGCCatalog.prototype=new VizierCatalog;

__catalogRegister__.Register( new PGCCatalog );

// ******************************************************************
// PPMXCatalog
// ******************************************************************

function PPMXCatalog()
{
   this.description = "PPMX catalog";

   this.__base__ = VizierCatalog;
   this.__base__( "PPMX", "PPMX" );

   this.catalogMagnitude = 15;
   this.magMin = NULLMAG;
   this.magMax = 15;
   this.fields = [ "Name", "Coordinates", "Cmag", "Rmag", "Bmag", "Vmag", "Jmag", "Hmag", "Kmag" ];

   this.properties.push( ["magMin",DataType_Double] );
   this.properties.push( ["magMax",DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = [ "Cmag", "Rmag", "Bmag", "Vmag", "Jmag", "Hmag", "Kmag" ];
   this.magnitudeFilter = "Vmag";
   this.maxFov = 60;

   this.GetConstructor = function()
   {
      return "new PPMXCatalog()";
   };

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=I/312/sample&-c=" +
         format( "%f %f", center.x, center.y ) +
         //"&-c.r=" + format( "%f",fov ) +
         "&-c.bd=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         format( "&-out.max=%d", this.maxRecords ) +
         "&-out=PPMX&-out=RAJ2000&-out=DEJ2000&-out=pmRA&-out=pmDE&-out=Cmag&-out=Rmag&-out=Bmag&-out=Vmag&-out=Jmag&-out=Hmag&-out=Kmag" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax );
   };

   this.ParseRecord = function( tokens, position )
   {
      if ( tokens.length>=12 && parseFloat( tokens[1] )>0 ) {
         let x=parseFloat( tokens[1] );
         let y=parseFloat( tokens[2] );
         if( !(x>=0 && x<=360 && y>=-90 && y<=90) )
            return null;

         if ( position != null )
         {
            let pmX = parseFloat( tokens[3] ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[4] ); // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let record = new CatalogRecord( new Point( x, y ), 0, tokens[0].trim(), parseFloat(tokens[6]) );
         record["Cmag"] = tokens[5].trim();
         record["Rmag"] = tokens[6].trim();
         record["Bmag"] = tokens[7].trim();
         record["Vmag"] = tokens[8].trim();
         record["Jmag"] = tokens[9].trim();
         record["Hmag"] = tokens[10].trim();
         record["Kmag"] = tokens[11].trim();
         if ( record[this.magnitudeFilter] )
            record.magnitude = parseFloat( record[this.magnitudeFilter] );

         return record;
      }

      return null;
   };
}

PPMXCatalog.prototype=new VizierCatalog;

__catalogRegister__.Register( new PPMXCatalog );

// ******************************************************************
// PPMXLCatalog
// ******************************************************************

function PPMXLCatalog()
{
   this.description = "PPMXL catalog (910,469,430 objects)";

   this.__base__ = VizierCatalog;
   this.__base__( "PPMXL", "PPMXL" );

   this.catalogMagnitude = 20;
   this.magMin = NULLMAG;
   this.magMax = 15;
   this.fields = [ "Name", "Coordinates", "Jmag", "Hmag", "Kmag", "b1mag", "b2mag", "r1mag", "r2mag", "imag" ];

   this.properties.push( ["magMin",DataType_Double] );
   this.properties.push( ["magMax",DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = [ "Jmag", "Hmag", "Kmag", "b1mag", "b2mag", "r1mag", "r2mag", "imag" ];
   this.magnitudeFilter = "r1mag";
   this.maxFov = 45;

   this.GetConstructor = function()
   {
      return "new PPMXLCatalog()";
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=I/317&-c=" +
         format( "%f %f", center.x, center.y ) +
         "&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         format( "&-out.max=%d", this.maxRecords ) +
         "&-out=PPMXL&-out=RAJ2000&-out=DEJ2000&-out=pmRA&-out=pmDE" +
         "&-out=Jmag&-out=Hmag&-out=Kmag&-out=b1mag&-out=b2mag&-out=r1mag&-out=r2mag&-out=imag" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax );
   };

   this.ParseRecord = function( tokens, position )
   {
      if ( tokens.length >= 13 && parseFloat( tokens[0] ) > 0 )
      {
         let x = parseFloat( tokens[1] );
         let y = parseFloat( tokens[2] );
         if( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         if ( position != null )
         {
            let pmX = parseFloat( tokens[3] ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[4] ); // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let record = new CatalogRecord( new Point( x, y ), 0, tokens[0].trim(), parseFloat( tokens[10] ) );
         record.Jmag = tokens[5].trim();
         record.Hmag = tokens[6].trim();
         record.Kmag = tokens[7].trim();
         record.b1mag = tokens[8].trim();
         record.b2mag = tokens[9].trim();
         record.r1mag = tokens[10].trim();
         record.r2mag = tokens[11].trim();
         record.imag = tokens[12].trim();
         if ( record[this.magnitudeFilter] )
            record.magnitude = parseFloat( record[this.magnitudeFilter] );

         return record;
      }

      return null;
   }
}

PPMXLCatalog.prototype=new VizierCatalog;

__catalogRegister__.Register( new PPMXLCatalog );

// ******************************************************************
// USNOB1Catalog
// ******************************************************************

function USNOB1Catalog()
{
   this.description = "USNO-B1.0 catalog (1,045,175,762 objects)";

   this.__base__ = VizierCatalog;
   this.__base__( "USNO-B1", "USNO-B1" );

   this.catalogMagnitude = 20;
   this.magMax = 15;
   this.fields = [ "Name", "Coordinates", "B1mag", "B2mag", "R1mag", "R2mag", "Imag" ];

   this.properties.push( ["magMin",DataType_Double] );
   this.properties.push( ["magMax",DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = [ "B1mag", "B2mag", "R1mag", "R2mag", "Imag" ];
   this.magnitudeFilter = "R1mag";
   this.maxFov = 45;

   this.GetConstructor = function()
   {
      return "new USNOB1Catalog()";
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=I/284/out&-c=" +
         format( "%f %f", center.x, center.y ) +
         "&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         format( "&-out.max=%d", this.maxRecords ) +
         "&-out=USNO-B1.0&-out=RAJ2000&-out=DEJ2000&-out=pmRA&-out=pmDE" +
         "&-out=B1mag&-out=B2mag&-out=R1mag&-out=R2mag&-out=Imag" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax );
   };

   this.ParseRecord = function( tokens, position )
   {
      if ( tokens.length >= 8 && parseFloat( tokens[0] ) > 0 )
      {
         let x = parseFloat( tokens[1] );
         let y = parseFloat( tokens[2] );
         if ( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         if ( position != null )
         {
            let pmX = parseFloat( tokens[3] ) * Math.cos( Math.rad( y ) ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[4] ); // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let record = new CatalogRecord( new Point( x, y ), 0, "USNO "+tokens[0].trim(), parseFloat( tokens[7] ) );
         record.B1mag = tokens[5].trim();
         record.B2mag = tokens[6].trim();
         record.R1mag = tokens[7].trim();
         if ( tokens.length > 8 ) record.R2mag = tokens[8].trim();
         if ( tokens.length > 9 ) record.Imag = tokens[9].trim();
         if ( record[this.magnitudeFilter] )
            record.magnitude = parseFloat( record[this.magnitudeFilter] );

         return record;
      }

      return null;
   };
}

USNOB1Catalog.prototype=new VizierCatalog;

__catalogRegister__.Register( new USNOB1Catalog );

// ******************************************************************
// UCAC3Catalog
// ******************************************************************

function UCAC3Catalog()
{
   this.description = "UCAC3 catalog (100,765,502 objects)";

   this.__base__ = VizierCatalog;
   this.__base__( "UCAC3", "UCAC3" );

   this.catalogMagnitude = 15;
   this.magMax = 15;
   this.fields = [ "Name", "Coordinates", "Magnitude", "f.mag", "a.mag", "Jmag", "Hmag", "Kmag", "Bmag", "R2mag", "Imag" ];

   this.properties.push( ["magMin",DataType_Double] );
   this.properties.push( ["magMax",DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString] );

   this.filters = [ "f.mag", "a.mag", "Jmag", "Hmag", "Kmag", "Bmag", "R2mag", "Imag" ];
   this.magnitudeFilter = "f.mag";
   this.maxFov = 45;

   this.GetConstructor = function()
   {
      return "new UCAC3Catalog()";
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=I/315/out&-c=" +
         format( "%f %f", center.x, center.y ) +
         "&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         format( "&-out.max=%d", this.maxRecords ) +
         "&-out=3UC&-out=RAJ2000&-out=DEJ2000&-out=pmRA&-out=pmDE" +
         "&-out=f.mag&-out=a.mag&-out=Jmag&-out=Hmag&-out=Kmag&-out=Bmag&-out=R2mag&-out=Imag" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax );
   };

   this.ParseRecord = function( tokens, position )
   {
      if ( tokens.length >= 6 && parseFloat( tokens[0] ) > 0)
      {
         let x = parseFloat( tokens[1] );
         let y = parseFloat( tokens[2] );
         if ( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         if ( position != null )
         {
            let pmX = parseFloat( tokens[3] ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[4] ); // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let record = new CatalogRecord( new Point( x, y ), 0, "3UCAC" + tokens[0].trim(), parseFloat( tokens[5] ) );
         record["f.mag"] = tokens[5].trim();
         if ( tokens.length >  6 ) record["a.mag"] = tokens[6].trim();
         if ( tokens.length >  7 ) record.Jmag = tokens[7].trim();
         if ( tokens.length >  8 ) record.Hmag = tokens[8].trim();
         if ( tokens.length >  9 ) record.Kmag = tokens[9].trim();
         if ( tokens.length > 10 ) record.Bmag = tokens[10].trim();
         if ( tokens.length > 11 ) record.R2mag = tokens[11].trim();
         if ( tokens.length > 12 ) record.Imag = tokens[12].trim();
         if ( record[this.magnitudeFilter] )
            record.magnitude = parseFloat( record[this.magnitudeFilter] );

         return record;
      }

      return null;
   };
}

UCAC3Catalog.prototype=new VizierCatalog;

__catalogRegister__.Register( new UCAC3Catalog );

// ******************************************************************
// VdBCatalog
// ******************************************************************

function VdBCatalog()
{
   this.description = "Catalog of Reflection Nebulae - Van den Bergh (159 nebulaes)";

   this.__base__ = VizierCatalog;
   this.__base__( "VdB", "VdB" );

   this.catalogMagnitude = 10.5;

   this.fields = [ "Name", "Coordinates", "Magnitude", "DM code", "Type", "Surface bright.", "Spectral type" ];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString] );

   this.filters = [ "Vmag" ];
   this.magnitudeFilter = "Vmag";

   this.GetConstructor = function()
   {
      return "new VdBCatalog()";
   };

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=VII/21/catalog&-c=" +
         format( "%f %f", center.x, center.y ) +
         "&-c.eq=J2000&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         format( "&-out.max=%d", this.maxRecords ) +
         "&-out=_RA&-out=_DE&-out=VdB&-out=DM&-out=Vmag&-out=SpType&-out=Type&-out=SurfBr&-out=BRadMax&-out=RRadMax" +
         this.CreateMagFilter( "Vmag", this.magMin, this.magMax );
   };

   this.ParseRecord = function( tokens )
   {
      if ( tokens.length >= 10 && parseFloat( tokens[0] ) > 0 )
      {
         let x = parseFloat( tokens[0] );
         let y = parseFloat( tokens[1] );
         if ( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         let name = "VdB" + tokens[2].trim();
         let radBlue =  parseFloat( tokens[8] );
         let radRed =  parseFloat( tokens[9] );
         let radius = 0; // In arcmin
         if ( radBlue && radRed )
            radius = Math.max( radBlue, radRed );
         else if ( radRed )
            radius = radRed;
         else if ( radBlue )
            radius = radBlue;
         let record = new CatalogRecord( new Point( x, y ), radius*2/60, name, parseFloat( tokens[4] ) );
         record["DM code"] = tokens[3].trim();
         record["Type"] = tokens[6].trim();
         record["Surface brightness"] = tokens[7].trim();
         record["Spectral type"] = tokens[5].trim();

         return record;
      }

      return null;
   };
}

VdBCatalog.prototype = new VizierCatalog;

__catalogRegister__.Register( new VdBCatalog );

// ******************************************************************
// SharplessCatalog
// ******************************************************************

function SharplessCatalog()
{
   this.description = "Catalog of HII Regions - Sharpless (313 nebulaes)";

   this.__base__ = VizierCatalog;
   this.__base__( "Sharpless", "Sharpless" );

   this.fields = [ "Name", "Coordinates" ];

   this.GetConstructor = function()
   {
      return "new SharplessCatalog()";
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=VII/20/catalog&-c=" +
         format( "%f %f", center.x, center.y ) +
         "&-c.eq=J2000&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         "&-out.add=_RAJ,_DEJ&-out=Sh2&-out=Diam";
   };

   this.ParseRecord = function( tokens )
   {
      if ( tokens.length >= 4 && parseFloat( tokens[0] ) > 0 )
      {
         let x = parseFloat( tokens[0] );
         let y = parseFloat( tokens[1] );
         if( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         let name = "Sh2-" + tokens[2].trim();
         let diam =  parseFloat( tokens[3] );
         if ( !diam )
            diam = 0;
         let record = new CatalogRecord( new Point( x, y ), diam/60, name );

         return record;
      }

      return null;
   };
}

SharplessCatalog.prototype = new VizierCatalog;

__catalogRegister__.Register( new SharplessCatalog );

// ******************************************************************
// BarnardCatalog
// ******************************************************************

function BarnardCatalog()
{
   this.description = "Barnard's Catalog of Dark Objects in the Sky (349 objects)";

   this.__base__ = VizierCatalog;
   this.__base__( "Barnard", "Barnard" );

   this.fields = [ "Name", "Coordinates" ];

   this.GetConstructor = function()
   {
      return "new BarnardCatalog()";
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      return mirrorServer + "viz-bin/asu-tsv?-source=VII/220A/barnard&-c=" +
         format( "%f %f", center.x, center.y ) +
         "&-c.eq=J2000&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         "&-out.add=_RAJ,_DEJ&-out=Barn&-out=Diam";
   };

   this.ParseRecord = function( tokens )
   {
      if ( tokens.length >= 4 && parseFloat( tokens[0] ) > 0 )
      {
         let x = parseFloat( tokens[0] );
         let y = parseFloat( tokens[1] );
         if( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         let name = "B" + tokens[2].trim();
         let diam =  parseFloat( tokens[3] );
         if ( !diam )
            diam = 0;
         let record = new CatalogRecord( new Point( x, y ), diam/60, name );

         return record;
      }

      return null;
   };
}

BarnardCatalog.prototype = new VizierCatalog;

__catalogRegister__.Register( new BarnardCatalog );

// ******************************************************************
// B-V White Balance Stars from NOMAD1
// ******************************************************************
// hacked by Troy Piggins from the Hipparcos function above

function BVCatalog()
{
   this.description = "NOMAD-1 star catalog with B-V filtering for white balance";

   this.__base__ = VizierCatalog;
   this.__base__( "NOMAD-1", "NOMAD-1 B-V WB" );

   this.catalogMagnitude = 14;
   this.bvMin = 0.6;
   this.bvMax = 0.7;
   this.vrMin = 0.2;
   this.vrMax = 0.6;

   this.fields = [ "Name", "Coordinates", "Vmag", "Bmag", "Rmag", "B-V index", "V-R index" ];
   this.filters = [ "Vmag", "Bmag", "Rmag" ];
   this.magnitudeFilter = "Vmag";
   this.maxFov = 45;

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["bvMin", DataType_Double] );
   this.properties.push( ["bvMax", DataType_Double] );
   this.properties.push( ["vrMin", DataType_Double] );
   this.properties.push( ["vrMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString] );

   this.GetConstructor = function()
   {
      return "new BVCatalog()";
   };

   this._base_GetEditControls = this.GetEditControls;
   this.GetEditControls = function( parent )
   {
      let controls = this._base_GetEditControls( parent );

      // B-V filter
      this.bv_Label = new Label( parent );
      this.bv_Label.text = "B-V filter:";
      this.bv_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      this.bv_Label.minWidth = parent.labelWidth1;

      this.bvMin_Edit = new Edit( parent );
      this.bvMin_Edit.setFixedWidth( parent.editWidth );
      if ( this.bvMin != NULLMAG )
         this.bvMin_Edit.text = format( "%g", this.bvMin );
      this.bvMin_Edit.toolTip = "<p>Draw only objects with a B-V index greater than this value.<br/>" +
         "It can be empty.</p>";
      this.bvMin_Edit.onTextUpdated = function( value )
      {
         if ( value != null && value.trim().length>0 )
            this.dialog.activeFrame.object.catalog.bvMin = parseFloat(value);
         else
            this.dialog.activeFrame.object.catalog.bvMin = NULLMAG;
         this.dialog.activeFrame.object.catalog.bounds=null;
      };

      this.bvMax_Edit = new Edit( parent );
      this.bvMax_Edit.setFixedWidth( parent.editWidth );
      if ( this.bvMax != NULLMAG )
         this.bvMax_Edit.text = format( "%g", this.bvMax );
      this.bvMax_Edit.toolTip = "<p>Draw only objects with a B-V index lower than this value.<br />" +
         "It can be empty.</p>";
      this.bvMax_Edit.onTextUpdated = function( value )
      {
         if ( value != null && value.trim().length > 0 )
            this.dialog.activeFrame.object.catalog.bvMax = parseFloat( value );
         else
            this.dialog.activeFrame.object.catalog.bvMax = NULLMAG;
         this.dialog.activeFrame.object.catalog.bounds = null;
      };

      this.bvSeparator_Label = new Label( parent );
      this.bvSeparator_Label.text = " - ";

      // V-R filter
      this.vr_Label = new Label( parent );
      this.vr_Label.text = "V-R filter:";
      this.vr_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

      this.vrMin_Edit = new Edit( parent );
      this.vrMin_Edit.setFixedWidth( parent.editWidth );
      if ( this.vrMin != NULLMAG )
         this.vrMin_Edit.text = format( "%g", this.vrMin );
      this.vrMin_Edit.toolTip = "<p>Draw only objects with a V-R index greater than this value.<br/>" +
         "It can be empty.</p>";
      this.vrMin_Edit.onTextUpdated = function( value )
      {
         if ( value != null && value.trim().length > 0 )
            this.dialog.activeFrame.object.catalog.vrMin = parseFloat( value );
         else
            this.dialog.activeFrame.object.catalog.vrMin = NULLMAG;
         this.dialog.activeFrame.object.catalog.bounds = null;
      };

      this.vrMax_Edit = new Edit( parent );
      this.vrMax_Edit.setFixedWidth( parent.editWidth );
      if ( this.vrMax != NULLMAG )
         this.vrMax_Edit.text = format( "%g", this.vrMax);
      this.vrMax_Edit.toolTip = "<p>Draw only objects with a V-R index lower than this value.<br />" +
         "It can be empty.</p>";
      this.vrMax_Edit.onTextUpdated = function( value )
      {
         if ( value != null && value.trim().length > 0 )
            this.dialog.activeFrame.object.catalog.vrMax = parseFloat( value );
         else
            this.dialog.activeFrame.object.catalog.vrMax = NULLMAG;
         this.dialog.activeFrame.object.catalog.bounds = null;
      };

      this.vrSeparator_Label = new Label( parent );
      this.vrSeparator_Label.text = " - ";

      let bvSizer = new HorizontalSizer;
      bvSizer.scaledSpacing = 4;
      bvSizer.add( this.bv_Label );
      bvSizer.add( this.bvMin_Edit );
      bvSizer.add( this.bvSeparator_Label );
      bvSizer.add( this.bvMax_Edit );
      bvSizer.addSpacing( 4 );
      bvSizer.add( this.vr_Label );
      bvSizer.add( this.vrMin_Edit );
      bvSizer.add( this.vrSeparator_Label );
      bvSizer.add( this.vrMax_Edit );
      bvSizer.addStretch();
      bvSizer.setAlignment( this.bvSeparator_Label, Align_Center );
      bvSizer.setAlignment( this.vrSeparator_Label, Align_Center );

      controls.push( bvSizer );
      return controls;
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      let url = mirrorServer + "viz-bin/asu-tsv?-source=I/297&-c=" +
         format( "%f %f", center.x, center.y ) +
         "&-c.eq=J2000&-c.r=" + format( "%f", fov ) +
         "&-c.u=deg&-out.form=|" +
         format( "&-out.max=%d", this.maxRecords ) +
         "&-out.add=_RAJ,_DEJ&-out=NOMAD1&-out=Vmag&-out=Bmag&-out=Rmag&-out=pmRA&-out=pmDE&-out=R" +
         this.CreateMagFilter( this.magnitudeFilter,
                               (this.magMin == NULLMAG) ? -5 : this.magMin,
                               (this.magMax == NULLMAG) ? 25 : this.magMax );
      if ( this.magnitudeFilter != "Vmag" )
         url += this.CreateMagFilter( "Vmag", -5, 25 );
      if ( this.magnitudeFilter != "Bmag" )
         url += this.CreateMagFilter( "Bmag", -5, 25 );
      if ( this.magnitudeFilter != "Rmag" )
         url += this.CreateMagFilter( "Rmag", -5, 25 );

      return url;
   };

   this.ParseRecord = function( tokens, position )
   {
      if ( tokens.length >= 8 && parseFloat( tokens[0] ) > 0 )
      {
         let recommended = tokens[8].trim();
         // Exclude problematic stars
         if ( tokens[8].trim() == "*" )
            return null;

         // Get magnitude values
         let V = parseFloat( tokens[3] ); // Returns NaN if it doesn't exist
         let B = parseFloat( tokens[4] ); // Returns NaN if it doesn't exist
         let R = parseFloat( tokens[5] ); // Returns NaN if it doesn't exist

         // Calculate B-V
         let BV = B - V;

         // Calculate V-R
         let VR = V - R;

         // Filter by B-V index
         if ( this.bvMin != NULLMAG && BV < this.bvMin || this.bvMax != NULLMAG && BV > this.bvMax )
            return null;

         // Filter by V-R index
         if ( this.vrMin != NULLMAG && VR < this.vrMin || this.vrMax != NULLMAG && VR > this.vrMax )
            return null;

         let x = parseFloat( tokens[0] );
         let y = parseFloat( tokens[1] );
         if ( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         if ( position != null )
         {
            let pmX = parseFloat( tokens[6] ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[7] ); // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let name = tokens[2].trim();
         let record = new CatalogRecord( new Point( x, y ), 0, name, parseFloat( tokens[3] ) );
         record.Vmag = tokens[3].trim();
         record.Bmag = tokens[4].trim();
         record.Rmag = tokens[5].trim();
         record["B-V index"] = format( "%.3f", BV );
         record["V-R index"] = format( "%.3f", VR );

         return record;
      }

      return null;
   };
}

BVCatalog.prototype = new VizierCatalog;

__catalogRegister__.Register( new BVCatalog );

// ******************************************************************
// SDSSBase: Base class of SDSS catalog versions
// ******************************************************************

function SDSSBase(catalogId, catalogName)
{
   this.__base__ = VizierCatalog;
   this.__base__( catalogId, catalogName );

   this.catalogMagnitude = 25;

   this.fields = [ "Name", "Coordinates", "Magnitude", "Class", "Redshift", "umag", "gmag", "rmag", "imag", "zmag"];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );
   this.properties.push( ["classFilter", DataType_UInt16 ] );

   this.filters = [ "umag", "gmag", "rmag", "imag", "zmag" ];
   this.magnitudeFilter = "rmag";
   this.classFilter = 0;
   this.maxFov = 45;

   this._base_GetEditControls = this.GetEditControls;
   this.GetEditControls = function( parent )
   {
      let controls = this._base_GetEditControls( parent );

      // Class filter
      let class_Label = new Label(parent);
      class_Label.text = "Class:";
      class_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      class_Label.minWidth = parent.labelWidth1;
      this.class_Label = class_Label;

      let class_combo = new ComboBox(parent);
      class_combo.editEnabled = false;
      class_combo.toolTip = "<p>Filter the objects of the catalog by class.</p>";
      class_combo.onItemSelected = function ()
      {
         this.dialog.activeFrame.object.catalog.classFilter = class_combo.currentItem;
         this.dialog.activeFrame.object.catalog.bounds = null;
      };
      class_combo.addItem("All objects");
      class_combo.addItem("Stars");
      class_combo.addItem("Galaxies");
      class_combo.currentItem = this.classFilter;
      this.class_combo = class_combo;

      let classSizer = new HorizontalSizer;
      classSizer.scaledSpacing = 4;
      classSizer.add(class_Label);
      classSizer.add(class_combo);
      classSizer.addStretch();
      this.classSizer = classSizer;

      controls.push(classSizer);
      return controls;
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      let url=mirrorServer+"viz-bin/asu-tsv?-source="+this.vizierSource+"&mode==1&-c=" +
         format("%f %f",center.x, center.y) +
         "&-c.r=" + format("%f",fov) +
         "&-c.u=deg&-out.form=|"+
         format("&-out.max=%d", this.maxRecords)+
         "&-oc.form=dec&-out.add=_RAJ,_DEJ"+"&-out="+this.idField+"&-out=pmRA&-out=pmDE&-out=cl&-out=zsp" +
         "&-out=umag&-out=gmag&-out=rmag&-out=imag&-out=zmag" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax ) ;
      if( this.classFilter==1 )
         url += "&cl==6";
      else if( this.classFilter==2 )
         url += "&cl==3";
      return url;
   };

   this._base_GetCacheDescriptor = this.GetCacheDescriptor;
   this.GetCacheDescriptor = function()
   {
      let cacheId = this._base_GetCacheDescriptor();
      if( this.classFilter==1 )
         cacheId += "&cl==6";
      else if( this.classFilter==2 )
         cacheId += "&cl==3";
      return cacheId;
   };

   this.ParseRecord = function( tokens, position )
   {
      if( tokens.length>=12 && parseFloat(tokens[0])>0 )
      {
         let x=parseFloat(tokens[0]);
         let y=parseFloat(tokens[1]);
         if( !(x>=0 && x<=360 && y>=-90 && y<=90) )
            return null;

         if ( position != null && tokens[3].trim().length > 0 && tokens[4].trim().length > 0 )
         {
            let pmX = parseFloat( tokens[3] ) * Math.cos( Math.rad( y ) ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[4] ); // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let record = new CatalogRecord( new Point( x, y ), 0, "SDSS"+tokens[2].trim(), 0 );
         record.Redshift = tokens[6].trim();
         record.Class = tokens[5].trim();
         record.umag = tokens[7].trim();
         record.gmag = tokens[8].trim();
         record.rmag = tokens[9].trim();
         record.imag = tokens[10].trim();
         record.zmag = tokens[11].trim();
         record.magnitude = parseFloat( record[this.magnitudeFilter] );
         return record;
      } else
         return null;
   };
}

SDSSBase.prototype=new VizierCatalog;

// ******************************************************************
// SDSSCatalog: Latest version of SDSS
// ******************************************************************

function SDSSCatalog()
{
   this.description = "SDSS R9 catalog (469,053,874 objects)";

   this.__base__ = SDSSBase;
   this.__base__( "SDSS", "SDSS R9" );

   this.vizierSource = "V/139"
   this.idField = "SDSS9";

   this.GetConstructor = function()
   {
      return "new SDSSCatalog()";
   }
}

SDSSCatalog.prototype=new SDSSBase;

__catalogRegister__.Register( new SDSSCatalog );

// ******************************************************************
// SDSS7Catalog: Release 7 of SDSS
// ******************************************************************

function SDSS7Catalog()
{
   this.name="SDSS7";
   this.description = "SDSS R7 catalog (357,175,411 objects)";

   this.__base__ = SDSSBase;
   this.__base__( "SDSS7", "SDSS R7");

   this.vizierSource = "II/294"
   this.idField = "SDSS";

   this.GetConstructor = function()
   {
      return "new SDSS7Catalog()";
   }
}

SDSS7Catalog.prototype=new SDSSBase;

__catalogRegister__.Register( new SDSS7Catalog );

// ******************************************************************
// GSCCatalog
// ******************************************************************

function GSCCatalog()
{
   this.description = "GSC2.3 catalog (945,592,683 objects)";

   this.__base__ = VizierCatalog;
   this.__base__( "GSC", "GSC" );

   this.catalogMagnitude = 23;

   this.fields = [ "Name", "Coordinates", "Magnitude", "Class", "Fmag", "jmag", "Vmag", "Nmag", "Umag", "Bmag"];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );
   this.properties.push( ["classFilter", DataType_UInt16 ] );

   this.filters = [ "Fmag", "jmag", "Vmag", "Nmag", "Umag", "Bmag" ];
   this.magnitudeFilter = "Vmag";
   this.classFilter = 0;

   this.GetConstructor = function()
   {
      return "new GSCCatalog()";
   }

   this._base_GetEditControls = this.GetEditControls;
   this.GetEditControls = function (parent)
   {
      let controls = this._base_GetEditControls(parent);

      // Class filter
      let class_Label = new Label(parent);
      class_Label.text = "Class:";
      class_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      class_Label.minWidth = parent.labelWidth1;
      this.class_Label = class_Label;

      let class_combo = new ComboBox(parent);
      class_combo.editEnabled = false;
      class_combo.toolTip = "<p>Filter the objects of the catalog by class.</p>";
      class_combo.onItemSelected = function ()
      {
         this.dialog.activeFrame.object.catalog.classFilter = class_combo.currentItem;
         this.dialog.activeFrame.object.catalog.bounds = null;
      };
      class_combo.addItem("All objects");
      class_combo.addItem("Star");
      class_combo.addItem("Non-star");
      class_combo.currentItem = this.classFilter;
      this.class_combo = class_combo;

      let classSizer = new HorizontalSizer;
      classSizer.scaledSpacing = 4;
      classSizer.add(class_Label);
      classSizer.add(class_combo);
      classSizer.addStretch();
      this.classSizer = classSizer;

      controls.push(classSizer);
      return controls;
   };

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      let url=mirrorServer+"viz-bin/asu-tsv?-source=I/305/out&-c=" +
         format("%f %f",center.x, center.y) +
         "&-c.r=" + format("%f",fov) +
         "&-c.u=deg&-out.form=|"+
         format("&-out.max=%d", this.maxRecords)+
         "&-out=GSC2.3&-out=RAJ2000&-out=DEJ2000&-out=Class" +
         "&-out=Fmag&-out=jmag&-out=Vmag&-out=Nmag&-out=Umag&-out=Bmag" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax ) ;
      if( this.classFilter==1 )
         url += "&Class==0";
      else if( this.classFilter==2 )
         url += "&Class==3";
      return url;
   }

   this._base_GetCacheDescriptor = this.GetCacheDescriptor;
   this.GetCacheDescriptor = function()
   {
      let cacheId = this._base_GetCacheDescriptor();
      if( this.classFilter==1 )
         cacheId += "&cl==6";
      else if( this.classFilter==2 )
         cacheId += "&cl==3";
      return cacheId;
   }

   this.ParseRecord = function( tokens )
   {
      if( tokens.length>=9 && parseFloat(tokens[1])>0 )
      {
         let x=parseFloat(tokens[1]);
         let y=parseFloat(tokens[2]);
         if( !(x>=0 && x<=360 && y>=-90 && y<=90) )
            return null;

         let record = new CatalogRecord( new Point( x, y ), 0, tokens[0].trim(), 0 );
         record.Class = tokens[3].trim();
         record.Fmag = tokens[4].trim();
         record.jmag = tokens[5].trim();
         record.Vmag = tokens[6].trim();
         record.Nmag = tokens[7].trim();
         record.Umag = tokens[8].trim();
         if(tokens.length>9) record.Bmag = tokens[9].trim();
         record.magnitude = parseFloat( record[this.magnitudeFilter] );
         return record;
      } else
         return null;
   }
}

GSCCatalog.prototype=new VizierCatalog;
__catalogRegister__.Register( new GSCCatalog );


// ******************************************************************
// CMC14Catalog
// ******************************************************************

function CMC14Catalog()
{
   this.description = "CMC14 catalog (95,858,475 stars)";

   this.__base__ = VizierCatalog;
   this.__base__( "CMC14", "CMC14" );

   this.catalogMagnitude = 17;

   this.fields = [ "Name", "Coordinates", "Magnitude", "Class", "r'mag", "Jmag", "Hmag", "Ksmag" ];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = [ "r'mag", "Jmag", "Hmag", "Ksmag" ];
   this.magnitudeFilter = "r'mag";
   this.classFilter = 0;

   this.GetConstructor = function()
   {
      return "new CMC14Catalog()";
   }

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      let url=mirrorServer+"viz-bin/asu-tsv?-source=I/304/out&-c=" +
         format("%f %f",center.x, center.y) +
         "&-c.r=" + format("%f",fov) +
         "&-c.u=deg&-out.form=|"+
         format("&-out.max=%d", this.maxRecords)+
         "&-out=CMC14&-out=RAJ2000&-out=DEJ2000" +
         "&-out=r'mag&-out=Jmag&-out=Hmag&-out=Ksmag" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax ) ;
      return url;
   }

   this.ParseRecord = function( tokens )
   {
      if( tokens.length>=2 && parseFloat(tokens[1])>0 )
      {
         let x=parseFloat(tokens[1]);
         let y=parseFloat(tokens[2]);
         if( !(x>=0 && x<=360 && y>=-90 && y<=90) )
            return null;

         let record = new CatalogRecord( new Point( x, y ), 0, tokens[0].trim(), 0 );
         if(tokens.length>3) record["r'mag"] = tokens[3].trim();
         if(tokens.length>4) record.Jmag = tokens[4].trim();
         if(tokens.length>5) record.Hmag = tokens[5].trim();
         if(tokens.length>6) record.Ksmag = tokens[6].trim();
         record.magnitude = parseFloat( record[this.magnitudeFilter] );
         return record;
      } else
         return null;
   }
}

CMC14Catalog.prototype=new VizierCatalog;
__catalogRegister__.Register( new CMC14Catalog );

// ******************************************************************
// ARPCatalog
// ******************************************************************

function ARPCatalog()
{
   this.description = "ARP catalog (592 galaxies)";

   this.__base__ = VizierCatalog;
   this.__base__( "ARP", "ARP" );

   this.catalogMagnitude = 17;

   this.fields = [ "Name", "CommonName", "Coordinates", "Magnitude", "MType", "VTmag" ];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = [ "VTmag" ];
   this.magnitudeFilter = "VTmag";

   this.GetConstructor = function()
   {
      return "new ARPCatalog()";
   }

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      let url=mirrorServer+"viz-bin/asu-tsv?-source=VII/192/arplist&-c=" +
         format("%f %f",center.x, center.y) +
         "&-c.r=" + format("%f",fov) +
         "&-c.u=deg&-out.form=|"+
         "&-oc.form=dec&-out.add=_RAJ,_DEJ"+
         "&-out=Arp&-out=Name&-out=VT&-out=dim1&-out=MType" +
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax ) ;
      return url;
   }

   this.ParseRecord = function( tokens )
   {
      if( tokens.length>=2 && parseFloat(tokens[0])>0 )
      {
         let x=parseFloat(tokens[0]);
         let y=parseFloat(tokens[1]);
         if( !(x>=0 && x<=360 && y>=-90 && y<=90) )
            return null;

         let diameter = parseFloat(tokens[5])/60;
         let record = new CatalogRecord( new Point( x, y ), diameter, "ARP"+tokens[2].trim());
         record["CommonName"] = tokens[3].trim();
         record["VTmag"] = tokens[4].trim();
         record["MType"] = tokens[6].trim();
         record.magnitude = parseFloat( record[this.magnitudeFilter] );
         return record;
      } else
         return null;
   }
}

ARPCatalog.prototype=new VizierCatalog;
__catalogRegister__.Register( new ARPCatalog );

// ******************************************************************
// GCVS Catalog
// ******************************************************************

function GCVSCatalog()
{
   this.description = "General Catalog of Variable Stars (47969 stars)";

   this.__base__ = VizierCatalog;
   this.__base__( "GCVS", "GCVS" );

   this.catalogMagnitude = 17;

   this.fields = [ "Name", "Coordinates", "MaxMagnitude", "MinMagnitude1", "MinMagnitude2", "Period", "VarType", "SpectralType" ];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = [ "magMax" ];
   this.magnitudeFilter = "magMax";

   this.GetConstructor = function()
   {
      return "new GCVSCatalog()";
   }

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      let url=mirrorServer+"viz-bin/asu-tsv?-source=B/gcvs/gcvs_cat&-c=" +
         format("%f %f",center.x, center.y) +
         "&-c.r=" + format("%f",fov) +
         "&-c.u=deg&-out.form=|"+
         "&-out=GCVS&-out=RAJ2000&-out=DEJ2000&-out=pmRA&-out=pmDE" +
         "&-out=VarType&-out=magMax&-out=Min1&-out=Min2&-out=Period&-out=SpType"+
         this.CreateMagFilter( this.magnitudeFilter, this.magMin, this.magMax ) ;
      return url;
   }

   this.ParseRecord = function( tokens, position )
   {
      if( tokens.length>=3 && parseFloat(tokens[1])>0 )
      {
         let x=DMSangle.FromString(tokens[1]).GetValue()*360/24;
         let y=DMSangle.FromString(tokens[2]).GetValue();
         if( !(x>=0 && x<=360 && y>=-90 && y<=90) )
            return null;

         if ( position != null && tokens[3].trim().length > 0 && tokens[4].trim().length > 0 )
         {
            let pmX = parseFloat( tokens[3] ) * 1000 * Math.cos( Math.rad( y ) ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[4] ) * 1000; // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let record = new CatalogRecord( new Point( x, y ), null, tokens[0].trim(), parseFloat(tokens[6]));
         //record["Code"] = tokens[0].trim();
         record["MaxMagnitude"] = tokens[6].trim();
         record["MinMagnitude1"] = tokens[7].trim();
         record["MinMagnitude2"] = tokens[8].trim();
         record["Period"] = tokens[9].trim();
         if(record["Period"].length)
            record["Period"] = parseFloat(record["Period"]).toString();
         record["VarType"] = tokens[5].trim();
         record["SpectralType"] = tokens[10].trim();
         //record.magnitude = parseFloat( record[this.magnitudeFilter] );
         return record;
      } else
         return null;
   }
}

GCVSCatalog.prototype=new VizierCatalog;
__catalogRegister__.Register( new GCVSCatalog );


// ******************************************************************
// GaiaDR1_Catalog
// ******************************************************************

function GaiaDR1_Catalog()
{
   this.description = "Gaia Data Release 1 (Gaia collaboration 2016, 1,142,679,769 sources)";

   this.__base__ = VizierCatalog;
   this.__base__( "GaiaDR1", "Gaia DR1" );

   this.catalogMagnitude = 20.7;
   this.magMin = NULLMAG;
   this.magMax = 21;
   this.fields = [ "SourceID", "Coordinates", "<Gmag>" ];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = [ "<Gmag>"];
   this.magnitudeFilter = "<Gmag>";

   this.GetConstructor = function ()
   {
      return "new GaiaDR1_Catalog()";
   }

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      let url = mirrorServer + "viz-bin/asu-tsv?-source=I/337/gaia&-c=" +
         format("%f %f", center.x, center.y) +
         "&-c.r=" + format("%f", fov) +
         "&-c.u=deg&-out.form=|" +
         "&-out.add=_RAJ,_DEJ&-out=pmRA&-out=pmDE&-out=Source&-out=<Gmag>" +
         this.CreateMagFilter(this.magnitudeFilter, this.magMin, this.magMax);
      return url;
   }

   this.ParseRecord = function( tokens, position )
   {
      if (tokens.length >= 6 && parseFloat(tokens[0]) > 0)
      {
         let x = parseFloat(tokens[0]);
         let y = parseFloat(tokens[1]);
         if (!(x >= 0 && x <= 360 && y >= -90 && y <= 90))
            return null;

         if ( position != null && tokens[2].trim().length > 0 && tokens[3].trim().length > 0 )
         {
            let pmX = parseFloat( tokens[2] ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[3] ); // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let name = tokens[4].trim();
         let record = new CatalogRecord(new Point(x, y), 0, name, parseFloat(tokens[5]));
         record["SourceID"] = name;
         record["<Gmag>"] = tokens[5].trim();
         if (record[this.magnitudeFilter])
            record.magnitude = parseFloat(record[this.magnitudeFilter]);
         return record;
      }
      else
         return null;
   }
}

GaiaDR1_Catalog.prototype=new VizierCatalog;
__catalogRegister__.Register(new GaiaDR1_Catalog);

// ******************************************************************
// GaiaDR2_Catalog
// ******************************************************************

function GaiaDR2_Catalog()
{
   this.description = "Gaia Data Release 2 (Gaia collaboration 2018, 1,692,919,135 sources)";

   this.__base__ = VizierCatalog;
   this.__base__( "GaiaDR2", "Gaia DR2" );

   this.catalogMagnitude = 21;
   this.magMin = NULLMAG;
   this.magMax = 21;
   this.fields = [ "SourceID", "Coordinates", "RPmag", "Gmag", "BPmag", "Parallax", "RadialVelocity", "Radius", "Luminosity"];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString ] );

   this.filters = ["RPmag", "Gmag", "BPmag"];
   this.magnitudeFilter = "Gmag";

   this.GetConstructor = function ()
   {
      return "new GaiaDR2_Catalog()";
   }

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      let url = mirrorServer + "viz-bin/asu-tsv?-source=I/345/gaia2&-c=" +
         format("%f %f", center.x, center.y) +
         "&-c.r=" + format("%f", fov) +
         "&-c.u=deg&-out.form=|" +
         "&-out.add=_RAJ,_DEJ&-out=pmRA&-out=pmDE&-out=Source&-out=Gmag&-out=RPmag&-out=BPmag" +
         "&-out=Plx&-out=RV&-out=Rad&-out=Lum" +
         this.CreateMagFilter(this.magnitudeFilter, this.magMin, this.magMax);
      return url;
   }

   this.ParseRecord = function( tokens, position )
   {
      if (tokens.length >= 5 && parseFloat(tokens[0]) > 0)
      {
         let x = parseFloat( tokens[0] );
         let y = parseFloat( tokens[1] );
         if ( !(x >= 0 && x <= 360 && y >= -90 && y <= 90) )
            return null;

         if ( position != null && tokens[2].trim().length > 0 && tokens[3].trim().length > 0 )
         {
            let pmX = parseFloat( tokens[2] ); // mas/year * cos(delta)
            let pmY = parseFloat( tokens[3] ); // mas/year
            let q = position.geometric( new StarPosition( x, y, pmX, pmY ) ).toSpherical2Pi();
            x = Math.deg( q[0] );
            y = Math.deg( q[1] );
         }
         let name = tokens[4].trim();
         let record = new CatalogRecord(new Point(x, y), 0, name, parseFloat(tokens[5]));
         record["SourceID"] = name;
         record["Gmag"] = tokens[5].trim();
         record["RPmag"] = tokens[6].trim();
         record["BPmag"] = tokens[7].trim();
         record["Parallax"] = tokens[8].trim();
         record["RadialVelocity"] = tokens[9].trim();
         record["Radius"] = tokens[10].trim();
         record["Luminosity"] = tokens[11].trim();
         if ( record[this.magnitudeFilter] )
            record.magnitude = parseFloat( record[this.magnitudeFilter] );
         return record;
      }
      else
         return null;
   }
}

GaiaDR2_Catalog.prototype=new VizierCatalog;
__catalogRegister__.Register(new GaiaDR2_Catalog);
__catalogRegister__.Register(new GaiaDR2_Catalog, "Gaia");

// ******************************************************************
// APASS_Catalog
// ******************************************************************

function APASS_Catalog()
{
   this.description = "AAVSO Photometric All Sky Survey DR9 (Henden+, 2016, 62 million stars)";

   this.__base__ = VizierCatalog;
   this.__base__( "APASS", "APASS" );

   this.catalogMagnitude = 17;
   this.magMin = 10;
   this.magMax = 17;
   this.fields = ["Coordinates", "Vmag", "Bmag", "g'mag","r'mag", "i'mag", "B-V"];

   this.properties.push( ["magMin", DataType_Double] );
   this.properties.push( ["magMax", DataType_Double] );
   this.properties.push( ["magnitudeFilter", DataType_UCString] );

   this.filters = ["Vmag", "Bmag", "g'mag","r'mag", "i'mag"];
   this.magnitudeFilter = "Vmag";

   this.GetConstructor = function()
   {
      return "new APASS_Catalog()";
   };

   this.UrlBuilder = function( center, fov, mirrorServer )
   {
      let url = mirrorServer + "viz-bin/asu-tsv?-source=II/336/apass9&-c=" +
         format("%f %f", center.x, center.y) +
         "&-c.r=" + format("%f", fov) +
         "&-c.u=deg&-out.form=|" +
         "&-out.add=_RAJ,_DEJ&-out=B-V&-out=Vmag&-out=Bmag&-out=g'mag&-out=r'mag&-out=i'mag" +
         this.CreateMagFilter(this.magnitudeFilter, this.magMin, this.magMax);
      return url;
   };

   this.ParseRecord = function( tokens )
   {
      if (tokens.length >= 2 && parseFloat(tokens[0]) > 0)
      {
         let x = parseFloat( tokens[0] );
         let y = parseFloat( tokens[1] );
         if( !(x>=0 && x<=360 && y>=-90 && y<=90) )
            return null;

         let name = tokens[0]+"_"+tokens[1];
         let record = new CatalogRecord(new Point(x, y), 0, name, 0);
         if(tokens.length>2)
            record["B-V"] = tokens[2].trim();
         if(tokens.length>3)
            record["Vmag"] = tokens[3].trim();
         if(tokens.length>4)
            record["Bmag"] = tokens[4].trim();
         if(tokens.length>5)
            record["g'mag"] = tokens[5].trim();
         if(tokens.length>6)
            record["r'mag"] = tokens[6].trim();
         if(tokens.length>7)
            record["i'mag"] = tokens[7].trim();
         if (record[this.magnitudeFilter])
            record.magnitude = parseFloat(record[this.magnitudeFilter]);
         return record;
      }
      else
         return null;
   };

   this.PostProcessObjects = function( objects )
   {
      // The workflow of APASS DR9 can generate duplicated stars
      // Since the resolution of the cameras is 2.5"/px the tolerance
      // will be 2.5"/px
      this.RemoveDuplicates( objects, 3/3600 );
   }
}

APASS_Catalog.prototype=new VizierCatalog;
__catalogRegister__.Register( new APASS_Catalog );

// ******************************************************************
// CustomCatalog: Uses a file to store the info
// ******************************************************************

function CustomCatalog()
{
   this.description = "User defined catalog";

   this.__base__ = Catalog;
   this.__base__( "Custom", "Custom Catalog" );

   this.catalogPath = null;

   this.fields = ["Name", "Coordinates", "Magnitude"];
   this.properties.push( ["catalogPath", DataType_String] );

   this.GetConstructor = function()
   {
      return "new CustomCatalog()";
   }

   this.Validate = function()
   {
      if(!this.catalogPath || this.catalogPath.trim().length==0){
         (new MessageBox( "The path of the custom catalog is empty", TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return false;
      }
      if( !File.exists( this.catalogPath ) ){
         (new MessageBox( "The file of the custom catalog doesn't exist", TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return false;
      }

      let catalogLines = this.LoadLines();

      if( catalogLines.length==0 )
      {
         new MessageBox( "The custom catalog is empty", TITLE, StdIcon_Error ).execute();
         return false;
      }

      return this.ParseHeader(catalogLines[0]) != null;
   }

   this.LoadLines = function()
   {
      let file = new File();
      file.openForReading( this.catalogPath );
      if( !file.isOpen )
      {
         new MessageBox( "The custom catalog file could not be opened", TITLE, StdIcon_Error, StdButton_Ok ).execute();
         return [];
      }

      let fileData = file.read( DataType_ByteArray,file.size );
      file.close();
      let str = fileData.toString();
      if( str.indexOf( "\r\n" ) >=0 )
         return str.split( "\r\n" );
      else if( str.indexOf( "\r" ) >=0 )
         return str.split( "\r" );
      else
         return str.split( "\n" );
   }

   this.ParseHeader = function( headerLine )
   {
      if( !headerLine )
      {
         new MessageBox( "The header line is empty", TITLE, StdIcon_Error ).execute();
         return null;
      }
      let index = {};

      let fields = headerLine.split("\t");
      fields = fields.map( function(s) { return s.trim().toLowerCase(); } );
      //console.writeln(fields);
      index.ra  = fields.indexOf( "ra" );
      index.dec = fields.indexOf( "dec" );
      index.dia = fields.indexOf( "diameter" );
      index.mag = fields.indexOf( "magnitude" );
      index.nam = fields.indexOf( "name" );

      if( index.ra<0 || index.dec<0 )
      {
         new MessageBox( "The custom catalog hasn't valid coordinate's columns", TITLE, StdIcon_Error ).execute();
         return null;
      }

      return index;
   }

   this.Load = function( metadata )
   {
      let file = new File();
      if ( !this.catalogPath )
         return false;

      let catalogLines = this.LoadLines();
      if ( catalogLines.length == 0 )
      {
         new MessageBox( "The custom catalog is empty", TITLE, StdIcon_Error ).execute();
         return false;
      }

      let index = this.ParseHeader( catalogLines[0] );
      if ( index == null )
         return false;

      let minLength = Math.max( index.ra, index.dec ) + 1;

      this.objects = new Array;
      let numWarnings = 0;
      for ( let i = 1; i < catalogLines.length; i++ )
      { 
         if ( catalogLines[i].trim().length==0 )
            continue;
         let fields = catalogLines[i].split("\t");

         if ( fields.length < minLength )
         {
            if( numWarnings<50 )
               console.warningln( "** Warning: The line ", i+1, " doesn't contain coordinates" );
            numWarnings++;
            continue;
         }

         let x = parseFloat( fields[index.ra] );
         let y = parseFloat( fields[index.dec] );

         let diameter = 0;
         if ( index.dia >= 0 && fields.length > index.dia )
            diameter = parseFloat( fields[index.dia] )/60;

         let name;
         if ( index.nam >= 0 && fields.length > index.nam )
            name = fields[index.nam].trim();

         let magnitude;
         if( index.mag >= 0 && fields.length > index.mag  )
            magnitude = parseFloat( fields[index.mag] );

         this.objects.push( new CatalogRecord( new Point( x, y ), diameter, name, magnitude ) );
      }
      if ( numWarnings > 50 )
         console.warningln( "Total number of warnings: ", numWarnings );
      console.writeln( "<end><cbr><br><b>Custom catalog size</b>: ", this.objects.length, " objects" );

      return true;
   };

   this.GetEditControls = function( parent )
   {
      // Catalog path
      let path_Label = new Label( parent );
      path_Label.text = "Catalog path:";
      path_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

      let path_Edit = new Edit(parent);
      path_Edit.text = this.catalogPath ? this.catalogPath : "";
      path_Edit.onTextUpdated = function( value ) { this.dialog.activeFrame.object.catalog.catalogPath = value; };

      let path_Button = new ToolButton( parent );
      path_Button.icon = parent.scaledResource(":/icons/select-file.png");
      path_Button.setScaledFixedSize( 20, 20 );
      path_Button.toolTip = "<p>Select the custom catalog file.</p>";
      path_Button.onClick = function()
      {
         let gdd = new OpenFileDialog;
         if ( this.dialog.activeFrame.object.catalog.catalogPath )
            gdd.initialPath = this.dialog.activeFrame.object.catalog.catalogPath;
         gdd.caption = "Select Custom Catalog Path";
         gdd.filters = [["Text files", "*.txt"]];
         if ( gdd.execute() )
         {
            this.dialog.activeFrame.object.catalog.catalogPath = gdd.fileName;
            path_Edit.text = gdd.fileName;
         }
      };

      let download_Button = new ToolButton(parent);
      download_Button.icon = parent.scaledResource(":/icons/download.png");
      download_Button.setScaledFixedSize(20, 20);
      download_Button.toolTip = "<p>Download from an online catalog.</p>";
      download_Button.onClick = function ()
      {
         let metadata = null;
         let server = parent.engine.vizierServer;
         if (parent.engine)
         {
            if (parent.engine.metadata)
               metadata = parent.engine.metadata;
            if (parent.engine.vizierServer)
               server = parent.engine.vizierServer;
         }
         let dlg = new CatalogDownloaderDialog(metadata, server);
         if (dlg.execute())
         {
            this.dialog.activeFrame.object.catalog.catalogPath = dlg.path;
            path_Edit.text = dlg.path;
         }
      };

      let pathSizer = new HorizontalSizer;
      pathSizer.scaledSpacing = 4;
      pathSizer.add( path_Label );
      pathSizer.add( path_Edit, 100 );
      pathSizer.add( path_Button );
      pathSizer.add( download_Button );

      return [pathSizer];
   };
}

CustomCatalog.prototype = new Catalog;

__catalogRegister__.Register( new CustomCatalog );

// ******************************************************************
// VizierMirrorDialog: Selects a mirror of VizieR
// ******************************************************************

function VizierMirrorDialog( serverAddress )
{
   this.__base__ = Dialog;
   this.__base__();

   this.helpLabel = new Label( this );
   this.helpLabel.text = "Select a Vizier catalog server:"

   this.server_List = new TreeBox( this );
   this.server_List.alternateRowColor = false;
   this.server_List.multipleSelection = false;
   this.server_List.headerVisible = false;
   this.server_List.numberOfColumns = 1;
   this.server_List.setHeaderText( 0, "Description" );
   //this.server_List.setHeaderText( 1, "Address" );
   this.server_List.rootDecoration = false;

   for ( let m = 0; m < VizierCatalog.mirrors.length; ++m )
   {
      let node = new TreeBoxNode( this.server_List );
      node.checkable = false;
      node.setText( 0, VizierCatalog.mirrors[m].name );
      node.address = VizierCatalog.mirrors[m].address;
      if ( VizierCatalog.mirrors[m].address == serverAddress )
         node.selected = true;
   }
   this.server_List.adjustColumnWidthToContents( 0 );
   this.server_List.setMinWidth( this.server_List.columnWidth( 0 ) * 1.1 );

   this.resetCache_Button = new PushButton( this );
   this.resetCache_Button.text = "Reset Catalog Cache";
   this.resetCache_Button.icon = this.scaledResource( ":/icons/delete.png" );
   this.resetCache_Button.toolTip = "<p>Resets the catalog cache.</p>" +
      "<p>The script uses a special cache to store catalog query results. " +
      "This saves considerable time by avoiding unnecessary network transfers. " +
      "However, sometimes a query fails because of a temporary problem, but " +
      "still returns a result that the script cannot recognize as invalid. " +
      "In these cases this action resets the internal cache, so that new queries " +
      "can be sent to the server to retrieve valid data.</p>";
   this.resetCache_Button.onClick = function()
   {
      __vizier_cache__ = new VizierCache();
      (new MessageBox( "<p>The catalog cache has been reset successfully.</p>",
                       TITLE, StdIcon_Information, StdButton_Ok )).execute();
   };

   // TERMS OF USE of VizieR catalogs
   this.terms_Button = new ToolButton( this );
   this.terms_Button.text = "Terms of use of VizieR data";
   this.terms_Font = new Font( this.font.family, this.font.pointSize );
   this.terms_Font.underline = true;
   this.terms_Button.font = this.terms_Font;
   this.terms_Button.onClick = function()
   {
      Dialog.openBrowser( "http://cds.u-strasbg.fr/vizier-org/licences_vizier.html" );
   };

   this.buttons1_Sizer = new HorizontalSizer;
   this.buttons1_Sizer.scaledSpacing = 6;
   this.buttons1_Sizer.add( this.resetCache_Button );
   this.buttons1_Sizer.addStretch();
   this.buttons1_Sizer.add( this.terms_Button );

   // Buttons

   this.ok_Button = new PushButton( this );
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      if ( this.dialog.server_List.selectedNodes == 0 )
      {
         (new MessageBox( "No server has been selected.",
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return;
      }
      this.dialog.server = this.dialog.server_List.selectedNodes[0].address;
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.scaledSpacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   // Global sizer
   this.sizer = new VerticalSizer;
   this.sizer.scaledMargin = 8;
   this.sizer.scaledSpacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.add( this.server_List );
   this.sizer.add( this.buttons1_Sizer );
   this.sizer.addScaledSpacing( 6 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Vizier Servers";
   this.adjustToContents();
}

VizierMirrorDialog.prototype = new Dialog;
