// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BatchFrameAcquisition.js - Released 2020-01-24T13:16:56Z
// ----------------------------------------------------------------------------
//
// This file is part of BatchFrameAcquisition Script version 0.2.1
//
// Copyright (c) 2015-2020 Klaus Kretzschmar. All Rights Reserved.
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
#feature-id    Batch Processing > BatchFrameAcquisition

#feature-info  A batch image acquisition utility.<br/>\
   <br/>\
   Copyright &copy; 2015-2020 Klaus Kretzschmar. All Rights Reserved.

#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>

// ### BUG: This generates an "unmatched #endif ..." error if
// ../AdP/ImageSolver.js also included (see below).
//#include <pjsr/NumericControl.jsh>

#define USE_SOLVER_LIBRARY true
#define SETTINGS_MODULE "ACQUISITION"
#define STAR_CSV_FILE   File.systemTempDirectory + "/stars.csv"
#define TITLE "Batch Frame Acquisition"

#include "../../AdP/WCSmetadata.jsh"
#include "../../AdP/AstronomicalCatalogs.jsh"
#include "../../AdP/CommonUIControls.js"
#include "../../AdP/ImageSolver.js"
#include "../../AdP/SearchCoordinatesDialog.js"

#include "../CoordUtils.jsh"
#include "../INDI-helper.jsh"

#define VERSION "0.2.1"

#undef UPLOAD_DATA_FEATURE
/* beautify ignore:end */

function BatchFrameAcquisitionEngine()
{
   this.deviceController = new IndigoDeviceController;

   this.timer = new ElapsedTime;

   this.mountDevice = "";
   this.ccdDevice = "";
   this.filterWheelDevice = "";
   this.extFilterWheelDevice = ""; // external filter wheel device
   this.focuserDevice = "";

   // mount parameters
   this.doMove = false;
   this.automaticMove = false;
   this.automaticSync = false;
   this.park = false;

   this.center = false;
   this.align = false;
   this.computeApparentPos = false;
   this.alignModelFile = "";

   // camera parameters
   this.binningX = {
      idx: 0,
      text: "1"
   };
   this.binningY = {
      idx: 0,
      text: "1"
   };
   this.frameType = {
      idx: 0,
      text: "Light"
   };
   this.filterKeys = [];
   this.filterDict = {};
   this.exposureTime = 0.001;
   this.exposureDelay = 0.0;
   this.numOfFrames = 1;
   this.openClientImages = true;
   this.saveClientImages = true;
   this.clientDownloadDir = "";
   this.clientFileTemplate = "";
   this.clientOutputHints = "";
   this.overwriteClientFiles = false;
   this.serverDownloadDir = "";
   this.serverFileTemplate = "";
   this.uploadMode = {
      idx: 0,
      text: "Client only"
   };

   // on error modes
   this.onError = 0;

   // processing parameters
   // fraction of exposure time spent for the image used to center the object
   this.centerImageExpTimeFraction = 0.1;

   // target list
   this.targets = [];
   this.targetInHourAngle = false;

   // worklist
   this.worklist = [];

   // cloud upload parameters
   this.cloudURL = "";
   this.auth_token = 0;
   this.wait = false;

   this.executeController = function()
   {
      if ( !this.deviceController.executeGlobal() )
      {
         console.criticalln( "IndigoDeviceController.executeGlobal() failed" );
         throw new Error( "IndigoDeviceController.executeGlobal() failed" );
      }
   };

   this.restartTimer = function()
   {
      this.timer.reset();
   };

   this.timeout = function()
   {
      if ( this.timer.value > 3 )
      {
         console.criticalln( "Timeout reached" );
         return true;
      }
      return false;
   };

   this.deviceSupportsFilter = function()
   {
      return this.filterWheelDevice != "" || this.extFilterWheelDevice != "";
   };

   this.getFilterWheelDeviceName = function()
   {
      return ( this.extFilterWheelDevice != "" ) ? this.extFilterWheelDevice : this.filterWheelDevice;
   };

   this.doesNotNeedFilter = function()
   {
      if ( this.frameType.text == "Dark" || this.frameType.text == "Bias" )
         return true;
      return false;
   };

   this.print = function()
   {
      console.writeln( "================================================" );
      console.noteln( "INDI devices:" );
      console.writeln( "Mount device:              " + this.mountDevice );
      console.writeln( "Camera device:             " + this.ccdDevice );
      console.writeln( "Filter device:             " + this.getFilterWheelDeviceName() );
      console.writeln( "Focus device:              " + this.focuserDevice );
      console.writeln( "------------------------------------------------" );
      console.noteln( "Mount parameters:" );
      console.writeln( "Center:                    " + ( this.center ? "true" : "false" ) );
      console.writeln( "Compute apparent pos:      " + ( this.computeApparentPos ? "true" : "false" ) );
      console.writeln( "Alignment corr:            " + ( this.align ? "true" : "false" ) );
      console.writeln( "Alignment file:            " + this.alignModelFile );
      console.writeln( "------------------------------------------------" );
      console.noteln( "Camera parameters:" );
      console.writeln( "Binning X:                 " + this.binningX.text );
      console.writeln( "Binning Y:                 " + this.binningY.text );
      console.writeln( "Frame type:                " + this.frameType.text );
      console.writeln( "Exposure time:             " + this.exposureTime );
      console.writeln( "Exposure delay:            " + this.exposureDelay );
      console.writeln( "Save frames:               " + ( this.saveClientImages ? "true" : "false" ) );
      console.writeln( "Open frames:               " + ( this.openClientImages ? "true" : "false" ) );
      console.writeln( "Client download directory: " + this.clientDownloadDir );
      console.writeln( "Client file template:      " + this.clientFileTemplate );
      console.writeln( "Client output hints:       " + this.clientOutputHints );
      console.writeln( "Overwrite client file:     " + ( this.overwriteClientFiles ? "true" : "false" ) );
      console.writeln( "Upload mode:               " + this.uploadMode.text );
      console.writeln( "Server download directory: " + this.serverDownloadDir );
      console.writeln( "Server file template:      " + this.serverFileTemplate );
      console.writeln( "------------------------------------------------" );
      console.noteln( "Filter wheel parameters:" );
      console.write( "Filter:               " );
      for ( let i = 0; i < this.filterKeys.length; ++i )
         console.write( this.filterKeys[ i ] + "(" + this.filterDict[ this.filterKeys[ i ] ] + ")" + ", " );
      console.writeln( " " );
      console.writeln( "------------------------------------------------" );
      console.noteln( "Targets:" );
      console.writeln( format( "%-15s|%-15s|%-15s|", "Name", this.targetInHourAngle ? "Hour Angle" : "Right Ascension", "Declination" ) );
      console.writeln( "------------------------------------------------" )
      for ( let i = 0; i < this.targets.length; ++i )
         console.writeln( format( "%-15s|% 2.12f|% 3.11f|", this.targets[ i ].name, this.targets[ i ].ra, this.targets[ i ].dec ) );
      console.writeln( "================================================" );
   };

   this.createWorklist = function()
   {
      if ( this.targets.length == 0 )
      {
         ( new MessageBox( "You must specify at least one target", "Error", StdIcon_Error ) ).execute();
         return [];
      }

      if ( !this.doesNotNeedFilter() && this.filterKeys.length == 0 )
      {
         ( new MessageBox( "You must specify at least one filter", "Error", StdIcon_Error ) ).execute();
         return [];
      }

      if ( this.doesNotNeedFilter() )
      {
         this.filterKeys[ 0 ] = "<no filter>";
         this.filterDict[ "<no filter>" ] = -1;
      }

      this.worklist = [];
      let count = 0;
      for ( let t = 0; t < this.targets.length; ++t )
      {
         for ( let f = 0; f < this.filterKeys.length; ++f )
         {
            let item = {
               "targetName": "",
               "ra": 0,
               "dec": 0,
               "filterName": "",
               "filterID": -1,
               "binningX": 0,
               "binningY": 0,
               "expTime": 0,
               "numOfFrames": 0,
               "download_dir": "",
               "fileName": ""
            };
            item.targetName = this.targets[ t ].name;
            item.ra = this.targets[ t ].ra;
            item.dec = this.targets[ t ].dec;
            item.filterName = this.filterKeys[ f ];
            item.filterID = this.filterDict[ item.filterName ];
            item.binningX = this.binningX.idx + 1;
            item.binningY = this.binningY.idx + 1;
            item.expTime = this.exposureTime;
            item.numOfFrames = this.numOfFrames;
            item.download_dir = this.uploadMode.idx == 2 ? this.serverDownloadDir : this.clientDownloadDir;
            item.fileName = this.uploadMode.idx == 2 ? this.serverFileTemplate : this.clientFileTemplate;
            this.worklist[ count ] = item;
            count = count + 1;
         }
      }
      return this.worklist;
   };

   this.centerImage = function( window, mountController, currentBinningX )
   {
      let sensorXPixelSize = window.mainView.propertyValue( "Instrument:Sensor:XPixelSize" );
      let telescopeFocalLength = window.mainView.propertyValue( "Instrument:Telescope:FocalLength" ) * 1000;

      let solver = new ImageSolver();

      solver.Init( window );
      solver.solverCfg.showStars = false;
      solver.solverCfg.showDistortion = false;
      solver.solverCfg.generateErrorImg = false;

      solver.metadata.xpixsz = currentBinningX * sensorXPixelSize;
      solver.metadata.focal = telescopeFocalLength;
      solver.metadata.resolution = ( solver.metadata.focal > 0 ) ? solver.metadata.xpixsz / solver.metadata.focal * 0.18 / Math.PI : 0;
      if ( solver.SolveImage( window ) )
      {
         // Print result
         console.writeln( "===============================================================================" );
         solver.metadata.Print();
         console.writeln( "===============================================================================" );
         // center object
         return mountController.executeOn( window.mainView );
      }
      return false;
   };

#ifdef UPLOAD_DATA_FEATURE
   this.uploadWorkListItem = function( wItem )
   {
      let T = new NetworkTransfer;
      if ( engine.cloudURL.indexOf( "https" ) != -1 )
         T.setSSL();
      T.setURL( this.cloudURL + "api/v1.0/add_frame" );
      let authTokenHeaderPart = "Authentication-Token: " + this.auth_token;
      T.setCustomHTTPHeaders( [ "Content-Type: application/json", authTokenHeaderPart ] );
      T.onDownloadDataAvailable = function( data )
      {
         engine.wait = false;
      };
      let jsonData = JSON.stringify( wItem );
      engine.wait = true;
      let rc = T.post( jsonData );
   };
#endif

   this.startProcessing = function( treeBox )
   {
      // configure mount controller
      let mountController = new IndigoMount();
      mountController.deviceName = this.mountDevice;
      mountController.computeApparentPosition = this.computeApparentPos;
      mountController.enableAlignmentCorrection = this.align;
      mountController.alignmentModelFile = this.alignModelFile;
      if ( this.alignModelFile != "" )
         mountController.alignmentConfig = 127;
      // unpark mount
      mountController.Command = 0; // Unpark
      mountController.executeGlobal();
      mountController.Command = 10; // Goto

      // configure camera controller
      let cameraController = new IndigoCCDFrame();
      cameraController.deviceName = this.ccdDevice;
      cameraController.telescopeDeviceName = this.mountDevice;
      cameraController.openClientImages = this.openClientImages;
      cameraController.overwriteClientImages = this.overwriteClientFiles;
      cameraController.saveClientImages = this.saveClientImages;
      cameraController.clientDownloadDirectory = this.clientDownloadDir;
      cameraController.serverUploadDirectory = this.serverDownloadDir;
      cameraController.clientFileNameTemplate = this.clientFileTemplate;
      cameraController.clientOutputFormatHints = this.clientOutputHints;
      cameraController.uploadMode = this.uploadMode.idx;

      cameraController.telescopeSelection = 4; //deviceName
      cameraController.enableAlignmentCorrection = mountController.enableAlignmentCorrection;
      cameraController.alignmentModelFile = mountController.alignmentModelFile;

      // loop worklist items
      let previousTarget = "";
      let previousFilterID = -1;
      for ( let i = 0; i < this.worklist.length; ++i )
      {
         let node = treeBox.child( i );
         node.setIcon( 5, this.scaledResource( ":/bullets/bullet-ball-glass-yellow.png" ) );
         // move to target
         if ( this.targetInHourAngle )
            mountController.targetRA = mountController.currentLST - this.worklist[ i ].ra;
         else
            mountController.targetRA = this.worklist[ i ].ra;
         mountController.targetDec = this.worklist[ i ].dec;
         console.writeln( format( "Moving to target %s", this.worklist[ i ].targetName ) );

         let isDifferentTarget = previousTarget != this.worklist[ i ].targetName;

         if ( isDifferentTarget )
            if ( this.doMove )
               if ( !this.automaticMove )
                  if ( !this.automaticSync )
                     if ( !( ( new MessageBox( "Goto next object ?", "Message", StdIcon_Question, StdButton_Yes, StdButton_No ) ).execute() ) )
                        break;

         if ( isDifferentTarget )
            if ( this.doMove )
               if ( !mountController.executeGlobal() )
               {
                  node.setIcon( 5, this.scaledResource( ":/bullets/bullet-ball-glass-red.png" ) );
                  break;
               }

         msleep( 10000 );
         // start frame acquisition
         cameraController.objectName = this.worklist[ i ].targetName;
         cameraController.binningX = this.worklist[ i ].binningX;
         cameraController.binningY = this.worklist[ i ].binningY;
         cameraController.exposureTime = this.worklist[ i ].expTime;
         cameraController.exposureCount = this.worklist[ i ].numOfFrames;
         cameraController.newImageIdTemplate = format( "%s_", this.worklist[ i ].targetName );
         cameraController.clientFileNameTemplate = format( "%s_%s", this.worklist[ i ].targetName, this.clientFileTemplate );
         cameraController.serverFileNameTemplate = format( "%s_%s", this.worklist[ i ].targetName, this.serverFileTemplate );
         if ( this.worklist[ i ].filterID != -1 )
         {
            if ( this.deviceSupportsFilter() )
            {
               cameraController.externalFilterWheelDeviceName = this.extFilterWheelDevice;
               cameraController.filterSlot = this.worklist[ i ].filterID;
            }
            else
            {
               let isDifferentFilter = previousFilterID != this.worklist[ i ].filterID;
               new MessageBox( "Change filter slot", "Message", StdIcon_Information, StdButton_Ok ).execute();
            }
            cameraController.newImageIdTemplate = format( "%s_%s_", this.worklist[ i ].targetName, this.worklist[ i ].filterName );
            cameraController.clientFileNameTemplate = format( "%s_%s_%s", this.worklist[ i ].targetName, this.worklist[ i ].filterName, this.clientFileTemplate );
            cameraController.serverFileNameTemplate = format( "%s_%s_%s", this.worklist[ i ].targetName, this.worklist[ i ].filterName, this.serverFileTemplate );
         }
         if ( isDifferentTarget && this.center )
         {
            cameraController.saveClientImages = false;
            cameraController.openClientImages = true;
            cameraController.uploadMode = 0;
            cameraController.exposureTime = this.worklist[ i ].expTime * this.centerImageExpTimeFraction;
            cameraController.exposureCount = 1;

            if ( !cameraController.executeGlobal() )
            {
               node.setIcon( 5, this.scaledResource( ":/bullets/bullet-ball-glass-red.png" ) );
               break;
            }

            let window = ImageWindow.activeWindow;
            if ( !this.centerImage( window, mountController, this.worklist[ i ].binningX ) )
            {
               node.setIcon( 5, this.scaledResource( ":/bullets/bullet-ball-glass-red.png" ) );
               if ( this.onError == 0 ) // onError == Stop
                  break;
               if ( this.onError == 1 ) // onError == Continue
                  continue;
               if ( this.onError == 2 )
               { // onError == Retry
                  window.forceClose();
                  if ( !cameraController.executeGlobal() )
                  {
                     node.setIcon( 5, this.scaledResource( ":/bullets/bullet-ball-glass-red.png" ) );
                     continue;
                  }
                  if ( !this.centerImage( window, mountController, this.worklist[ i ].binningX ) )
                  {
                     node.setIcon( 5, this.scaledResource( ":/bullets/bullet-ball-glass-red.png" ) );
                     continue;
                  }
               }
            }
            msleep( 5000 );
            cameraController.saveClientImages = this.saveClientImages;
            cameraController.openClientImages = this.openClientImages;
            cameraController.uploadMode = this.uploadMode.idx;
            cameraController.exposureTime = this.worklist[ i ].expTime;
            cameraController.exposureCount = this.worklist[ i ].numOfFrames;
            cameraController.binningX = this.worklist[ i ].binningX;
            cameraController.binningY = this.worklist[ i ].binningY;

            window.forceClose();

            if ( isDifferentTarget )
               if ( this.doMove )
                  if ( !this.automaticMove )
                     if ( !this.automaticSync )
                        if ( !( ( new MessageBox( "Continue ?", "Message", StdIcon_Question, StdButton_Yes, StdButton_No ) ).execute() ) )
                           break;

         }

         if ( !this.automaticSync )
            if ( !cameraController.executeGlobal() )
            {
               node.setIcon( 5, this.scaledResource( ":/bullets/bullet-ball-glass-red.png" ) );
               break;
            }
         if ( this.automaticSync )
         {
            // sync mount
            mountController.Command = 11; // Sync
            mountController.executeGlobal();
            mountController.Command = 10; // Goto
         }
         node.setIcon( 5, this.scaledResource( ":/bullets/bullet-ball-glass-green.png" ) );
#ifdef UPLOAD_DATA_FEATURE
         if ( this.auth_token != 0 )
         {
            this.uploadWorkListItem( this.worklist[ i ] );
         }
#endif
         previousTarget = this.worklist[ i ].targetName;
         previousFilterID = this.worklist[ i ].filterID;
      }
      // park telescope
      if ( this.park )
      {
         mountController.Command = 1; // Park
         mountController.executeGlobal();
      }
   }; // this.startProcessing = function( treeBox )
}

