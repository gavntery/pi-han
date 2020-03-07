// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// LinearDefectDetection.js - Released 2019-12-23T12:01:37Z
// ----------------------------------------------------------------------------
//
// Pattern Correction Scripts
//
// Copyright (c) 2019 Vicent Peris (OAUV). All Rights Reserved.
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

#include <pjsr/ImageOp.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/UndoFlag.jsh>

#feature-id Utilities > LinearDefectDetection

#feature-info  <b>LinearDefectDetection version 1.0</b><br/>\
   <br/>\
   A script to detect defective columns or rows in a reference image.<br/>\
   <br/>\
   Copyright &copy; 2019 Vicent Peris (OAUV). All Rights Reserved.

#ifndef __PI_ENCODED_VERSION__
#error This script requires PixInsight version 1.8.7 or higher.
#endif
#iflt __PI_ENCODED_VERSION__ "000100080007"
#error This script requires PixInsight version 1.8.7 or higher.
#endif

#define TITLE "LinearDefectDetection"
#define VERSION "1.0"

#include "CommonFunctions.jsh"
#include "LinearDefectDetectionGUI.jsh"

/*
 * LinearDefectDetection Script.
 *
 * Script to detect defective columns or rows in a reference image.
 */

// ----------------------------------------------------------------------------

/*
 * Script parameters.
 */
function LDDParameters()
{
   this.__base__ = Object;
   this.__base__();

   this.reset = function()
   {
      this.detectColumns = true;
      this.detectPartialLines = true;
      this.closeFormerWorkingImages = true;
      this.layersToRemove = 9;
      this.rejectionLimit = 3;
      this.detectionThreshold = 5;
      this.partialLineDetectionThreshold = 5;
      this.imageShift = 50;
      this.outputDir = "";
   };

   this.ensureValid = function()
   {
      this.outputDir.trim();
      if ( this.layersToRemove < 7 )
         this.layersToRemove = 7;
   };

   this.import = function()
   {
      if ( Parameters.has( "detectColumns" ) )
         this.detectColumns                  = Parameters.getBoolean( "detectColumns" );
      if ( Parameters.has( "detectPartialLines" ) )
         this.detectPartialLines             = Parameters.getBoolean( "detectPartialLines" );
      if ( Parameters.has( "closeFormerWorkingImages" ) )
         this.closeFormerWorkingImages       = Parameters.getBoolean( "closeFormerWorkingImages" );
      if ( Parameters.has( "layersToRemove" ) )
         this.layersToRemove                 = Parameters.getInteger( "layersToRemove" );
      if ( Parameters.has( "rejectionLimit" ) )
         this.rejectionLimit                 = Parameters.getInteger( "rejectionLimit" );
      if ( Parameters.has( "detectionThreshold" ) )
         this.detectionThreshold             = Parameters.getInteger( "detectionThreshold" );
      if ( Parameters.has( "partialLineDetectionThreshold" ) )
         this.partialLineDetectionThreshold  = Parameters.getInteger( "partialLineDetectionThreshold" );
      if ( Parameters.has( "imageShift" ) )
         this.imageShift                     = Parameters.getInteger( "imageShift" );
      if ( Parameters.has( "outputDir" ) )
         this.outputDir                      = Parameters.get( "outputDir" );

      this.ensureValid();
   };

   this.export = function()
   {
      Parameters.set( "detectColumns",                 this.detectColumns );
      Parameters.set( "detectPartialLines",            this.detectPartialLines );
      Parameters.set( "closeFormerWorkingImages",      this.closeFormerWorkingImages );
      Parameters.set( "layersToRemove",                this.layersToRemove );
      Parameters.set( "rejectionLimit",                this.rejectionLimit );
      Parameters.set( "detectionThreshold",            this.detectionThreshold );
      Parameters.set( "partialLineDetectionThreshold", this.partialLineDetectionThreshold );
      Parameters.set( "imageShift",                    this.imageShift );
      Parameters.set( "outputDir",                     this.outputDir );
   };

   this.reset();
}

