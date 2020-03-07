/*
   Annotate Image

   Annotation of astronomical images.

   Copyright (C) 2012-2019, Andres del Pozo
   Contributions (C) 2019, Juan Conejero (PTeam)
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

/*
   Changelog:

   2.0.1  * Fix dialog layout problems on KDE Plasma 5 generated in
            SectionBar.onToggleSection() event handlers.

   2.0:   * New layers for visible planets and asteroids using the integrated
            ephemerides system in PixInsight version >= 1.8.6.
          * New controls for extended observation time and geodetic coordinates
            of the observer, required for calculation of topocentric positions
            of solar system bodies.
          * The layers list box includes two new columns, 'M' and 'L', which
            indicate the drawing state of markers and labels, respectively, for
            each selected layer.
          * Improvements to the information provided by tool tips and console
            messages.
          * Source code refactoring and clean-up.

   1.9.5: * AnnotateImage can now be used from another script

   1.9.4: * Better error management in the online catalogs

   1.9.3: * Changed the ambiguous term "Epoch" by "Obs date"

   1.9.2: * Added Gaia DR1 and APASS DR9 catalogs

   1.9.1: * Added test for too big images (> 0.5 GigaPixels)

   1.9:   * Use downloaded catalogs

   1.8.5: * Fixed: When the script was executed from the console it ignored the
            parameters in the command and it used the saved parameters

   1.8.4: * Fixed: The grid layer didn't use the selected font
          * Improved star marker figure
          * Catalog GCVS

   1.8.3: * Fixed a bug in a bad interaction between the catalog cache and the
            remove of duplicates
          * Fixed the coordinates of Mintaka in the catalog NamedStars

   1.8.2: * Fixed the configuration panel of Custom Catalog Layer
          * The layers Messier and IC/NGC can now read files with any endline code

   1.8.1: * New Messier catalog
          * Improved NamedStars catalog.
          * Improved "Constellation Lines" layer

   1.8:   * Optionally writes a text file with the catalog objects inside the image
          * New button for clearing the catalog cache

   1.7.4: * The queries to the catalog are now more efficient and the cache is kept
            between executions.
          * New option "non-interactive" for non-interactive execution

   1.7.3: * The images with polynomials of high degree had problems of oscillations in
            the layers with lines (constellations and grid)

   1.7.2: * Fixed the asterisms of Bootes and Ursa Major
          * Fixed problem drawing constellation lines around RA=0h/24h

   1.7.1: * Fixed magnitude filter in USNO B1 catalog

   1.7:   * Constellations layers

   1.6.3: * New catalog Bright Star Catalog, 5th ed. (Hoffleit+)
          * Fixed an error in the catalog cache when the epoch value changes

   1.6.2: * Provide a default path for the NGC/IC local catalog file if the
            stored script settings point to a nonexistent file (changes to the
            NGCICCatalog object, in AstronomicalCatalogs.jsh). For example, this
            happens if we move the script within the core application's
            directory tree.

   1.6.1: * Fixed rendering of the grid and NGC/IC catalog in images that cross the 0/24h boundary.

   1.6:   * Cursor coordinates in J2000 in PreviewDialog
          * Layout fixes for PixInsight 1.8
          * Changed all icons to standard PI Core 1.8 resources
          * Button icons also shown on Mac OS X
          * Fixed copyright years (2012-2013)
          * The default dialog button is now 'OK' (defaultButton property)

   1.5:   * Graphics scale: Allow to change the graphics properties of all elements at the same time
          * Preview dialog: Shows a previsualization of the annotation in an interactive image viewer
                            with zoom and scroll.

   1.4:   * Catalog ARP
          * Use of VectorGraphics object that allows using floating point coordinates
          * SVG overlay

   1.3:   * Fixed for PI v1.8
          * Better dialog for adding layers
          * Catalog CMC14

   1.2:   * The user can choose the filter used in the magnitude filter
          * Catalog SDSS Release 8 with object class filter (star/galaxy)
          * Catalog GSC 2.3 with object class filter (star/non-star)
          * Fixed the magnitude filter in some catalogs
          * Fixed problem in the combo OutputMode
          * After downloading a catalog it logs the number of objects inside the image

   1.11:  * 2012 Apr 19 - Released as an official update.
          * Removed all instances of the 'with' JavaScript statement.
          * Fixed several GUI control dimension issues.
          * Fixed some text messages.

   1.1:   * Multiple labels per object
          * NOMAD-1 catalog with B-V filtering for white balance
          * Fields B, V and B-V in Tycho-2 catalog

   1.0:   * Label alignment.
          * Fixed grid around the poles
          * New field "NGC/IC code" in NGC/IC catalog. Cleaned name column in the catalog.
          * Hipparcos Main Catalog (VizieR I/239) with B-V and Spectral Type fields.
          * Catalog of Reflection Nebulae - Van den Bergh (VizieR VII/21)
          * Catalog of HII Regions - Sharpless (VizieR VII/20)
          * Barnard's Catalog of Dark Objects in the Sky (VizieR VII/220A)

   0.7:   * Layer management fixed. The delete button didn't work as expected.
          * Security fix in parameters persistence
          * Layout fixed when there are no layers


   0.65:  * Fixed a couple problems with dialog dimensions.
          * Fixed a few message strings.
          * More robust method to compute the local path to the NGC/IC catalog.

   0.6:   * Fix for custom catalogs that cover the entire sky
          * Support of custom catalogs with line endings in Mac format [CR]
          * Fixed problem in the labels of the grid near RA=0h
          * More fields for the labels in the catalogs NamedStars and Tycho2
          * Shortened the names of the variables in the persistence. PI seems to have
            a limit in the length of the parameter list

   0.5:   * Buttons for adding, removing and moving layers
          * Custom catalog layer
          * Text layer

   0.4:   * Adds support for saving the parameters as an icon.
          * It can be applied to an image container.
          * When Reset is pressed now it is not necessary to reopen the script
          * Fixed problem with incomplete values in DATE-OBS
          * Better grid spacing
          * Code clean up

   0.3:   * Faster removing of duplicates (at most a few seconds in any case)
          * Warning when VizieR limit is reached

   0.2:   * New layout
          * Proper Motion in Tycho-2, PPMXL, UCAC3 and USNO-B1
          * Filter by magnitude (minimum and maximum)
          * The label can be chosen between name, coordinates and magnitude
          * New catalogs: Named Stars, UCAC3
          * Faster removing of duplicates
          * The font family can be changed

   0.1:   * Initial test version.
*/

#feature-id    Render > AnnotateImage

#feature-info  A script for annotating astronomical images.<br/>\
               <br/>\
               Copyright &copy; 2012-2019 Andr&eacute;s del Pozo<br/>\
               Contributions &copy; 2019, Juan Conejero (PTeam)

#ifndef USE_ANNOTATE_LIBRARY
// Global control variable for PCL invocation.
var __PJSR_AdpAnnotateImage_SuccessCount = 0;
#endif

#iflt __PI_BUILD__ 1463
#error This script requires PixInsight version 1.8.6.1463 or higher.
#endif

#include <pjsr/ColorComboBox.jsh>
#include <pjsr/ColorSpace.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FontFamily.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/SectionBar.jsh>
#include <pjsr/SimpleColorDialog.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>

#define VERSION "2.0.1"
#define TITLE "Annotate Image"
#define ANNOT_SETTINGS_MODULE "ANNOT"

#ifndef USE_ANNOTATE_LIBRARY
#define SETTINGS_MODULE "ANNOT"
#include "WCSmetadata.jsh"
#include "SearchCoordinatesDialog.js"
#include "CommonUIControls.js"
#include "CatalogDownloader.js"
#include "AstronomicalCatalogs.jsh"
//#include "SpectrophotometricCatalogs.js"
#include "PreviewControl.js"
#endif

// Output modes
#define Output_Image    0  // Image annotated
#define Output_Overlay  1  // Transparent overlay
#define Output_SVG      2  // Overlay in SVG format

var __layerRegister__ = new Array();

function RegisterLayer( layer )
{
   __layerRegister__.push( { id:          layer.layerName,
                             constructor: layer.GetConstructor() } );
}

function FindLayer( layerId )
{
   for ( let i = 0; i < __layerRegister__.length; ++i )
      if (  __layerRegister__[i].id == layerId )
         return __layerRegister__[i];
   return null;
}

// ******************************************************************
// LabelCombo: Label field selection
// ******************************************************************

function LabelCombo( parent, fields, labels, labelPos, width )
{
   this.__base__ = ComboBox;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.labels = labels;
   this.setFixedWidth( width );
   this.editEnabled = false;
   this.addItem( "" );
   for ( let f = 0; f < fields.length; ++f )
   {
      this.addItem( fields[f] );
      if( fields[f] == labels[labelPos] )
         this.currentItem = f + 1;
   }

   this.onItemSelected = function()
   {
      this.labels[labelPos] = this.itemText( this.currentItem );
   };
}

LabelCombo.prototype = new ComboBox;

// ******************************************************************
// GraphicProperties: Graphic properties of a layer
// ******************************************************************

function GraphicProperties( module, layer )
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      module,
      layer,
      new Array(
         ["showMarkers", DataType_Boolean],
         ["lineColor", DataType_UInt32],
         ["lineWidth", DataType_Double],
         ["showLabels", DataType_Boolean],
         ["labelSize", DataType_Double],
         ["labelBold", DataType_Boolean],
         ["labelItalic", DataType_Boolean],
         ["labelColor", DataType_UInt32],
         ["labelFace", DataType_UInt32],
         ["labelFields", Ext_DataType_StringArray]
      )
   );

   this.GetEditControls = function( parent, fields )
   {
      // Marker color
      let markerColor_Label = new Label( parent );
      markerColor_Label.text = "Color:";
      markerColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      markerColor_Label.minWidth = parent.labelWidth2;

      let marker_ColorControl = new TransparentColorControl( parent, this.lineColor, "Marker color" );
      marker_ColorControl.onColorChanged = function( color )
      {
         this.dialog.activeFrame.object.gprops.lineColor = color;
      };

      let markerColor_Sizer = new HorizontalSizer;
      markerColor_Sizer.spacing = 4;
      markerColor_Sizer.add( markerColor_Label );
      markerColor_Sizer.add( marker_ColorControl );
      markerColor_Sizer.addStretch();

      let markerWidth_Label = new Label( parent );
      markerWidth_Label.text = "Width:";
      markerWidth_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      markerWidth_Label.minWidth = parent.labelWidth2;

      let markerWidth_SpinBox = new SpinBox( parent );
      markerWidth_SpinBox.minValue = 0;
      markerWidth_SpinBox.maxValue = 20;
      markerWidth_SpinBox.value = this.lineWidth;
      markerWidth_SpinBox.setFixedWidth( parent.spinWidth );
      markerWidth_SpinBox.toolTip = "<p>Line width of markers.</p>";
      markerWidth_SpinBox.onValueUpdated = function( value )
      {
         this.dialog.activeFrame.object.gprops.lineWidth = value;
      };

      let markerWidth_Sizer = new HorizontalSizer;
      markerWidth_Sizer.spacing = 4;
      markerWidth_Sizer.add( markerWidth_Label );
      markerWidth_Sizer.add( markerWidth_SpinBox );
      markerWidth_Sizer.addStretch();

      let showMarker_Frame = new GroupBox( parent );
      showMarker_Frame.title = "Show Markers";
      showMarker_Frame.titleCheckBox = true;
      showMarker_Frame.checked = this.showMarkers;
      showMarker_Frame.onCheck = function( checked )
      {
         this.dialog.activeFrame.object.gprops.showMarkers = checked;
         this.dialog.layers_TreeBox.currentNode.setIcon( 1,
            this.dialog.scaledResource( checked ? ":/browser/enabled.png" : ":/browser/disabled.png" ) );
      };
      showMarker_Frame.sizer = new VerticalSizer;
      showMarker_Frame.sizer.margin=6;
      showMarker_Frame.sizer.spacing=4;
      showMarker_Frame.sizer.add(markerColor_Sizer);
      showMarker_Frame.sizer.add(markerWidth_Sizer);
      showMarker_Frame.frameStyle = FrameStyle_Box;

      let labelSize_Label = new Label( parent );
      labelSize_Label.text = "Font:";
      labelSize_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      labelSize_Label.minWidth = parent.labelWidth2;

      this.label_FontControl = new FontControl( parent, this,
         {
            face:   this.labelFace,
            size:   this.labelSize,
            bold:   this.labelBold,
            italic: this.labelItalic
         } );
      this.label_FontControl.onChanged = function( fontDef )
      {
         this.labelFace = fontDef.face;
         this.labelSize = fontDef.size;
         this.labelBold = fontDef.bold;
         this.labelItalic = fontDef.italic;
      };

      let font_Sizer = new HorizontalSizer;
      font_Sizer.spacing = 4;
      font_Sizer.add( labelSize_Label );
      font_Sizer.add( this.label_FontControl );
      font_Sizer.addStretch();

      let labelColor_Label = new Label( parent );
      labelColor_Label.text = "Color:";
      labelColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      labelColor_Label.minWidth = parent.labelWidth2;

      let label_ColorControl = new TransparentColorControl( parent, this.labelColor, "Label color" );
      label_ColorControl.onColorChanged = function( color )
      {
         this.dialog.activeFrame.object.gprops.labelColor = color;
      };

      let labelColor_Sizer = new HorizontalSizer;
      labelColor_Sizer.spacing = 4;
      labelColor_Sizer.add( labelColor_Label );
      labelColor_Sizer.add( label_ColorControl );
      labelColor_Sizer.addStretch();

      let fields_Sizer;
      if ( fields )
      {
         let comboWidth = parent.font.width( "Common name " + "M".repeat( 4 ) );

         let combo0 = new LabelCombo( parent, fields, this.labelFields, 0, comboWidth );
         let combo1 = new LabelCombo( parent, fields, this.labelFields, 1, comboWidth );
         let combo2 = new LabelCombo( parent, fields, this.labelFields, 2, comboWidth );
         let combo3 = new LabelCombo( parent, fields, this.labelFields, 3, comboWidth );
         let combo4 = new LabelCombo( parent, fields, this.labelFields, 4, comboWidth );
         let combo5 = new LabelCombo( parent, fields, this.labelFields, 5, comboWidth );
         let combo6 = new LabelCombo( parent, fields, this.labelFields, 6, comboWidth );
         let combo7 = new LabelCombo( parent, fields, this.labelFields, 7, comboWidth );

         let row1 = new HorizontalSizer;
         row1.spacing = 4;
         row1.add( combo0 );
         row1.add( combo1 );
         row1.add( combo2 );
         row1.addStretch( );

         this.spacerControl = new Control( parent );
         this.spacerControl.setFixedWidth( comboWidth );
         let row2 = new HorizontalSizer;
         row2.spacing = 4;
         row2.add( combo3 );
         row2.add( this.spacerControl );
         row2.add( combo4 );
         row2.addStretch();

         let row3 = new HorizontalSizer;
         row3.spacing = 4;
         row3.add( combo5 );
         row3.add( combo6 );
         row3.add( combo7 );
         row3.addStretch();

         let fields_Label = new Label( parent );
         fields_Label.text = "Label Text:";
         fields_Label.textAlignment = TextAlign_Right|TextAlign_Top;
         fields_Label.minWidth = parent.labelWidth2;

         let table_Sizer = new VerticalSizer;
         table_Sizer.spacing = 4;
         table_Sizer.add( row1 );
         table_Sizer.add( row2 );
         table_Sizer.add( row3 );

         fields_Sizer = new HorizontalSizer;
         fields_Sizer.spacing = 4;
         fields_Sizer.add( fields_Label );
         fields_Sizer.add( table_Sizer );
         fields_Sizer.addStretch();
      }

      let showLabel_Frame = new GroupBox( parent );
      showLabel_Frame.title = "Show Labels";
      showLabel_Frame.titleCheckBox = true;
      showLabel_Frame.setMinWidth( parent.font.width( 'M' )*35 );
      showLabel_Frame.checked = this.showLabels;
      showLabel_Frame.onCheck = function( checked )
      {
         this.dialog.activeFrame.object.gprops.showLabels = checked;
         this.dialog.layers_TreeBox.currentNode.setIcon( 2,
            this.dialog.scaledResource( checked ? ":/browser/enabled.png" : ":/browser/disabled.png" ) );
      };
      showLabel_Frame.sizer = new VerticalSizer;
      showLabel_Frame.sizer.margin = 6;
      showLabel_Frame.sizer.spacing = 4;
      showLabel_Frame.sizer.add( font_Sizer );
      showLabel_Frame.sizer.add( labelColor_Sizer );
      if ( fields_Sizer )
         showLabel_Frame.sizer.add( fields_Sizer );
      showLabel_Frame.frameStyle = FrameStyle_Box;

      return [ showMarker_Frame, showLabel_Frame ];
   };

   this.showMarkers = true;
   this.lineColor = 0xffffffff;
   this.lineWidth = 1;
   this.showLabels = true;
   this.labelFace = 1;
   this.labelSize = 10;
   this.labelBold = false;
   this.labelItalic = false;
   this.labelColor = 0xffffffff;
   this.labelFields = new Array( 8 );
}