var engine = new BatchFrameAcquisitionEngine();

/*
 * Mount parameters dialog
 */
function MountParametersDialog( dialog )
{
   this.__base__ = Dialog;
   this.__base__();

   this.telescopeInfoFocalLength = 0;
   this.CCDInfoPixelSize = 0;

   let labelWidth1 = this.font.width( "Center exposure time fraction:" + 'T' );
   let ui4 = this.logicalPixelsToPhysical( 4 );

   this.gotoMode_Label = new Label( this );
   this.gotoMode_Label.text = "Mount Goto mode:";
   this.gotoMode_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.gotoMode_Label.minWidth = labelWidth1;
   this.gotoMode_Label.toolTip = "<p>There are three Goto modes:</p>\
         <p><i>None:</i> Do not move telescope if the target has changed. Especially do not move telescope for first target.</p>\
         <p><i>Interactive:</i> Always ask the user before moving to the next object.</p>\
         <p><i>Automatic:</i> Move to the next object automatically without asking the user.</p>";

   this.gotoMode_ComboBox = new ComboBox( this );
   this.gotoMode_ComboBox.addItem( "None" );
   this.gotoMode_ComboBox.addItem( "Interactive" );
   this.gotoMode_ComboBox.addItem( "Automatic" );
   this.gotoMode_ComboBox.addItem( "Automatic sync" );
   this.gotoMode_ComboBox.toolTip = this.gotoMode_Label.toolTip;
   this.gotoMode_ComboBox.onItemSelected = function( index )
   {
      this.dialog.enableGotoServices( index != "0" );
      engine.doMove = ( index != "0" );
      engine.automaticMove = ( index == "2" );
      engine.automaticSync = ( index == "3" );
   };

   this.onError_Label = new Label( this );
   this.onError_Label.text = "On Error mode:";
   this.onError_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.onError_Label.minWidth = labelWidth1;
   this.onError_Label.toolTip = "<p>There are three On Error modes:</p>\
      <p><i>Stop:</i> Processing stops, if an error occured, e.g. centering of object failed.</p>\
      <p><i>Continue:</i> Processing continues, even if an error occured.</p>\
      <p><i>Retry:</i> Retry action, if an error occured</p>";

   this.onError_ComboBox = new ComboBox( this );
   this.onError_ComboBox.addItem( "Stop" );
   this.onError_ComboBox.addItem( "Continue" );
   this.onError_ComboBox.addItem( "Retry" );
   this.onError_ComboBox.toolTip = this.onError_Label.toolTip;
   this.onError_ComboBox.onItemSelected = function( index )
   {
      engine.onError = index;
   };

   this.park_Checkbox = new CheckBox( this );
   this.park_Checkbox.text = "Park telescope";
   this.park_Checkbox.toolTip = "<p>Park the telescope after all targets have been finished.</p>";

   this.centering_Checkbox = new CheckBox( this );
   this.centering_Checkbox.text = "Center object:";
   this.centering_Checkbox.toolTip = "<p>Enable centering of targets by applying differential alignment correction.</p>";

   this.centering_exposureTimeEdit = new NumericEdit( this );
   this.centering_exposureTimeEdit.label.text = "Center exposure time fraction:";
   this.centering_exposureTimeEdit.label.minWidth = labelWidth1;
   this.centering_exposureTimeEdit.setRange( 0.01, 1 );
   this.centering_exposureTimeEdit.setPrecision( 2 );
   this.centering_exposureTimeEdit.setValue( 0.1 );
   this.centering_exposureTimeEdit.toolTip = "<p>Fraction of exposure time applied for the image used to center the object</p>";
   this.centering_exposureTimeEdit.sizer.addStretch();
   this.centering_exposureTimeEdit.onValueUpdated = function( value )
   {
      engine.centerImageExpTimeFraction = value;
   };

   this.alignmentCorrection_Checkbox = new CheckBox( this );
   this.alignmentCorrection_Checkbox.text = "Alignment correction";
   this.alignmentCorrection_Checkbox.toolTip = "<p>Enable correction of telescope pointing misalignment.</p>";

   this.computeApparentPos_Checkbox = new CheckBox( this );
   this.computeApparentPos_Checkbox.text = "Apparent position correction";
   this.computeApparentPos_Checkbox.checked = true;
   this.computeApparentPos_Checkbox.toolTip = "<p>Computes the apparent position of the target and corrects the target coordinates accordingly.</p>";

   this.alignmentModel_Edit = new Edit( this );
   this.alignmentModel_Edit.text = "<select an alignment model file>";
   this.alignmentModel_Edit.toolTip = "<p>Specify file that defines the alignment model.</p>"

   this.alignmentFile_ToolButton = new ToolButton( this );
   this.alignmentFile_ToolButton.icon = this.scaledResource( ":/icons/select-file.png" );
   this.alignmentFile_ToolButton.setScaledFixedSize( 22, 22 );
   this.alignmentFile_ToolButton.toolTip = "<p>Select the alignment file:</p>";
   this.alignmentFile_ToolButton.onClick = function()
   {
      let ofd = new SaveFileDialog;
      ofd.multipleSelections = false;
      ofd.caption = "Select Alignment Model";
      ofd.filters = [
         [ "Alignment Model", "*.xtpm" ]
      ];
      if ( ofd.execute() )
         dialog.mountDialog.alignmentModel_Edit.text = ofd.fileName;
   };

   this.gotoMode_Sizer = new HorizontalSizer;
   this.gotoMode_Sizer.spacing = 4;
   this.gotoMode_Sizer.add( this.gotoMode_Label );
   this.gotoMode_Sizer.add( this.gotoMode_ComboBox, 100 );

   this.onError_Sizer = new HorizontalSizer;
   this.onError_Sizer.spacing = 4;
   this.onError_Sizer.add( this.onError_Label );
   this.onError_Sizer.add( this.onError_ComboBox, 100 );

   this.park_Sizer = new HorizontalSizer;
   this.park_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.park_Sizer.add( this.park_Checkbox );
   this.park_Sizer.addStretch();

   this.centering_Sizer = new HorizontalSizer;
   this.centering_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.centering_Sizer.add( this.centering_Checkbox );
   this.centering_Sizer.addStretch();

   this.alignmentCorrection_Sizer = new HorizontalSizer;
   this.alignmentCorrection_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.alignmentCorrection_Sizer.add( this.alignmentCorrection_Checkbox );
   this.alignmentCorrection_Sizer.addStretch();

   this.apparentPosCorrection_Sizer = new HorizontalSizer;
   this.apparentPosCorrection_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.apparentPosCorrection_Sizer.add( this.computeApparentPos_Checkbox );
   this.apparentPosCorrection_Sizer.addStretch();

   this.alignmentModel_Sizer = new HorizontalSizer;
   this.alignmentModel_Sizer.spacing = 4;
   this.alignmentModel_Sizer.add( this.alignmentModel_Edit );
   this.alignmentModel_Sizer.add( this.alignmentFile_ToolButton );
   //this.alignmentModel_Sizer.addStretch();

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
   this.sizer.spacing = 4;
   this.sizer.add( this.gotoMode_Sizer );
   this.sizer.add( this.onError_Sizer );
   this.sizer.add( this.park_Sizer );
   this.sizer.add( this.centering_Sizer );
   this.sizer.add( this.centering_exposureTimeEdit );
   this.sizer.add( this.apparentPosCorrection_Sizer );
   this.sizer.add( this.alignmentCorrection_Sizer );
   this.sizer.add( this.alignmentModel_Sizer );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Mount Device Parameters";
   this.adjustToContents();
   this.setFixedSize();

   // methods
   this.enableGotoServices = function( enable )
   {
      this.centering_Checkbox.enabled = enable;
      this.centering_exposureTimeEdit.enabled = enable;
      this.alignmentCorrection_Checkbox.enabled = enable;
      this.computeApparentPos_Checkbox.enabled = enable;
      this.alignmentModel_Edit.enabled = enable;
   };

   this.enableGotoServices( false );
}

