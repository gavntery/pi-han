// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// ProcessWatcher.js - Released 2020-01-22T17:07:33Z
// ----------------------------------------------------------------------------
//
//
// Copyright (c) 2003-2020 Pleiades Astrophoto S.L. All Rights Reserved.
//
// Redistribution and use in both source and binary forms, with or without
// modification, is permitted provided that the following conditions are met:
//
// 1. All redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//
// 2. All redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// 3. Neither the names "PixInsight" and "Pleiades Astrophoto", nor the names
//    of their contributors, may be used to endorse or promote products derived
//    from this software without specific prior written permission. For written
//    permission, please contact info@pixinsight.com.
//
// 4. All products derived from this software, in any form whatsoever, must
//    reproduce the following acknowledgment in the end-user documentation
//    and/or other materials provided with the product:
//
//    "This product is based on software from the PixInsight project, developed
//    by Pleiades Astrophoto and its contributors (http://pixinsight.com/)."
//
//    Alternatively, if that is where third-party acknowledgments normally
//    appear, this acknowledgment must be reproduced in the product itself.
//
// THIS SOFTWARE IS PROVIDED BY PLEIADES ASTROPHOTO AND ITS CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PLEIADES ASTROPHOTO OR ITS
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, BUSINESS
// INTERRUPTION; PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; AND LOSS OF USE,
// DATA OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
// ----------------------------------------------------------------------------

/* beautify ignore:start */
#define TITLE "ProcessWatcher"

#include <pjsr/ColorSpace.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/SectionBar.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/NumericControl.jsh>

#include "ProcessWatcherProcessInstanceIO.js"
/* beautify ignore:end */

function BitmapBox( parent )
{
   this.__base__ = ScrollBox;
   this.__base__( parent );

   this.useHorizontalScrollBar = true;
   this.useVerticalScrollBar = false;

   this.autoScroll = false;
   this.horizontalScrollBarVisible = this.useHorizontalScrollBar;
   this.horizontalTracking = this.useHorizontalScrollBar;
   this.verticalScrollBarVisible = this.useVerticalScrollBar;
   this.verticalTracking = this.useVerticalScrollBar;

   this.bitmap = null;
   this.bitmapPosition = new Point( 0, 0 );
   this.scrollBarWidth = this.useVerticalScrollBar ? 24 : 0;
   this.scrollBarHeight = this.useHorizontalScrollBar ? 24 : 0;

   this.onResize = function() {};

   this.onMouseRelease = function( x, y, button, buttons, modifiers ) {};

   this.onHorizontalScrollPosUpdated = function()
   {
      this.viewport.update();
   };

   this.setBitmap = function( bitmap )
   {
      //console.writeln("this.width: ", this.width);
      //console.writeln("this.height: ", this.height);
      //console.writeln("this.viewport.width: ", this.viewport.width);
      //console.writeln("this.viewport.height: ", this.viewport.height);

      this.bitmap = bitmap;
      this.bitmapPosition = this.bitmap != null ?
         new Point(
            Math.max( 0, Math.round(
               0.5 * ( this.width - this.scrollBarWidth - this.bitmap.width )
            ) ),
            Math.max( 0, Math.round(
               0.5 * ( this.height - this.scrollBarHeight - this.bitmap.height )
            ) )
         ) :
         new Point( 0, 0 );

      this.lineWidth = this.useHorizontalScrollBar && this.bitmap != null ?
         Math.min( 10, this.bitmap.width ) : 0;
      this.lightHeight = 0;
      this.pageWidth = this.useHorizontalScrollBar && this.bitmap != null ?
         this.bitmap.width : 0;
      this.pageHeight = 0;
      this.setHorizontalScrollRange(
         0,
         this.useHorizontalScrollBar && this.bitmap != null ?
         Math.max( 0, this.bitmap.width - this.width ) : 0
      );
      this.setVerticalScrollRange( 0, 0 );

      this.viewport.update();
   };

   // viewport coordinate system is
   // positive x-axis to rightward,
   // positive y-axis downward
   this.viewport.onPaint = function( x0, y0, x1, y1 )
   {
      let graphics = new Graphics( this );

      graphics.fillRect( x0, y0, x1, y1, new Brush( this.dialog.backgroundColor ) );
      if ( this.parent.bitmap != null )
      {
         graphics.drawBitmap(
            this.parent.bitmapPosition.x - this.parent.scrollPosition.x,
            this.parent.bitmapPosition.y - this.parent.scrollPosition.y,
            this.parent.bitmap
         );
      }

      try
      {
         graphics.end();
      }
      catch ( error )
      {}
   };

   this.viewport.onResize = function()
   {
      this.parent.onResize();
   };

   this.viewport.onMouseRelease = function( x, y, button, buttons, modifiers )
   {
      this.parent.onMouseRelease(
         x - this.parent.bitmapPosition.x + this.parent.scrollPosition.x,
         y - this.parent.bitmapPosition.y + this.parent.scrollPosition.y,
         button,
         buttons,
         modifiers
      );
   };

   this.setBitmap( null );
}