// ******************************************************************
// Layer: Base class for all layers
// ******************************************************************

function Layer()
{
   if ( typeof this.layerName === "undefined" )
      this.layerName = null;
   this.__base__ = ObjectWithSettings;
   this.__base__(
      ANNOT_SETTINGS_MODULE,
      this.layerName,
      new Array(
         [ "visible", DataType_Boolean ],
         [ "gprops", Ext_DataType_Complex ]
      )
   );

   this.visible = true;
   this.gprops = new GraphicProperties( ANNOT_SETTINGS_MODULE, this.layerName );

   this.GetObjects = function()
   {
      if ( this.visible && this.objects )
         return this.objects;
      return null;
   };

   this.SetId = function( id )
   {
      this.id = id;
      this.prefix = "ly" + id;
      this.gprops.prefix = this.prefix;
   };

   this.GetConstructor = null;

   this.GetLayerType = function ()
   {
      return this.GetLayerType.caller.name;
   };
}

Layer.prototype = new ObjectWithSettings;

function ConvertLines( metadata, points )
{
   let lineList = new Array();
   let line = new Array();
   let pI = metadata.Convert_RD_I( points[0] );
   if ( pI && !metadata.CheckOscillation( points[0], pI ) )
      pI = null;
   if ( pI )
      line.push( pI );
   let longLineDist = metadata.width*metadata.height/160;
   for ( let p = 1; p < points.length; ++p )
   {
      let p1 = points[p-1];
      let p2 = points[p];
      let dx = p2.x - p1.x;
      let dy = p2.y - p1.y;
      let steps = Math.ceil( Math.max( Math.abs( dx ), Math.abs( dy ), 1 )*5 );
      for ( let i = 1; i <= steps; ++i )
      {
         let pA = new Point( p1.x+(i-1)*dx/steps, p1.y+(i-1)*dy/steps );
         let pB = new Point( p1.x+i*dx/steps, p1.y+i*dy/steps );
         let pI = null;
         if ( metadata.projection.CheckBrokenLine( pA, pB ) )
            pI = metadata.Convert_RD_I( pB );
         if ( pI && !metadata.CheckOscillation( pB, pI ) )
            pI = null;
         if ( pI )
            line.push( pI );
         else
         {
            if ( line.length > 1 )
               lineList.push( line );
            line = new Array;
         }
      }
   }
   if ( line.length > 1 )
      lineList.push( line );
   return lineList;
}

// ******************************************************************
// GridLayer: Layer that draws the grid
// ******************************************************************

function GridLayer()
{
   this.layerName = "Grid";
   this.layerDescription = "Grid in ICRS/J2000.0 equatorial coordinates";

   this.__base__ = Layer;
   this.__base__();

   this.density = 4;
   this.gprops.lineColor = 0x80ffffff;
   this.gprops.labelSize = 12;
   this.properties.push( [ "density", DataType_UInt16 ] );

   this.GetConstructor = function()
   {
      return "new GridLayer()";
   }

   this.GetEditPanel = function( parent )
   {
      this.gpropsControls = this.gprops.GetEditControls( parent, null );

      // Grid density
      let density_Label = new Label( parent );
      density_Label.text = "Grid density:";
      density_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      density_Label.minWidth = parent.labelWidth1;
      this.density_Label = density_Label;

      let density_SpinBox = new SpinBox( parent );
      density_SpinBox.minValue = 1;
      density_SpinBox.maxValue = 20;
      density_SpinBox.value = this.density;
      density_SpinBox.setFixedWidth( parent.spinWidth );
      density_SpinBox.toolTip = "<p>Density of the grid.<br/>Higher values for a denser grid.</p>";
      density_SpinBox.onValueUpdated = function( value )
      {
         this.dialog.activeFrame.object.density = value;
      };
      this.density_SpinBox = density_SpinBox;

      let density_Sizer = new HorizontalSizer;
      density_Sizer.spacing = 4;
      density_Sizer.add( density_Label );
      density_Sizer.add( density_SpinBox );
      density_Sizer.addStretch();
      this.density_Sizer = density_Sizer;

      let frame = new Frame( parent );
      frame.sizer = new VerticalSizer;
      frame.sizer.margin = 6;
      frame.sizer.spacing = 4;
      frame.style = FrameStyle_Flat;
      for ( let i = 0; i < this.gpropsControls.length; ++i )
         frame.sizer.add( this.gpropsControls[i] );
      frame.sizer.add( density_Sizer );
      frame.sizer.addStretch();
      frame.object = this;
      return frame;
   };

   this.Draw = function( g, metadata, bounds, imageWnd, graphicsScale )
   {
      // Will try to draw "density" lines in declination
      let targetScale = bounds.height/this.density;

      let cosDec = Math.cos( Math.rad( bounds.center.y ) );
      let scalex = this.FindAxisScale( targetScale/cosDec/15 );
      let scaley = this.FindAxisScale( targetScale );
      let orgx = Math.floor( bounds.left/scalex )*scalex;
      let orgy = Math.max( -90, Math.floor( bounds.top/scaley )*scaley );

      // Draw horizontal lines
      if ( this.gprops.showMarkers )
      {
         g.pen = new Pen( this.gprops.lineColor, this.gprops.lineWidth*graphicsScale );
         for ( let y = 0; orgy + y*scaley <= bounds.bottom; ++y )
         {
            let yRD = orgy+y*scaley;
            let lines=ConvertLines( metadata, [new Point( orgx*15, yRD ), new Point( bounds.right*15, yRD )] );
            for ( let i = 0; i < lines.length; ++i )
               g.drawPolyline( lines[i] );
         }

         // Draw vertical lines
         for ( let x = 0; orgx + (x - 0)*scalex <= bounds.right; ++x )
         {
            let xRD = orgx + x*scalex;
            let lines = ConvertLines( metadata, [new Point( xRD*15, orgy ), new Point( xRD*15, bounds.bottom )] );
            for ( let i = 0; i < lines.length; ++i )
               g.drawPolyline( lines[i] );
         }
      }

      if ( this.gprops.showLabels )
      {
         g.pen = new Pen( this.gprops.labelColor, 1 );
         let font = new Font( this.gprops.labelFace, this.gprops.labelSize*graphicsScale );
         font.bold = this.gprops.labelBold;
         font.italic = this.gprops.labelItalic;
         g.font = font;

         // Draw declination labels
         for ( let y = 0; orgy + y*scaley <= bounds.bottom; ++y )
         {
            let yRD = orgy + y*scaley;
            let xRD = orgx + Math.ceil( bounds.width/3/scalex )*scalex;
            let labelPos = metadata.Convert_RD_I( new Point( xRD*15, yRD ) );
            if ( labelPos )
            {
               labelPos.y += font.height;
               let label = this.GetLabelText( yRD, '\xb0', '\'', '\"', true );
               g.drawText( labelPos, label );
            }
         }

         // Draw R.A. labels
         for ( let x = 0; orgx + x*scalex < bounds.right; ++x )
         {
            let xRD = orgx + x*scalex;
            if ( xRD < 0 )
               xRD += 24;
            else if( xRD >= 24 )
               xRD -= 24;
            let yRD = orgy + Math.ceil( bounds.height/3/scaley )*scaley;
            let labelPos = metadata.Convert_RD_I( new Point( xRD*15, yRD ) );
            if ( labelPos )
            {
               let label = this.GetLabelText( xRD, 'h', 'm', 's', false );
               g.drawText( labelPos, label );
            }
         }
      }
   };

   this.FindAxisScale = function( scaleTarget )
   {
      let scaleBase = Math.pow( 60, Math.floor( Math.log( scaleTarget )/Math.log( 60 ) ) );
      let factors = [60, 45, 30, 20, 15, 10, 9, 6, 5, 4, 3, 2, 1.5, 1];

      let factor = scaleTarget/scaleBase;
      for ( let i = 0; i < factors.length; ++i )
         if ( scaleBase*factors[i] < scaleTarget )
            return scaleBase*factors[i];
      return scaleBase;
   };

   this.GetLabelText = function( val, d, m, s, sign )
   {
      let dms = DMSangle.FromAngle( val );
      let signStr = sign ? ((dms.sign < 0) ? "\u2212" : "+") : "";
      if ( dms.sec > 0.001 )
         return signStr + format( "%d%c%d%c%.0f%c", dms.deg, d, dms.min, m, dms.sec, s );
      if ( dms.min > 0 )
         return signStr + format( "%d%c%d%c", dms.deg, d, dms.min, m );
      return signStr + format( "%d%c", dms.deg, d );
   };
}

GridLayer.prototype = new Layer;

RegisterLayer( new GridLayer );

// ******************************************************************
// ConstLinesLayer
// ******************************************************************