MountParametersDialog.prototype = new Dialog;

function CameraParametersDialog( dialog )
{
   this.__base__ = Dialog;
   this.__base__();

   //

   let labelWidth1 = this.font.width( "Download directory" + 'T' );
   let ui4 = this.logicalPixelsToPhysical( 4 );

   this.binningX_Label = new Label( this );
   this.binningX_Label.text = "Binning X:";
   this.binningX_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.binningX_Label.minWidth = labelWidth1;
   this.binningX_Label.toolTip = "<p>...</p>";

   //

   this.binningX_ComboBox = new ComboBox( this );
   this.binningX_ComboBox.addItem( "1" );
   this.binningX_ComboBox.addItem( "2" );
   this.binningX_ComboBox.addItem( "3" );
   this.binningX_ComboBox.addItem( "4" );
   this.binningX_ComboBox.toolTip = "<p>...</p>";

   //

   this.binningY_Label = new Label( this );
   this.binningY_Label.text = "Binning Y:";
   this.binningY_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.binningY_Label.minWidth = labelWidth1;
   this.binningY_Label.toolTip = "<p>...</p>";

   //

   this.binningY_ComboBox = new ComboBox( this );
   this.binningY_ComboBox.addItem( "1" );
   this.binningY_ComboBox.addItem( "2" );
   this.binningY_ComboBox.addItem( "3" );
   this.binningY_ComboBox.addItem( "4" );
   this.binningY_ComboBox.toolTip = "<p>...</p>";

   //

   this.binningX_Sizer = new HorizontalSizer;
   this.binningX_Sizer.spacing = 4;
   this.binningX_Sizer.add( this.binningX_Label );
   this.binningX_Sizer.add( this.binningX_ComboBox );
   this.binningX_Sizer.addStretch();

   //

   this.binningY_Sizer = new HorizontalSizer;
   this.binningY_Sizer.spacing = 4;
   this.binningY_Sizer.add( this.binningY_Label );
   this.binningY_Sizer.add( this.binningY_ComboBox );
   this.binningY_Sizer.addStretch();

   //

   this.frameType_Label = new Label( this );
   this.frameType_Label.text = "Frame Type:";
   this.frameType_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.frameType_Label.minWidth = labelWidth1;
   this.frameType_Label.toolTip = "<p>...</p>";

   //

   this.frameType_ComboBox = new ComboBox( this );
   this.frameType_ComboBox.addItem( "Light" );
   this.frameType_ComboBox.addItem( "Bias" );
   this.frameType_ComboBox.addItem( "Dark" );
   this.frameType_ComboBox.addItem( "Flat" );
   this.frameType_ComboBox.toolTip = "<p>...</p>";

   //

   this.frameType_Sizer = new HorizontalSizer;
   this.frameType_Sizer.spacing = 4;
   this.frameType_Sizer.add( this.frameType_Label );
   this.frameType_Sizer.add( this.frameType_ComboBox );
   this.frameType_Sizer.addStretch();

   //

   this.uploadMode_Label = new Label( this );
   this.uploadMode_Label.text = "Upload Mode:";
   this.uploadMode_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.uploadMode_Label.minWidth = labelWidth1;
   this.uploadMode_Label.toolTip = "<p>...</p>";

   //

   this.uploadMode_ComboBox = new ComboBox( this );
   this.uploadMode_ComboBox.addItem( "Client only" );
   this.uploadMode_ComboBox.addItem( "Server only" );
   this.uploadMode_ComboBox.addItem( "Client and server" );
   this.uploadMode_ComboBox.toolTip = "<p>...</p>";
   this.uploadMode_ComboBox.onItemSelected = function( index )
   {
      if ( index == 1 )
      {
         this.dialog.openImages_Checkbox.checked = false;
         this.dialog.client_GroupBox.enabled = false;
      }
      else
      {
         this.dialog.client_GroupBox.enabled = true;
         this.dialog.openImages_Checkbox.checked = true;
      }
   };

   //

   this.uploadMode_Sizer = new HorizontalSizer;
   this.uploadMode_Sizer.spacing = 4;
   this.uploadMode_Sizer.add( this.uploadMode_Label );
   this.uploadMode_Sizer.add( this.uploadMode_ComboBox );
   this.uploadMode_Sizer.addStretch();

   //

   this.exposureTimeEdit = new NumericEdit( this );
   this.exposureTimeEdit.label.text = "Exposure time:";
   this.exposureTimeEdit.label.minWidth = labelWidth1;
   this.exposureTimeEdit.setRange( 0.001, 60000 );
   this.exposureTimeEdit.setPrecision( 3 );
   this.exposureTimeEdit.setValue( 0.001 );
   this.exposureTimeEdit.toolTip = "<p>Exposure time in seconds.</p>";
   this.exposureTimeEdit.sizer.addStretch();
   this.exposureTimeEdit.onValueUpdated = function( value )
   {
      engine.exposureTime = value;
   };

   this.exposureDelayEdit = new NumericEdit( this );
   this.exposureDelayEdit.label.text = "Exposure delay:";
   this.exposureDelayEdit.label.minWidth = labelWidth1;
   this.exposureDelayEdit.setRange( 0, 600 );
   this.exposureDelayEdit.setPrecision( 3 );
   this.exposureDelayEdit.setValue( 0 );
   this.exposureDelayEdit.toolTip = "<p>Exposure delay in seconds.</p>";
   this.exposureDelayEdit.sizer.addStretch();
   this.exposureDelayEdit.onValueUpdated = function( value )
   {
      engine.exposureDelay = value;
   };

   //

   this.numOfFramesEdit = new NumericEdit( this );
   this.numOfFramesEdit.label.text = "Number of frames:";
   this.numOfFramesEdit.label.minWidth = labelWidth1;
   this.numOfFramesEdit.setRange( 0, 600 );
   this.numOfFramesEdit.setReal( false );
   this.numOfFramesEdit.setValue( 1 );
   this.numOfFramesEdit.toolTip = "<p>Number of frames to be acquired.</p>";
   this.numOfFramesEdit.sizer.addStretch();
   this.numOfFramesEdit.onValueUpdated = function( value )
   {
      engine.numOfFrames = value;
   };

   //

   this.exposureParameters_GroupBox = new GroupBox( this );
   this.exposureParameters_GroupBox.title = "Exposure";
   this.exposureParameters_GroupBox.sizer = new VerticalSizer;
   this.exposureParameters_GroupBox.sizer.margin = 6;
   this.exposureParameters_GroupBox.sizer.spacing = 4;
   this.exposureParameters_GroupBox.sizer.add( this.exposureTimeEdit );
   this.exposureParameters_GroupBox.sizer.add( this.exposureDelayEdit );
   this.exposureParameters_GroupBox.sizer.add( this.numOfFramesEdit );

   this.frameParameters_GroupBox = new GroupBox( this );
   this.frameParameters_GroupBox.title = "Frames";
   this.frameParameters_GroupBox.sizer = new VerticalSizer;
   this.frameParameters_GroupBox.sizer.margin = 6;
   this.frameParameters_GroupBox.sizer.spacing = 4;
   this.frameParameters_GroupBox.sizer.add( this.binningX_Sizer );
   this.frameParameters_GroupBox.sizer.add( this.binningY_Sizer );
   this.frameParameters_GroupBox.sizer.add( this.frameType_Sizer );
   this.frameParameters_GroupBox.sizer.add( this.uploadMode_Sizer );

   //

   this.openImages_Checkbox = new CheckBox( this );
   this.openImages_Checkbox.text = "Open frames";
   this.openImages_Checkbox.checked = true;
   this.openImages_Checkbox.toolTip = "<p>Load newly acquired frames as image windows.</p>";

   this.openImages_Sizer = new HorizontalSizer;
   this.openImages_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.openImages_Sizer.add( this.openImages_Checkbox );
   this.openImages_Sizer.addStretch();

   //

   this.saveImages_Checkbox = new CheckBox( this );
   this.saveImages_Checkbox.text = "Save frames";
   this.saveImages_Checkbox.toolTip = "<p>Save newly acquired frames to loal images files in XISF format.</p>";

   this.saveImages_Sizer = new HorizontalSizer;
   this.saveImages_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.saveImages_Sizer.add( this.saveImages_Checkbox );
   this.saveImages_Sizer.addStretch();

   //

   this.clientDownloadDir_Label = new Label( this );
   this.clientDownloadDir_Label.text = "Download directory:";
   this.clientDownloadDir_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.clientDownloadDir_Label.minWidth = labelWidth1;
   this.clientDownloadDir_Label.toolTip = "<p>The directory where newly acquired frames will be stored on the local filesystem.</p>\
      <p>If you leave this parameter empty, new files will be created on the current downloads directory, as defined by global settings.</p>";

   this.clientDownloadDir_Edit = new Edit( this );
   this.clientDownloadDir_Edit.setMinWidth( 30*this.font.width( 'm' ) );
   this.clientDownloadDir_Edit.toolTip = "<p>The directory where newly acquired frames will be stored on the local filesystem.</p>\
      <p>If you leave this parameter empty, new files will be created on the current downloads directory, as defined by global settings.</p>";

   this.clientDownloadDir_ToolButton = new ToolButton( this );
   this.clientDownloadDir_ToolButton.icon = this.scaledResource( ":/icons/select-file.png" );
   this.clientDownloadDir_ToolButton.setScaledFixedSize( 22, 22 );
   this.clientDownloadDir_ToolButton.toolTip = "<p>Select download directory</p>";
   this.clientDownloadDir_ToolButton.onClick = function()
   {
      let gdd = new GetDirectoryDialog;
      gdd.multipleSelections = false;
      gdd.caption = "Select Download Directory";
      if ( gdd.execute() )
         dialog.cameraDialog.clientDownloadDir_Edit.text = gdd.directory;
   };

   this.clientDownloadDir_Sizer = new HorizontalSizer;
   this.clientDownloadDir_Sizer.spacing = 4;
   this.clientDownloadDir_Sizer.add( this.clientDownloadDir_Label );
   this.clientDownloadDir_Sizer.add( this.clientDownloadDir_Edit );
   this.clientDownloadDir_Sizer.add( this.clientDownloadDir_ToolButton );

   this.clientFileTemplate_Label = new Label( this );
   this.clientFileTemplate_Label.text = "Filename template:";
   this.clientFileTemplate_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.clientFileTemplate_Label.minWidth = labelWidth1;

   let clientFileTemplate_toolTip = "<p>A file name template can be any valid text suitable to specify file names on the target filesystem, and may include \
      one or more <i>template specifiers</i>. Template specifiers are replaced automatically with selected tokens when \
      new frames are acquired. Supported template specifiers are the following:</p>\
      <p><table border=\"1\" cellspacing=\"1\" cellpadding=\"4\">\
      <tr>\
         <td><i>Template specifier</i></td>\
         <td width=\"90%\"><i>Will be replaced by</i></td>\
      </tr>\
      <tr>\
         <td>%f</td>\
         <td>Frame type (light, flat, dark, bias).</td>\
      </tr>\
      <tr>\
         <td>%b</td>\
         <td>CCD binning with the format HxV, where H and V are, respectively, the horizontal and vertical binning factors.</td>\
      </tr>\
      <tr>\
         <td>%e</td>\
         <td>Exposure time in seconds.</td>\
      </tr>\
      <tr>\
         <td>%F</td>\
         <td>Filter name</td>\
      </tr>\
      <tr>\
         <td>%T</td>\
         <td>CCD temperature in degrees Celsius.</td>\
      </tr>\
      <tr>\
         <td>%t</td>\
         <td>Acquisition date and time in the UTC time scale, ISO 8601 format.</td>\
      </tr>\
      <tr>\
         <td>%d</td>\
         <td>Acquisition date in the UTC time scale, yyyy-mm-dd format.</td>\
      </tr>\
      <tr>\
         <td>%n</td>\
         <td>The frame number starting from one, with three digits and left-padded with zeros.</td>\
      </tr>\
      <tr>\
         <td>%u</td>\
         <td>A universally unique identifier (UUID) in canonical form (36 characters).</td>\
      </tr>\
      </table></p>\
      <p>For example, the default template %f_B%b_E%e_%n would produce the following file name:</p>\
      <p>LIGHT_B2x2_E300.00_002.fits</p>\
      <p>for the second light frame of a series with exposure time of 300 seconds at binning 2x2.</p>";

   this.clientFileTemplate_Label.toolTip = clientFileTemplate_toolTip;

   this.clientFileTemplate_Edit = new Edit( this );
   this.clientFileTemplate_Edit.text = "%f_B%b_E%e_%n";
   this.clientFileTemplate_Edit.toolTip = clientFileTemplate_toolTip;

   this.clientFileTemplate_Sizer = new HorizontalSizer;
   this.clientFileTemplate_Sizer.spacing = 4;
   this.clientFileTemplate_Sizer.add( this.clientFileTemplate_Label );
   this.clientFileTemplate_Sizer.add( this.clientFileTemplate_Edit );

   this.clientFileHints_Label = new Label( this );
   this.clientFileHints_Label.text = "Output hints:";
   this.clientFileHints_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.clientFileHints_Label.minWidth = labelWidth1;

   let clientFileHints_toolTip = "<p><i>Format hints</i> allow you to override global file format settings for image files used by specific processes. \
      In IndigoCCDFrame, output hints allow you to control the way newly acquired image files are generated on the INDI client.</p>\
      <p>For example, you can use the \"compression-codec zlib\" hint to force the XISF format support module to compress \
      images using the Zlib data compression algorithm. To gain more control on compression, you can use the \"compression-level <i>n</i>\"\
      hint to specify a compression level <i>n</i> in the range from 0 (default compression) to 100 (maximum compression). See the XISF \
      format documentation for detailed information on supported XISF format hints.</p>";

   this.clientFileHints_Label.toolTip = clientFileHints_toolTip;

   this.clientFileHints_Edit = new Edit( this );
   //this.clientFileHints_Edit.text = "compression-codec zlib+sh";
   this.clientFileHints_Edit.toolTip = clientFileHints_toolTip;

   this.clientFileHints_Sizer = new HorizontalSizer;
   this.clientFileHints_Sizer.spacing = 4;
   this.clientFileHints_Sizer.add( this.clientFileHints_Label );
   this.clientFileHints_Sizer.add( this.clientFileHints_Edit );

   this.overwriteImages_Checkbox = new CheckBox( this );
   this.overwriteImages_Checkbox.text = "Overwrite files";
   this.overwriteImages_Checkbox.toolTip = "<p>Overwrite files on local file system</p>";

   this.overwriteImages_Sizer = new HorizontalSizer;
   this.overwriteImages_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.overwriteImages_Sizer.add( this.overwriteImages_Checkbox );
   this.overwriteImages_Sizer.addStretch();

   //

   this.client_GroupBox = new GroupBox( this );
   this.client_GroupBox.title = "Client";
   this.client_GroupBox.sizer = new VerticalSizer;
   this.client_GroupBox.sizer.margin = 6;
   this.client_GroupBox.sizer.spacing = 4;
   this.client_GroupBox.sizer.add( this.openImages_Sizer );
   this.client_GroupBox.sizer.add( this.saveImages_Sizer );
   this.client_GroupBox.sizer.add( this.clientDownloadDir_Sizer );
   this.client_GroupBox.sizer.add( this.clientFileTemplate_Sizer );
   this.client_GroupBox.sizer.add( this.clientFileHints_Sizer );
   this.client_GroupBox.sizer.add( this.overwriteImages_Sizer );

   //

   this.serverDownloadDir_Label = new Label( this );
   this.serverDownloadDir_Label.text = "Download directory:";
   this.serverDownloadDir_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.serverDownloadDir_Label.minWidth = labelWidth1;
   this.serverDownloadDir_Label.toolTip = "<p>The directory where newly acquired frames will be stored on the server filesystem.</p>";

   this.serverDownloadDir_Edit = new Edit( this );
   this.serverDownloadDir_Edit.toolTip = "<p>The directory where newly acquired frames will be stored on the local filesystem.</p>";

   this.serverDownloadDir_Sizer = new HorizontalSizer;
   this.serverDownloadDir_Sizer.spacing = 4;
   this.serverDownloadDir_Sizer.add( this.serverDownloadDir_Label );
   this.serverDownloadDir_Sizer.add( this.serverDownloadDir_Edit );

   this.serverFileTemplate_Label = new Label( this );
   this.serverFileTemplate_Label.text = "Filename template:";
   this.serverFileTemplate_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.serverFileTemplate_Label.minWidth = labelWidth1;

   let serverFileTemplate_toolTip = "<p>A file name template can be any valid text suitable to specify file names on the target filesystem, and may include \
      one or more <i>template specifiers</i>. Template specifiers are replaced automatically with selected tokens when \
      new frames are acquired. Supported template specifiers are the following:</p>\
      <p><table border=\"1\" cellspacing=\"1\" cellpadding=\"4\">\
      <tr>\
         <td><i>Template specifier</i></td>\
         <td width=\"90%\"><i>Will be replaced by</i></td>\
      </tr>\
      <tr>\
         <td>%f</td>\
         <td>Frame type (light, flat, dark, bias).</td>\
      </tr>\
      <tr>\
         <td>%b</td>\
         <td>CCD binning with the format HxV, where H and V are, respectively, the horizontal and vertical binning factors.</td>\
      </tr>\
      <tr>\
         <td>%e</td>\
         <td>Exposure time in seconds.</td>\
      </tr>\
      <tr>\
         <td>%F</td>\
         <td>Filter name</td>\
      </tr>\
      <tr>\
         <td>%T</td>\
         <td>CCD temperature in degrees Celsius.</td>\
      </tr>\
      <tr>\
         <td>%t</td>\
         <td>Acquisition date and time in the UTC time scale, ISO 8601 format.</td>\
      </tr>\
      <tr>\
         <td>%d</td>\
         <td>Acquisition date in the UTC time scale, yyyy-mm-dd format.</td>\
      </tr>\
      <tr>\
         <td>%n</td>\
         <td>The frame number starting from one, with three digits and left-padded with zeros.</td>\
      </tr>\
      <tr>\
         <td>%u</td>\
         <td>A universally unique identifier (UUID) in canonical form (36 characters).</td>\
      </tr>\
      </table></p>\
      <p>For example, the default template %f_B%b_E%e_%n would produce the following file name:</p>\
      <p>LIGHT_B2x2_E300.00_002.fits</p>\
      <p>for the second light frame of a series with exposure time of 300 seconds at binning 2x2.</p>";

   this.serverFileTemplate_Label.toolTip = serverFileTemplate_toolTip;

   this.serverFileTemplate_Edit = new Edit( this );
   this.serverFileTemplate_Edit.text = "%f_B%b_E%e_%n";
   this.serverFileTemplate_Edit.toolTip = serverFileTemplate_toolTip;

   this.serverFileTemplate_Sizer = new HorizontalSizer;
   this.serverFileTemplate_Sizer.spacing = 4;
   this.serverFileTemplate_Sizer.add( this.serverFileTemplate_Label );
   this.serverFileTemplate_Sizer.add( this.serverFileTemplate_Edit );

   this.server_GroupBox = new GroupBox( this );
   this.server_GroupBox.title = "Server";
   this.server_GroupBox.sizer = new VerticalSizer;
   this.server_GroupBox.sizer.margin = 6;
   this.server_GroupBox.sizer.spacing = 4;
   this.server_GroupBox.sizer.add( this.serverDownloadDir_Sizer );
   this.server_GroupBox.sizer.add( this.serverFileTemplate_Sizer );

   //

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
   this.sizer.spacing = 6;
   this.sizer.add( this.exposureParameters_GroupBox );
   this.sizer.add( this.frameParameters_GroupBox );
   this.sizer.add( this.client_GroupBox );
   this.sizer.add( this.server_GroupBox );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Camera Device Parameters";
   this.adjustToContents();
   this.setMinWidth();
   this.setFixedHeight();
}