BitmapBox.prototype = new ScrollBox;

function SetInstanceId( dialog )
{
   this.__base__ = Dialog;
   this.__base__();

   this.instanceId = 0;

   this.instanceIdEdit = new NumericEdit( this );
   this.instanceIdEdit.label.text = "Instance Id:";
   this.instanceIdEdit.setRange( 0, 255 );
   this.instanceIdEdit.setPrecision( 0 );
   this.instanceIdEdit.setValue( 0 );
   this.instanceIdEdit.toolTip = "<p>PixInsight instance id.</p>";
   this.instanceIdEdit.sizer.addStretch();
   this.instanceIdEdit.onValueUpdated = function( value )
   {
      this.dialog.instanceId = value;
   };

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
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

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.instanceIdEdit );
   this.sizer.add( this.buttons_Sizer );

}

SetInstanceId.prototype = new Dialog;

function ProcessWatcherDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.processIcons = ProcessInstance.icons();
   this.processInstances = [];
   this.measurements = {};

   this.initialInputDirectory = "<input directory>";

   // dialogs
   this.setInstanceIdDialog = new SetInstanceId( this );

   // file watcher
   this.busy = false; // flag to prevent reentrant FileWatcher events
   this.changed = true; // flag to signal a pending FileWatcher update event

   this.fileWatcher = new FileWatcher( [ this.initialInputDirectory ] );
   this.fileWatcher.dialog = this; // necessary because FileWatcher is not a Control object
   this.fileWatcher.onDirectoryChanged = function( /*dirPath*/)
   {
      this.dialog.changed = true;
   };

   // timer to check for new work
   this.updateTimer = new Timer;
   this.updateTimer.interval = 5; // timing interval in seconds
   this.updateTimer.periodic = true; // periodic or single shot timer
   this.updateTimer.dialog = this; // necessary because Timer is not a Control object
   this.updateTimer.onTimeout = function()
   {
      if ( this.dialog.changed && !this.dialog.busy )
      {
         this.dialog.busy = true;

         let measurements = this.dialog.measurements;
         for ( let processIdx = 0; processIdx < this.dialog.processInstances.length; processIdx++ )
         {
            let files = this.dialog.searchFiles( this.dialog.processIconsTreeBox.child( processIdx ).child( 0 ).text( 1 ) );
            this.dialog.sortFiles( files );
            let processIO = this.dialog.processInstances[ processIdx ];
            processIO.addInputFrames( files );
            processIO.setOutputDirectory( this.dialog.processIconsTreeBox.child( processIdx ).child( 1 ).text( 1 ) );
            let hasNewMeasurements = processIO.execute();
            if ( hasNewMeasurements && processIO.createsMeasurements() )
            {
               if ( measurements[ processIO.getProcessId() ] === undefined )
                  measurements[ processIO.getProcessId() ] = [];
               let newMeasurement = processIO.getMeasurements();
               // add new measurements array to measurement array
               measurements[ processIO.getProcessId() ].push.apply( measurements[ processIO.getProcessId() ], newMeasurement );
               processIO.sendMessage( parseInt( this.dialog.setInstanceIdDialog.instanceId ), measurements );
               let measurementDesc = processIO.getMeasurementDescription()
               this.dialog.addMeasurementTableNodes( newMeasurement, this.dialog.measurementTableTreeBox );
               this.dialog.addMeasurementComboBoxItems( measurementDesc, this.dialog.bitmap_Combo );
               let measureFilePath = this.dialog.getMeasureFilePath( processIO );
               this.dialog.plotMeasurements( measureFilePath, measurementDesc, measurements[ processIO.getProcessId() ] );
               this.dialog.convertSvgToBitmap( measureFilePath, measurementDesc );
               let bitmapFilePath = this.dialog.getMeasurementBitmapFilePath( measureFilePath, measurementDesc[ this.dialog.bitmap_Combo.currentItem + 2 ].name );
               this.dialog.addMeasurementBitmap( bitmapFilePath );
            }
            processIO.disableFrames();
         }
         this.dialog.busy = false;
      }
   };

   this.searchFileExtend = function( dirPath, files, fileExtension )
   {
      let find = new FileFind;
      // [ "All supported formats", ".xisf", ".fit", ".fits", ".fts" ],
      if ( find.begin( dirPath + "/*" + fileExtension ) )
         do {
            if ( find.name != "." && find.name != ".." )
            {
               let item = {
                  name: dirPath + "/" + find.name,
                  lastModified: find.lastModified
               };
               if ( !find.isDirectory )
                  files.push( item );
            }
         }
         while ( find.next() );
   };

   this.sortFiles = function( files )
   {
      files.sort( function( a, b )
      {
         return a.lastModified - b.lastModified;
      } );
   };

   // methods
   this.searchFiles = function( dirPath )
   {
      let files = [];
      let find = new FileFind;
      // [ "All supported formats", ".xisf", ".fit", ".fits", ".fts" ],
      this.searchFileExtend( dirPath, files, ".xisf" );
      this.searchFileExtend( dirPath, files, ".fits" );
      this.searchFileExtend( dirPath, files, ".fit" );
      this.searchFileExtend( dirPath, files, ".fts" );
      return files;
   };

   this.addDirectoryNodes = function( inputDirectory, outputDirectory, parentNode )
   {
      let inputDirectoryNode = new TreeBoxNode( parentNode );
      inputDirectoryNode.setText( 0, "Input directory" );
      inputDirectoryNode.setText( 1, inputDirectory );
      let outputDirectoryNode = new TreeBoxNode( parentNode );
      outputDirectoryNode.setText( 0, "Output directory" );
      outputDirectoryNode.setText( 1, outputDirectory );
   };

   this.addMessageNode = function( instanceId, parentNode )
   {
      let messageNode = new TreeBoxNode( parentNode );
      messageNode.setText( 0, "Message node" );
      messageNode.setText( 1, instanceId.toString() );
   };

   this.addMeasurementTableNodes = function( measurements, tableTreeBox )
   {
      for ( let i = 0; i < measurements.length; ++i )
      {
         let newMeasurementNode = new TreeBoxNode( tableTreeBox );
         let measurement = measurements[ i ];
         for ( let j = 0; j < measurement.length; ++j )
         {
            newMeasurementNode.setText( j, measurement[ j ].toString() );
            tableTreeBox.adjustColumnWidthToContents( j );
         }
      }
   };

   this.addMeasurementComboBoxItems = function( measurementDesc, comboBox )
   {
      for ( let i = 0; i < measurementDesc.length; ++i )
         if ( measurementDesc[ i ].isMeasure )
            comboBox.addItem( measurementDesc[ i ].name );
   };

   this.getMeasureFilePath = function( processIO )
   {
      return File.systemTempDirectory + "/" + processIO.getProcessId() + "_measurement";
   };

   this.getMeasurementSvgFilePath = function( measureFilePath, measurementDesc )
   {
      return measureFilePath + "_" + measurementDesc + ".svg";
   };

   this.getMeasurementBitmapFilePath = function( measureFilePath, measurementDesc )
   {
      return measureFilePath + "_" + measurementDesc + ".png";
   };

   function FileData( image, description, instance, outputFormat )
   {
      this.image = image;
      this.description = description;
      this.filePath = instance.filePath;

      if ( outputFormat.canStoreICCProfiles && instance.format.canStoreICCProfiles )
         this.iccProfile = instance.iccProfile;
      else
         this.iccProfile = undefined;

      if ( outputFormat.canStoreKeywords && instance.format.canStoreKeywords )
         this.keywords = instance.keywords;
      else
         this.keywords = undefined;

      if ( outputFormat.canStoreMetadata && instance.format.canStoreMetadata )
         this.metadata = instance.metadata;
      else
         this.metadata = undefined;

      if ( outputFormat.canStoreThumbnails && instance.format.canStoreThumbnails )
         this.thumbnail = instance.thumbnail;
      else
         this.thumbnail = undefined;
   };

   this.plotMeasurements = function( measureFilePath, measurementDesc, measurements )
   {
      // write data to file
      let dataFile = new File();
      dataFile.create( measureFilePath + ".dat" );
      for ( let i = 0; i < measurements.length; ++i )
      {
         let tokens = measurements[ i ].toString().split( "," );
         let line = "" + i;
         for ( let j = 1; j < tokens.length; ++j )
            line = line + " " + tokens[ j ];
         dataFile.outTextLn( line );
      }
      dataFile.close()

      for ( let i = 0; i < measurementDesc.length; ++i )
      {
         if ( !measurementDesc[ i ].isMeasure )
            continue;
         let svgFileName = this.getMeasurementSvgFilePath( measureFilePath, measurementDesc[ i ].name );
         let gpIndex = i + 1;
         let gnuplotSrc = "set terminal svg enhanced size 800,200 enhanced background rgb 'white' font 'helvetica,12'; " +
            "set output '" + svgFileName + "';" +
            "set nokey;" +
            "plot '" + measureFilePath + ".dat' using 1:" + gpIndex + " w lp;";
         let p = new ExternalProcess( "gnuplot -e \"" + gnuplotSrc + "\"" );
         p.waitForFinished();
         if ( p.exitCode != 0 )
         {
            let e = p.stderr;
            throw "gnuplot process failed:\n" + gnuplotSrc + ( ( e.length > 0 ) ? "\n" + e : "" );
         }
      }
   };

   this.convertSvgToBitmap = function( measureFilePath, measurementDesc )
   {
      for ( let i = 0; i < measurementDesc.length; ++i )
      {
         if ( !measurementDesc[ i ].isMeasure )
            continue;
         let F = new FileFormat( ".svg", true /*toRead*/ , false /*toWrite*/ );
         let f = new FileFormatInstance( F );
         let svgFileName = this.getMeasurementSvgFilePath( measureFilePath, measurementDesc[ i ].name );
         let d = f.open( svgFileName );
         let bitsPerSample = d[ 0 ].bitsPerSample;
         let floatSample = d[ 0 ].ieeefpSampleFormat;
         let image = new Image( 1, 1, 1, ColorSpace_Gray, bitsPerSample, floatSample ? SampleType_Real : SampleType_Integer );
         if ( !f.readImage( image ) )
            throw new Error( "Unable to read file: " + filePath );

         let data = new FileData( image, d[ 0 ], f, ".png" );

         let outputFilePath = this.getMeasurementBitmapFilePath( measureFilePath, measurementDesc[ i ].name );
         let Fout = new FileFormat( ".png", false /*toRead*/ , true /*toWrite*/ );
         let fout = new FileFormatInstance( Fout );
         if ( !fout.create( outputFilePath ) )
            throw new Error( "Error creating output file: " + outputFilePath );

         let dout = new ImageDescription( data.description );
         dout.bitsPerSample = data.image.bitsPerSample;
         dout.ieeefpSampleFormat = data.image.isReal;
         if ( !fout.setOptions( dout ) )
            throw new Error( "Unable to set output file options: " + outputFilePath );
         if ( !fout.writeImage( data.image ) )
            throw new Error( "Error writing output file: " + outputFilePath );
         fout.close();
         data.image.free();
      }
   };

   this.addMeasurementBitmap = function( bitmapFilePath )
   {
      let bitmap = new Bitmap( bitmapFilePath );
      this.bitmapBox.setBitmap( bitmap );
   };

   // GUI elements
   this.processIconsTreeBox = new TreeBox( this );
   this.processIconsTreeBox.alternateRowColor = true;
   this.processIconsTreeBox.headerVisible = false;
   this.processIconsTreeBox.numberOfColumns = 2; // label, name
   this.processIconsTreeBox.rootDecoration = true;
   this.processIconsTreeBox.uniformRowHeight = true;
   this.processIconsTreeBox.minWidth = 400;
   this.processIconsTreeBox.minHeight = 200;
   this.processIconsTreeBox.onNodeExpanded = function()
   {
      this.dialog.processIconsTreeBox.adjustColumnWidthToContents( 0 );
      this.dialog.processIconsTreeBox.adjustColumnWidthToContents( 1 );
   };

   let prevNode = null;
   for ( let i = 0; i < this.processIcons.length; prevNode = this.processInstances[ i ], ++i )
   {
      let pio = ProcessInstanceIO.create( this.processIcons[ i ] );
      if ( pio === undefined )
      {
         let processInstance = ProcessInstance.fromIcon( this.processIcons[ i ] );
         console.criticalln( "Unsupported process ID: " + processInstance.processId() );
         continue;
      }
      let iconNode = new TreeBoxNode( this.processIconsTreeBox );
      iconNode.setText( 0, this.processIcons[ i ] );
      this.processInstances.push( pio );
      this.addDirectoryNodes( prevNode === null ? this.initialInputDirectory : prevNode.getOutputDirectory(), pio.getOutputDirectory(), iconNode );
      this.addMessageNode( -1, iconNode ); // default - no message sending
   }

   this.processIconsTreeBox.adjustColumnWidthToContents( 0 );
   this.processIconsTreeBox.adjustColumnWidthToContents( 1 );

   this.inputDirectory_Button = new PushButton( this );
   this.inputDirectory_Button.text = "Set Directory";
   this.inputDirectory_Button.onClick = function()
   {
      if ( this.dialog.processIconsTreeBox.selectedNodes.length == 0 )
      {
         new MessageBox( "Select a process directory node", TITLE, StdIcon_Error ).execute();
         return;
      }
      let gdd = new GetDirectoryDialog();
      if ( gdd.execute() )
      {
         this.dialog.inputDirectory = gdd.directory;
         this.dialog.processIconsTreeBox.selectedNodes[ 0 ].setText( 1, this.dialog.inputDirectory );
      }
   };

   this.messageReceive_Button = new PushButton( this );
   this.messageReceive_Button.text = "Set Message Node";
   this.messageReceive_Button.onClick = function()
   {
      if ( this.dialog.processIconsTreeBox.selectedNodes.length == 0 )
      {
         new MessageBox( "Select a PixInsight instance number to receive messages from this process", TITLE, StdIcon_Error ).execute();
         return;
      }
      if ( this.dialog.setInstanceIdDialog.execute() )
      {
         this.dialog.processIconsTreeBox.selectedNodes[ 0 ].setText( 1, this.dialog.setInstanceIdDialog.instanceId.toString() );
      }
   };

   this.start_Button = new PushButton( this );
   this.start_Button.text = "Start";
   this.start_Button.onClick = function()
   {
      this.dialog.updateTimer.start();
   };

   this.stop_Button = new PushButton( this );
   this.stop_Button.text = "Stop";
   this.stop_Button.onClick = function()
   {
      this.dialog.updateTimer.stop();
   };

   this.ButtonsSizer = new VerticalSizer;
   this.ButtonsSizer.margin = 8;
   this.ButtonsSizer.spacing = 8;
   this.ButtonsSizer.add( this.inputDirectory_Button );
   this.ButtonsSizer.add( this.messageReceive_Button );
   this.ButtonsSizer.add( this.start_Button );
   this.ButtonsSizer.add( this.stop_Button );
   this.ButtonsSizer.addStretch();

   this.hSizer = new HorizontalSizer;
   this.hSizer.margin = 8;
   this.hSizer.spacing = 8;
   this.hSizer.add( this.processIconsTreeBox );
   this.hSizer.add( this.ButtonsSizer );

   // Table Control
   this.measurementTables = [];
   this.processIcon_Combo = new ComboBox( this );
   this.processIcon_Combo.editEnabled = false;

   for ( let i = 0; i < this.processInstances.length; ++i )
   {
      let processInstanceIO = this.processInstances[ i ];
      if ( processInstanceIO.createsMeasurements() )
      {
         this.processIcon_Combo.addItem( processInstanceIO.getProcessId() );
         let measurementDesc = processInstanceIO.getMeasurementDescription();
         let measurementTableTreeBox = new TreeBox( this );
         measurementTableTreeBox.alternateRowColor = true;
         measurementTableTreeBox.headerVisible = true;
         measurementTableTreeBox.numberOfColumns = measurementDesc.length;
         for ( let j = 0; j < measurementTableTreeBox.numberOfColumns; j++ )
            measurementTableTreeBox.setHeaderText( j, measurementDesc[ j ].name );
         this.measurementTables[ i ] = measurementTableTreeBox;
      }
   }

   this.measurementTableTreeBox = this.measurementTables.length != 0 ? this.measurementTables[ 0 ] : undefined;

   this.processIcon_Combo.onItemSelected = function()
   {
      this.dialog.measurementTableTreeBox = this.dialog.measurementTables[ this.currentItem ];
   };

   // measurement plot box
   this.bitmapBox = new BitmapBox( this );
   this.bitmapBox.setBitmap( null );

   this.bitmap_Combo = new ComboBox( this );
   this.bitmap_Combo.editEnabled = false;

   this.bitmap_Sizer = new HorizontalSizer;
   this.bitmap_Sizer.add( this.bitmapBox );

   this.bitmap_Combo.onItemSelected = function()
   {
      let processInstanceIO = this.dialog.processInstances[ this.dialog.processIcon_Combo.currentItem ];
      let measurementDesc = processInstanceIO.getMeasurementDescription();
      let bitmapPath = this.dialog.getMeasurementBitmapFilePath( this.dialog.getMeasureFilePath( processInstanceIO ), measurementDesc[ this.currentItem + 2 ].name );
      this.dialog.addMeasurementBitmap( bitmapPath );
   };

   // Section Bars
   this.processIcons_Section = new SectionBar( this, "Process Icons" );
   this.processIcons_Control = new Control( this );
   this.processIcons_Control.sizer = new VerticalSizer;
   this.processIcons_Control.sizer.scaledSpacing = 4;
   this.processIcons_Section.setSection( this.processIcons_Control );
   this.processIcons_Control.onToggleSection = function( bar, toggleBegin )
   {
      if ( !toggleBegin )
      {
         this.dialog.setVariableHeight();
         this.dialog.adjustToContents();
         this.dialog.setFixedHeight();
      }
   };

   this.processIcons_Control.sizer.add( this.hSizer );

   this.measurementTable_Section = new SectionBar( this, "Measurements" );
   this.measurementTable_Control = new Control( this );
   this.measurementTable_Control.sizer = new VerticalSizer;
   this.measurementTable_Control.sizer.scaledSpacing = 4;
   this.measurementTable_Section.setSection( this.measurementTable_Control );
   this.measurementTable_Control.onToggleSection = function( bar, toggleBegin )
   {
      if ( !toggleBegin )
      {
         this.dialog.setVariableHeight();
         this.dialog.adjustToContents();
         this.dialog.setFixedHeight();
      }
   };

   this.measurementTable_Control.sizer.add( this.processIcon_Combo );
   if ( this.dialog.measurementTableTreeBox !== undefined )
      this.measurementTable_Control.sizer.add( this.dialog.measurementTableTreeBox );

   this.bitmapBox_Section = new SectionBar( this, "Plot" );
   this.bitmapBox_Control = new Control( this );
   this.bitmapBox_Control.sizer = new VerticalSizer;
   this.bitmapBox_Control.sizer.scaledSpacing = 4;
   this.bitmapBox_Section.setSection( this.bitmapBox_Control );
   this.bitmapBox_Control.onToggleSection = function( bar, toggleBegin )
   {
      if ( !toggleBegin )
      {
         this.dialog.setVariableHeight();
         this.dialog.adjustToContents();
         this.dialog.setFixedHeight();
      }
   };

   this.bitmapBox_Control.sizer.add( this.bitmap_Combo );
   this.bitmapBox_Control.sizer.add( this.bitmap_Sizer );

   // Global Sizer
   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.processIcons_Section );
   this.sizer.add( this.processIcons_Control );
   this.sizer.add( this.measurementTable_Section );
   this.sizer.add( this.measurementTable_Control );
   this.sizer.add( this.bitmapBox_Section );
   this.sizer.add( this.bitmapBox_Control );

   this.sizer.addSpacing( 4 );
   this.windowTitle = TITLE + " Script";
   this.userResizable = true;
   this.adjustToContents();

   this.onHide = function()
   {
      this.updateTimer.stop();
   };
}

ProcessWatcherDialog.prototype = new Dialog;

function main()
{
   (new ProcessWatcherDialog()).execute();
}

main();

// ----------------------------------------------------------------------------
// EOF ProcessWatcher.js - Released 2020-01-22T17:07:33Z