LDDParameters.prototype = new Object;

// ----------------------------------------------------------------------------

/*
 * These are the image windows and images that will be used by the script
 * engine.
 */
function DefineWindowsAndImages( detectPartialLines )
{
   // Define the working image windows and images.
   this.referenceImageWindow = ImageWindow.activeWindow;

   this.referenceImage = new Image( this.referenceImageWindow.mainView.image.width,
                                    this.referenceImageWindow.mainView.image.height,
                                    this.referenceImageWindow.mainView.image.numberOfChannels,
                                    this.referenceImageWindow.mainView.image.colorSpace,
                                    32, SampleType_Real );

   this.referenceImage.apply( this.referenceImageWindow.mainView.image );

   if ( detectPartialLines )
   {
      this.referenceImageCopy = new Image( this.referenceImageWindow.mainView.image.width,
                                           this.referenceImageWindow.mainView.image.height,
                                           this.referenceImageWindow.mainView.image.numberOfChannels,
                                           this.referenceImageWindow.mainView.image.colorSpace,
                                           32, SampleType_Real );

      this.referenceImageCopy.apply( this.referenceImageWindow.mainView.image );
   }

   this.referenceSSImage = new Image( this.referenceImage.width,
                                      this.referenceImage.height,
                                      this.referenceImage.numberOfChannels,
                                      this.referenceImage.colorSpace,
                                      32, SampleType_Real );

   this.referenceSSImage.apply( this.referenceImage );

   this.lineModelWindow = new ImageWindow( this.referenceImage.width,
                                           this.referenceImage.height,
                                           this.referenceImage.numberOfChannels,
                                           32, true, false, "line_model" );

   this.lineModelImage = new Image( this.referenceImage.width,
                                    this.referenceImage.height,
                                    this.referenceImage.numberOfChannels,
                                    this.referenceImage.colorSpace,
                                    32, SampleType_Real );

   this.lineDetectionWindow = new ImageWindow( this.referenceImage.width,
                                               this.referenceImage.height,
                                               this.referenceImage.numberOfChannels,
                                               32, true, false, "line_detection" );

   this.lineDetectionImage = new Image( this.referenceImage.width,
                                        this.referenceImage.height,
                                        this.referenceImage.numberOfChannels,
                                        this.referenceImage.colorSpace,
                                        32, SampleType_Real );
}

// ----------------------------------------------------------------------------

/*
 * Script engine.
 */