CameraParametersDialog.prototype = new Dialog;

/*
 * Filter Name dialog
 */
function AddFilterDialog( dialog )
{
   this.__base__ = Dialog;
   this.__base__();

   let labelWidth = this.font.width( "Filter name" + 'T' );

   this.filterName_Label = new Label( this );
   this.filterName_Label.text = "Filter name";
   this.filterName_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.filterName_Label.minWidth = labelWidth;
   this.filterName_Label.toolTip = "<p>Specify a filter name.</p>";

   this.filterName_Edit = new Edit( this );
   this.filterName_Edit.setMinWidth( 20*this.font.width( 'm' ) );
   this.filterName_Edit.toolTip = "<p>Specify a filter name.</p>";

   this.filterName_Sizer = new HorizontalSizer;
   this.filterName_Sizer.spacing = 4;
   this.filterName_Sizer.add( this.filterName_Label );
   this.filterName_Sizer.add( this.filterName_Edit );

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
   this.sizer.add( this.filterName_Sizer );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Add Filter";
   this.adjustToContents();
   this.setMinWidth();
   this.setFixedHeight();
}

AddFilterDialog.prototype = new Dialog;

function FilterWheelParametersDialog( dialog )
{
   this.__base__ = Dialog;
   this.__base__();

   this.addFilterDialog = new AddFilterDialog( this );

   //

   this.filterType_TreeBox = new TreeBox( this );
   this.filterType_TreeBox.rootDecoration = false;
   this.filterType_TreeBox.multipleSelection = false;
   this.filterType_TreeBox.alternateRowColor = true;
   this.filterType_TreeBox.setMinSize( 600, 200 );
   this.filterType_TreeBox.numberOfColumns = 2;
   this.filterType_TreeBox.showColumn( 1, false );
   this.filterType_TreeBox.setHeaderText( 0, "Filter" );
   this.filterType_TreeBox.headerVisible = true;

   this.filterDelete_ToolButton = new ToolButton( this );
   this.filterDelete_ToolButton.icon = this.scaledResource( ":/browser/disabled.png" );
   this.filterDelete_ToolButton.setScaledFixedSize( 22, 22 );
   this.filterDelete_ToolButton.toolTip = "<p>Remove filter</p>";
   this.filterDelete_ToolButton.onClick = function()
   {
      if ( this.dialog.filterType_TreeBox.selectedNodes.length == 1 )
      {
         let selectedNode = this.dialog.filterType_TreeBox.selectedNodes[ 0 ];
         let idx = this.dialog.filterType_TreeBox.childIndex( selectedNode );
         this.dialog.filterType_TreeBox.remove( idx );
      }
      if ( this.dialog.filterType_TreeBox.numberOfChildren == 0 )
         dialog.filterparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-yellow.png" );
   };

   this.filterAdd_ToolButton = new ToolButton( this );
   this.filterAdd_ToolButton.icon = this.scaledResource( ":/icons/add.png" );
   this.filterAdd_ToolButton.setScaledFixedSize( 22, 22 );
   this.filterAdd_ToolButton.toolTip = "<p>Add filter</p>";
   this.filterAdd_ToolButton.onClick = function()
   {
      if ( this.dialog.addFilterDialog.execute() )
      {
         let node = new TreeBoxNode( this.dialog.filterType_TreeBox );
         node.setText( 0, this.dialog.addFilterDialog.filterName_Edit.text );
      }
   };

   this.filterMoveUp_ToolButton = new ToolButton( this );
   this.filterMoveUp_ToolButton.icon = this.scaledResource( ":/arrows/arrow-up.png" );
   this.filterMoveUp_ToolButton.setScaledFixedSize( 22, 22 );
   this.filterMoveUp_ToolButton.toolTip = "<p>Move filter up</p>";
   this.filterMoveUp_ToolButton.onClick = function()
   {
      if ( this.dialog.filterType_TreeBox.selectedNodes.length == 1 )
      {
         let selectedNode = this.dialog.filterType_TreeBox.selectedNodes[ 0 ];
         let idx = this.dialog.filterType_TreeBox.childIndex( selectedNode );
         if ( idx > 0 )
         {
            this.dialog.filterType_TreeBox.remove( idx );
            this.dialog.filterType_TreeBox.insert( idx - 1, selectedNode );
         }
      }
   };

   this.filterMoveDown_ToolButton = new ToolButton( this );
   this.filterMoveDown_ToolButton.icon = this.scaledResource( ":/arrows/arrow-down.png" );
   this.filterMoveDown_ToolButton.setScaledFixedSize( 22, 22 );
   this.filterMoveDown_ToolButton.toolTip = "<p>Move filter down</p>";
   this.filterMoveDown_ToolButton.onClick = function()
   {
      if ( this.dialog.filterType_TreeBox.selectedNodes.length == 1 )
      {
         let selectedNode = this.dialog.filterType_TreeBox.selectedNodes[ 0 ];
         let idx = this.dialog.filterType_TreeBox.childIndex( selectedNode );
         if ( idx < this.dialog.filterType_TreeBox.numberOfChildren - 1 )
         {
            this.dialog.filterType_TreeBox.remove( idx );
            this.dialog.filterType_TreeBox.insert( idx + 1, selectedNode );
         }
      }
   };

   //

   this.filterTool_Sizer = new VerticalSizer;
   this.filterTool_Sizer.spacing = 4;
   this.filterTool_Sizer.add( this.filterAdd_ToolButton );
   this.filterTool_Sizer.add( this.filterDelete_ToolButton );
   this.filterTool_Sizer.add( this.filterMoveUp_ToolButton );
   this.filterTool_Sizer.add( this.filterMoveDown_ToolButton );
   this.filterTool_Sizer.addStretch();

   //

   this.filter_Sizer = new HorizontalSizer;
   this.filter_Sizer.spacing = 4;
   this.filter_Sizer.add( this.filterType_TreeBox, 100 );
   this.filter_Sizer.add( this.filterTool_Sizer );

   //

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      for ( let i = 0; i < this.dialog.filterType_TreeBox.numberOfChildren; ++i )
      {
         let childNode = this.dialog.filterType_TreeBox.child( i );
         engine.filterKeys[ i ] = childNode.text( 0 );
         engine.filterDict[ childNode.text( 0 ) ] = parseInt( childNode.text( 1 ) );
      }
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

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.filter_Sizer, 100 );
   this.sizer.add( this.buttons_Sizer );

   //

   this.windowTitle = "Filter Wheel Device Parameters";
   this.adjustToContents();
   this.setMinSize();
}