function ConstLinesLayer()
{
   this.layerName = "Constellation Lines";
   this.layerDescription = "Asterisms of the constellations";

   this.__base__ = Layer;
   this.__base__();

   this.margin = 8;
   this.gprops.lineColor = 0x80ffffff;
   this.gprops.labelSize = 12;
   this.properties.push( [ "margin", DataType_Double ] );

   this.GetConstructor = function()
   {
      return "new ConstLinesLayer()";
   };

   this.GetEditPanel = function( parent )
   {
      this.gpropsControls = this.gprops.GetEditControls( parent, null );

      // Grid margin
      this.margin_Label = new Label( parent );
      this.margin_Label.text = "Line margin:";
      this.margin_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      this.margin_Label.minWidth = parent.labelWidth1;

      this.margin_Spin = new SpinBox( parent );
      this.margin_Spin.minValue = 0;
      this.margin_Spin.maxValue = 40;
      this.margin_Spin.value = this.margin;
      this.margin_Spin.toolTip = "<p>Separation in pixels between adjacent lines.</p>"
         + "<p>The purpose of this parameter is to avoid drawing lines over the stars "
         + "in the corners of the asterism.</p>";
      this.margin_Spin.onValueUpdated = function( value )
      {
         this.dialog.activeFrame.object.margin = value;
      };

      this.marginSizer = new HorizontalSizer;
      this.marginSizer.spacing = 4;
      this.marginSizer.add( this.margin_Label );
      this.marginSizer.add( this.margin_Spin );
      this.marginSizer.addStretch();

      let frame = new Frame( parent );
      frame.sizer = new VerticalSizer;
      frame.sizer.margin = 6;
      frame.sizer.spacing = 4;
      frame.style = FrameStyle_Flat;
      for ( let i = 0; i < this.gpropsControls.length; ++i )
         frame.sizer.add( this.gpropsControls[i] );
      frame.sizer.add( this.marginSizer );
      frame.sizer.addStretch();
      frame.object = this;
      return frame;
   };

   this.Draw = function( g, metadata, bounds, imageWnd, graphicsScale )
   {
      let dataPath = File.extractDrive( #__FILE__ )
                   + File.extractDirectory( #__FILE__ )
                   + "/ConstellationLines.json";
      let imgArea = new Rect( 0, 0, metadata.width, metadata.height );
      let data = JSON.parse( File.readFile( dataPath ).toString() );

      let boundsDeg = new Rect( bounds );
      boundsDeg.mul( 15, 1 );
      if ( this.gprops.showMarkers )
      {
         g.pen = new Pen( this.gprops.lineColor, this.gprops.lineWidth*graphicsScale );
         for ( let i = 0; i < data.length; ++i )
         {
            let pRD0 = new Point( data[i].pol[0].x*15, data[i].pol[0].y );
            let p0 = metadata.Convert_RD_I( pRD0 );
            if ( p0 && !metadata.CheckOscillation( pRD0, p0 ) )
               p0 = null;
            for ( let p = 1; p < data[i].pol.length; ++p )
            {
               let pRD = new Point( data[i].pol[p].x*15, data[i].pol[p].y );
               //this.NormalizeCoord( metadata, pRD );
               let p1 = metadata.Convert_RD_I( pRD );
               if ( p1 && !metadata.CheckOscillation( pRD, p1 ) )
                  p1 = null;

               if ( p0 && p1 && metadata.projection.CheckBrokenLine( pRD0, pRD ) )
                  this.PaintSegment( g, p0, p1, this.margin, this.margin, imgArea );
               p0 = p1;
               pRD0 = pRD;
            }
         }
      }

      if ( this.gprops.showLabels )
      {
         let centroids = {};
         for ( let i = 0; i < data.length; ++i )
         {
            for ( let j = 0; j < data[i].pol.length; ++j )
            {
               let pRD = new Point( data[i].pol[j].x*15, data[i].pol[j].y );
               let p = metadata.Convert_RD_I( pRD );
               if ( p && !metadata.CheckOscillation( pRD, p ) )
                  p = null;
               if ( p && Math.abs( p.x ) < 1e5
                      && Math.abs( p.y ) < 1e5
                      && imgArea.inflatedBy( 1000 ).includes( p ) )
               {
                  if ( !centroids[data[i].c] )
                     centroids[data[i].c] = {n:0, pos:{x:0, y:0}};
                  centroids[data[i].c].n++;
                  centroids[data[i].c].pos.x += p.x;
                  centroids[data[i].c].pos.y += p.y;
               }
            }
         }

         let labelPath = File.extractDrive( #__FILE__ )
                       + File.extractDirectory( #__FILE__ )
                       + "/ConstellationLabels.json";
         let labels = JSON.parse( File.readFile( labelPath ).toString() );

         g.pen = new Pen( this.gprops.labelColor, 1 );
         let font = new Font( this.gprops.labelFace, this.gprops.labelSize*graphicsScale );
         font.bold = this.gprops.labelBold;
         font.italic = this.gprops.labelItalic;
         g.font = font;

         for ( let k in centroids )
         {
            let p = new Point( centroids[k].pos.x/centroids[k].n, centroids[k].pos.y/centroids[k].n );
            if ( p && imgArea.includes( p ) && centroids[k].n > 2 )
               g.drawText( p, labels[k.trim()] );
         }
      }
   };

   this.PaintSegment = function( g, p0, p1, margin0, margin1, imgArea )
   {
      if ( p0 && p1
        && Math.abs( p0.x ) < 1e5
        && Math.abs( p0.y ) < 1e5
        && Math.abs( p1.x ) < 1e5
        && Math.abs( p1.y ) < 1e5
      /*&& boundsDeg.includes( pRD )*/ )
      {
         let segmentArea = new Rect( Math.min( p0.x, p1.x ),
                                     Math.min( p0.y, p1.y ),
                                     Math.max( p0.x, p1.x ),
                                     Math.max( p0.y, p1.y ) );
         if ( segmentArea.intersects( imgArea ) )
         {
            let vx = p1.x - p0.x;
            let vy = p1.y - p0.y;
            let len = Math.sqrt(vx * vx + vy * vy);
            if ( len > margin0 + margin1 && len < Math.max( imgArea.width, imgArea.height ) )
            {
               let pA = new Point( p0.x + vx*margin0/len, p0.y + vy*margin0/len );
               let pB = new Point( p0.x + vx*(len - margin1)/len, p0.y + vy*(len - margin1)/len );
               g.drawLine( pA, pB );
            }
         }
      }
   };

   this.NormalizeCoord = function( metadata, pRD )
   {
      if ( pRD.x < metadata.ra - 180 )
         pRD.x += 360;
      if ( pRD.x > metadata.ra + 180 )
         pRD.x -= 360;
   };
}

ConstLinesLayer.prototype = new Layer;

RegisterLayer( new ConstLinesLayer );

// ******************************************************************
// ConstBordersLayer
// ******************************************************************

function ConstBordersLayer()
{
   this.layerName = "Constellation Borders";
   this.layerDescription = "Borders of the constellations";

   this.__base__ = Layer;
   this.__base__();

   this.gprops.lineColor = 0x80ffffff;
   this.gprops.labelSize = 12;

   this.GetConstructor = function ()
   {
      return "new ConstBordersLayer()";
   };

   this.GetEditPanel = function( parent )
   {
      this.gpropsControls = this.gprops.GetEditControls( parent, null );

      let frame = new Frame( parent );
      frame.sizer = new VerticalSizer;
      frame.sizer.margin = 6;
      frame.sizer.spacing = 4;
      frame.style = FrameStyle_Flat;
      for ( let i = 0; i < this.gpropsControls.length; ++i )
         frame.sizer.add( this.gpropsControls[i] );
      frame.sizer.addStretch();
      frame.object = this;
      return frame;
   };

   this.Draw = function( g, metadata, bounds, imageWnd, graphicsScale )
   {
      let dataPath = File.extractDrive( #__FILE__ )
                   + File.extractDirectory( #__FILE__ )
                   + "/ConstellationBorders.json";
      let imgArea = new Rect( 0, 0, metadata.width, metadata.height );
      let data = JSON.parse( File.readFile( dataPath ).toString() );
      if ( this.gprops.showMarkers )
      {
         g.pen = new Pen( this.gprops.lineColor, this.gprops.lineWidth*graphicsScale );
         for ( let i = 0; i < data.length; ++i )
         {
            let lines = ConvertLines( metadata, data[i].pol );
            for ( let l = 0; l < lines.length; ++l )
               g.drawPolyline( lines[l] );
         }
      }

      // labels
      if ( this.gprops.showLabels )
      {
         let centroids = {};
         for ( let i = 0; i < data.length; ++i )
            for ( let j = 0; j < data[i].pol.length; ++j )
            {
               let p = metadata.Convert_RD_I( data[i].pol[j] );
               if ( p && Math.abs( p.x ) < 1e5
                      && Math.abs( p.y ) < 1e5
                      && imgArea.inflatedBy( 1000 ).includes( p ) )
               {
                  if ( !centroids[data[i].c1] )
                     centroids[data[i].c1] = {n:0, pos:{x:0, y:0}};
                  centroids[data[i].c1].n++;
                  centroids[data[i].c1].pos.x += p.x;
                  centroids[data[i].c1].pos.y += p.y;

                  if ( !centroids[data[i].c2] )
                     centroids[data[i].c2] = {n:0, pos:{x:0, y:0}};
                  centroids[data[i].c2].n++;
                  centroids[data[i].c2].pos.x += p.x;
                  centroids[data[i].c2].pos.y += p.y;
               }
            }

         g.pen = new Pen( this.gprops.labelColor, 1 );
         let font = new Font( this.gprops.labelFace, this.gprops.labelSize*graphicsScale );
         font.bold = this.gprops.labelBold;
         font.italic = this.gprops.labelItalic;
         g.font = font;

         let labelPath = File.extractDrive( #__FILE__ )
                       + File.extractDirectory( #__FILE__ )
                       + "/ConstellationLabels.json";
         let labels = JSON.parse( File.readFile( labelPath ).toString() );
         for ( let k in centroids )
         {
            let p = new Point( centroids[k].pos.x/centroids[k].n, centroids[k].pos.y/centroids[k].n );
            if ( p && imgArea.includes(p) && centroids[k].n > 2 )
               g.drawText( p, labels[k.trim()] );
         }
      }
   };
}

ConstBordersLayer.prototype = new Layer;

RegisterLayer( new ConstBordersLayer );

// ******************************************************************
// CatalogLayer: Layer that draws a catalog
// ******************************************************************

function CatalogLayer( catalog )
{
   this.layerName = catalog.name;
   this.layerDescription = catalog.description;

   this.__base__ = Layer;
   this.__base__();

   this.catalog = catalog;
   this.properties.push( [ "catalog", Ext_DataType_Complex ] );
   this.gprops.labelFields = catalog.GetDefaultLabels();

   this.GetConstructor = function()
   {
      return "new CatalogLayer(" + catalog.GetConstructor() + ")";
   };

   this.SetId = function( id )
   {
      this.id = id;
      this.prefix = "ly" + id;
      this.gprops.prefix = this.prefix;
      this.catalog.prefix = this.prefix;
   };

   this.Load = function( metadata, mirrorServer )
   {
      this.catalog.Load( metadata, mirrorServer );
      // "objects" stores a shallow duplicate of the array of objects of the
      // catalog. RemoveDuplicates removes stars from this array.
      if ( this.catalog.objects )
         this.objects = this.catalog.objects.slice();
      else
         this.objects = null;
   };

   this.Validate = function()
   {
      if ( !this.visible )
         return true;
      if ( this.catalog.Validate )
         return this.catalog.Validate();
      return true;
   };

   this.GetEditPanel = function( parent )
   {
      let frame = new Frame( parent );
      frame.sizer = new VerticalSizer;
      frame.sizer.margin = 6;
      frame.sizer.spacing = 4;
      frame.style = FrameStyle_Flat;

      this.gpropsControls = this.gprops.GetEditControls( parent, this.catalog.fields );
      for ( let i = 0; i < this.gpropsControls.length; ++i )
         frame.sizer.add( this.gpropsControls[i] );

      this.catalogControls = this.catalog.GetEditControls( parent, this.catalog.fields );
      for ( let i = 0; i < this.catalogControls.length; ++i )
         frame.sizer.add( this.catalogControls[i] );

      frame.sizer.addStretch();
      frame.object = this;
      return frame;
   };

   this.Draw = function( g, metadata, bounds, imageWnd, graphicsScale )
   {
      let objects = this.GetObjects();
      if ( objects == null )
         return;
      let penMarker = new Pen( this.gprops.lineColor, this.gprops.lineWidth*graphicsScale );
      let penLabel = new Pen( this.gprops.labelColor, 0 );
      let font = new Font( this.gprops.labelFace, this.gprops.labelSize*graphicsScale );
      font.bold = this.gprops.labelBold;
      font.italic = this.gprops.labelItalic;
      g.font = font;
      let maglimit = 15;
      if ( this.catalog.magMax != null && this.catalog.magMax != NULLMAG )
         maglimit = this.catalog.magMax;
      else if ( this.catalog.catalogMagnitude != null )
         maglimit = this.catalog.catalogMagnitude;

      let drawInfo = new Array( objects.length );
      for ( let i = 0; i < objects.length; ++i )
      {
         if ( !objects[i] )
            continue;

         // Coordinates validation
         if ( !(objects[i].posRD.x >= 0 && objects[i].posRD.x <= 360) )
            continue;
         if ( !(objects[i].posRD.y >= -90 && objects[i].posRD.y <= 90) )
            continue;

         let pI = metadata.Convert_RD_I( objects[i].posRD );
         if ( pI == null )
            continue;
         if ( g.clipping && (pI.x < g.clipRect.left
                          || pI.y < g.clipRect.top
                          || pI.x > g.clipRect.right
                          || pI.y > g.clipRect.bottom) )
            continue;

         let size = 5;
//         if ( objects[i].magnitude != null )
//            size = Math.max( 0, maglimit - objects[i].magnitude ) + 1;
         size *= this.gprops.lineWidth*graphicsScale;
         drawInfo[i] = { pI:pI, size:size };
      }

      let hole = 5*((graphicsScale - 1)/2 + 1);
      if ( this.gprops.showMarkers )
      {
         g.pen = penMarker;
         for ( let i = 0; i < objects.length; ++i )
         {
            if ( drawInfo[i] == null )
               continue;
            let pI = drawInfo[i].pI;
            let size = drawInfo[i].size;
            let diameter = objects[i].diameter/metadata.resolution;
            if ( diameter > 10 )
               g.strokeEllipse( pI.x - diameter/2,
                                pI.y - diameter/2,
                                pI.x + diameter/2,
                                pI.y + diameter/2, penMarker );
            else
            {
               g.drawLine( pI.x - size - hole, pI.y,               pI.x - hole,  pI.y );
               g.drawLine( pI.x + size + hole, pI.y,               pI.x + hole,  pI.y );
               g.drawLine( pI.x,               pI.y + size + hole, pI.x,         pI.y + hole );
               g.drawLine( pI.x,               pI.y - size - hole, pI.x,         pI.y - hole );
            }
         }
      }

      if ( this.gprops.showLabels )
      {
         g.pen = penLabel;
         for ( let i = 0; i < objects.length; ++i )
            if ( drawInfo[i] )
               for ( let l = 0; l < 8; ++l )
                  this.DrawLabel( g,
                                  objects[i],
                                  this.gprops.labelFields[l],
                                  l,
                                  font,
                                  drawInfo[i].size + hole,
                                  drawInfo[i].pI,
                                  graphicsScale );
      }
   };

   this.DrawLabel = function( g, object, field, align, font, size, pI, graphicsScale )
   {
      if ( field == null || field.length == 0 )
         return;
      let label = null;
      if ( field == "Name" )
      {
         if ( object.name )
            label = [ object.name ];
      }
      else if ( field == "Coordinates" )
         label = [ DMSangle.FromAngle( object.posRD.x/15 ).ToString( true ),
                   DMSangle.FromAngle( object.posRD.y ).ToString() ];
      else if ( field == "Magnitude" && object.magnitude != null )
         label = [ format( "%.2f", object.magnitude ) ];
      else if ( object[field] )
         label = [ object[field] ];
      else
         return;

      if ( label == null )
         return;
      let labelHeight = label.length * this.gprops.labelSize * graphicsScale;
      for ( let line = 0; line < label.length; ++line )
      {
         let rect = font.tightBoundingRect( label[line] );

         let posX;
         if ( align == 0 || align == 3 || align == 5 ) // Left
            posX = pI.x - size - rect.width - graphicsScale;
         else if ( align == 1 || align == 6 ) // HCenter
            posX = pI.x - rect.width/2;
         else // Right
            posX = pI.x + size + graphicsScale;

         // let offsetY = (align == 1 || align == 6) ? size : 0;
         let offsetY = Math.max( size, this.gprops.labelSize*graphicsScale );
         let posY;
         if ( align >= 0 && align <= 2 ) // Top
            posY = pI.y - offsetY - labelHeight + (line + 1)*this.gprops.labelSize*graphicsScale;
         else if ( align == 3 || align == 4 ) // VCenter
            posY = pI.y - labelHeight/2 + (line + 1)*this.gprops.labelSize*graphicsScale;
         else // Bottom
            posY = pI.y + offsetY + (line + 1)*this.gprops.labelSize*graphicsScale;

         g.drawText( posX, posY, label[line] );
      }
   };

   this.ToFile = function( file, metadata )
   {
      let objects = this.catalog.objects;
      if ( objects.length == 0 )
         return;

      // Write catalog header
      file.outTextLn( this.catalog.name );
      file.outTextLn( this.catalog.description );

      file.outText( "Name;RA(deg);Dec(deg);PixelX;PixelY" );
      for ( let f = 0; f < this.catalog.fields.length; ++f )
      {
         let field = this.catalog.fields[f];
         if ( field != "Name" && field != "Coordinates" )
            file.outText( ";" + field );
      }
      file.outText( "\n" );

      // Write objects data
      for ( let i = 0; i < objects.length; ++i )
      {
         if ( !objects[i] )
            continue;

         // Coordinates validation
         if ( !(objects[i].posRD.x >= 0 && objects[i].posRD.x <= 360) )
            continue;
         if ( !(objects[i].posRD.y >= -90 && objects[i].posRD.y <= 90) )
            continue;

         let pI = metadata.Convert_RD_I( objects[i].posRD );
         if ( pI == null )
            continue;
         if ( pI.x < 0 || pI.y < 0 || pI.x > metadata.width || pI.y > metadata.height )
            continue;

         file.outText( format( "%ls;%f;%f;%f;%f",
                               objects[i].name,
                               objects[i].posRD.x, objects[i].posRD.y,
                               pI.x, pI.y ) );
         for ( let f = 0; f < this.catalog.fields.length; ++f )
         {
            let field = this.catalog.fields[f];
            if ( field == "Magnitude" )
            {
               file.outText( ";" );
               if ( objects[i].magnitude != null )
                  file.outText( format( "%.2f", objects[i].magnitude ) );
            }
            else if ( field != "Name" && field != "Coordinates" )
            {
               file.outText( ";" );
               if ( field in objects[i] )
                  file.outText( objects[i][field].toString() );
            }
         }
         file.outText( "\n" );
      }
      file.outText( "\n" );
   };
}

CatalogLayer.prototype = new Layer;

for ( let c = 0; c < __catalogRegister__.catalogs.length; ++c )
{
   let catalog = __catalogRegister__.GetCatalog( c );
   RegisterLayer( new CatalogLayer( catalog ) );
}

// ******************************************************************
// TextLayer: Draws a text on the image
// ******************************************************************

function TextLayer()
{
   this.layerName = "Text";
   this.layerDescription = "User defined text";

   this.__base__ = Layer;
   this.__base__();

   this.positionX = 0;
   this.positionY = 100;
   this.text = "";
   this.gprops.lineColor = 0x30000000;
   this.gprops.labelColor = 0xffffffff;
   this.gprops.labelSize = 14;
   this.properties.push( [ "positionX", DataType_Double ] );
   this.properties.push( [ "positionY", DataType_Double ] );
   this.properties.push( [ "text", DataType_UCString ] );

   this.GetConstructor = function()
   {
      return "new TextLayer()";
   };

   this.GetEditPanel = function( parent )
   {
      // Font
      this.labelSize_Label = new Label( parent );
      this.labelSize_Label.text = "Font:";
      this.labelSize_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      this.labelSize_Label.minWidth = parent.labelWidth2;

      this.labelFace_Combo = new ComboBox( parent );
      this.labelFace_Combo.editEnabled = false;
      this.labelFace_Combo.addItem( "SansSerif" );
      this.labelFace_Combo.addItem( "Serif" );
      this.labelFace_Combo.addItem( "Script" );
      this.labelFace_Combo.addItem( "TypeWriter" );
      this.labelFace_Combo.addItem( "Decorative" );
      this.labelFace_Combo.addItem( "Symbol" );
      this.labelFace_Combo.currentItem = this.gprops.labelFace - 1;
      this.labelFace_Combo.onItemSelected = function()
      {
         this.dialog.activeFrame.object.gprops.labelFace = labelFace_Combo.currentItem + 1;
      };

      this.labelSize_SpinBox = new SpinBox( parent );
      this.labelSize_SpinBox.minValue = 6;
      this.labelSize_SpinBox.maxValue = 72;
      this.labelSize_SpinBox.value = this.gprops.labelSize;
      this.labelSize_SpinBox.toolTip = "<p>Font size of the text.</p>";
      this.labelSize_SpinBox.setFixedWidth( parent.spinWidth );
      this.labelSize_SpinBox.onValueUpdated = function( value )
      {
         this.dialog.activeFrame.object.gprops.labelSize = value;
      };

      this.labelBold_Check = new CheckBox( parent );
      this.labelBold_Check.checked = this.gprops.labelBold;
      this.labelBold_Check.text = "Bold";
      this.labelBold_Check.toolTip = "<p>Bold font.</p>";
      this.labelBold_Check.onCheck = function( checked )
      {
         this.dialog.activeFrame.object.gprops.labelBold = checked;
      };

      this.labelItalic_Check = new CheckBox( parent );
      this.labelItalic_Check.checked = this.gprops.labelItalic;
      this.labelItalic_Check.text = "Italic";
      this.labelItalic_Check.toolTip = "<p>Italic font.</p>";
      this.labelItalic_Check.onCheck = function( checked )
      {
         this.dialog.activeFrame.object.gprops.labelItalic = checked;
      };

      this.font_Sizer = new HorizontalSizer;
      this.font_Sizer.spacing = 4;
      this.font_Sizer.add( this.labelSize_Label );
      this.font_Sizer.add( this.labelFace_Combo );
      this.font_Sizer.add( this.labelSize_SpinBox );
      this.font_Sizer.add( this.labelBold_Check );
      this.font_Sizer.add( this.labelItalic_Check );
      this.font_Sizer.addStretch();

      // Foreground color
      this.fcolor_Label = new Label( parent );
      this.fcolor_Label.text = "Text color:";
      this.fcolor_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      this.fcolor_Label.minWidth = parent.labelWidth2;

      this.fcolor_ColorControl = new TransparentColorControl( parent, this.gprops.labelColor, "Text color" );
      this.fcolor_ColorControl.onColorChanged = function( color )
      {
         this.dialog.activeFrame.object.gprops.labelColor = color;
      };

      this.fcolor_Sizer = new HorizontalSizer;
      this.fcolor_Sizer.spacing = 4;
      this.fcolor_Sizer.add( this.fcolor_Label );
      this.fcolor_Sizer.add( this.fcolor_ColorControl );
      this.fcolor_Sizer.addStretch();

      // Background color
      this.bcolor_Label = new Label( parent );
      this.bcolor_Label.text = "Background:";
      this.bcolor_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      this.bcolor_Label.minWidth = parent.labelWidth2;

      this.bcolor_ColorControl = new TransparentColorControl( parent, this.gprops.lineColor, "Background color" );
      this.bcolor_ColorControl.onColorChanged = function( color )
      {
         this.dialog.activeFrame.object.gprops.lineColor = color;
      };

      this.bcolor_Sizer = new HorizontalSizer;
      this.bcolor_Sizer.spacing = 4;
      this.bcolor_Sizer.add( this.bcolor_Label );
      this.bcolor_Sizer.add( this.bcolor_ColorControl );
      this.bcolor_Sizer.addStretch();

      // Position
      this.position_Label = new Label( parent );
      this.position_Label.text = "Position:";
      this.position_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      this.position_Label.minWidth = parent.labelWidth2;

      this.positionX_Label = new Label( parent );
      this.positionX_Label.text = "X=";
      this.positionX_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

      this.positionX_Spin = new SpinBox( parent );
      this.positionX_Spin.minValue = 0;
      this.positionX_Spin.maxValue = 100;
      this.positionX_Spin.suffix = "%";
      this.positionX_Spin.value = this.positionX;
      this.positionX_Spin.setFixedWidth( Math.round( parent.spinWidth*1.5 ) );
      this.positionX_Spin.toolTip = "<p>Horizontal text position.</p>"
         + "<p>Specify 0% to draw the text at the left side of the image. "
         + "50% corresponds to the center of the image, and 100% to the right side.</p>";
      this.positionX_Spin.onValueUpdated = function( value )
      {
         this.dialog.activeFrame.object.positionX = value;
      };

      this.positionY_Label = new Label( parent );
      this.positionY_Label.text = "  Y=";
      this.positionY_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

      this.positionY_Spin = new SpinBox( parent );
      this.positionY_Spin.minValue = 0;
      this.positionY_Spin.maxValue = 100;
      this.positionY_Spin.value = this.positionY;
      this.positionY_Spin.suffix = "%";
      this.positionY_Spin.setFixedWidth( Math.round( parent.spinWidth*1.5 ) );
      this.positionY_Spin.toolTip = "<p>Vertical text position.</p>"
         + "<p>Specify 0% to draw the text at the top of the image. "
         + "50% corresponds to the center of the image, and 100% to the bottom.</p>";
      this.positionY_Spin.onValueUpdated = function( value )
      {
         this.dialog.activeFrame.object.positionY = value;
      };

      this.positionSizer = new HorizontalSizer;
      this.positionSizer.spacing = 4;
      this.positionSizer.add( this.position_Label );
      this.positionSizer.add( this.positionX_Label );
      this.positionSizer.add( this.positionX_Spin );
      this.positionSizer.add( this.positionY_Label );
      this.positionSizer.add( this.positionY_Spin );
      this.positionSizer.addStretch();

      this.text_Label = new Label( parent );
      this.text_Label.text = "Text:";
      this.text_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      this.text_Label.minWidth = parent.labelWidth2;
      this.textLabel_Sizer = new HorizontalSizer;
      this.textLabel_Sizer.spacing = 4;
      this.textLabel_Sizer.add( this.text_Label );
      this.textLabel_Sizer.addStretch();

      this.text_TextBox = new TextBox( parent );
      this.text_TextBox.text = this.text;
      //text_TextBox.font = text_Label.font;
      this.text_TextBox.styleSheet = "* { font-family: " + this.text_Label.font.face + "; font-size: " + this.text_Label.font.pointSize + "pt; }";
      this.text_TextBox.toolTip = "<p>User-defined text. It supports expansion of the following variables:</p>"
         + "<ul><li>%RA: Right Ascension of the center of the image.</li>"
         + "<li>%DEC: Declination of the center of the image.</li>"
         + "<li>%RESOLUTION: Resolution of the image in arcseconds/pixel.</li>"
         + "<li>%ROTATION: Rotation of the image in degrees.</li>"
         + "<li>%PROJECTION: Name of the projection.</li>"
         + "<li>%KEY-XXXX: Prints the value of the FITS keyword XXXX.<br/>"
         + "For example, %KEY-FOCALLEN is replaced by the value of the keyword FOCALLEN.</li></ul>";
      this.text_TextBox.onTextUpdated = function()
      {
         this.dialog.activeFrame.object.text = this.text;
      };

      this.frame = new Frame( parent );
      this.frame.sizer = new VerticalSizer;
      this.frame.sizer.margin = 6;
      this.frame.sizer.spacing = 4;
      this.frame.style = FrameStyle_Flat;
      this.frame.sizer.add( this.font_Sizer );
      this.frame.sizer.add( this.fcolor_Sizer );
      this.frame.sizer.add( this.bcolor_Sizer );
      this.frame.sizer.add( this.positionSizer );
      this.frame.sizer.add( this.textLabel_Sizer );
      this.frame.sizer.add( this.text_TextBox );
      this.frame.sizer.addStretch();
      this.frame.object = this;
      return this.frame;
   };

   this.Draw = function( g, metadata, bounds, imageWnd, graphicsScale )
   {
      let finalText = this.ExpandVariables( metadata, imageWnd.keywords );

      let margin = 3;
      let imageWidth = imageWnd.mainView.image.width - margin*2;
      let imageHeight = imageWnd.mainView.image.height - margin*2;

      let font = new Font(this.gprops.labelFace, this.gprops.labelSize * graphicsScale);
      font.bold = this.gprops.labelBold;
      font.italic = this.gprops.labelItalic;
      g.font = font;
      g.pen = new Pen( this.gprops.labelColor );

      let lines = finalText.trim().split( "\n" );

      // Dimensions of the text
      let lineHeight = font.ascent + font.descent;
      let height = lines.length * lineHeight;
      let orgY = (imageHeight - height)*this.positionY/100;

      // Background
      if ( (this.gprops.lineColor & 0xff000000) != 0 )
      {
         let maxWidth = 0;
         for ( let i = 0; i < lines.length; ++i )
            maxWidth = Math.max( maxWidth, font.tightBoundingRect( lines[i] ).width );
         let left = (imageWidth - maxWidth)*this.positionX/100;
         let top = orgY;
         let brush = new Brush( this.gprops.lineColor );
         g.fillRect( left, top, left + maxWidth + margin*2, top + height + margin*2, brush );
      }

      // Draw text lines
      for ( let i = 0; i < lines.length; ++i )
      {
         let rect = font.tightBoundingRect( lines[i] );
         g.drawText( (imageWidth - rect.width)*this.positionX/100 + margin,
                     orgY + i*lineHeight + font.ascent + margin,
                     lines[i] );
      }
   };

   this.ExpandVariables = function( metadata, keywords )
   {
      let expanded = this.text;

      // RA
      for ( let pos = expanded.indexOf( "%RA" ); pos >= 0; pos = expanded.indexOf( "%RA" ) )
         expanded = expanded.replace( "%RA", DMSangle.FromAngle( metadata.ra/15 ).ToString( true ) );

      // DEC
      for ( let pos = expanded.indexOf( "%DEC" ); pos >= 0; pos = expanded.indexOf( "%DEC" ) )
         expanded = expanded.replace( "%DEC", DMSangle.FromAngle( metadata.dec ).ToString() );

      // Resolution
      for ( let pos = expanded.indexOf( "%RESOLUTION" ); pos >= 0; pos = expanded.indexOf( "%RESOLUTION" ) )
         expanded = expanded.replace( "%RESOLUTION", format( "%.3f", metadata.resolution*3600 ) );

      // Resolution
      for ( let pos = expanded.indexOf( "%PROJECTION" ); pos >= 0; pos = expanded.indexOf( "%PROJECTION" ) )
         expanded = expanded.replace( "%PROJECTION", metadata.projection.name );

      // Rotation
      for ( let pos = expanded.indexOf( "%ROTATION" ); pos >= 0; pos = expanded.indexOf( "%ROTATION" ) )
      {
         let rotation = metadata.GetRotation();
         expanded = expanded.replace( "%ROTATION", format( "%.2f", rotation[0] ) + (rotation[1] ? " (flipped)" : "") );
      }

      // FITS Keyword
      for ( let pos = expanded.indexOf( "%KEY-" ); pos >= 0; pos = expanded.indexOf( "%KEY-", pos ) )
      {
         let keyIdx = this.FindKeyword( expanded.substr( pos+5 ), keywords );
         if ( keyIdx >= 0 )
         {
            let value = keywords[keyIdx].value.trim();
            if ( value.charAt(0) == "'" )
               value = value.substr( 1 );
            if ( value.charAt( value.length-1 ) == "'" )
               value = value.substr( 0, value.length-1 );
            expanded = expanded.replace( "%KEY-" + keywords[keyIdx].name, value );
         }
         else
            ++pos;
      }

      return expanded;
   };

   this.FindKeyword = function( str, keywords )
   {
      for ( let i = 0; i < keywords.length; ++i )
         if ( str.indexOf( keywords[i].name ) == 0 )
            return i;
      return -1;
   };
}

TextLayer.prototype = new Layer;

RegisterLayer( new TextLayer );

// ******************************************************************
// AddLayerDialog: Selects the layer class to add
// ******************************************************************

function AddLayerDialog()
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.information_Label = new Label( this );
   this.information_Label.text = "Select the layer class to add:"

   this.addLayer_List = new TreeBox( this );
   this.addLayer_List.alternateRowColor = false;
   this.addLayer_List.multipleSelection = false;
   this.addLayer_List.headerVisible = true;
   this.addLayer_List.numberOfColumns = 2;
   this.addLayer_List.setHeaderText( 0, "Layer Class" );
   this.addLayer_List.setHeaderText( 1, "Description" );
   this.addLayer_List.rootDecoration = false;
   this.addLayer_List.setMinSize( this.logicalPixelsToPhysical( 550 ), this.font.pixelSize*30 );
   for ( let l = 0; l < __layerRegister__.length; ++l )
   {
      let node = new TreeBoxNode( this.addLayer_List );
      node.layer = eval( __layerRegister__[l].constructor );
      node.checkable = false;
      node.setText( 0, node.layer.layerName );
      node.setText( 1, node.layer.layerDescription );
   }
   this.addLayer_List.adjustColumnWidthToContents( 0 );

   // Buttons

   this.ok_Button = new PushButton( this );
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      if ( this.dialog.addLayer_List.selectedNodes == 0 )
      {
         (new MessageBox( "No layer has been selected.", TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return;
      }
      this.dialog.layer = this.dialog.addLayer_List.selectedNodes[0].layer;
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
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   // Global sizer
   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add( this.information_Label );
   this.sizer.add( this.addLayer_List );
   this.sizer.addSpacing( 6 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Add Layer";
   this.adjustToContents();
}

AddLayerDialog.prototype = new Dialog;

// ******************************************************************
// PreviewDialog: Shows a preview of the annotated image
// ******************************************************************

function PreviewDialog( image, metadata )
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.previewControl = new PreviewControl( this );
   this.previewControl.SetImage( image, metadata );

   // Buttons

   this.ok_Button = new PushButton( this );
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "Close";
   this.ok_Button.icon = this.scaledResource( ":/icons/close.png" );
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );

   // Global sizer
   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add( this.previewControl );
   this.sizer.addSpacing( 2 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Preview annotation";
   this.adjustToContents();
   this.resize( this.logicalPixelsToPhysical( 800 ), this.logicalPixelsToPhysical( 800 ) );
}

PreviewDialog.prototype = new Dialog;

// ******************************************************************
// AnnotateDialog: Configuration dialog for the annotation engine.
// ******************************************************************

function AnnotateDialog( engine )
{
   this.__base__ = Dialog;
   this.__base__();

   this.labelWidth1 = this.font.width( "Magnitude filter:" + 'M' );
   this.labelWidth2 = this.font.width( "Background:" );
   this.editWidth = this.font.width( "12.888" );
   this.spinWidth = this.font.width( "888888" );

   let emWidth = this.font.width( 'm' );
   let labelWidth3 = Math.round( this.font.width( "M" ) + 0.1*emWidth );
   let editWidth1 = Math.round( 4.75*emWidth );
   let editWidth2 = Math.round( 5.75*emWidth );
   let ui4 = this.logicalPixelsToPhysical( 4 );

   this.engine = engine;
   this.layers = this.engine.layers;

   // -------------------------------------------------------------------------
   // Information header
   // -------------------------------------------------------------------------

   this.information_Label = new Label( this );
   this.information_Label.frameStyle = FrameStyle_Box;
   this.information_Label.minWidth = 45*this.font.width( 'M' );
   this.information_Label.margin = 6;
   this.information_Label.wordWrapping = true;
   this.information_Label.useRichText = true;
   this.information_Label.text = "<p><b>Image Annotation v" + VERSION + "</b> &mdash; "
      + "A script for annotating astronomical images.</p>"
      + "<p>This script draws coordinate grids and object markers and labels using data extracted "
      + "from a variety of astronomical catalogs, as well as positions computed from ephemerides "
      + "of solar system bodies. The script requires the image to have a valid astrometric solution "
      + "represented as image properties and FITS header keywords following the standard WCS convention. "
      + "The Image Plate Solver script can be used to generate these properties and keywords.</p>"
      + "<p>Copyright &copy; 2012-2019 Andr&eacute;s del Pozo<br/>"
      + "Contributions &copy; 2019, Juan Conejero (PTeam)</p>";

   // -------------------------------------------------------------------------
   // Layers
   // -------------------------------------------------------------------------

   this.layers_TreeBox = new TreeBox( this );
   this.layers_TreeBox.alternateRowColor = false;
   this.layers_TreeBox.multipleSelection = false;
   this.layers_TreeBox.headerVisible = true;
   this.layers_TreeBox.numberOfColumns = 4;
   this.layers_TreeBox.setHeaderText( 0, "Layer" );
   this.layers_TreeBox.setHeaderText( 1, "M" );
   this.layers_TreeBox.setHeaderText( 2, "L" );
   this.layers_TreeBox.setHeaderText( 3, "Description" );
   this.layers_TreeBox.rootDecoration = false;
   this.layers_TreeBox.setMinSize( this.logicalPixelsToPhysical( 400 ), this.font.pixelSize*22 );
   this.layers_TreeBox.toolTip = "<p>Only checked layers are drawn on the result image.<br/>"
      + "The panel at the right shows the configuration of the currently selected layer.</p>";
   this.layers_TreeBox.onCurrentNodeUpdated = function( node )
   {
      this.dialog.ActivateLayer( node );
   };

   this.addLayer_Button = new ToolButton( this );
   this.addLayer_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.addLayer_Button.setScaledFixedSize( 20, 20 );
   this.addLayer_Button.toolTip = "Add layer";
   this.addLayer_Button.onMousePress = function()
   {
      this.hasFocus = true;
      let dlg = new AddLayerDialog( this );
      if ( dlg.execute() )
      {
         let node = this.dialog.AddLayerToTree( dlg.layer );
         for ( let i = 0; i < this.dialog.layers_TreeBox.numberOfChildren; ++i )
         {
            let child = this.dialog.layers_TreeBox.child( i );
            child.selected = child == node;
         }
         this.dialog.layers_TreeBox.setNodeIntoView( node );
         this.dialog.ActivateLayer( node );
      }
      this.pushed = false;
   };

   this.deleteLayer_Button = new ToolButton( this );
   this.deleteLayer_Button.icon = this.scaledResource( ":/icons/delete.png" );
   this.deleteLayer_Button.setScaledFixedSize( 20, 20 );
   this.deleteLayer_Button.toolTip = "Delete layer";
   this.deleteLayer_Button.onMousePress = function()
   {
      this.hasFocus = true;

      let lastRemoved = -1;
      let selected = this.dialog.layers_TreeBox.selectedNodes;
      for ( let node = 0; node < selected.length; ++node )
      {
         lastRemoved = this.dialog.layers_TreeBox.childIndex( selected[node] );
         this.dialog.layers_TreeBox.remove( lastRemoved );
      }

      if ( this.dialog.layers_TreeBox.numberOfChildren > 0 )
      {
         if ( lastRemoved >= 0 )
         {
            let nodeIdx = Math.min( lastRemoved, this.dialog.layers_TreeBox.numberOfChildren - 1 );
            let node = this.dialog.layers_TreeBox.child( nodeIdx );
            this.dialog.ActivateLayer( node );
         }
      }
      else
         this.dialog.ActivateLayer( null );

      this.pushed = false;
   };

   this.moveUpLayer_Button = new ToolButton( this );
   this.moveUpLayer_Button.icon = this.scaledResource( ":/browser/move-up.png" );
   this.moveUpLayer_Button.setScaledFixedSize( 20, 20 );
   this.moveUpLayer_Button.toolTip = "Move layer up";
   this.moveUpLayer_Button.onMousePress = function()
   {
      this.hasFocus = true;

      let lastRemoved = -1;
      if ( this.dialog.layers_TreeBox.selectedNodes.length > 0 )
      {
         let selected = this.dialog.layers_TreeBox.selectedNodes[0];
         let selectedIdx = this.dialog.layers_TreeBox.childIndex( selected );
         if ( selectedIdx > 0 )
         {
            this.dialog.layers_TreeBox.remove( selectedIdx );
            this.dialog.layers_TreeBox.insert( selectedIdx-1, selected );
            this.dialog.ActivateLayer( selected );
            while ( this.dialog.layers_TreeBox.selectedNodes.length > 0 )
               this.dialog.layers_TreeBox.selectedNodes[0].selected = false;
            selected.selected = true;
         }
      }
      this.pushed = false;
   };

   this.moveDownLayer_Button = new ToolButton( this );
   this.moveDownLayer_Button.icon = this.scaledResource( ":/browser/move-down.png" );
   this.moveDownLayer_Button.setScaledFixedSize( 20, 20 );
   this.moveDownLayer_Button.toolTip = "Move layer down";
   this.moveDownLayer_Button.onMousePress = function()
   {
      this.hasFocus = true;

      let lastRemoved = -1;
      if ( this.dialog.layers_TreeBox.selectedNodes.length > 0 )
      {
         let selected = this.dialog.layers_TreeBox.selectedNodes[0];
         let selectedIdx = this.dialog.layers_TreeBox.childIndex( selected );
         if ( selectedIdx < this.dialog.layers_TreeBox.numberOfChildren - 1 )
         {
            this.dialog.layers_TreeBox.remove( selectedIdx );
            this.dialog.layers_TreeBox.insert( selectedIdx+1, selected );
            this.dialog.ActivateLayer( selected );
            while ( this.dialog.layers_TreeBox.selectedNodes.length > 0 )
               this.dialog.layers_TreeBox.selectedNodes[0].selected = false;
            selected.selected = true;
         }
      }
      this.pushed = false;
   };

   this.terms_Button = new ToolButton( this );
   this.terms_Button.text = "Terms of use of VizieR data";
   this.terms_Font = new Font( this.font.family, this.font.pointSize );
   this.terms_Font.underline = true;
   this.terms_Button.font = this.terms_Font;
   this.terms_Button.onClick = function()
   {
      Dialog.openBrowser( "http://cds.u-strasbg.fr/vizier-org/licences_vizier.html" );
   };

   this.layerButtons_Sizer = new HorizontalSizer;
   this.layerButtons_Sizer.spacing = 6;
   this.layerButtons_Sizer.add( this.addLayer_Button );
   this.layerButtons_Sizer.add( this.deleteLayer_Button );
   this.layerButtons_Sizer.addSpacing( 6 );
   this.layerButtons_Sizer.add( this.moveUpLayer_Button );
   this.layerButtons_Sizer.add( this.moveDownLayer_Button );
   this.layerButtons_Sizer.addStretch();
   this.layerButtons_Sizer.add( this.terms_Button );

   this.layers_Sizer = new VerticalSizer;
   this.layers_Sizer.spacing = 4;
   this.layers_Sizer.add( this.layers_TreeBox, 100 );
   this.layers_Sizer.add( this.layerButtons_Sizer );

   this.layerParameters_GroupBox = new GroupBox( this );
   this.layerParameters_GroupBox.sizer = new VerticalSizer;
   this.layerParameters_GroupBox.minWidth = this.font.width( "a" )*50;

   this.layers_Control = new Control( this );
   this.layers_Control.sizer = new HorizontalSizer;
   this.layers_Control.sizer.spacing = 4;
   this.layers_Control.sizer.add( this.layers_Sizer, 100 );
   this.layers_Control.sizer.add( this.layerParameters_GroupBox );

   this.layers_Section = new SectionBar( this, "Layers" );
   this.layers_Section.setSection( this.layers_Control );
   this.layers_Section.onToggleSection = function( section, toggleBegin )
   {
      if ( toggleBegin )
         this.dialog.layers_TreeBox.setFixedSize();
      else
         this.dialog.layers_TreeBox.setVariableSize();
   };

   this.activeFrame = null;

   this.ActivateLayer = function( node )
   {
      if ( this.dialog.activeFrame )
      {
         this.dialog.layerParameters_GroupBox.sizer.remove( this.dialog.activeFrame );
         this.dialog.activeFrame.visible = false;
      }
      if ( node )
      {
         this.dialog.layerParameters_GroupBox.sizer.add( node.frame );
         this.dialog.activeFrame = node.frame;
         this.dialog.activeFrame.visible = true;
         this.dialog.layerParameters_GroupBox.title = node.text( 0 ) + " Parameters";
      }
      this.dialog.adjustToContents();
   };

   this.AddLayerToTree = function( layer )
   {
      let node = new TreeBoxNode( this.layers_TreeBox );
      node.checkable = true;
      node.checked = layer.visible;
      node.setText( 0, layer.layerName );
      node.setIcon( 1, this.scaledResource( layer.gprops.showMarkers ? ":/browser/enabled.png" : ":/browser/disabled.png" ) );
      node.setToolTip( 1, "<p>Show markers</p>" );
      node.setIcon( 2, this.scaledResource( layer.gprops.showLabels ? ":/browser/enabled.png" : ":/browser/disabled.png" ) );
      node.setToolTip( 2, "<p>Show labels</p>" );
      node.setText( 3, layer.layerDescription );
      node.setToolTip( 3, "<p>" + layer.layerDescription + "</p>" );
      node.frame = layer.GetEditPanel( this );
      node.frame.visible = false;
      this.layers_TreeBox.adjustColumnWidthToContents( 0 );
      this.layers_TreeBox.adjustColumnWidthToContents( 1 );
      this.layers_TreeBox.adjustColumnWidthToContents( 2 );

      return node;
   };

   for ( let l = 0; l < this.layers.length; ++l )
   {
      let node = this.AddLayerToTree( this.layers[l] );
      node.selected = l == 0;
   }

   this.layers_TreeBox.currentNode = this.layers_TreeBox.child( 0 );
   this.ActivateLayer( this.layers_TreeBox.child( 0 ) );

   // -------------------------------------------------------------------------
   // General Properties
   // -------------------------------------------------------------------------

   this.vizierServer_Label = new Label( this );
   this.vizierServer_Label.text = "Vizier server:";
   this.vizierServer_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.vizierServer_Label.minWidth = this.labelWidth1;

   this.vizierServer_ComboBox = new ComboBox( this );
   this.vizierServer_ComboBox.editEnabled = false;
   for ( let m = 0; m < VizierCatalog.mirrors.length; ++m )
   {
      this.vizierServer_ComboBox.addItem( VizierCatalog.mirrors[m].name );
      if ( VizierCatalog.mirrors[m].address == this.engine.vizierServer )
         this.vizierServer_ComboBox.currentItem = parseInt( m );
   }
   this.vizierServer_ComboBox.onItemSelected = function()
   {
      this.dialog.engine.vizierServer = VizierCatalog.mirrors[this.dialog.vizierServer_ComboBox.currentItem].address;
   };

   this.clearCache_Button = new PushButton( this );
   this.clearCache_Button.text = "Clear Cache";
   this.clearCache_Button.toolTip = "<p>Clears the catalog query cache. "
      + "This forces the script to reload all catalog data on successive server queries.</p>"
      + "<p>This is useful when there has been any problem before, which may have "
      + "caused data corruption.</p>";
   this.clearCache_Button.onMousePress = function()
   {
      if ( __vizier_cache__ )
         __vizier_cache__ = null;
      (new MessageBox( "VizieR cache cleared", TITLE, StdIcon_Information )).execute();
   };

   this.vizierServer_Sizer = new HorizontalSizer;
   this.vizierServer_Sizer.spacing = 4;
   this.vizierServer_Sizer.add( this.vizierServer_Label );
   this.vizierServer_Sizer.add( this.vizierServer_ComboBox );
   this.vizierServer_Sizer.add( this.clearCache_Button );
   this.vizierServer_Sizer.addStretch();

   //

   this.outputMode_Label = new Label( this );
   this.outputMode_Label.text = "Output mode:";
   this.outputMode_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.outputMode_Label.minWidth = this.labelWidth1;

   this.outputMode_ComboBox = new ComboBox( this );
   this.outputMode_ComboBox.editEnabled = false;
   this.outputMode_ComboBox.addItem( "Annotate image" );
   this.outputMode_ComboBox.addItem( "Generate transparent overlay" );
   this.outputMode_ComboBox.addItem( "Generate SVG overlay" );
   this.outputMode_ComboBox.toolTip = "<p>The script's output can be:</p>"
      + "<ul><li><b>Annotate image</b>: Generates a new RGB image with the annotation drawn "
      + "over the original data.</li>"
      + "<li><b>Generate transparent overlay</b>: Generates a new transparent image "
      + "(alpha channel) with the annotation. It can be saved e.g. in PNG or TIFF format "
      + "and be used in other applications.</li>"
      + "<li><b>Generate SVG overlay</b>: Generates an SVG file with the annotation.</li></ul>";
   this.outputMode_ComboBox.currentItem = this.engine.outputMode;
   this.outputMode_ComboBox.onItemSelected = function()
   {
      this.dialog.engine.outputMode = this.dialog.outputMode_ComboBox.currentItem;
      this.dialog.applySTF_CheckBox.visible = this.dialog.outputMode_ComboBox.currentItem == Output_Image;
      this.dialog.svgFile_Frame.visible = this.dialog.outputMode_ComboBox.currentItem == Output_SVG;
   };

   this.applySTF_CheckBox = new CheckBox( this );
   this.applySTF_CheckBox.text = "Apply STF before annotation";
   this.applySTF_CheckBox.toolTip = "<p>Applies an STF transformation to the image before "
      + "drawing the annotation.</p>"
      + "<p>This is usually necessary when the original image is linear.</p>";
   this.applySTF_CheckBox.checked = this.engine.applySTF;
   this.applySTF_CheckBox.visible = this.engine.outputMode == Output_Image;
   this.applySTF_CheckBox.onCheck = function( checked )
   {
      this.dialog.engine.applySTF = checked;
   };

   this.svgFile_Label = new Label( this );
   this.svgFile_Label.text = "SVG file path:";
   this.svgFile_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.svgFile_Edit = new Edit( this );
   if ( this.engine.svgPath )
      this.svgFile_Edit.text = this.engine.svgPath;
   this.svgFile_Edit.setScaledMinWidth( 250 );
   this.svgFile_Edit.toolTip = "<p>Path where the SVG file will be created.</p>";
   this.svgFile_Edit.onTextUpdated = function( value )
   {
      this.dialog.engine.svgPath = value;
   };

   this.svgFile_Button = new ToolButton( this );
   this.svgFile_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.svgFile_Button.setScaledFixedSize( 20, 20 );
   this.svgFile_Button.toolTip = "<p>Select the SVG file path.</p>";
   this.svgFile_Button.onClick = function()
   {
      let sfd = new SaveFileDialog();
      if ( this.dialog.engine.svgPath )
         sfd.initialPath = this.dialog.engine.svgPath;
      sfd.caption = "Select the SVG file path";
      sfd.filters = [
         [ "SVG Files", ".svg" ]
      ];
      if ( sfd.execute() )
      {
         this.dialog.engine.svgPath = sfd.fileName;
         this.dialog.svgFile_Edit.text = sfd.fileName;
      }
   };

   this.svgFile_Frame = new Frame( this );
   this.svgFile_Frame.sizer = new HorizontalSizer;
   this.svgFile_Frame.sizer.margin = 0;
   this.svgFile_Frame.sizer.spacing = 4;
   this.svgFile_Frame.style = FrameStyle_Flat;
   this.svgFile_Frame.sizer.add( this.svgFile_Label );
   this.svgFile_Frame.sizer.add( this.svgFile_Edit );
   this.svgFile_Frame.sizer.add( this.svgFile_Button );
   this.svgFile_Frame.visible = this.engine.outputMode == Output_SVG;

   this.outputSizer = new HorizontalSizer;
   this.outputSizer.spacing = 4;
   this.outputSizer.add( this.outputMode_Label );
   this.outputSizer.add( this.outputMode_ComboBox );
   this.outputSizer.add( this.applySTF_CheckBox );
   this.outputSizer.add( this.svgFile_Frame );
   this.outputSizer.addStretch();

   //

   this.removeDuplicates_CheckBox = new CheckBox( this );
   this.removeDuplicates_CheckBox.text = "Remove duplicate objects";
   this.removeDuplicates_CheckBox.checked = this.engine.removeDuplicates;
   this.removeDuplicates_CheckBox.onCheck = function( checked )
   {
      this.dialog.engine.removeDuplicates = checked;
   };

   this.removeDuplicates_Sizer = new HorizontalSizer;
   this.removeDuplicates_Sizer.spacing = 4;
   this.removeDuplicates_Sizer.addUnscaledSpacing( this.labelWidth1 + ui4 );
   this.removeDuplicates_Sizer.add( this.removeDuplicates_CheckBox );
   this.removeDuplicates_Sizer.addStretch();

   //

   this.writeObjectsToFile_CheckBox = new CheckBox( this );
   this.writeObjectsToFile_CheckBox.text = "Write objects to a text file";
   this.writeObjectsToFile_CheckBox.toolTip = "<p>If enabled, the script will write "
      + "a text file with all catalog objects inside the image.</p>"
      + "<p>If the image has been loaded from an existing file, the output text file "
      + "will be created on the same directory and with the same file name, but with "
      + "the suffix '.objects.txt'.</p>"
      + "<p>If the image has not been loaded from a file, the script will ask for a "
      + "file path using a standard file dialog.</p>";
   this.writeObjectsToFile_CheckBox.checked = ("writeObjects" in this.engine) ? this.engine.writeObjects : false;
   this.writeObjectsToFile_CheckBox.onCheck = function( checked )
   {
      this.dialog.engine.writeObjects = checked;
   };

   this.writeObjectsToFile_Sizer = new HorizontalSizer;
   this.writeObjectsToFile_Sizer.spacing = 4;
   this.writeObjectsToFile_Sizer.addUnscaledSpacing( this.labelWidth1 + ui4 );
   this.writeObjectsToFile_Sizer.add( this.writeObjectsToFile_CheckBox );
   this.writeObjectsToFile_Sizer.addStretch();

   //

   this.graphicsScale_NumericControl = new NumericControl( this );
   this.graphicsScale_NumericControl.real = true;
   this.graphicsScale_NumericControl.label.text = "Graphics scale:";
   this.graphicsScale_NumericControl.label.minWidth = this.labelWidth1;
   this.graphicsScale_NumericControl.setRange( 0.1, 5 );
   this.graphicsScale_NumericControl.slider.setRange( 0, 49 );
   this.graphicsScale_NumericControl.slider.scaledMinWidth = 250;
   this.graphicsScale_NumericControl.setPrecision( 1 );
   this.graphicsScale_NumericControl.edit.minWidth = this.editWidth;
   this.graphicsScale_NumericControl.setValue( this.engine.graphicsScale );
   this.graphicsScale_NumericControl.toolTip = "<p>Scaling factor used when drawing "
      + "graphical elements on the image.</p>"
      + "<p>This parameter is useful to change the size of all elements of the image "
      + "annotation as a whole.</p>";
   this.graphicsScale_NumericControl.onValueUpdated = function( value )
   {
      this.dialog.engine.graphicsScale = value;
   };

   this.symbolScaleSizer = new HorizontalSizer;
   this.symbolScaleSizer.spacing = 4;
   this.symbolScaleSizer.add( this.graphicsScale_NumericControl );
   this.symbolScaleSizer.addStretch();

   //

   this.generalProperties_Control = new Control( this );
   this.generalProperties_Control.sizer = new VerticalSizer;
   this.generalProperties_Control.sizer.spacing = 4;
   this.generalProperties_Control.sizer.add( this.outputSizer );
   this.generalProperties_Control.sizer.add( this.vizierServer_Sizer );
   this.generalProperties_Control.sizer.add( this.removeDuplicates_Sizer );
   this.generalProperties_Control.sizer.add( this.writeObjectsToFile_Sizer );
   this.generalProperties_Control.sizer.add( this.symbolScaleSizer );

   this.generalProperties_Section = new SectionBar( this, "General Properties" );
   this.generalProperties_Section.setSection( this.generalProperties_Control );
   this.generalProperties_Section.onToggleSection = function( section, toggleBegin )
   {
      if ( toggleBegin )
         this.dialog.layers_TreeBox.setFixedSize();
      else
         this.dialog.layers_TreeBox.setVariableSize();
   };

   // -------------------------------------------------------------------------
   // Observation
   // -------------------------------------------------------------------------

   this.observationTime_Label = new Label( this );
   this.observationTime_Label.text = "Date and time:";
   this.observationTime_Label.toolTip = "<p>Date and time of observation in the UTC timescale.</p>";
   this.observationTime_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.observationTime_Label.setFixedWidth( this.labelWidth1 );

   this.observationTime_Y_SpinBox = new SpinBox( this );
   this.observationTime_Y_SpinBox.toolTip = "<p>UTC date of observation, year.</p>";
   this.observationTime_Y_SpinBox.setRange( -4000, +4000 );
   this.observationTime_Y_SpinBox.setFixedWidth( editWidth2 );

   this.observationTime_Y_Label = new Label( this );
   this.observationTime_Y_Label.text = "Y";
   this.observationTime_Y_Label.setFixedWidth( labelWidth3 );

   this.observationTime_N_SpinBox = new SpinBox( this );
   this.observationTime_N_SpinBox.toolTip = "<p>UTC date of observation, month.</p>";
   this.observationTime_N_SpinBox.setRange( 1, 12 );
   this.observationTime_N_SpinBox.setFixedWidth( editWidth1 );

   this.observationTime_N_Label = new Label( this );
   this.observationTime_N_Label.text = "M";
   this.observationTime_N_Label.setFixedWidth( labelWidth3 );

   this.observationTime_D_SpinBox = new SpinBox( this );
   this.observationTime_D_SpinBox.toolTip = "<p>UTC date of observation, day.</p>";
   this.observationTime_D_SpinBox.setRange( 0, 31 );
   this.observationTime_D_SpinBox.setFixedWidth( editWidth1 );

   this.observationTime_D_Label = new Label( this );
   this.observationTime_D_Label.text = "d";
   this.observationTime_D_Label.setFixedWidth( labelWidth3 );

   this.observationTime_H_SpinBox = new SpinBox( this );
   this.observationTime_H_SpinBox.toolTip = "<p>UTC time of observation, hour.</p>";
   this.observationTime_H_SpinBox.setRange( 0, 23 );
   this.observationTime_H_SpinBox.setFixedWidth( editWidth1 );

   this.observationTime_H_Label = new Label( this );
   this.observationTime_H_Label.text = "h";
   this.observationTime_H_Label.setFixedWidth( labelWidth3 );

   this.observationTime_M_SpinBox = new SpinBox( this );
   this.observationTime_M_SpinBox.toolTip = "<p>UTC time of observation, minute.</p>";
   this.observationTime_M_SpinBox.setRange( 0, 59 );
   this.observationTime_M_SpinBox.setFixedWidth( editWidth1 );

   this.observationTime_M_Label = new Label( this );
   this.observationTime_M_Label.text = "m";
   this.observationTime_M_Label.setFixedWidth( labelWidth3 );

   this.observationTime_S_SpinBox = new SpinBox( this );
   this.observationTime_S_SpinBox.toolTip = "<p>UTC time of observation, seconds.</p>";
   this.observationTime_S_SpinBox.setRange( 0, 59 );
   this.observationTime_S_SpinBox.setFixedWidth( editWidth1 );

   this.observationTime_S_Label = new Label( this );
   this.observationTime_S_Label.text = "s";
   this.observationTime_S_Label.setFixedWidth( labelWidth3 );

   this.observationTime_Sizer = new HorizontalSizer;
   this.observationTime_Sizer.spacing = 4;
   this.observationTime_Sizer.add( this.observationTime_Label );
   this.observationTime_Sizer.add( this.observationTime_Y_SpinBox );
   this.observationTime_Sizer.add( this.observationTime_Y_Label );
   this.observationTime_Sizer.add( this.observationTime_N_SpinBox );
   this.observationTime_Sizer.add( this.observationTime_N_Label );
   this.observationTime_Sizer.add( this.observationTime_D_SpinBox );
   this.observationTime_Sizer.add( this.observationTime_D_Label );
   this.observationTime_Sizer.add( this.observationTime_H_SpinBox );
   this.observationTime_Sizer.add( this.observationTime_H_Label );
   this.observationTime_Sizer.add( this.observationTime_M_SpinBox );
   this.observationTime_Sizer.add( this.observationTime_M_Label );
   this.observationTime_Sizer.add( this.observationTime_S_SpinBox );
   this.observationTime_Sizer.add( this.observationTime_S_Label );
   this.observationTime_Sizer.addStretch();

   //

   this.topocentric_CheckBox = new CheckBox( this );
   this.topocentric_CheckBox.text = "Topocentric";
   this.topocentric_CheckBox.toolTip = "<p>Compute topocentric positions of solar system objects.</p>"
      + "<p>If this option is enabled, positions calculated for planets, asteroids and comets "
      + "will be topocentric, that is, will be referred to the location of the observer with "
      + "respect to the center of the Earth, as defined by the following geodetic longitude, "
      + "latitude and height parameters.</p>"
      + "<p>If this option is disabled, the computed positions will be geocentric, which will "
      + "lead to inaccurate annotations, especially for objects relatively close to the Earth at "
      + "the date of observation.</p>";
   this.topocentric_CheckBox.onCheck = function( checked )
   {
      this.dialog.engine.topocentric = checked;
      this.dialog.observerData_Control.enabled = checked;
   };

   this.topocentric_Sizer = new HorizontalSizer;
   this.topocentric_Sizer.addUnscaledSpacing( this.labelWidth1 + ui4 );
   this.topocentric_Sizer.add( this.topocentric_CheckBox );
   this.topocentric_Sizer.addStretch();

   //

   this.longitude_Label = new Label( this );
   this.longitude_Label.text = "Longitude:";
   this.longitude_Label.toolTip = "<p>Observer position, geodetic longitude "
      + "(degrees, minutes and seconds or arc).</p>";
   this.longitude_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.longitude_Label.setFixedWidth( this.labelWidth1 );

   this.longitude_D_SpinBox = new SpinBox( this );
   this.longitude_D_SpinBox.setRange( 0, 179 );
   this.longitude_D_SpinBox.setFixedWidth( editWidth1 );
   this.longitude_D_SpinBox.toolTip = "<p>Geodetic longitude of the observer, degrees.</p>";

   this.longitude_D_Label = new Label( this );
   this.longitude_D_Label.text = "\u00B0";
   this.longitude_D_Label.setFixedWidth( labelWidth3 );

   this.longitude_M_SpinBox = new SpinBox( this );
   this.longitude_M_SpinBox.setRange( 0, 59 );
   this.longitude_M_SpinBox.setFixedWidth( editWidth1 );
   this.longitude_M_SpinBox.toolTip = "<p>Geodetic longitude of the observer, arcminutes.</p>";

   this.longitude_M_Label = new Label( this );
   this.longitude_M_Label.text = "'";
   this.longitude_M_Label.setFixedWidth( labelWidth3 );

   this.longitude_S_NumericEdit = new NumericEdit( this );
   this.longitude_S_NumericEdit.setReal( true );
   this.longitude_S_NumericEdit.setPrecision( 2 );
   this.longitude_S_NumericEdit.setRange( 0, 60 );
   this.longitude_S_NumericEdit.enableFixedPrecision( true );
   this.longitude_S_NumericEdit.label.visible = false;
   this.longitude_S_NumericEdit.edit.setFixedWidth( editWidth1 );
   this.longitude_S_NumericEdit.toolTip = "<p>Geodetic longitude of the observer, arcseconds.</p>";

   this.longitude_S_Label = new Label( this );
   this.longitude_S_Label.text = "\"";
   this.longitude_S_Label.setFixedWidth( labelWidth3 );

   this.longitudeIsWest_CheckBox = new CheckBox( this );
   this.longitudeIsWest_CheckBox.text = "West";
   this.longitudeIsWest_CheckBox.toolTip = "<p>When checked, the longitude is "
      + "negative (to the west of the reference meridian).</p>";

   this.longitude_Sizer = new HorizontalSizer;
   this.longitude_Sizer.spacing = 4;
   this.longitude_Sizer.add( this.longitude_Label );
   this.longitude_Sizer.add( this.longitude_D_SpinBox );
   this.longitude_Sizer.add( this.longitude_D_Label );
   this.longitude_Sizer.add( this.longitude_M_SpinBox );
   this.longitude_Sizer.add( this.longitude_M_Label );
   this.longitude_Sizer.add( this.longitude_S_NumericEdit );
   this.longitude_Sizer.add( this.longitude_S_Label );
   this.longitude_Sizer.add( this.longitudeIsWest_CheckBox );
   this.longitude_Sizer.addStretch();

   //

   this.latitude_Label = new Label( this );
   this.latitude_Label.text = "Latitude:";
   this.latitude_Label.toolTip = "<p>Observer position, geodetic latitude "
      + "(degrees, minutes and seconds or arc).</p>";
   this.latitude_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.latitude_Label.setFixedWidth( this.labelWidth1 );

   this.latitude_D_SpinBox = new SpinBox( this );
   this.latitude_D_SpinBox.setRange( 0, 89 );
   this.latitude_D_SpinBox.setFixedWidth( editWidth1 );
   this.latitude_D_SpinBox.toolTip = "<p>Geodetic latitude of the observer, degrees.</p>";

   this.latitude_D_Label = new Label( this );
   this.latitude_D_Label.text = "\u00B0";
   this.latitude_D_Label.setFixedWidth( labelWidth3 );

   this.latitude_M_SpinBox = new SpinBox( this );
   this.latitude_M_SpinBox.setRange( 0, 59 );
   this.latitude_M_SpinBox.setFixedWidth( editWidth1 );
   this.latitude_M_SpinBox.toolTip = "<p>Geodetic latitude of the observer, arcminutes.</p>";

   this.latitude_M_Label = new Label( this );
   this.latitude_M_Label.text = "'";
   this.latitude_M_Label.setFixedWidth( labelWidth3 );

   this.latitude_S_NumericEdit = new NumericEdit( this );
   this.latitude_S_NumericEdit.setReal( true );
   this.latitude_S_NumericEdit.setPrecision( 2 );
   this.latitude_S_NumericEdit.setRange( 0, 60 );
   this.latitude_S_NumericEdit.enableFixedPrecision( true );
   this.latitude_S_NumericEdit.label.visible = false;
   this.latitude_S_NumericEdit.edit.setFixedWidth( editWidth1 );
   this.latitude_S_NumericEdit.toolTip = "<p>Geodetic latitude of the observer, arcseconds.</p>";

   this.latitude_S_Label = new Label( this );
   this.latitude_S_Label.text = "\"";
   this.latitude_S_Label.setFixedWidth( labelWidth3 );

   this.latitudeIsSouth_CheckBox = new CheckBox( this );
   this.latitudeIsSouth_CheckBox.text = "South";
   this.latitudeIsSouth_CheckBox.toolTip = "<p>When checked, the latitude is "
      + "negative (southern hemisphere).</p>";

   this.latitude_Sizer = new HorizontalSizer;
   this.latitude_Sizer.spacing = 4;
   this.latitude_Sizer.add( this.latitude_Label );
   this.latitude_Sizer.add( this.latitude_D_SpinBox );
   this.latitude_Sizer.add( this.latitude_D_Label );
   this.latitude_Sizer.add( this.latitude_M_SpinBox );
   this.latitude_Sizer.add( this.latitude_M_Label );
   this.latitude_Sizer.add( this.latitude_S_NumericEdit );
   this.latitude_Sizer.add( this.latitude_S_Label );
   this.latitude_Sizer.add( this.latitudeIsSouth_CheckBox );
   this.latitude_Sizer.addStretch();

   //

   let height_ToolTip = "<p>Observer position, geodetic height in meters.</p>";

   this.height_M_Label = new Label( this );
   this.height_M_Label.text = "m";
   this.height_M_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.height_M_Label.setFixedWidth( labelWidth3 );
   this.height_M_Label.toolTip = height_ToolTip;

   this.height_NumericEdit = new NumericEdit( this );
   this.height_NumericEdit.setReal( false );
   this.height_NumericEdit.setRange( 0, 1e+07 );
   this.height_NumericEdit.label.text = "Height:";
   this.height_NumericEdit.label.setFixedWidth( this.labelWidth1 );
   this.height_NumericEdit.sizer.add( this.height_M_Label );
   this.height_NumericEdit.sizer.addStretch();
   this.height_NumericEdit.toolTip = height_ToolTip;

   //

   this.observerData_Control = new Control( this );
   this.observerData_Control.enabled = this.engine.topocentric;
   this.observerData_Control.sizer = new VerticalSizer;
   this.observerData_Control.sizer.spacing = 4;
   this.observerData_Control.sizer.add( this.longitude_Sizer );
   this.observerData_Control.sizer.add( this.latitude_Sizer );
   this.observerData_Control.sizer.add( this.height_NumericEdit );

   this.observation_Control = new Control( this );
   this.observation_Control.sizer = new VerticalSizer;
   this.observation_Control.sizer.spacing = 4;
   this.observation_Control.sizer.add( this.observationTime_Sizer );
   this.observation_Control.sizer.add( this.topocentric_Sizer );
   this.observation_Control.sizer.add( this.observerData_Control );

   this.observation_Section = new SectionBar( this, "Observation" );
   this.observation_Section.setSection( this.observation_Control );
   this.observation_Section.onToggleSection = function( section, toggleBegin )
   {
      if ( toggleBegin )
         this.dialog.layers_TreeBox.setFixedSize();
      else
         this.dialog.layers_TreeBox.setVariableSize();
   };

   // -------------------------------------------------------------------------
   // Buttons
   // -------------------------------------------------------------------------

   this.newInstance_Button = new ToolButton( this );
   this.newInstance_Button.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstance_Button.setScaledFixedSize( 20, 20 );
   this.newInstance_Button.toolTip = "New Instance";
   this.newInstance_Button.onMousePress = function()
   {
      this.hasFocus = true;
      this.pushed = false;
      this.dialog.updateEngineProperties();
      this.dialog.engine.SaveParameters();
      this.dialog.newInstance();
   };

   this.reset_Button = new ToolButton( this );
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.setScaledFixedSize( 20, 20 );
   this.reset_Button.toolTip = "<p>Resets all script parameters to factory-default values.</p>";
   this.reset_Button.onClick = function()
   {
      let msg = new MessageBox( "Do you really want to reset all script parameters to their default values?",
                                TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No );
      if ( msg.execute() == StdButton_Yes )
      {
         this.dialog.engine.ResetSettings();
         this.dialog.resetRequest = true;
         this.dialog.cancel();
      }
   };

   this.preview_Button = new ToolButton(this);
   this.preview_Button.text = "Preview";
   this.preview_Button.icon = this.scaledResource( ":/icons/find.png" );
   //this.preview_Button.setScaledFixedSize( 20, 20 );
   this.preview_Button.toolTip = "<p>Preview.</p>";
   this.preview_Button.onClick = function()
   {
      this.dialog.updateEngineProperties();
      let image = this.dialog.engine.RenderPreview();
      let previewDlg = new PreviewDialog( image, this.dialog.engine.metadata );
      previewDlg.execute();
   };

   this.ok_Button = new PushButton( this );
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      this.dialog.updateEngineProperties();
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton(this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function ()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.add(this.newInstance_Button);
   this.buttons_Sizer.add(this.reset_Button);
   this.buttons_Sizer.add(this.preview_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add( this.information_Label );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.layers_Section );
   this.sizer.add( this.layers_Control, 100 );
   this.sizer.add( this.generalProperties_Section );
   this.sizer.add( this.generalProperties_Control );
   this.sizer.add( this.observation_Section );
   this.sizer.add( this.observation_Control );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Image Annotation Script";
   this.adjustToContents();

   this.observationTime = function()
   {
      return Math.complexTimeToJD( this.observationTime_Y_SpinBox.value,
                                   this.observationTime_N_SpinBox.value,
                                   this.observationTime_D_SpinBox.value,
                                   (this.observationTime_H_SpinBox.value
                                       + (this.observationTime_M_SpinBox.value
                                          + this.observationTime_S_SpinBox.value/60)/60)/24 );
   };

   this.updateObservationTime = function()
   {
      let jd = this.engine.epoch;
      if ( !jd )
         jd = this.engine.epoch = 2451545.0;
      let A = Math.jdToComplexTime( jd );
      let hh = A[3]*24;
      let mm = Math.frac( hh )*60;
      let ss = Math.round( Math.frac( mm )*60 );
      mm = Math.trunc( mm );
      hh = Math.trunc( hh );
      if ( ss == 60 )
      {
         ss = 0;
         mm += 1;
      }
      if ( mm == 60 )
      {
         mm = 0;
         hh += 1;
      }
      if ( hh == 24 )
      {
         this.setObservationTime( Math.complexTimeToJD( A[0], A[1], A[2]+1, (mm + ss/60)/1440 ) );
         return;
      }
      this.observationTime_Y_SpinBox.value = A[0];
      this.observationTime_N_SpinBox.value = A[1];
      this.observationTime_D_SpinBox.value = A[2];
      this.observationTime_H_SpinBox.value = hh;
      this.observationTime_M_SpinBox.value = mm;
      this.observationTime_S_SpinBox.value = ss;
   };

   this.isTopocentric = function()
   {
      return this.topocentric_CheckBox.checked;
   };

   this.observerLongitude = function()
   {
      return (this.longitude_D_SpinBox.value
               + (this.longitude_M_SpinBox.value
                 + this.longitude_S_NumericEdit.value/60)/60)
           * (this.longitudeIsWest_CheckBox.checked ? -1 : +1);
   };

   this.observerLatitude = function()
   {
      return (this.latitude_D_SpinBox.value
               + (this.latitude_M_SpinBox.value
                 + this.latitude_S_NumericEdit.value/60)/60)
           * (this.latitudeIsSouth_CheckBox.checked ? -1 : +1);
   };

   this.observerHeight = function()
   {
      return this.height_NumericEdit.value;
   };

   this.updateObserverPosition = function()
   {
      this.topocentric_CheckBox.checked = this.engine.topocentric;

      this.observerData_Control.enabled = this.engine.topocentric;

      let l = this.engine.obsLongitude;
      if ( l > 180 )
         l -= 360;
      let s = Math.decimalToSexagesimal( l );
      s[3] = Math.roundTo( s[3], 2 );
      if ( s[3] > 59.99 )
      {
         s[3] = 0;
         if ( ++s[2] == 60 )
         {
            s[2] = 0;
            ++s[1];
         }
      }
      this.longitude_D_SpinBox.value = s[1];
      this.longitude_M_SpinBox.value = s[2];
      this.longitude_S_NumericEdit.setValue( s[3] );
      this.longitudeIsWest_CheckBox.checked = s[0] < 0;

      let s = Math.decimalToSexagesimal( this.engine.obsLatitude );
      s[3] = Math.roundTo( s[3], 2 );
      if ( s[3] > 59.99 )
      {
         s[3] = 0;
         if ( ++s[2] == 60 )
         {
            s[2] = 0;
            ++s[1];
         }
      }
      this.latitude_D_SpinBox.value = s[1];
      this.latitude_M_SpinBox.value = s[2];
      this.latitude_S_NumericEdit.setValue( s[3] );
      this.latitudeIsSouth_CheckBox.checked = s[0] < 0;

      this.height_NumericEdit.setValue( this.engine.obsHeight );
   };

   this.updateEngineProperties = function()
   {
      this.engine.layers = new Array();
      for ( let i = 0; i < this.layers_TreeBox.numberOfChildren; ++i )
      {
         let node = this.layers_TreeBox.child( i );
         node.frame.object.visible = node.checked;
         if ( node.frame.object.Validate && !node.frame.object.Validate() )
         {
            this.layers_TreeBox.currentNode = node;
            this.ActivateLayer( node );
            return;
         }
         this.engine.layers.push( node.frame.object );
      }

      this.engine.epoch = this.observationTime();
      this.engine.topocentric = this.isTopocentric();
      this.engine.obsLongitude = this.observerLongitude();
      this.engine.obsLatitude = this.observerLatitude();
      this.engine.obsHeight = this.observerHeight();
   };

   this.updateObservationTime();
   this.updateObserverPosition();
}

AnnotateDialog.prototype = new Dialog;

// ******************************************************************
// AnnotationEngine: Annotation engine
// ******************************************************************

function AnnotationEngine()
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      ANNOT_SETTINGS_MODULE,
      "engine",
      new Array(
         [ "vizierServer", DataType_String ],
         [ "removeDuplicates", DataType_Boolean ],
         [ "outputMode", DataType_UInt8 ],
         [ "applySTF", DataType_Boolean ],
         [ "svgPath", DataType_String ],
         [ "graphicsScale", DataType_Double ],
         [ "writeObjects", DataType_Boolean ],
         [ "epoch", DataType_Double ],
         [ "topocentric", DataType_Boolean ],
         [ "obsLongitude", DataType_Double ],
         [ "obsLatitude", DataType_Double ],
         [ "obsHeight", DataType_Double ]
      )
   );

   this.layers = new Array;
   this.vizierServer = "http://vizier.u-strasbg.fr/";
   this.removeDuplicates = true;
   this.outputMode = Output_Image;
   this.applySTF = true;
   this.svgPath = null;
   this.graphicsScale = 1;
   this.writeObjects = false;
   this.topocentric = false;

   this.Init = function( window )
   {
      if ( !window || !window.isWindow )
         throw Error( "The script requires an image" );
      this.window = window;

      if ( !this.LoadParameters() )
         if ( !this.LoadSettings() )
            this.SetDefaults();

      this.metadata = new ImageMetadata;
      this.metadata.ExtractMetadata( this.window );

      if ( this.metadata.ref_I_G == null )
         throw Error( "The image has no valid WCS coordinates" );

      this.epoch = this.metadata.observationTime ? this.metadata.observationTime : 2451545.0;
      this.topocentric = this.metadata.obsLongitude != null && this.metadata.obsLatitude != null;
      this.obsLongitude = this.topocentric ? this.metadata.obsLongitude : 0;
      this.obsLatitude = this.topocentric ? this.metadata.obsLatitude : 0;
      this.obsHeight = (this.topocentric && this.metadata.obsHeight) ? this.metadata.obsHeight : 0;

      console.writeln( "<end><cbr><br>" + "=".repeat( 79 ) );
      console.writeln( this.window.astrometricSolutionSummary() );

      if ( this.metadata.width*this.metadata.height*4 >= 2*1024*1024*1024 )
         throw Error( "The script cannot annotate images bigger than 536,870,912 pixels" );
   };

   this.SetDefaults = function()
   {
      this.layers = new Array;
      this.layers.push( new GridLayer );
      this.layers.push( new ConstBordersLayer );
      this.layers.push( new ConstLinesLayer );
      this.layers.push( new CatalogLayer( new NamedStarsCatalog ) );
      this.layers.push( new CatalogLayer( new MessierCatalog ) );
      this.layers.push( new CatalogLayer( new NGCICCatalog  ));
      this.layers.push( new CatalogLayer( new TychoCatalog ) );
      this.layers.push( new CatalogLayer( new PGCCatalog ) );
      this.layers.push( new CatalogLayer( new VisiblePlanets ) );
      this.layers.push( new CatalogLayer( new VisibleAsteroids ) );

      // Set default parameters
      // GridLayer
      this.layers[0].visible = true;
      this.layers[0].gprops.lineColor = 0x80ffffff;

      // ConstellationBorders
      this.layers[1].visible = false;
      this.layers[1].gprops.lineColor = 0x8000ffff;
      this.layers[1].gprops.lineWidth = 4;
      this.layers[1].gprops.showLabels = false;
      this.layers[1].gprops.labelColor = 0xff00ffff;
      this.layers[1].gprops.labelSize = 32;

      // ConstellationLines
      this.layers[2].visible = true;
      this.layers[2].gprops.lineColor = 0x80ff8080;
      this.layers[2].gprops.lineWidth = 4;
      this.layers[2].gprops.labelColor = 0xffff8080;
      this.layers[2].gprops.labelSize = 32;

      // NamedStarsCatalog
      this.layers[3].visible = true;
      this.layers[3].gprops.lineColor = 0xffffd700;
      this.layers[3].gprops.lineWidth = 2;
      this.layers[3].gprops.labelColor = 0xffffd700;
      this.layers[3].gprops.labelSize = 14;

      // Messier
      this.layers[4].gprops.lineColor = 0xff8080ff;
      this.layers[4].gprops.labelColor = 0xff8080ff;
      this.layers[4].gprops.labelSize = 16;

      // NGC/IC
      this.layers[5].gprops.lineColor = 0xffff8080;
      this.layers[5].gprops.labelColor = 0xffff8080;
      this.layers[5].gprops.labelSize = 16;

      // Tycho2
      this.layers[6].gprops.lineColor = 0xffffff00;
      this.layers[6].gprops.labelColor = 0xffffff00;
      this.layers[6].gprops.labelSize = 12;

      // PGC
      this.layers[7].visible = false;
      this.layers[7].gprops.lineColor = 0xff00ffff;
      this.layers[7].gprops.labelColor = 0xff00ffff;

      // Planets
      this.layers[8].visible = false;
      this.layers[8].gprops.lineColor = 0xffff8000;
      this.layers[8].gprops.labelColor = 0xffff8000;
      this.layers[8].gprops.labelSize = 16;

      // Asteroids
      this.layers[9].visible = false;
      this.layers[9].gprops.lineColor = 0xffff8000;
      this.layers[9].gprops.labelColor = 0xffff8000;
      this.layers[9].gprops.labelSize = 16;
   };

   this._base_LoadSettings = this.LoadSettings;
   this.LoadSettings = function()
   {
      this._base_LoadSettings();

      let version = Settings.read( this.MakeSettingsKey( "version" ), DataType_UCString );
      if ( !Settings.lastReadOK || version != VERSION )
         return false;

      let layersStr = Settings.read( this.MakeSettingsKey( "layers" ), DataType_UCString );
      if ( !Settings.lastReadOK || !layersStr )
         return false;

      let layerIds = layersStr.split( "|" );
      this.layers = new Array;
      for ( let l = 0; l < layerIds.length; ++l )
      {
         let layerDef = FindLayer( layerIds[l] );
         if ( layerDef )
         {
            let layer = eval( layerDef.constructor );
            layer.SetId( l );
            layer.LoadSettings();
            this.layers.push( layer );
         }
      }

      return true;
   };

   this._base_SaveSettings = this.SaveSettings;
   this.SaveSettings = function()
   {
      Settings.write( this.MakeSettingsKey( "version" ), DataType_UCString, VERSION );
      this._base_SaveSettings();

      let layerIds;
      for ( let l = 0; l < this.layers.length; ++l )
      {
         this.layers[l].SetId( l );
         this.layers[l].SaveSettings();
         if ( layerIds )
            layerIds += "|" + this.layers[l].layerName;
         else
            layerIds = this.layers[l].layerName;
      }

      if ( layerIds )
         Settings.write( this.MakeSettingsKey( "layers" ), DataType_UCString, layerIds );
   };

   this.ResetSettings = function ()
   {
      Settings.remove( ANNOT_SETTINGS_MODULE );
   };

   this._base_LoadParameters = this.LoadParameters;
   this.LoadParameters = function()
   {
      this._base_LoadParameters();

      let key = this.MakeParamsKey( "layers" );
      if ( !Parameters.has( key ) )
         return false;

      let layersStr = Parameters.getString( key );
      if ( !layersStr )
         return false;

      let layerIds = layersStr.split( "|" );
      this.layers = new Array;
      for ( let l = 0; l < layerIds.length; ++l )
      {
         let layerDef = FindLayer( layerIds[l] );
         if ( layerDef )
         {
            let layer = eval( layerDef.constructor );
            layer.SetId( l );
            layer.LoadParameters();
            this.layers.push( layer );
         }
      }

      return true;
   };

   this._base_SaveParameters = this.SaveParameters;
   this.SaveParameters = function()
   {
      this._base_SaveParameters();

      let layerIds;
      for ( let l = 0; l < this.layers.length; ++l )
      {
         this.layers[l].SetId( l );
         this.layers[l].SaveParameters();
         if ( layerIds )
            layerIds += "|" + this.layers[l].layerName;
         else
            layerIds = this.layers[l].layerName;
      }

      Parameters.set( this.MakeParamsKey( "layers" ), layerIds );
   };

   this.RenderGraphics = function (g, width, height)
   {
      let bounds = this.metadata.FindImageBounds();
      g.clipRect = new Rect(0, 0, width, height);
      g.antialiasing = true;
      g.textAntialiasing = true;
      g.transparentBackground = true;
      for ( let c = 0; c < this.layers.length; ++c )
         if ( this.layers[c].visible )
            this.layers[c].Draw( g, this.metadata, bounds, this.window, this.graphicsScale );
      g.end();
   };

   this.Render = function()
   {
      this.synchronizeMetadata();

      // Load data from catalogs
      for ( let c = 0; c < this.layers.length; ++c )
         if ( this.layers[c].visible )
            if ( this.layers[c].Load )
               this.layers[c].Load( this.metadata, this.vizierServer );

      try
      {
         if ( this.removeDuplicates )
            this.RemoveDuplicates();
      }
      catch ( ex )
      {
         console.writeln( ex );
      }

      let targetWindow = null;

      let width = this.window.mainView.image.width;
      let height = this.window.mainView.image.height;

      if ( this.outputMode == Output_SVG )
      {
         let svg = new SVG( this.svgPath );
         svg.viewBox = new Rect( width, height );
         g = new VectorGraphics( svg );
         console.writeln( "Rendering SVG overlay: ", this.svgPath );
         this.RenderGraphics( g, width, height );
      }
      else
      {
         let bmp = new Bitmap(width, height);
         if ( this.outputMode == Output_Image )
         {
            if ( this.applySTF )
            {
               let imageOrg = this.window.mainView.image;
               let tmpW = new ImageWindow( width, height, imageOrg.numberOfChannels,
                                           this.window.bitsPerSample, this.window.isFloatSample,
                                           imageOrg.isColor,
                                           this.window.mainView.fullId + "_Annotated" );
               tmpW.mainView.beginProcess( UndoFlag_NoSwapFile );
               tmpW.mainView.image.apply( imageOrg );
               ApplySTF( tmpW.mainView, this.window.mainView.stf );
               tmpW.mainView.endProcess();
               bmp.assign( tmpW.mainView.image.render() );
               tmpW.forceClose();
            }
            else
               bmp.assign( this.window.mainView.image.render() );
         }
         else
            bmp.fill( 0x00000000 );

         let g = new VectorGraphics( bmp );
         if ( !g.isPainting )
            throw Error( "The script cannot draw on the image" );

         console.writeln( "Rendering annotation" );
         this.RenderGraphics( g, width, height );

         if ( Parameters.isViewTarget )
         {
            if ( this.window.mainView.image.colorSpace != ColorSpace_RGB )
               (new ConvertToRGBColor).executeOn( this.window.mainView );
            this.window.mainView.beginProcess( UndoFlag_PixelData );
            this.window.mainView.image.blend( bmp );
            this.window.mainView.endProcess();
         }
         else
         {
            let newid = this.window.mainView.fullId + "_Annotated";
            console.writeln( "<end><cbr>Generating output image: ", newid );
            targetWindow = new ImageWindow( width, height,
                                            (this.outputMode == Output_Overlay) ? 4 : 3,
                                            this.window.bitsPerSample, this.window.isFloatSample,
                                            true/*color*/, newid );

            // Set FITS keywords and regenerate solutions
            targetWindow.mainView.beginProcess( UndoFlag_NoSwapFile );
            targetWindow.mainView.image.blend( bmp );
            this.metadata.SaveKeywords( targetWindow, false/*beginProcess*/ );
            this.metadata.SaveProperties( targetWindow );
            targetWindow.regenerateAstrometricSolution();
            targetWindow.mainView.endProcess();
            targetWindow.show();
         }
      }
      console.writeln( "Rendering ok" );

      if ( this.writeObjects )
         this.WriteObjects();

      return targetWindow;
   };

   this.RenderPreview = function()
   {
      this.synchronizeMetadata();

      // Load data from catalogs
      for ( let c = 0; c < this.layers.length; ++c )
         if ( this.layers[c].visible )
            if ( this.layers[c].Load )
               this.layers[c].Load( this.metadata, this.vizierServer );

      try
      {
         if ( this.removeDuplicates )
            this.RemoveDuplicates();
      }
      catch ( ex )
      {
         console.writeln( ex );
      }

      let width = this.window.mainView.image.width;
      let height = this.window.mainView.image.height;

      let bmp = new Bitmap( width, height );
      if ( this.outputMode == Output_Image )
      {
         if ( this.applySTF )
         {
            let imageOrg = this.window.mainView.image;
            let tmpW = new ImageWindow( width, height, imageOrg.numberOfChannels,
                                        this.window.bitsPerSample, this.window.isFloatSample,
                                        imageOrg.isColor,
                                        this.window.mainView.fullId + "_Annotated" );
            tmpW.mainView.beginProcess( UndoFlag_NoSwapFile );
            tmpW.mainView.image.apply( imageOrg );
            ApplySTF( tmpW.mainView, this.window.mainView.stf );
            tmpW.mainView.endProcess();
            bmp.assign( tmpW.mainView.image.render() );
            tmpW.forceClose();
         }
         else
            bmp.assign( this.window.mainView.image.render() );
      }
      else
         bmp.fill( 0x00000000 );

      let g = new VectorGraphics( bmp );
      if ( !g.isPainting )
         throw Error( "The script cannot draw on the image" );

      console.writeln( "Rendering annotation" );
      this.RenderGraphics( g, width, height );
      console.writeln( "Rendering ok" );

      return bmp;
   };

   this.WriteObjects = function()
   {
      let imagePath = this.window.filePath;
      let outPath;
      if ( imagePath != null && imagePath.length > 0 )
         outPath = File.changeExtension( imagePath, ".objects.txt" );
      else
      {
         let sfd = new SaveFileDialog;
         sfd.caption = "Select objects file path";
         sfd.filters = [
            ["Text files", "*.txt"]
         ];
         sfd.initialPath = this.window.mainView.fullId + ".objects.txt";
         if ( !sfd.execute() )
            return;
         outPath = sfd.fileName;
      }
      console.writeln( "Writing objects file: ", outPath );

      let file = new File();
      file.createForWriting( outPath );
      for ( let c = 0; c < this.layers.length; ++c )
         if ( this.layers[c].visible && this.layers[c].ToFile )
            this.layers[c].ToFile( file, this.metadata );
      file.close();
   };

   this.RemoveDuplicates = function()
   {
      console.writeln( "<end><cbr><br>Removing duplicate objects:" );
      console.flush();

      let T = new ElapsedTime;
      let numDuplicates = 0;
      let checks = 0;
      let numChecks = 0;
      let abortableBackup = jsAbortable;
      jsAbortable = true;

      // Sort objects in each catalog by declination
      for ( let c = 0; c < this.layers.length; ++c )
         if ( this.layers[c].GetObjects() )
            this.layers[c].GetObjects().sort(
                  function( a, b )
                  {
                     if ( a && b )
                        return (a.posRD.y == b.posRD.y) ? 0 : ((a.posRD.y < b.posRD.y) ? -1 : 1);
                     return a ? -1 : (b ? 1 : 0);
                  } );

      // Calculate the maximum number of checks
      for ( let c = 0; c < this.layers.length - 1; ++c )
      {
         let objects1 = this.layers[c].GetObjects();
         if ( objects1 )
            for ( let c2 = c + 1; c2 < this.layers.length; ++c2 )
            {
               let objects2 = this.layers[c2].GetObjects();
               if ( objects2 )
                  numChecks += objects1.length * objects2.length;
            }
      }

      let T1 = new ElapsedTime;
      let tolerancePuntual = Math.max( this.metadata.resolution, 3/3600 );
      let toleranceExtense = Math.max( this.metadata.resolution, 10/3600 );
      for ( let c1 = 0; c1 < this.layers.length-1; ++c1 )
      {
         let objects1 = this.layers[c1].GetObjects();
         if ( !objects1 )
            continue;

         //Find a coincident object in the other layers
         for ( let c2 = c1 + 1; c2 < this.layers.length; ++c2 )
         {
            let objects2 = this.layers[c2].GetObjects();
            if ( !objects2 || this.layers[c1].layerName == this.layers[c2].layerName )
               continue;

            let j0 = 0;
            for ( let i = 0; i < objects1.length; ++i )
            {
               let obj1 = objects1[i];
               if ( !obj1 )
                  continue;
               let puntual1 = obj1.diameter <= 5/3600;
               let cosDec = Math.cos( Math.rad( obj1.posRD.y ) );
               let minDec = obj1.posRD.y - toleranceExtense;
               let maxDec = obj1.posRD.y + toleranceExtense;

               for ( let j = j0; j < objects2.length; ++j )
               {
                  let obj2 = objects2[j];
                  if ( !obj2 )
                     continue;
                  if ( obj2.posRD.y < minDec )
                  {
                     j0 = j;
                     continue;
                  }
                  if ( obj2.posRD.y > maxDec )
                     break;
                  let puntual2 = obj2.diameter <= 5/3600;
                  let effectiveTolerance = (puntual1 || puntual2) ? tolerancePuntual : toleranceExtense;
                  let dx = (obj1.posRD.x - obj2.posRD.x)*cosDec;
                  let dy = obj1.posRD.y - obj2.posRD.y;
                  let dist2 = dx*dx + dy*dy;
                  if ( dist2 < effectiveTolerance*effectiveTolerance )
                  {
                     if ( numDuplicates <= 50 )
                     {
                        console.writeln( "<end><cbr>   ", obj1.name, " = ", obj2.name,
                                         format( " (%.2f mas)", Math.sqrt( dist2 )*3600000 ) );
                        if ( numDuplicates == 50 )
                           console.writeln( "<end><cbr>... Too many to show." );
                     }
                     objects2[j] = null;
                     numDuplicates++;
                  }
               }

               checks += objects2.length;

               if ( T1.value > 3 )
               {
                  console.writeln( format( "<end><cbr>Found %d duplicate objects (%.2f%%)", numDuplicates, checks/numChecks*100 ) );
                  processEvents();
                  T1.reset();
               }
            }
         }
      }

      console.writeln( format( "<end><cbr>Found %d duplicate objects in ", numDuplicates ), T.text );
      jsAbortable = abortableBackup;
   };

   this.synchronizeMetadata = function()
   {
      if ( this.epoch != null )
         this.metadata.observationTime = this.epoch;
      if ( this.topocentric != null )
         this.metadata.topocentric = this.topocentric;
      if ( this.obsLongitude != null )
         this.metadata.obsLongitude = this.obsLongitude;
      if ( this.obsLatitude != null )
         this.metadata.obsLatitude = this.obsLatitude;
      if ( this.obsHeight != null )
         this.metadata.obsHeight = this.obsHeight;
   };
}

// ----------------------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------------------

#ifndef USE_ANNOTATE_LIBRARY

function main()
{
   try
   {
      console.abortEnabled = true;

      let engine = new AnnotationEngine;
      if ( Parameters.isViewTarget )
         engine.Init( Parameters.targetView.window );
      else
      {
         if ( Parameters.getBoolean( "non_interactive" ) )
            engine.Init( ImageWindow.activeWindow );
         else
         {
            for ( ;; )
            {
               engine.Init( ImageWindow.activeWindow );
               let dialog = new AnnotateDialog( engine );
               if ( dialog.execute() )
                  break;
               if ( !dialog.resetRequest )
                  return;
               engine = new AnnotationEngine;
            }

            engine.SaveSettings();
         }
      }

      engine.Render();
      ++__PJSR_AdpAnnotateImage_SuccessCount;

      console.show();
   }
   catch ( error )
   {
      console.writeln( error.toString() );
      (new MessageBox( error.toString(), TITLE, StdIcon_Error )).execute();
   }
}

main();

#endif // !USE_ANNOTATE_LIBRARY