function LDDEngine( detectColumns, detectPartialLines,
                    layersToRemove, rejectionLimit, imageShift,
                    detectionThreshold, partialLineDetectionThreshold )
{
   let WI = new DefineWindowsAndImages( detectPartialLines );

   // Generate the small-scale image by subtracting
   // the large-scale components of the image.
   MultiscaleIsolation( WI.referenceSSImage, null, layersToRemove );

   // Build a list of lines in the image.
   // This can include entire or partial rows or columns.
   if ( layersToRemove < 7 )
      layersToRemove = 7;
   let partialLines;
   if ( detectPartialLines )
      partialLines = new PartialLineDetection( detectColumns, WI.referenceImageCopy,
                                               layersToRemove - 3, imageShift,
                                               partialLineDetectionThreshold );

   let maxPixelPara, maxPixelPerp;
   if ( detectColumns )
   {
      maxPixelPara = WI.referenceImage.height - 1;
      maxPixelPerp = WI.referenceImage.width - 1;
   }
   else
   {
      maxPixelPara = WI.referenceImage.width - 1;
      maxPixelPerp = WI.referenceImage.height - 1;
   }

   let lines;
   if ( detectPartialLines )
      lines = new LineList( true,
                            partialLines.columnOrRow,
                            partialLines.startPixel,
                            partialLines.endPixel,
                            maxPixelPara, maxPixelPerp );
   else
      lines = new LineList( true, [], [], [], maxPixelPara, maxPixelPerp );

   // Calculate the median value of each line in the image.
   // Create a model image with the lines filled
   // by their respective median values.
   console.writeln( "<end><cbr><br>Analyzing " + lines.columnOrRow.length + " lines in the image<br>" );
   let lineValues = new Array;
   for ( let i = 0; i < lines.columnOrRow.length; ++i )
   {
      let lineRect;
      if ( detectColumns )
      {
         lineRect = new Rect( 1, lines.endPixel[i] - lines.startPixel[i] + 1 );
         lineRect.moveTo( lines.columnOrRow[i], lines.startPixel[i] );
      }
      else
      {
         lineRect = new Rect( lines.endPixel[i] - lines.startPixel[i] + 1, 1 );
         lineRect.moveTo( lines.startPixel[i], lines.columnOrRow[i] );
      }

      let lineStatistics = new IterativeStatistics( WI.referenceSSImage, lineRect, rejectionLimit );
      WI.lineModelImage.selectedRect = lineRect;
      WI.lineModelImage.apply( lineStatistics.median );
      lineValues.push( lineStatistics.median );
   }
   WI.referenceSSImage.resetSelections();
   WI.lineModelImage.resetSelections();

   // Build the detection map image
   // and the list of detected line defects.
   this.detectedColumnOrRow = new Array;
   this.detectedStartPixel = new Array;
   this.detectedEndPixel = new Array;
   let lineModelMedian = WI.lineModelImage.median();
   let lineModelMAD = WI.lineModelImage.MAD();
   let lineRect;
   for ( let i = 0; i < lineValues.length; ++i )
   {
      if ( detectColumns )
      {
         lineRect = new Rect( 1, lines.endPixel[i] - lines.startPixel[i] + 1 );
         lineRect.moveTo( lines.columnOrRow[i], lines.startPixel[i] );
      }
      else
      {
         lineRect = new Rect( lines.endPixel[i] - lines.startPixel[i] + 1, 1 );
         lineRect.moveTo( lines.startPixel[i], lines.columnOrRow[i] );
      }

      WI.lineDetectionImage.selectedRect = lineRect;
      let sigma = Math.abs( lineValues[i] - lineModelMedian ) / ( lineModelMAD * 1.4826 );
      WI.lineDetectionImage.apply( parseInt( sigma ) / ( detectionThreshold + 1 ) );
      if ( sigma >= detectionThreshold )
      {
         this.detectedColumnOrRow.push( lines.columnOrRow[i] );
         this.detectedStartPixel.push( lines.startPixel[i] );
         this.detectedEndPixel.push( lines.endPixel[i] );
      }
   }

   // Transfer the resulting images to their respective windows.
   WI.lineDetectionImage.resetSelections();
   WI.lineDetectionImage.truncate( 0, 1 );
   WI.lineModelImage.apply( WI.referenceImage.median(), ImageOp_Add );

   WI.lineModelWindow.mainView.beginProcess();
   WI.lineModelWindow.mainView.image.apply( WI.lineModelImage );
   WI.lineModelWindow.mainView.endProcess();

   WI.lineDetectionWindow.mainView.beginProcess();
   WI.lineDetectionWindow.mainView.image.apply( WI.lineDetectionImage );
   WI.lineDetectionWindow.mainView.endProcess();

   // Free memory space taken by working images.
   WI.referenceImage.free();
   WI.referenceSSImage.free();
   WI.lineModelImage.free();
   WI.lineDetectionImage.free();
   if ( detectPartialLines )
      WI.referenceImageCopy.free();
   WI.lineModelWindow.show();
   WI.lineDetectionWindow.show();
}

// ----------------------------------------------------------------------------

/*
 * Output the list of detected lines to console and text file.
 */