FilterWheelParametersDialog.prototype = new Dialog;

function UpdateWorklistDialog( dialog, selectedIdx )
{
   this.__base__ = Dialog;
   this.__base__();

   this.selectedItemIdx = selectedIdx;

   let labelWidth1 = this.font.width( "Number of frames:" + 'T' );

   this.binningX_Label = new Label( this );
   this.binningX_Label.text = "Binning X:";
   this.binningX_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.binningX_Label.minWidth = labelWidth1;
   this.binningX_Label.toolTip = "<p>...</p>";

   //

   this.binningX_ComboBox = new ComboBox( this );
   this.binningX_ComboBox.addItem( "1" );
   this.binningX_ComboBox.addItem( "2" );
   this.binningX_ComboBox.addItem( "3" );
   this.binningX_ComboBox.addItem( "4" );
   this.binningX_ComboBox.currentItem = engine.worklist[ this.dialog.selectedItemIdx ].binningX - 1;
   this.binningX_ComboBox.toolTip = "<p>...</p>";

   //

   this.binningY_Label = new Label( this );
   this.binningY_Label.text = "Binning Y:";
   this.binningY_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.binningY_Label.minWidth = labelWidth1;
   this.binningY_Label.toolTip = "<p>...</p>";

   //

   this.binningY_ComboBox = new ComboBox( this );
   this.binningY_ComboBox.addItem( "1" );
   this.binningY_ComboBox.addItem( "2" );
   this.binningY_ComboBox.addItem( "3" );
   this.binningY_ComboBox.addItem( "4" );
   this.binningY_ComboBox.currentItem = engine.worklist[ this.dialog.selectedItemIdx ].binningY - 1;
   this.binningY_ComboBox.toolTip = "<p>...</p>";

   //

   this.binningX_Sizer = new HorizontalSizer;
   this.binningX_Sizer.spacing = 4;
   this.binningX_Sizer.add( this.binningX_Label );
   this.binningX_Sizer.add( this.binningX_ComboBox );
   this.binningX_Sizer.addStretch();

   //

   this.binningY_Sizer = new HorizontalSizer;
   this.binningY_Sizer.spacing = 4;
   this.binningY_Sizer.add( this.binningY_Label );
   this.binningY_Sizer.add( this.binningY_ComboBox );
   this.binningY_Sizer.addStretch();

   //

   this.exposureTimeEdit = new NumericEdit( this );
   this.exposureTimeEdit.label.text = "Exposure time:";
   this.exposureTimeEdit.label.minWidth = labelWidth1;
   this.exposureTimeEdit.setRange( 0.001, 60000 );
   this.exposureTimeEdit.setPrecision( 3 );
   this.exposureTimeEdit.setValue( engine.worklist[ this.dialog.selectedItemIdx ].expTime );
   this.exposureTimeEdit.toolTip = "<p>Exposure time in seconds.</p>";
   this.exposureTimeEdit.sizer.addStretch();

   //

   this.numOfFramesEdit = new NumericEdit( this );
   this.numOfFramesEdit.label.text = "Number of frames:";
   this.numOfFramesEdit.label.minWidth = labelWidth1;
   this.numOfFramesEdit.setRange( 0, 600 );
   this.numOfFramesEdit.setReal( false );
   this.numOfFramesEdit.setValue( engine.worklist[ this.dialog.selectedItemIdx ].numOfFrames );
   this.numOfFramesEdit.toolTip = "<p>Number of frames to be acquired.</p>";
   this.numOfFramesEdit.sizer.addStretch();

   //

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      engine.worklist[ this.dialog.selectedItemIdx ].binningX = this.dialog.binningX_ComboBox.currentItem + 1;
      engine.worklist[ this.dialog.selectedItemIdx ].binningY = this.dialog.binningY_ComboBox.currentItem + 1;
      engine.worklist[ this.dialog.selectedItemIdx ].expTime = this.dialog.exposureTimeEdit.value;
      engine.worklist[ this.dialog.selectedItemIdx ].numOfFrames = this.dialog.numOfFramesEdit.value;
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

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 4;
   this.sizer.add( this.binningX_Sizer );
   this.sizer.add( this.binningY_Sizer );
   this.sizer.add( this.exposureTimeEdit );
   this.sizer.add( this.numOfFramesEdit );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Update Worklist";
   this.scaledMinWidth = 250;
   this.adjustToContents();
   this.setFixedSize();
}

UpdateWorklistDialog.prototype = new Dialog;

/*
 * Dialog to define a grid of equidistant coordinate points
 * covering the sky.
 *
 * Can be used to automatically move to these gridpoints
 * e.g getting sync data for telesope pointing models.
 */
function CoordGridDefinitionDialog( dialog )
{
   this.__base__ = Dialog;
   this.__base__();

   let labelWidth = this.font.width( "Maximum azimuth angle" + 'T' );

   /*this.gridType_Label = new Label( this );
   this.gridType_Label.text = "Coordinate grid type";
   this.gridType_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.gridType_Label.minWidth = labelWidth;
   this.gridType_Label.toolTip = "<p><b>Equatorial grid:</b> Grid of coordinates given in righascension and declination.</p>" +
                                 "<p><b>Horizontal grid:</b> Grid of coordinates given in azimuth and height.</p>";

   this.gridType_ComboBox = new ComboBox(this);
   this.gridType_ComboBox.addItem("Equatorial grid");
   this.gridType_ComboBox.addItem("Horizontal grid");
   this.gridType_ComboBox.currentItem = 0;
   this.gridType_ComboBox.toolTip = "<p><b>Equatorial grid:</b> Grid of coordinates given in righascension and declination.</p>" +
   		                            "<p><b>Horizontal grid:</b> Grid of coordinates given in azimuth and height.</p>";

   this.gridType_ComboBox.onItemSelected = function ( index ) {
	   this.dialog.enableGridServices(index == 0);
   }

   this.gridType_Sizer = new HorizontalSizer;
   this.gridType_Sizer.spacing = 4;
   this.gridType_Sizer.add( this.gridType_Label );
   this.gridType_Sizer.add( this.gridType_ComboBox );
   this.gridType_Sizer.addStretch();

   this.grid_maxAzimuthEdit = new NumericEdit( this );
   this.grid_maxAzimuthEdit.label.text = "Max azimuth angle:";
   this.grid_maxAzimuthEdit.label.minWidth = labelWidth;
   this.grid_maxAzimuthEdit.setRange( 0, 180 );
   this.grid_maxAzimuthEdit.setPrecision( 2 );
   this.grid_maxAzimuthEdit.setValue( 0 );
   this.grid_maxAzimuthEdit.toolTip = "<p>Maximum azimuth angle of coordinate grid</p>";
   this.grid_maxAzimuthEdit.enabled = false;
   this.grid_maxAzimuthEdit.sizer.addStretch();

   this.grid_minAzimuthEdit = new NumericEdit( this );
   this.grid_minAzimuthEdit.label.text = "Min azimuth angle:";
   this.grid_minAzimuthEdit.label.minWidth = labelWidth;
   this.grid_minAzimuthEdit.setRange( -180, 0 );
   this.grid_minAzimuthEdit.setPrecision( 2 );
   this.grid_minAzimuthEdit.setValue( 0 );
   this.grid_minAzimuthEdit.toolTip = "<p>Minimum azimuth angle of coordinate grid</p>";
   this.grid_minAzimuthEdit.enabled = false;
   this.grid_minAzimuthEdit.sizer.addStretch();

   this.grid_maxHeightEdit = new NumericEdit( this );
   this.grid_maxHeightEdit.label.text = "Max height angle:";
   this.grid_maxHeightEdit.label.minWidth = labelWidth;
   this.grid_maxHeightEdit.setRange( 0, 180 );
   this.grid_maxHeightEdit.setPrecision( 2 );
   this.grid_maxHeightEdit.setValue( 0 );
   this.grid_maxHeightEdit.toolTip = "<p>Maximum height angle of coordinate grid</p>";
   this.grid_maxHeightEdit.enabled= false;
   this.grid_maxHeightEdit.sizer.addStretch();

   this.grid_minHeightEdit = new NumericEdit( this );
   this.grid_minHeightEdit.label.text = "Min height angle:";
   this.grid_minHeightEdit.label.minWidth = labelWidth;
   this.grid_minHeightEdit.setRange( -180, 0 );
   this.grid_minHeightEdit.setPrecision( 2 );
   this.grid_minHeightEdit.setValue( 0 );
   this.grid_minHeightEdit.toolTip = "<p>Minimum height angle of coordinate grid</p>";
   this.grid_minHeightEdit.enabled= false;
   this.grid_minHeightEdit.sizer.addStretch();
*/
   this.grid_maxRAEdit = new NumericEdit( this );
   this.grid_maxRAEdit.label.text = "Max hour angle [h]:";
   this.grid_maxRAEdit.label.minWidth = labelWidth;
   this.grid_maxRAEdit.setRange( -12, 12 );
   this.grid_maxRAEdit.setPrecision( 2 );
   this.grid_maxRAEdit.setValue( 0 );
   this.grid_maxRAEdit.toolTip = "<p>Maximum hour angle of coordinate grid</p>";
   this.grid_maxRAEdit.enabled = false;
   this.grid_maxRAEdit.sizer.addStretch();

   this.grid_minRAEdit = new NumericEdit( this );
   this.grid_minRAEdit.label.text = "Min hour angle [h]:";
   this.grid_minRAEdit.label.minWidth = labelWidth;
   this.grid_minRAEdit.setRange( -12, 12 );
   this.grid_minRAEdit.setPrecision( 2 );
   this.grid_minRAEdit.setValue( 0 );
   this.grid_minRAEdit.toolTip = "<p>Minimum hour angle of coordinate grid</p>";
   this.grid_minRAEdit.enabled = false;
   this.grid_minRAEdit.sizer.addStretch();

   this.grid_maxDECEdit = new NumericEdit( this );
   this.grid_maxDECEdit.label.text = "Max declination angle [deg]:";
   this.grid_maxDECEdit.label.minWidth = labelWidth;
   this.grid_maxDECEdit.setRange( -90, 90 );
   this.grid_maxDECEdit.setPrecision( 2 );
   this.grid_maxDECEdit.setValue( 0 );
   this.grid_maxDECEdit.toolTip = "<p>Maximum declination angle of coordinate grid</p>";
   this.grid_maxDECEdit.enabled = false;
   this.grid_maxDECEdit.sizer.addStretch();

   this.grid_minDECEdit = new NumericEdit( this );
   this.grid_minDECEdit.label.text = "Min declination angle [deg]:";
   this.grid_minDECEdit.label.minWidth = labelWidth;
   this.grid_minDECEdit.setRange( -90, 90 );
   this.grid_minDECEdit.setPrecision( 2 );
   this.grid_minDECEdit.setValue( 0 );
   this.grid_minDECEdit.toolTip = "<p>Minimum declination angle of coordinate grid</p>";
   this.grid_minDECEdit.enabled = false;
   this.grid_minDECEdit.sizer.addStretch();

   this.grid_RAStepEdit = new NumericEdit( this );
   this.grid_RAStepEdit.label.text = "RA step size:";
   this.grid_RAStepEdit.label.minWidth = labelWidth;
   this.grid_RAStepEdit.setRange( 0, 12 );
   this.grid_RAStepEdit.setPrecision( 2 );
   this.grid_RAStepEdit.setValue( 0 );
   this.grid_RAStepEdit.toolTip = "<p>Grid step size in rightascension</p>";
   this.grid_RAStepEdit.enabled = false;
   this.grid_RAStepEdit.sizer.addStretch();

   this.grid_DECStepEdit = new NumericEdit( this );
   this.grid_DECStepEdit.label.text = "DEC step size:";
   this.grid_DECStepEdit.label.minWidth = labelWidth;
   this.grid_DECStepEdit.setRange( 0, 12 );
   this.grid_DECStepEdit.setPrecision( 2 );
   this.grid_DECStepEdit.setValue( 0 );
   this.grid_DECStepEdit.toolTip = "<p>Grid step size in declination</p>";
   this.grid_DECStepEdit.enabled = false;
   this.grid_DECStepEdit.sizer.addStretch();

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
   //   this.sizer.add( this.gridType_Sizer );
   this.sizer.add( this.grid_maxRAEdit );
   this.sizer.add( this.grid_minRAEdit );
   this.sizer.add( this.grid_maxDECEdit );
   this.sizer.add( this.grid_minDECEdit );
   this.sizer.add( this.grid_RAStepEdit );
   this.sizer.add( this.grid_DECStepEdit );
   /*  this.sizer.add( this.grid_maxAzimuthEdit );
     this.sizer.add( this.grid_minAzimuthEdit );
     this.sizer.add( this.grid_maxHeightEdit );
     this.sizer.add( this.grid_minHeightEdit );*/
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Coordinate Grid Definition";
   this.adjustToContents();
   this.setMinSize();

   this.enableGridServices = function( enable )
   {
      this.grid_maxRAEdit.enabled = enable;
      this.grid_minRAEdit.enabled = enable;
      this.grid_maxDECEdit.enabled = enable;
      this.grid_minDECEdit.enabled = enable;
      this.grid_RAStepEdit.enabled = enable;
      this.grid_DECStepEdit.enabled = enable;

      /*	this.grid_maxAzimuthEdit.enabled= !enable;
      	this.grid_minAzimuthEdit.enabled= !enable;
      	this.grid_maxHeightEdit.enabled = !enable;
      	this.grid_minHeightEdit.enabled = !enable;*/
   };

   let enableEquatorialCoordGrid = true; //this.gridType_ComboBox.currentItem == 0;

   this.enableGridServices( enableEquatorialCoordGrid );
}

CoordGridDefinitionDialog.prototype = new Dialog;

#ifdef UPLOAD_DATA_FEATURE

/*
 * Dialog to configure a connection for an upload of metadata to the cloud
 *
 * - url for connection
 * - user credentionals
 *
 * Use this dialog to get a connection token from the cloud application
 */
function CloudConnectionDialog( dialog )
{
   this.__base__ = Dialog;
   this.__base__();

   let labelWidth = this.font.width( "Cloud Connection URL:" + "T" );

   this.cloudConnectionURL_Label = new Label( this );
   this.cloudConnectionURL_Label.text = "URL:";
   this.cloudConnectionURL_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.cloudConnectionURL_Label.minWidth = labelWidth;
   this.cloudConnectionURL_Label.toolTip = "<p>Set the url for the cloud application. </p>";

   this.cloudConnectionURL_Edit = new Edit( this );
   this.cloudConnectionURL_Edit.text = "klaus-Inspiron-1720:5000/";
   this.cloudConnectionURL_Edit.setFixedWidth( 185 );
   this.cloudConnectionURL_Edit.toolTip = "<p>Enter the url for the cloud application.</p>";

   this.cloudConnectionURL_Sizer = new HorizontalSizer;
   this.cloudConnectionURL_Sizer.spacing = 4;
   this.cloudConnectionURL_Sizer.add( this.cloudConnectionURL_Label );
   this.cloudConnectionURL_Sizer.add( this.cloudConnectionURL_Edit );

   this.User_Label = new Label( this );
   this.User_Label.text = "User:";
   this.User_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.User_Label.minWidth = labelWidth;
   this.User_Label.toolTip = "<p>Set the user credentials for the cloud connection. </p>";

   this.User_Edit = new Edit( this );
   this.User_Edit.setFixedWidth( 185 );
   this.User_Edit.toolTip = "<p>Specify login user.</p>";

   this.User_Sizer = new HorizontalSizer;
   this.User_Sizer.spacing = 4;
   this.User_Sizer.add( this.User_Label );
   this.User_Sizer.add( this.User_Edit );

   this.Password_Label = new Label( this );
   this.Password_Label.text = "Password:";
   this.Password_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.Password_Label.minWidth = labelWidth;
   this.Password_Label.toolTip = "<p>Set the user credentials for the cloud connection. </p>";

   this.Password_Edit = new Edit( this );
   this.Password_Edit.setFixedWidth( 185 );
   this.Password_Edit.passwordMode = true;
   this.Password_Edit.toolTip = "<p>Specify login password.</p>";

   console.writeln( JSON.stringify( this.Password_Edit ) );

   this.Password_Sizer = new HorizontalSizer;
   this.Password_Sizer.spacing = 4;
   this.Password_Sizer.add( this.Password_Label );
   this.Password_Sizer.add( this.Password_Edit );

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
   this.sizer.add( this.cloudConnectionURL_Sizer );
   this.sizer.add( this.User_Sizer );
   this.sizer.add( this.Password_Sizer );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Cloud Connection";
   this.adjustToContents();
   this.setMinSize();
}

CloudConnectionDialog.prototype = new Dialog;

#endif // UPLOAD_DATA_FEATURE

/*
 * Batch Frame Acquisition dialog
 */
function BatchFrameAcquisitionDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //this.computeApparentPos_Checkbox.
   this.mountDialog = new MountParametersDialog( this );

   this.cameraDialog = new CameraParametersDialog( this );
   this.filterDialog = new FilterWheelParametersDialog( this );
   this.coordGridDialog = new CoordGridDefinitionDialog( this );
#ifdef UPLOAD_DATA_FEATURE
   this.cloudConnectionDialog = new CloudConnectionDialog( this );