function Output( detectColumns, detectedLines, threshold, outputDir )
{
   if ( detectedLines.detectedColumnOrRow.length > 0 )
   {
      let outputFileName, columnOrRow;
      if ( detectColumns )
      {
         outputFileName = "/detected-columns_" + threshold + "-sigma.txt";
         columnOrRow = "Col";
      }
      else
      {
         outputFileName = "/detected-rows_" + threshold + "-sigma.txt";
         columnOrRow = "Row";
      }

      let outputPath, defectListTable = null;
      if ( outputDir )
      {
         outputPath = outputDir + outputFileName;
         defectListTable = File.createFileForWriting( outputPath );
      }

      console.noteln( "<end><cbr><br>Detected lines" );
      console.noteln(               "--------------" );
      for ( let i = 0; i < detectedLines.detectedColumnOrRow.length; ++i )
      {
         if ( defectListTable )
            defectListTable.outTextLn( columnOrRow + " " +
                                       detectedLines.detectedColumnOrRow[i] + " " +
                                       detectedLines.detectedStartPixel[i] + " " +
                                       detectedLines.detectedEndPixel[i] );
         console.noteln( columnOrRow + " " +
                         detectedLines.detectedColumnOrRow[i] + " " +
                         detectedLines.detectedStartPixel[i] + " " +
                         detectedLines.detectedEndPixel[i] );
      }
      console.noteln( "<end><cbr><br>Detected defect lines: " + detectedLines.detectedColumnOrRow.length );
      if ( defectListTable )
         defectListTable.close();
      console.writeln();
      if ( defectListTable )
      {
         if ( !File.exists( outputPath ) )
            throw new Error( "*** File I/O Error: Could not output defect list to " + outputPath );
         console.writeln( "Defect list saved to " + outputPath );
      }
   }
   else
   {
      console.warningln( "<end><cbr><br>No defect was detected. Try lowering the threshold value." );
   }
}

// ----------------------------------------------------------------------------

function main()
{
   if ( Parameters.isViewTarget )
      throw new Error( TITLE + " cannot be executed on views." );

   let parameters = new LDDParameters;
   parameters.import();

   let dialog = new LDDDialog( parameters );
   if ( dialog.execute() )
   {
      parameters = dialog.parameters;
      parameters.ensureValid();

      console.noteln( "<end><cbr><br>============================" );
      console.noteln(               "LinearDefectDetection script" );
      console.noteln(               "(C) 2019 Vicent Peris (OAUV)" );
      console.noteln(               "============================" );
      console.writeln();
      console.writeln( "* Working parameters" );
      console.writeln( "Detect columns: " + parameters.detectColumns );
      console.writeln( "Detect partial lines: " + parameters.detectPartialLines );
      console.writeln( "Image shift: " + parameters.imageShift );
      console.writeln( "Close former working images: " + parameters.closeFormerWorkingImages );
      console.writeln( "Layers to remove: " + parameters.layersToRemove );
      console.writeln( "Rejection limit: " + parameters.rejectionLimit );
      console.writeln( "Detection threshold: " + parameters.detectionThreshold );
      console.writeln( "Partial line detection threshold: " + parameters.partialLineDetectionThreshold );
      console.writeln( "Output directory: " + parameters.outputDir );

      console.show();
      processEvents();

      if ( parameters.closeFormerWorkingImages )
      {
         if ( !ImageWindow.windowById( "partial_line_detection" ).isNull )
            ImageWindow.windowById( "partial_line_detection" ).forceClose();
         if ( !ImageWindow.windowById( "line_model" ).isNull )
            ImageWindow.windowById( "line_model" ).forceClose();
         if ( !ImageWindow.windowById( "line_detection" ).isNull )
            ImageWindow.windowById( "line_detection" ).forceClose();
      }

      let T = new ElapsedTime;

      let detectedLines = new LDDEngine( parameters.detectColumns,
                                         parameters.detectPartialLines,
                                         parameters.layersToRemove,
                                         parameters.rejectionLimit,
                                         parameters.imageShift,
                                         parameters.detectionThreshold,
                                         parameters.partialLineDetectionThreshold );

      Output( parameters.detectColumns, detectedLines, parameters.detectionThreshold, parameters.outputDir );

      processEvents();
      console.writeln( "<end><cbr><br>Script processing time: " + T.text );
   }
}

main();

// ----------------------------------------------------------------------------
// EOF LinearDefectDetection.js - Released 2019-12-23T12:01:37Z