#endif
   this.updateDialog = {};
   this.filter = [];
   //

   this.getFilterParameters = function()
   {
      let filter = [];
      for ( let i = 0; i < 10; ++i )
      {
         let filterIndex = i + 1;
         let filterPropertyKey = "/" + engine.getFilterWheelDeviceName() + "/WHEEL_SLOT_NAME/SLOT_NAME_" + filterIndex;
         engine.deviceController.getCommandParameters = filterPropertyKey;
         engine.deviceController.serverCommand = "TRY_GET";
         engine.executeController();
         if ( engine.deviceController.getCommandResult.length != 0 )
            filter[ i ] = engine.deviceController.getCommandResult;
      }
      return filter;
   };

   this.getServerDownloadDir = function()
   {
      let serverDir = "";
      let propertyKey = "/" + engine.ccdDevice + "/CCD_LOCAL_MODE/DIR";
      engine.deviceController.getCommandParameters = propertyKey;
      engine.deviceController.serverCommand = "TRY_GET";

      engine.executeController();
      if ( engine.deviceController.getCommandResult.length != 0 )
      {
         serverDir = engine.deviceController.getCommandResult;
      }
      return serverDir;
   };

   //

   this.serverhost_Edit = new Edit( this );
   this.serverhost_Edit.text = "localhost";
   this.serverhost_Edit.toolTip = "<p>Enter INDI server host.</p>";
   this.connect_PushButton = new PushButton( this );
   this.connect_PushButton.icon = this.scaledResource( ":/icons/power.png" );
   this.connect_PushButton.text = "Connect";
   this.connect_PushButton.toolTip = "<p>Connect to INDI server.</p>";
   this.connect_PushButton.onClick = function()
   {
      engine.deviceController.serverConnect = true;
      engine.deviceController.serverHostName = this.dialog.serverhost_Edit.text;
      engine.executeController();

      // Wait until device names are received from server
      console.note( "<p>Getting device information ... " );
      for ( engine.restartTimer(); !engine.timeout(); )
      {
         msleep( 100 );
         processEvents();
      }
      msleep( 500 );
      console.noteln( "done. </p>" );

      // Connecting to devices
      for ( let i = 0; i < engine.deviceController.devices.length; ++i )
      {
         // struct = [deficeName, deviceLabel]
         let deviceStruct = engine.deviceController.devices[ i ].toString().split( ',' );
         let device = deviceStruct[ 0 ];
         // ignore server device
         if ( device.indexOf( "Server" ) != -1 )
            continue;

         console.note( "<p>Connecting to device '" + device + "' ..." )
         let propertyKey = "/" + device + "/CONNECTION/CONNECTED";
         console.writeln( propertyKey );
         engine.deviceController.newProperties = [
            [ propertyKey, "INDI_SWITCH", "ON" ]
         ];
         engine.deviceController.serverCommand = "SET";
         engine.executeController();
         engine.deviceController.serverCommand = "";

         // Wait until device is connected
         for ( engine.restartTimer(); !engine.timeout(); )
         {
            msleep( 100 );
            processEvents();
            if ( propertyEquals( ( new IndigoDeviceController ).properties, propertyKey, "ON" ) )
               break;
         }
         console.noteln( "<p>Connecting to device '" + device + "' ... done. </p>" );

         // determine type of device
         // -- mount device
         if ( engine.mountDevice == "" )
         {
            let mountPropertyKey = "/" + device + "/MOUNT_EQUATORIAL_COORDINATES/RA";
            engine.deviceController.getCommandParameters = mountPropertyKey;
            engine.deviceController.serverCommand = "TRY_GET";

            engine.executeController();
            if ( engine.deviceController.getCommandResult.length != 0 )
            {
               engine.mountDevice = device;
               this.dialog.mountparam_PushButton.enabled = true;
               this.dialog.mountparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-green.png" );
            }
         }
         // -- ccd device
         if ( engine.ccdDevice == "" )
         {
            let ccdPropertyKey = "/" + device + "/CCD_EXPOSURE/EXPOSURE";
            engine.deviceController.getCommandParameters = ccdPropertyKey;
            engine.deviceController.serverCommand = "TRY_GET";

            engine.executeController();
            if ( engine.deviceController.getCommandResult.length != 0 )
            {
               engine.ccdDevice = device;
               this.dialog.cameraparam_PushButton.enabled = true;
               this.dialog.cameraparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-green.png" );
            }
         }

         // -- filter wheel device
         if ( engine.filterWheelDevice == "" )
         {
            let filterWheelPropertyKey = "/" + device + "/WHEEL_SLOT/SLOT";
            engine.deviceController.getCommandParameters = filterWheelPropertyKey;
            engine.deviceController.serverCommand = "TRY_GET";

            engine.executeController();
            if ( engine.deviceController.getCommandResult.length != 0 )
            {
               engine.filterWheelDevice = device;
               this.dialog.filterparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-green.png" );
               engine.extFilterWheelDevice = ( engine.ccdDevice != device ) ? device : "";
            }
            this.dialog.filterparam_PushButton.enabled = true;
         }
      }
   };

   this.serverConnection_Sizer = new HorizontalSizer;
   this.serverConnection_Sizer.spacing = 4;
   this.serverConnection_Sizer.add( this.serverhost_Edit, 100 );
   this.serverConnection_Sizer.add( this.connect_PushButton );

   this.mountparam_PushButton = new PushButton( this );
   this.mountparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-grey.png" );
   this.mountparam_PushButton.text = "Mount Parameters";
   this.mountparam_PushButton.toolTip = "<p>Set mount device parameters</p>";
   this.mountparam_PushButton.enabled = false;
   this.mountparam_PushButton.onClick = function()
   {
      if ( this.dialog.mountDialog.execute() )
      {
         engine.center = this.dialog.mountDialog.centering_Checkbox.checked;
         engine.align = this.dialog.mountDialog.alignmentCorrection_Checkbox.checked;
         engine.alignModelFile = this.dialog.mountDialog.alignmentModel_Edit.text;
         engine.computeApparentPos = this.dialog.mountDialog.computeApparentPos_Checkbox.checked;
      }
   };

   this.cameraparam_PushButton = new PushButton( this );
   this.cameraparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-grey.png" );
   this.cameraparam_PushButton.text = "Camera Parameters";
   this.cameraparam_PushButton.toolTip = "<p>Set camera device parameters</p>";
   this.cameraparam_PushButton.enabled = false;
   this.cameraparam_PushButton.onClick = function()
   {
      let serverDir = this.dialog.getServerDownloadDir();
      this.dialog.cameraDialog.serverDownloadDir_Edit.text = serverDir;
      if ( this.dialog.cameraDialog.execute() )
      {
         engine.binningX.idx = this.dialog.cameraDialog.binningX_ComboBox.currentItem;
         engine.binningX.text = this.dialog.cameraDialog.binningX_ComboBox.itemText( engine.binningX.idx );
         engine.binningY.idx = this.dialog.cameraDialog.binningY_ComboBox.currentItem;
         engine.binningY.text = this.dialog.cameraDialog.binningY_ComboBox.itemText( engine.binningY.idx );
         engine.frameType.idx = this.dialog.cameraDialog.frameType_ComboBox.currentItem;
         engine.frameType.text = this.dialog.cameraDialog.frameType_ComboBox.itemText( engine.frameType.idx );
         engine.openClientImages = this.dialog.cameraDialog.openImages_Checkbox.checked;
         engine.saveClientImages = this.dialog.cameraDialog.saveImages_Checkbox.checked;
         engine.clientDownloadDir = this.dialog.cameraDialog.clientDownloadDir_Edit.text;
         engine.clientFileTemplate = this.dialog.cameraDialog.clientFileTemplate_Edit.text;
         engine.clientFileHints = this.dialog.cameraDialog.clientFileHints_Edit.text;
         engine.overwriteClientFiles = this.dialog.cameraDialog.overwriteImages_Checkbox.checked;
         engine.serverDownloadDir = this.dialog.cameraDialog.serverDownloadDir_Edit.text;
         engine.serverFileTemplate = this.dialog.cameraDialog.serverFileTemplate_Edit.text;
         engine.uploadMode.idx = this.dialog.cameraDialog.uploadMode_ComboBox.currentItem;
         engine.uploadMode.text = this.dialog.cameraDialog.uploadMode_ComboBox.itemText( engine.uploadMode.idx );

         // diable target treebox if frame type not "LIGHT"
         if ( engine.frameType.idx != 0 )
         {
            this.dialog.mountParam_TreeBox.enabled = false;
            this.dialog.loadTargetCoord_Button.enabled = false;
            engine.targets[ 0 ] = {
               "name": engine.frameType.text,
               "ra": 0.0,
               "dec": 0.0
            };
         }
         else
         {
            this.dialog.mountParam_TreeBox.enabled = true;
            this.dialog.loadTargetCoord_Button.enabled = true;
         }
      }
   };

   this.filterparam_PushButton = new PushButton( this );
   this.filterparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-grey.png" );
   this.filterparam_PushButton.text = "Filter Parameters";
   this.filterparam_PushButton.enabled = false;
   this.filterparam_PushButton.toolTip = "<p>Set filterwheel device parameters</p>";
   this.filterparam_PushButton.onClick = function()
   {
      let filterList = this.dialog.getFilterParameters();
      // fill table
      this.dialog.filterDialog.filterType_TreeBox.clear();
      for ( let i = 0; i < filterList.length; ++i )
      {
         let filterIdx = i + 1;
         let node = new TreeBoxNode( this.dialog.filterDialog.filterType_TreeBox );
         node.setText( 0, filterList[ i ] );
         node.setText( 1, filterIdx.toString() );
      }
      if ( this.dialog.filterDialog.execute() )
      {}
      if ( this.dialog.filterDialog.filterType_TreeBox.numberOfChildren != 0 )
         this.dialog.filterparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-green.png" );
   };

   this.serverDevicesButton_Sizer = new HorizontalSizer;
   this.serverDevicesButton_Sizer.spacing = 4;
   this.serverDevicesButton_Sizer.add( this.mountparam_PushButton );
   this.serverDevicesButton_Sizer.add( this.cameraparam_PushButton );
   this.serverDevicesButton_Sizer.add( this.filterparam_PushButton );
   this.serverDevicesButton_Sizer.addStretch();

   this.serverDevices_Sizer = new HorizontalSizer;
   this.serverDevices_Sizer.spacing = 4;
   //this.serverDevices_Sizer.add( this.serverDevices_TreeBox);
   this.serverDevices_Sizer.add( this.serverDevicesButton_Sizer );

   this.connection_GroupBox = new GroupBox( this );
   this.connection_GroupBox.title = "Server connection";
   this.connection_GroupBox.sizer = new VerticalSizer;
   this.connection_GroupBox.sizer.margin = 6;
   this.connection_GroupBox.sizer.spacing = 4;
   this.connection_GroupBox.sizer.add( this.serverConnection_Sizer );
   this.connection_GroupBox.sizer.add( this.serverDevices_Sizer );

   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = this.logicalPixelsToPhysical( 4 );
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; " +
      "An image acquisition batch processing utility.</p>" +
      "<p>Copyright &copy; 2015-2020 Klaus Kretzschmar</p>";
   //

   this.mountParam_TreeBox = new TreeBox( this );
   this.mountParam_TreeBox.multipleSelection = false;
   this.mountParam_TreeBox.rootDecoration = false;
   this.mountParam_TreeBox.alternateRowColor = true;
   this.mountParam_TreeBox.setScaledMinSize( 500, 100 );
   this.mountParam_TreeBox.numberOfColumns = 4;
   this.mountParam_TreeBox.setHeaderText( 0, "Target" );
   this.mountParam_TreeBox.setHeaderText( 1, "Right Ascension" );
   this.mountParam_TreeBox.setHeaderText( 2, "Declination" );
   this.mountParam_TreeBox.setHeaderText( 3, "Rotation" );
   this.mountParam_TreeBox.headerVisible = true;

   //

   this.updateTargets = function( targetTreeBox )
   {
      for ( let i = 0; i < targetTreeBox.numberOfChildren; ++i )
      {
         let childNode = targetTreeBox.child( i );
         let targetItem = {
            "name": "",
            "ra": 0.0,
            "dec": 0.0
         };
         targetItem.name = childNode.text( 0 );
         targetItem.ra = sexagesimalStringToDouble( childNode.text( 1 ) );
         targetItem.dec = sexagesimalStringToDouble( childNode.text( 2 ) );
         engine.targets[ i ] = targetItem;
      }
   };

   this.findTargetCoord_Button = new ToolButton( this );
   this.findTargetCoord_Button.icon = this.scaledResource( ":/icons/find.png" );
   this.findTargetCoord_Button.toolTip = "<p>Search for target coordinates or add coordinates manually.</p>";
   this.findTargetCoord_Button.onClick = function()
   {
      let search = new SearchCoordinatesDialog( null, true, true );
      search.windowTitle = "Online Coordinates Search"
      if ( search.execute() )
      {
         let object = search.object;
         if ( object == null )
            return;

         let node = new TreeBoxNode( this.dialog.mountParam_TreeBox );
         node.setText( 0, object.name );
         node.setText( 1, sexagesimalStringFromDouble( object.posEq.x / 15 ) );
         node.setText( 2, sexagesimalStringFromDouble( object.posEq.y ) );
         node.setText( 3, "0" );

         let targetItem = {
            "name": "",
            "ra": 0.0,
            "dec": 0.0
         };

         targetItem.name = object.name.replace( /\s/g, '' );;
         targetItem.ra = object.posEq.x / 15;
         targetItem.dec = object.posEq.y;
         engine.targets.push( targetItem );

         //console.writeln("Name: " + object.name + ", posEq (x,y): " + sexagesimalStringFromDouble(object.posEq.x / 15) + "," +  sexagesimalStringFromDouble(object.posEq.y));
         //this.dialog.coords_Editor.SetCoords(object.posEq);
      }
   };

   this.gridTargetCoord_Button = new ToolButton( this );
   this.gridTargetCoord_Button.icon = this.scaledResource( ":/icons/border.png" );
   this.gridTargetCoord_Button.toolTip = "<p>Create grid of coordinates.</p>";
   this.gridTargetCoord_Button.onClick = function()
   {
      if ( this.dialog.coordGridDialog.execute() )
      {
         let ra_lower = this.dialog.coordGridDialog.grid_minRAEdit.value;
         let ra_upper = this.dialog.coordGridDialog.grid_maxRAEdit.value;
         let dec_lower = this.dialog.coordGridDialog.grid_minDECEdit.value;
         let dec_upper = this.dialog.coordGridDialog.grid_maxDECEdit.value;
         let ra_step_deg = this.dialog.coordGridDialog.grid_RAStepEdit.value;
         let ra_step = Math.round( ra_step_deg / 15 * 1000000000000 ) / 1000000000000;

         let dec_step_deg = this.dialog.coordGridDialog.grid_DECStepEdit.value;;

         let num_of_ra_steps = ( ra_upper - ra_lower ) / ra_step;
         let num_of_dec_steps = ( dec_upper - dec_lower ) / dec_step_deg;

         let count = 0;
         for ( let ra = ra_lower; ra <= ra_upper; ra += ra_step )
            for ( let dec = dec_lower; dec <= dec_upper; dec += dec_step_deg )
            {
               let nodeText = "grid_point_" + count;
               let node = new TreeBoxNode( this.dialog.mountParam_TreeBox );
               node.setText( 0, nodeText );
               node.setText( 1, sexagesimalStringFromDouble( ra ) );
               node.setText( 2, sexagesimalStringFromDouble( dec ) );
               node.setText( 3, "0" );

               let targetItem = {
                  "name": "",
                  "ra": 0.0,
                  "dec": 0.0
               };
               targetItem.name = nodeText;
               targetItem.ra = ra;
               targetItem.dec = dec;
               engine.targets[ count ] = targetItem;
               count++;
            }

         engine.targetInHourAngle = true;
      }
   };

   //
   this.loadTargetCoord_Button = new ToolButton( this );
   this.loadTargetCoord_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.loadTargetCoord_Button.toolTip = "<p>Add target coordinates from csv file	.</p>";
   this.loadTargetCoord_Button.onClick = function()
   {
      let ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select CSV";
      ofd.filters = [
         [ "Targets", "*.csv" ]
      ];

      if ( ofd.execute() )
      {
         this.dialog.mountParam_TreeBox.canUpdate = false;
         for ( let i = 0; i < ofd.fileNames.length; ++i )
         {
            let f = new File;
            f.openForReading( ofd.fileNames[ i ] );
            let buffer = f.read( DataType_ByteArray, f.size );
            f.close();
            let content = buffer.utf8ToString();
            let lines = content.split( "\n" );
            for ( let lineIndex = 0; lineIndex < lines.length; lineIndex++ )
            {
               let line = lines[ lineIndex ];
               let tokens = line.split( "," );
               if ( tokens.length < 3 )
                  continue;
               let node = new TreeBoxNode( this.dialog.mountParam_TreeBox );
               let targetItem = {
                  "name": "",
                  "ra": 0.0,
                  "dec": 0.0
               };
               for ( let j = 0; j < 4; ++j )
               {
                  if ( tokens.length == 3 && j == 3 )
                     continue;
                  node.setText( j, tokens[ j ].toString() );
               }
               targetItem.name = tokens[ 0 ].toString();
               targetItem.ra = sexagesimalStringToDouble( tokens[ 1 ].toString(), " " );
               targetItem.dec = sexagesimalStringToDouble( tokens[ 2 ].toString(), " " );
               engine.targets[ lineIndex ] = targetItem;
            }
         }
         this.dialog.mountParam_TreeBox.canUpdate = true;
      }
   };

   //

   this.moveUpTargetCoord_Button = new ToolButton( this );
   this.moveUpTargetCoord_Button.icon = this.scaledResource( ":/arrows/arrow-up.png" );
   this.moveUpTargetCoord_Button.toolTip = "<p>Move up target.</p>";
   this.moveUpTargetCoord_Button.onClick = function()
   {
      if ( this.dialog.mountParam_TreeBox.selectedNodes.length == 1 )
      {
         let selectedNode = this.dialog.mountParam_TreeBox.selectedNodes[ 0 ];
         let idx = this.dialog.mountParam_TreeBox.childIndex( selectedNode );
         if ( idx > 0 )
         {
            this.dialog.mountParam_TreeBox.remove( idx );
            this.dialog.mountParam_TreeBox.insert( idx - 1, selectedNode );
         }
         this.dialog.updateTargets( this.dialog.mountParam_TreeBox );
      }
   }

   //

   this.moveDownTargetCoord_Button = new ToolButton( this );
   this.moveDownTargetCoord_Button.icon = this.scaledResource( ":/arrows/arrow-down.png" );
   this.moveDownTargetCoord_Button.toolTip = "<p>Move down target.</p>";
   this.moveDownTargetCoord_Button.onClick = function()
   {
      if ( this.dialog.mountParam_TreeBox.selectedNodes.length == 1 )
      {
         let selectedNode = this.dialog.mountParam_TreeBox.selectedNodes[ 0 ];
         let idx = this.dialog.mountParam_TreeBox.childIndex( selectedNode );
         if ( idx < this.dialog.mountParam_TreeBox.numberOfChildren - 1 )
         {
            this.dialog.mountParam_TreeBox.remove( idx );
            this.dialog.mountParam_TreeBox.insert( idx + 1, selectedNode );
         }
         this.dialog.updateTargets( this.dialog.mountParam_TreeBox );
      }
   }

   //

   this.clearTargetCoord_Button = new ToolButton( this );
   this.clearTargetCoord_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.clearTargetCoord_Button.toolTip = "<p>Clear targets.</p>";
   this.clearTargetCoord_Button.onClick = function()
   {
      if ( this.dialog.mountParam_TreeBox.selectedNodes.length == 0 )
      {
         this.dialog.mountParam_TreeBox.clear();
         engine.targets = [];
      }
      else
      {
         let selectedNode = this.dialog.mountParam_TreeBox.selectedNodes[ 0 ];
         let idx = this.dialog.mountParam_TreeBox.childIndex( selectedNode );
         this.dialog.mountParam_TreeBox.remove( idx );
         engine.targets.splice( idx, 1 );
      }
      this.dialog.updateTargets( this.dialog.mountParam_TreeBox );
   }

   this.mountParam_ButtonSizer = new VerticalSizer;
   this.mountParam_ButtonSizer.spacing = 4;
   this.mountParam_ButtonSizer.add( this.findTargetCoord_Button );
   this.mountParam_ButtonSizer.add( this.loadTargetCoord_Button );
   this.mountParam_ButtonSizer.add( this.gridTargetCoord_Button );
   this.mountParam_ButtonSizer.add( this.moveUpTargetCoord_Button );
   this.mountParam_ButtonSizer.add( this.moveDownTargetCoord_Button );
   this.mountParam_ButtonSizer.add( this.clearTargetCoord_Button );
   this.mountParam_ButtonSizer.addStretch();

   //

   this.mountParam_GroupBox = new GroupBox( this );
   this.mountParam_GroupBox.title = "Targets";
   this.mountParam_GroupBox.sizer = new HorizontalSizer;
   this.mountParam_GroupBox.sizer.margin = 6;
   this.mountParam_GroupBox.sizer.spacing = 4;
   this.mountParam_GroupBox.sizer.add( this.mountParam_TreeBox, 100 );
   this.mountParam_GroupBox.sizer.add( this.mountParam_ButtonSizer );

   // acquisition queue treebox

   this.worklist_TreeBox = new TreeBox( this );
   this.worklist_TreeBox.multipleSelection = false;
   this.worklist_TreeBox.rootDecoration = false;
   this.worklist_TreeBox.alternateRowColor = true;
   this.worklist_TreeBox.setScaledMinSize( 500, 200 );
   this.worklist_TreeBox.numberOfColumns = 6;
   this.worklist_TreeBox.setHeaderText( 0, "Target" );
   this.worklist_TreeBox.setHeaderText( 1, "Filter" );
   this.worklist_TreeBox.setHeaderText( 2, "Binning" );
   this.worklist_TreeBox.setHeaderText( 3, "Exp. time" );
   this.worklist_TreeBox.setHeaderText( 4, "#frames" );
   this.worklist_TreeBox.setHeaderText( 5, "Status" );
   this.worklist_TreeBox.headerVisible = true;

   //

   this.createWorklist_Button = new ToolButton( this );
   //this.createWorklist_Button.text = "Worklist";
   this.createWorklist_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.createWorklist_Button.toolTip = "<p>Create worklist</p>";
   this.createWorklist_Button.onClick = function()
   {
      engine.worklist.splice( 0, engine.worklist.length );
      this.dialog.worklist_TreeBox.clear();
      engine.print();
      let worklist = engine.createWorklist();
      for ( let i = 0; i < worklist.length; ++i )
      {
         let node = new TreeBoxNode( this.dialog.worklist_TreeBox );
         node.setText( 0, worklist[ i ].targetName );
         node.setText( 1, worklist[ i ].filterName );
         node.setText( 2, format( "%dx%d", worklist[ i ].binningX, worklist[ i ].binningY ) );
         node.setText( 3, worklist[ i ].expTime.toString() );
         node.setText( 4, worklist[ i ].numOfFrames.toString() );
         node.setIcon( 5, this.scaledResource( ":/bullets/bullet-ball-glass-grey.png" ) );
      }
   };

   this.updateWorklist_Button = new ToolButton( this );
   //this.updateWorklist_Button.text = "Update";
   this.updateWorklist_Button.icon = this.scaledResource( ":/icons/write.png" );
   this.updateWorklist_Button.toolTip = "<p>Update worklist</p>";
   this.updateWorklist_Button.onClick = function()
   {
      if ( this.dialog.worklist_TreeBox.selectedNodes.length > 0 )
      {
         let selectedNode = this.dialog.worklist_TreeBox.selectedNodes[ 0 ];
         let idx = this.dialog.worklist_TreeBox.childIndex( selectedNode );
         this.dialog.updateDialog = new UpdateWorklistDialog( this, idx );
         if ( this.dialog.updateDialog.execute() )
         {
            this.dialog.worklist_TreeBox.clear();
            for ( let i = 0; i < engine.worklist.length; ++i )
            {
               let node = new TreeBoxNode( this.dialog.worklist_TreeBox );
               node.setText( 0, engine.worklist[ i ].targetName );
               node.setText( 1, engine.worklist[ i ].filterName );
               node.setText( 2, format( "%dx%d", engine.worklist[ i ].binningX, engine.worklist[ i ].binningY ) );
               node.setText( 3, engine.worklist[ i ].expTime.toString() );
               node.setText( 4, engine.worklist[ i ].numOfFrames.toString() );
               node.setIcon( 5, this.scaledResource( ":/bullets/bullet-ball-glass-grey.png" ) );
            }
         }
      }
   };

   this.clearWorklist_Button = new ToolButton( this );
   //this.clearWorklist_Button.text = "Clear";
   this.clearWorklist_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.clearWorklist_Button.toolTip = "<p>Clear worklist</p>";
   this.clearWorklist_Button.onClick = function()
   {
      if ( this.dialog.worklist_TreeBox.selectedNodes.length == 0 )
      {
         this.dialog.worklist_TreeBox.clear();
         engine.worklist.splice( 0, engine.worklist.length );
      }
      else
      {
         let selectedNode = this.dialog.worklist_TreeBox.selectedNodes[ 0 ];
         let idx = this.dialog.worklist_TreeBox.childIndex( selectedNode );
         this.dialog.worklist_TreeBox.remove( idx );
         engine.worklist.splice( idx, 1 );
      }
   };

#ifdef UPLOAD_DATA_FEATURE
   this.cloudUpload_Button = new ToolButton( this );
   //this.cloudUpload_Button.text = "Clear";
   this.cloudUpload_Button.icon = this.scaledResource( ":/icons/cloud.png" );
   this.cloudUpload_Button.toolTip = "<p>Cloud upload configuration</p>";
   this.cloudUpload_Button.onClick = function()
   {
      if ( this.dialog.cloudConnectionDialog.execute() )
      {

         engine.cloudURL = this.dialog.cloudConnectionDialog.cloudConnectionURL_Edit.text;

         let T = new NetworkTransfer;
         if ( engine.cloudURL.indexOf( "https" ) != -1 )
            T.setSSL();
         T.setURL( this.dialog.cloudConnectionDialog.cloudConnectionURL_Edit.text + "login" );
         T.onDownloadDataAvailable = function( data )
         {
            try
            {
               let token = JSON.parse( data );
               if ( token.meta.code == 200 )
               { // ok
                  engine.auth_token = token.response.user.authentication_token;
               }
               else if ( token.meta.code == 400 )
               { // wrong credentials
                  if ( token.response.errors.email != null )
                  {
                     ( new MessageBox( token.response.errors.email[ 0 ], "Error", StdIcon_Error ) ).execute();
                  }
                  else if ( token.response.errors.password != null )
                  {
                     ( new MessageBox( token.response.errors.password[ 0 ], "Error", StdIcon_Error ) ).execute();
                  }
                  else
                  {
                     ( new MessageBox( "Code: " + token.meta.code, "Error", StdIcon_Error ) ).execute();
                  }
               }
               else
               {
                  ( new MessageBox( "HTTP error code: " + token.meta.code, "Error", StdIcon_Error ) ).execute();
               }
            }
            catch ( e )
            {
               ( new MessageBox( "Login service not available.", "Error", StdIcon_Error ) ).execute();
            }
         };

         let data = "{\"email\":\"" + this.dialog.cloudConnectionDialog.User_Edit.text + "\", " +
            "\"password\":\"" + this.dialog.cloudConnectionDialog.Password_Edit.text + "\"}";

         let lenghtStr = "Content-Length: " + data.length;
         T.setCustomHTTPHeaders( [ "Content-Type: application/json", lenghtStr ] );

         let rc = T.post( data );
      }
   };
#endif // UPLOAD_DATA_FEATURE
   this.startProcessing_Button = new PushButton( this );
   this.startProcessing_Button.text = "Start";
   this.startProcessing_Button.icon = this.scaledResource( ":/icons/power.png" );
   this.startProcessing_Button.toolTip = "<p>Start processing.</p>";
   this.startProcessing_Button.onClick = function()
   {
      engine.startProcessing( this.dialog.worklist_TreeBox );
   };

   this.cancelProcessing_Button = new PushButton( this );
   this.cancelProcessing_Button.text = "Cancel";
   this.cancelProcessing_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancelProcessing_Button.onClick = function()
   {

      this.dialog.cancel();
   };

   this.worklist_ToolButtonSizer = new VerticalSizer;
   this.worklist_ToolButtonSizer.spacing = 4;
   this.worklist_ToolButtonSizer.add( this.createWorklist_Button );
   this.worklist_ToolButtonSizer.add( this.updateWorklist_Button );
   this.worklist_ToolButtonSizer.add( this.clearWorklist_Button );
#ifdef UPLOAD_DATA_FEATURE
   this.worklist_ToolButtonSizer.add( this.cloudUpload_Button );
#endif
   this.worklist_ToolButtonSizer.addStretch();

   this.worklist_TreeBoxButtonSizer = new HorizontalSizer;
   this.worklist_TreeBoxButtonSizer.spacing = 4;
   this.worklist_TreeBoxButtonSizer.add( this.worklist_TreeBox, 100 );
   this.worklist_TreeBoxButtonSizer.add( this.worklist_ToolButtonSizer );

   this.worklist_ButtonSizer = new HorizontalSizer;
   this.worklist_ButtonSizer.spacing = 4;
   this.worklist_ButtonSizer.add( this.startProcessing_Button );
   this.worklist_ButtonSizer.add( this.cancelProcessing_Button );
   this.worklist_ButtonSizer.addStretch();

   this.worklist_GroupBox = new GroupBox( this );
   this.worklist_GroupBox.title = "Acquisition queue";
   this.worklist_GroupBox.sizer = new VerticalSizer;
   this.worklist_GroupBox.sizer.margin = 6;
   this.worklist_GroupBox.sizer.spacing = 4;
   this.worklist_GroupBox.sizer.add( this.worklist_TreeBoxButtonSizer );
   this.worklist_GroupBox.sizer.add( this.worklist_ButtonSizer );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.helpLabel );
   this.sizer.add( this.connection_GroupBox );
   this.sizer.add( this.mountParam_GroupBox );
   this.sizer.add( this.worklist_GroupBox );

   this.windowTitle = TITLE + " Script";

   this.adjustToContents();
   this.setMinSize();
}

// Our dialog inherits all properties and methods from the core Dialog object.
BatchFrameAcquisitionDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   // Show dialog box, quit if cancelled.
   console.abortEnabled = true;
   let dialog = new BatchFrameAcquisitionDialog();
   for ( ;; )
   {
      if ( dialog.execute() )
      {}

      break;
   }
}

main();

// ----------------------------------------------------------------------------
// EOF BatchFrameAcquisition.js - Released 2020-01-24T13:16:56Z
