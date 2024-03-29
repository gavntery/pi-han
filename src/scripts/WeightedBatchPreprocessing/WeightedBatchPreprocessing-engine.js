// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// WeightedBatchPreprocessing-engine.js - Released 2020-01-24T12:08:35Z
// ----------------------------------------------------------------------------
//
// This file is part of Weighted Batch Preprocessing Script version 1.4.4
//
// Copyright (c) 2012 Kai Wiechen. All Rights Reserved.
// Copyright (c) 2019-2020 Roberto Sartori. All Rights Reserved.
// Copyright (c) 2019-2020 Tommaso Rubechi. All Rights Reserved.
// Copyright (c) 2012-2020 Pleiades Astrophoto S.L. All Rights Reserved.
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
#include <pjsr/UndoFlag.jsh>
#include <pjsr/StdDialogCode.jsh>
#include <pjsr/ColorSpace.jsh>
#include <pjsr/Compression.jsh>
#include <pjsr/StarDetector.jsh>
#include "WeightedBatchPreprocessing-processLogger.js"
/* beautify ignore:end */

// ----------------------------------------------------------------------------

function FileItem( filePath, imageType, filter, binning, exposureTime, isCFA )
{
   this.__base__ = Object;
   this.__base__();

   this.filePath = filePath;
   this.imageType = imageType;
   this.binning = binning;
   this.filter = filter;
   this.exposureTime = exposureTime;
   this.enabled = true;
   this.isCFA = isCFA
}

FileItem.prototype = new Object;

// ----------------------------------------------------------------------------

function FrameGroup( imageType, filter, binning, exposureTime, firstItem, masterFrame )
{
   this.__base__ = Object;
   this.__base__();

   let
   {
      isEmptyString
   } = WBPPUtils.shared();

   this.imageType = imageType;
   this.filter = ( imageType == ImageType.BIAS || imageType == ImageType.DARK ) ? "" : filter;
   this.binning = binning;
   this.exposureTime = ( imageType == ImageType.BIAS ) ? 0 : exposureTime;
   this.exposureTimes = [ ( imageType == ImageType.BIAS ) ? 0 : exposureTime ];
   this.masterFrame = masterFrame;
   this.enabled = true;
   this.fileItems = new Array;
   // containsCFA property is true if at least one image is CFA, false otherwise
   // nb: firstItem.isCFA could be undefined if no explicit info has been found regarding CFA or colorspace while loading the file
   this.containsCFA = firstItem ? firstItem.isCFA === true : false;

   if ( firstItem ) // we pass null from importParameters()
      this.fileItems.push( firstItem );

   this.sameParameters = function( imageType, filter, binning, exposureTime, exposureTolerance, lightExposureTolerance )
   {
      if ( this.imageType != imageType )
         return false;

      switch ( imageType )
      {
         case ImageType.BIAS:
            return this.binning == binning
         case ImageType.DARK:
            return this.binning == binning && ( Math.abs( this.exposureTime - exposureTime ) <= Math.max( CONST_MIN_EXPOSURE_TOLERANCE, exposureTolerance ) );
         case ImageType.FLAT:
         case ImageType.UNKNOWN:
            return this.binning == binning && this.filter == filter;
         case ImageType.LIGHT:
            return this.binning == binning && this.filter == filter && Math.abs( this.exposureTime - exposureTime ) <= lightExposureTolerance;
      }
      return false;
   }

   // Returns an array [good:Boolean,reason:String]
   this.rejectionIsGood = function( rejection )
   {
      if ( rejection == ImageIntegration.prototype.auto )
         return [ true, "" ];

      // Invariants
      switch ( rejection )
      {
         case ImageIntegration.prototype.NoRejection:
            return [ false, "No pixel rejection algorithm has been selected" ];
         case ImageIntegration.prototype.MinMax:
            return [ false, "Min/Max rejection should not be used for production work" ];
         case ImageIntegration.prototype.CCDClip:
            return [ false, "CCD clipping rejection has been deprecated" ];
         default:
            break;
      }
      let selectedRejection = rejection !== ImageIntegration.prototype.auto ? rejection : this.bestRejectionMethod();

      // Selections dependent on the number of frames
      let n = this.fileItems.length;
      switch ( selectedRejection )
      {
         case ImageIntegration.prototype.PercentileClip:
            if ( n > 8 )
               return [ false, "Percentile clipping should only be used for small sets of eight or less images" ];
            break;
         case ImageIntegration.prototype.SigmaClip:
            if ( n < 8 )
               return [ false, "Sigma clipping requires at least 8 images to provide minimally reliable results; consider using percentile clipping" ];
            if ( n > 15 )
               return [ false, "Winsorized sigma clipping will work better than sigma clipping for sets of 15 or more images" ];
            break;
         case ImageIntegration.prototype.WinsorizedSigmaClip:
            if ( n < 8 )
               return [ false, "Winsorized sigma clipping requires at least 8 images to provide minimally reliable results; consider using percentile clipping" ];
            break;
         case ImageIntegration.prototype.AveragedSigmaClip:
            if ( n < 8 )
               return [ false, "Averaged sigma clipping requires at least 8 images to provide minimally reliable results; consider using percentile clipping" ];
            if ( n > 10 )
               return [ false, "Sigma clipping or Winsorized sigma clipping will work better than averaged sigma clipping for sets of 10 or more images" ];
            break;
         case ImageIntegration.prototype.LinearFit:
            if ( n < 8 )
               return [ false, "Linear fit clipping requires at least 15 images to provide reliable results; consider using percentile clipping" ];
            if ( n < 20 )
               return [ false, "Linear fit clipping may not be better than Winsorized sigma clipping for sets of less than 15-20 images" ];
            break;
         case ImageIntegration.prototype.Rejection_ESD:
            if ( n < 8 )
               return [ false, "ESD requires at least 15 images to provide reliable results; consider using percentile clipping" ];
            if ( n < 20 )
               return [ false, "ESD may not be better than Winsorized sigma clipping for sets of less than 20 images" ];
            if ( n < 25 )
               return [ false, "ESD  may not be better than Linear Fit clipping sigma clipping for sets of less than 20-25 images" ];
         default: // ?!
            break;
      }

      return [ true, "" ];
   };

   this.bestRejectionMethod = function()
   {
      let n = this.fileItems.length;
      if ( n < 8 )
         return ImageIntegration.prototype.PercentileClip;
      if ( n <= 10 )
         return ImageIntegration.prototype.AveragedSigmaClip;
      if ( n < 20 )
         return ImageIntegration.prototype.WinsorizedSigmaClip;
      // if ESD is not defined (PI 1.8.7 or below) then use LinearFit
      if ( n < 25 || ImageIntegration.prototype.Rejection_ESD === undefined )
         return ImageIntegration.prototype.LinearFit;
      return ImageIntegration.prototype.Rejection_ESD;
   };

   this.addExposureTime = function( time )
   {
      // check exposure with tolerance
      let hasExposure = false;
      for ( let i = 0; i < this.exposureTimes.length; i++ )
      {
         if ( Math.abs( time - this.exposureTimes[ i ] ) < CONST_MIN_EXPOSURE_TOLERANCE )
         {
            hasExposure = true;
            break;
         }
      }
      if ( !hasExposure )
      {
         this.exposureTimes.push( time );
         this.exposureTimes.sort( ( a, b ) => a > b )
         this.exposureTime = Math.max.apply( null, this.exposureTimes );
      }
   };

   this.exposuresToString = function()
   {
      if ( this.exposureTimes.length > 1 )
         return '[' + this.exposureTimes.map( exposure => format( "%.2fs", exposure ) ).join( ', ' ) + ']';
      return format( "%.2fs", this.exposureTime );
   };

   this.exposuresToExtendedString = function()
   {
      if ( this.exposureTimes.length > 1 )
         return format( "%.2fs", this.exposureTimes[ this.exposureTimes.length - 1 ] ) +
            ' - [' + this.exposureTimes.map( ( exposure ) => format( "%.2fs", exposure ) ).join( ', ' ) + ']';
      return format( "%.2fs", this.exposureTime );
   };

   this.log = function()
   {
      console.noteln( 'Group of ', this.fileItems.length, ' ', StackEngine.imageTypeToString( this.imageType ), ' frames' );
      console.noteln( 'BINNING  : ', this.binning );
      console.noteln( 'Filter   : ', this.filter.length > 0 ? this.filter : 'NoFilter' );
      console.noteln( 'Exposure : ', this.exposuresToString() );
   };

   this.logStringHeader = function()
   {
      let str = '<b>************************************************************\n';
      str += 'Group of ' + this.fileItems.length + ' ' + StackEngine.imageTypeToString( this.imageType ) + ' frames\n';
      str += 'BINNING  : ' + this.binning + '\n';
      if ( this.imageType != ImageType.BIAS && this.imageType != ImageType.DARK )
         str += 'Filter   : ' + this.filter.length > 0 ? this.filter : 'NoFilter' + '\n';
      if ( this.imageType != ImageType.BIAS )
         str += 'Exposure : ' + this.exposuresToString() + '</b>\n';
      return str;
   };

   this.logStringFooter = function()
   {
      return '<b>************************************************************</b>\n';
   };

   this.toString = function()
   {
      let a = [];
      if ( !isEmptyString( this.filter ) )
         a.push( "filter = " + this.filter );
      else
         a.push( "filter = NoFilter" );
      a.push( "binning = " + this.binning.toString() );
      if ( this.exposureTimes.length == 1 )
      {
         a.push( format( "exposure = %.2fs", this.exposureTime ) );
      }
      else if ( this.exposureTimes.length > 1 )
         a.push( 'exposures = ', this.exposuresToString() );
      a.push( "length = " + this.fileItems.length.toString() );
      let s = StackEngine.imageTypeToString( this.imageType ) + " frames (";
      s += a[ 0 ];
      for ( let i = 1; i < a.length; ++i )
         s += ", " + a[ i ];
      s += ")";
      return s;
   };
}

FrameGroup.prototype = new Object;

// ----------------------------------------------------------------------------

function OverscanRegions()
{
   this.__base__ = Object;
   this.__base__();

   this.enabled = false; // whether to apply this overscan correction
   this.sourceRect = new Rect( 0 ); // source overscan region
   this.targetRect = new Rect( 0 ); // image region to be corrected

   this.isValid = function()
   {
      if ( !this.enabled )
         return true;
      if ( !this.sourceRect.isNormal || !this.targetRect.isNormal )
         return false;
      if ( this.sourceRect.x0 < 0 || this.sourceRect.y0 < 0 ||
         this.targetRect.x0 < 0 || this.targetRect.y0 < 0 )
         return false;
      return true;
   };
}

OverscanRegions.prototype = new Object;

// ----------------------------------------------------------------------------

function Overscan()
{
   this.__base__ = Object;
   this.__base__();

   this.enabled = false; // whether overscan correction is globally enabled

   this.overscan = new Array; // four overscan source and target regions
   this.overscan.push( new OverscanRegions );
   this.overscan.push( new OverscanRegions );
   this.overscan.push( new OverscanRegions );
   this.overscan.push( new OverscanRegions );

   this.imageRect = new Rect( 0 ); // image region (i.e. the cropping rectangle)

   this.isValid = function()
   {
      if ( !this.enabled )
         return true;
      for ( let i = 0; i < 4; ++i )
         if ( !this.overscan[ i ].isValid() )
            return false;
      if ( !this.imageRect.isNormal )
         return false;
      if ( this.imageRect.x0 < 0 || this.imageRect.y0 < 0 )
         return false;
      return true;
   };

   this.hasOverscanRegions = function()
   {
      for ( let i = 0; i < 4; ++i )
         if ( this.overscan[ i ].enabled )
            return true;
      return false;
   };
}

Overscan.prototype = new Object;

// ----------------------------------------------------------------------------

function StackEngine()
{
   this.__base__ = Object;
   this.__base__();

   this.diagnosticMessages = new Array;

   // allocate structures
   this.useAsMaster = new Array( 3 );
   this.overscan = new Overscan;
   this.combination = new Array( 4 );
   this.rejection = new Array( 4 );
   this.minMaxLow = new Array( 4 );
   this.minMaxHigh = new Array( 4 );
   this.percentileLow = new Array( 4 );
   this.percentileHigh = new Array( 4 );
   this.sigmaLow = new Array( 4 );
   this.sigmaHigh = new Array( 4 );
   this.linearFitLow = new Array( 4 );
   this.linearFitHigh = new Array( 4 );
   this.ESD_Outliers = new Array( 4 );
   this.ESD_Significance = new Array( 4 );

   // default parameters
   setDefaultParameters.apply( this );

   // process logger
   this.processLogger = new ProcessLogger();
}

StackEngine.prototype = new Object;

var engine = new StackEngine;

// ----------------------------------------------------------------------------
// StackEngine Methods
// ----------------------------------------------------------------------------

StackEngine.imageTypeFromKeyword = function( value )
{
   switch ( value.toLowerCase() )
   {
      case "bias frame":
      case "bias":
      case "master bias":
         return ImageType.BIAS;
      case "dark frame":
      case "dark":
      case "master dark":
         return ImageType.DARK;
      case "flat field":
      case "flat frame":
      case "flat":
      case "master flat":
         return ImageType.FLAT;
      case "light frame":
      case "light":
      case "science frame":
      case "science":
      case "master light":
         return ImageType.LIGHT;
      default:
         return ImageType.UNKNOWN;
   }
};

StackEngine.imageTypeToString = function( imageType )
{
   return [ "Bias", "Dark", "Flat", "Light" ][ imageType ];
};

StackEngine.imageTypeToFrameKeywordValue = function( imageType )
{
   return [ "Bias Frame", "Dark Frame", "Flat Field", "Light Frame" ][ imageType ];
};

StackEngine.imageTypeToMasterKeywordValue = function( imageType )
{
   return [ "Master Bias", "Master Dark", "Master Flat", "Master Light" ][ imageType ];
};

function DiagnosticInformationDialog( messages, cancelButton )
{
   this.__base__ = Dialog;
   this.__base__();

   let info = "";
   for ( let i = 0; i < messages.length; ++i )
      info += messages[ i ] + '\n\n';

   this.infoLabel = new Label( this );
   this.infoLabel.text = format( "%d message(s):", messages.length );

   this.infoBox = new TextBox( this );
   this.infoBox.readOnly = true;
   this.infoBox.styleSheet = this.scaledStyleSheet( "QWidget { font-family: DejaVu Sans Mono, monospace; font-size: 10pt; }" );
   this.infoBox.setScaledMinSize( 800, 300 );
   this.infoBox.text = info;

   this.okButton = new PushButton( this );
   this.okButton.defaultButton = true;
   this.okButton.text = cancelButton ? "Continue" : "OK";
   this.okButton.icon = this.scaledResource( ":/icons/ok.png" );
   this.okButton.onClick = function()
   {
      this.dialog.ok();
   };

   if ( cancelButton )
   {
      this.cancelButton = new PushButton( this );
      this.cancelButton.defaultButton = true;
      this.cancelButton.text = "Cancel";
      this.cancelButton.icon = this.scaledResource( ":/icons/cancel.png" );
      this.cancelButton.onClick = function()
      {
         this.dialog.cancel();
      };
   }

   this.buttonsSizer = new HorizontalSizer;
   this.buttonsSizer.addStretch();
   this.buttonsSizer.add( this.okButton );
   if ( cancelButton )
   {
      this.buttonsSizer.addSpacing( 8 );
      this.buttonsSizer.add( this.cancelButton );
   }

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.add( this.infoLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.infoBox );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttonsSizer );

   this.adjustToContents();
   this.setMinSize();

   this.windowTitle = "Diagnostic Messages";
}

DiagnosticInformationDialog.prototype = new Dialog;

StackEngine.prototype.hasDiagnosticMessages = function()
{
   return this.diagnosticMessages.length > 0;
};

StackEngine.prototype.hasErrorMessages = function()
{
   for ( let i = 0; i < this.diagnosticMessages.length; ++i )
      if ( this.diagnosticMessages[ i ].startsWith( "*** Error" ) )
         return true;
   return false;
};

StackEngine.prototype.showDiagnosticMessages = function( cancelButton )
{
   if ( this.hasDiagnosticMessages() )
   {
      if ( this.hasErrorMessages() )
      {
         ( new DiagnosticInformationDialog( this.diagnosticMessages, false /*cancelButton*/ ) ).execute();
         return StdDialogCode_Cancel;
      }

      return ( new DiagnosticInformationDialog( this.diagnosticMessages, cancelButton ) ).execute();
   }

   ( new MessageBox( "There are no errors.", TITLE + " " + VERSION, StdIcon_Information, StdButton_Ok ) ).execute();
   return StdDialogCode_Ok;
};

StackEngine.prototype.clearDiagnosticMessages = function()
{
   this.diagnosticMessages = new Array;
};

// ----------------------------------------------------------------------------

function ProcessLogDialog( processLogger )
{
   this.__base__ = Dialog;
   this.__base__();

   let info = processLogger.toString();

   this.infoLabel = new Label( this );
   this.infoLabel.text = format( "WBPP steps:" );

   this.infoBox = new TextBox( this );
   this.infoBox.useRichText = true;
   this.infoBox.readOnly = true;
   this.infoBox.styleSheet = this.scaledStyleSheet( "QWidget { font-family: DejaVu Sans Mono, monospace; font-size: 10pt; color: #0066ff; padding: 4px;" );
   this.infoBox.setScaledMinSize( 800, 300 );
   this.infoBox.text = info;

   this.okButton = new PushButton( this );
   this.okButton.defaultButton = true;
   this.okButton.text = "OK";
   this.okButton.icon = this.scaledResource( ":/icons/ok.png" );
   this.okButton.onClick = function()
   {
      this.dialog.ok();
   };

   this.buttonsSizer = new HorizontalSizer;
   this.buttonsSizer.addStretch();
   this.buttonsSizer.add( this.okButton );

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.add( this.infoLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.infoBox );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttonsSizer );

   this.adjustToContents();
   this.setMinSize();

   this.windowTitle = "Smart Report";
}

ProcessLogDialog.prototype = new Dialog;

StackEngine.prototype.showProcessLogs = function()
{
   let dialog = new ProcessLogDialog( this.processLogger );
   dialog.execute();
};

StackEngine.prototype.cleanProcessLog = function()
{
   this.processLogger.clean();
};

function IntegrationWarningDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.infoLabel = new Label( this );
   this.infoLabel.scaledMinWidth = 550;
   this.infoLabel.useRichText = true;
   this.infoLabel.wordWrapping = true;
   this.infoLabel.styleSheet = this.scaledStyleSheet( "QWidget { font-size: 10pt; }" );
   this.infoLabel.text =
      "<p>You have selected to perform an integration of light frames with this script.</p>" +
      "<p>Please keep in mind that the light frames integration functionality of this script is just " +
      "a convenience feature, which we have included to let you take a quick look at the final " +
      "image. It will give you an idea of the achievable image, but in general, it will <i>not</i> " +
      "provide an optimal result. In most cases the integrated result of this script will be " +
      "rather poor, compared with the image that can be achieved by optimizing image integration " +
      "parameters.</p>" +
      "<p>Image integration is a critical task that requires fine-tuning. Our ImageIntegration tool " +
      "allows you to find optimal pixel rejection parameters to maximize signal-to-noise ratio with " +
      "the appropriate rejection of spurious image data. In general, this requires some trial-error " +
      "work that can't be done automatically from this script.</p>";

   this.noMoreCheckBox = new CheckBox( this );
   this.noMoreCheckBox.text = "Got it, don't show this anymore.";

   this.okButton = new PushButton( this );
   this.okButton.defaultButton = true;
   this.okButton.text = "Continue";
   this.okButton.icon = this.scaledResource( ":/icons/ok.png" );
   this.okButton.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancelButton = new PushButton( this );
   this.cancelButton.defaultButton = true;
   this.cancelButton.text = "Cancel";
   this.cancelButton.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancelButton.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttonsSizer = new HorizontalSizer;
   this.buttonsSizer.add( this.noMoreCheckBox );
   this.buttonsSizer.addSpacing( 40 );
   this.buttonsSizer.addStretch();
   this.buttonsSizer.add( this.okButton );
   this.buttonsSizer.addSpacing( 8 );
   this.buttonsSizer.add( this.cancelButton );

   this.sizer = new VerticalSizer;
   this.sizer.margin = 16;
   this.sizer.add( this.infoLabel );
   this.sizer.addSpacing( 32 );
   this.sizer.add( this.buttonsSizer );

   this.adjustToContents();
   this.setMinSize();

   this.windowTitle = "Light Frames Integration Warning";
}

IntegrationWarningDialog.prototype = new Dialog;

StackEngine.prototype.showIntegrationWarning = function()
{
   let show = Settings.read( SETTINGS_KEY_BASE + "showIntegrationWarning", DataType_Boolean );
   if ( show == null )
      show = true;
   if ( show )
   {
      let d = new IntegrationWarningDialog;
      let result = d.execute();
      if ( d.noMoreCheckBox.checked )
         Settings.write( SETTINGS_KEY_BASE + "showIntegrationWarning", DataType_Boolean, false );
      return result;
   }
   return true;
};

StackEngine.prototype.findGroup = function( imageType, filter, binning, exposureTime, darkExposureTolerance, lightExposureTolerance )
{
   for ( let i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[ i ].sameParameters( imageType, filter, binning, exposureTime, darkExposureTolerance, lightExposureTolerance ) )
         return i;
   return -1;
};

StackEngine.prototype.addGroup = function( imageType, filter, binning, exposureTime, fileItem, masterFrame )
{
   this.frameGroups.push( new FrameGroup( imageType, filter, binning, exposureTime, fileItem, masterFrame ) );
};

StackEngine.prototype.checkFile = function( filePath )
{
   let
   {
      isEmptyString
   } = WBPPUtils.shared();

   try
   {
      if ( isEmptyString( filePath ) )
         throw new Error( "Empty file path" );

      if ( !File.exists( filePath ) )
         throw new Error( "No such file: " + filePath );

      for ( let i = 0; i < this.frameGroups.length; ++i )
         for ( let j = 0; j < this.frameGroups[ i ].fileItems.length; ++j )
            if ( this.frameGroups[ i ].fileItems[ j ].filePath == filePath )
               throw new Error( "File already selected: " + filePath );

      return true;
   }
   catch ( x )
   {
      this.diagnosticMessages.push( x.message );
      return false;
   }
};

StackEngine.prototype.addFile = function( filePath, imageType, filter, binning, exposureTime )
{
   let
   {
      smartNaming
   } = WBPPUtils.shared();

   filePath = filePath.trim();

   if ( !this.checkFile( filePath ) )
      return false;

   let forcedType = imageType != undefined && imageType != ImageType.UNKNOWN;
   if ( !forcedType )
      imageType = ImageType.UNKNOWN;

   if ( filter == "?" )
      filter = undefined;
   let forcedFilter = filter != undefined && filter != "?"; // ### see Add Custom Frames dialog

   let forcedBinning = binning != undefined && binning > 0;
   if ( !forcedBinning )
      binning = 0;

   let forcedExposureTime = imageType == ImageType.BIAS || exposureTime != undefined && exposureTime > 0;
   if ( !forcedExposureTime || imageType == ImageType.BIAS )
      exposureTime = 0;

   // assume image is NOT CFA unless the bayer pattern is found in the header
   let isCFA = false;

   let ext = File.extractExtension( filePath ).toLowerCase();
   let F = new FileFormat( ext, true /*toRead*/ , false /*toWrite*/ );
   if ( F.isNull )
      throw new Error( "No installed file format can read \'" + ext + "\' files." ); // shouldn't happen
   let f = new FileFormatInstance( F );
   if ( f.isNull )
      throw new Error( "Unable to instantiate file format: " + F.name );

   let info = f.open( filePath, "verbosity 0" ); // do not fill the console with useless messages
   if ( info.length <= 0 )
      throw new Error( "Unable to open input file: " + filePath );

   let keywords = [];
   if ( F.canStoreKeywords )
      keywords = f.keywords;

   f.close();

   for ( let i = 0; i < keywords.length; ++i )
   {
      let value = keywords[ i ].strippedValue.trim();
      switch ( keywords[ i ].name )
      {
         case "IMAGETYP":
            if ( !forcedType )
               imageType = StackEngine.imageTypeFromKeyword( value );
            break;
         case "FILTER":
         case "INSFLNAM":
            if ( !forcedFilter )
               filter = value;
            break;
         case "XBINNING":
         case "BINNING":
         case "CCDBINX":
            if ( !forcedBinning )
               binning = parseInt( value );
            break;
         case "EXPTIME":
         case "EXPOSURE":
            if ( !forcedExposureTime && imageType != ImageType.BIAS )
               exposureTime = parseFloat( value );
            break;
         case "BAYERPAT":
            isCFA = true;
            break;
      }

      if ( !forcedExposureTime )
         if ( exposureTime <= 0 )
            if ( typeof( info[ 0 ].exposure ) == "number" )
               if ( info[ 0 ].exposure > 0 )
                  exposureTime = info[ 0 ].exposure;
   }

   // smart naming: extract type binning, filter and duration from filePath if needed
   if ( imageType == ImageType.UNKNOWN )
      imageType = smartNaming.geImageTypeFromPath( filePath );

   if ( imageType == ImageType.UNKNOWN )
   {
      this.diagnosticMessages.push( "Unable to determine frame type: " + filePath );
      return false;
   }

   if ( !forcedBinning && binning == 0 )
      binning = smartNaming.getBinningFromPath( filePath );
   if ( !forcedFilter && filter == undefined )
      filter = smartNaming.getFilterFromPath( filePath );
   if ( !forcedExposureTime && imageType !== ImageType.BIAS && exposureTime == 0 )
      exposureTime = smartNaming.getExposureTimeFromPath( filePath );

   let isMaster = false;
   switch ( imageType )
   {
      case ImageType.BIAS:
      case ImageType.DARK:
      case ImageType.FLAT:
         isMaster = this.useAsMaster[ imageType ];
      case ImageType.LIGHT:
         break;
      default:
         throw new Error( "StackEngine.addFile(): Internal error: Invalid image type: " + StackEngine.imageTypeToString( imageType ) );
   }

   let item = new FileItem( filePath, imageType, filter ? filter : "NoFilter", binning, exposureTime, isCFA );

   if ( this.frameGroups.length > 0 )
   {
      let i = this.findGroup( imageType, filter, binning, exposureTime, this.darkExposureTolerance, this.lightExposureTolerance );
      if ( i >= 0 )
      {
         if ( isMaster )
         {
            this.frameGroups[ i ].fileItems.unshift( item );
         }
         else
         {
            this.frameGroups[ i ].fileItems.push( item );
         }
         this.frameGroups[ i ].addExposureTime( exposureTime );
         if ( isCFA )
            this.frameGroups[ i ].containsCFA = true;
         return true;
      }
   }

   this.addGroup( imageType, filter, binning, exposureTime, item, isMaster );
   return true;
};

StackEngine.prototype.addBiasFrame = function( filePath )
{
   return this.addFile( filePath, ImageType.BIAS );
};

StackEngine.prototype.addDarkFrame = function( filePath )
{
   return this.addFile( filePath, ImageType.DARK );
};

StackEngine.prototype.addFlatFrame = function( filePath )
{
   return this.addFile( filePath, ImageType.FLAT );
};

StackEngine.prototype.addLightFrame = function( filePath )
{
   return this.addFile( filePath, ImageType.LIGHT );
};

StackEngine.prototype.hasFrames = function( imageType )
{
   for ( let i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[ i ].imageType == imageType )
         return true;
   return false;
};

StackEngine.prototype.hasBiasFrames = function()
{
   return this.hasFrames( ImageType.BIAS );
};

StackEngine.prototype.hasDarkFrames = function()
{
   return this.hasFrames( ImageType.DARK );
};

StackEngine.prototype.hasFlatFrames = function()
{
   return this.hasFrames( ImageType.FLAT );
};

StackEngine.prototype.hasLightFrames = function()
{
   return this.hasFrames( ImageType.LIGHT );
};

StackEngine.prototype.deleteFrameSet = function( imageType )
{
   for ( let i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[ i ].imageType == imageType )
         this.frameGroups.splice( i--, 1 );
};

StackEngine.prototype.reconstructGroups = function()
{
   // reconstruction is based on readding the whole files one by one.
   // in order to avoid wrong behaviours due to the useAsMaster flags, they will be saved and reset at the beginning and then restored at the end
   let masterFlags = [];
   for ( let i = 0; i < this.useAsMaster.length; ++i )
   {
      masterFlags.push( this.useAsMaster[ i ] );
      this.useAsMaster[ i ] = false;
   }

   // flatten existing file containers, clean groups and readd all
   let fileItems = [];

   // flatten files
   for ( let i = 0; i < this.frameGroups.length; ++i )
      for ( let j = 0; j < this.frameGroups[ i ].fileItems.length; ++j )
         fileItems.push(
         {
            filePath: this.frameGroups[ i ].fileItems[ j ].filePath,
            imageType: this.frameGroups[ i ].fileItems[ j ].imageType,
            binning: this.frameGroups[ i ].fileItems[ j ].binning,
            filter: this.frameGroups[ i ].fileItems[ j ].filter,
            exposureTime: this.frameGroups[ i ].fileItems[ j ].exposureTime
         } );

   // remove all groups
   let types = [ ImageType.UNKNOWN, ImageType.BIAS, ImageType.DARK, ImageType.FLAT, ImageType.LIGHT ];
   for ( let i = 0; i < types.length; ++i )
      this.deleteFrameSet( types[ i ] );

   // re-add files one by one
   for ( let i = 0; i < fileItems.length; ++i )
      this.addFile( fileItems[ i ].filePath, fileItems[ i ].imageType, fileItems[ i ].filter, fileItems[ i ].binning, fileItems[ i ].exposureTime );

   // sort groups by BINNING, FILTER and EXPOSURE
   this.frameGroups.sort( ( a, b ) =>
   {
      if ( a.binning != b.binning ) return a.binning > b.binning;
      if ( a.filter != b.filter ) return a.filter.toLowerCase() > b.filter.toLowerCase();
      return a.exposureTime < b.exposureTime;
   } );

   // re-enable master file flags
   for ( let i = 0; i < masterFlags.length; ++i )
      this.useAsMaster[ i ] = masterFlags[ i ];
   for ( let i = 0; i < this.frameGroups.length; ++i )
      this.frameGroups[ i ].masterFrame = this.useAsMaster[ this.frameGroups[ i ].imageType ];
};

StackEngine.prototype.inputHints = function()
{
   // Input format hints:
   // * XISF: fits-keywords normalize
   // * FITS: signed-is-physical up-bottom|bottom-up
   // * DSLR_RAW: raw cfa
   return "fits-keywords normalize raw cfa signed-is-physical " + ( this.upBottomFITS ? "up-bottom" : "bottom-up" );
};

StackEngine.prototype.outputHints = function()
{
   // Output format hints:
   // * XISF: properties fits-keywords no-compress-data block-alignment 4096 max-inline-block-size 3072 no-embedded-data no-resolution
   // * FITS: up-bottom|bottom-up
   return "properties fits-keywords no-compress-data block-alignment 4096 max-inline-block-size 3072 no-embedded-data no-resolution " +
      ( this.upBottomFITS ? "up-bottom" : "bottom-up" );
};

StackEngine.prototype.readImage = function( filePath )
{
   let
   {
      isEmptyString
   } = WBPPUtils.shared();

   let ext = File.extractExtension( filePath );
   let F = new FileFormat( ext, true /*toRead*/ , false /*toWrite*/ );
   if ( F.isNull )
      throw new Error( "No installed file format can read \'" + ext + "\' files." ); // shouldn't happen

   let f = new FileFormatInstance( F );
   if ( f.isNull )
      throw new Error( "Unable to instantiate file format: " + F.name );

   let d = f.open( filePath, this.inputHints() );
   if ( d.length < 1 )
      throw new Error( "Unable to open file: " + filePath );
   if ( d.length > 1 )
      throw new Error( "Multi-image files are not supported by this script: " + filePath );

   let window = new ImageWindow( 1, 1, 1, /*numberOfChannels*/ 32, /*bitsPerSample*/ true /*floatSample*/ );

   let view = window.mainView;
   view.beginProcess( UndoFlag_NoSwapFile );

   if ( !f.readImage( view.image ) )
      throw new Error( "Unable to read file: " + filePath );

   if ( F.canStoreImageProperties )
      if ( F.supportsViewProperties )
      {
         let info = view.importProperties( f );
         if ( !isEmptyString( info ) )
            console.criticalln( "<end><cbr>*** Error reading image properties:\n", info );
      }

   if ( F.canStoreKeywords )
      window.keywords = f.keywords;

   view.endProcess();

   f.close();

   return window;
};

StackEngine.prototype.writeImage = function( filePath,
   imageWindow, rejectionLowWindow, rejectionHighWindow, slopeMapWindow, imageIdentifiers )
{
   let F = new FileFormat( ".xisf", false /*toRead*/ , true /*toWrite*/ );
   if ( F.isNull )
      throw new Error( "No installed file format can write " + ".xisf" + " files." ); // shouldn't happen

   let f = new FileFormatInstance( F );
   if ( f.isNull )
      throw new Error( "Unable to instantiate file format: " + F.name );

   if ( !f.create( filePath, this.outputHints() ) )
      throw new Error( "Error creating output file: " + filePath );

   let d = new ImageDescription;
   d.bitsPerSample = 32;
   d.ieeefpSampleFormat = true;
   if ( !f.setOptions( d ) )
      throw new Error( "Unable to set output file options: " + filePath );

   if ( imageIdentifiers )
      f.setImageId( "integration" );

   if ( F.canStoreImageProperties )
      if ( F.supportsViewProperties )
         imageWindow.mainView.exportProperties( f );

   if ( F.canStoreKeywords )
      f.keywords = imageWindow.keywords;

   if ( !f.writeImage( imageWindow.mainView.image ) )
      throw new Error( "Error writing output file: " + filePath );

   if ( rejectionLowWindow && !rejectionLowWindow.isNull )
   {
      if ( imageIdentifiers )
         f.setImageId( "rejection_low" );
      f.keywords = rejectionLowWindow.keywords;
      if ( !f.writeImage( rejectionLowWindow.mainView.image ) )
         throw new Error( "Error writing output file (low rejection map): " + filePath );
   }

   if ( rejectionHighWindow && !rejectionHighWindow.isNull )
   {
      if ( imageIdentifiers )
         f.setImageId( "rejection_high" );
      f.keywords = rejectionHighWindow.keywords;
      if ( !f.writeImage( rejectionHighWindow.mainView.image ) )
         throw new Error( "Error writing output file (high rejection map): " + filePath );
   }

   if ( slopeMapWindow && !slopeMapWindow.isNull )
   {
      if ( imageIdentifiers )
         f.setImageId( "slope_map" );
      f.keywords = slopeMapWindow.keywords;
      if ( !f.writeImage( slopeMapWindow.mainView.image ) )
         throw new Error( "Error writing output file (slope map): " + filePath );
   }

   f.close();
};

StackEngine.prototype.rejectionMethods = function()
{
   let methods = [
   {
      name: "No rejection",
      rejection: ImageIntegration.prototype.NoRejection
   },
   {
      name: "Min/Max",
      rejection: ImageIntegration.prototype.MinMax
   },
   {
      name: "Percentile Clipping",
      rejection: ImageIntegration.prototype.PercentileClip
   },
   {
      name: "Sigma Clipping",
      rejection: ImageIntegration.prototype.SigmaClip
   },
   {
      name: "Winsorized Sigma Clipping",
      rejection: ImageIntegration.prototype.WinsorizedSigmaClip
   },
   {
      name: "Linear Fit Clipping",
      rejection: ImageIntegration.prototype.LinearFit
   } ];

   if ( ImageIntegration.prototype.Rejection_ESD )
   {
      methods.push(
      {
         name: "Generalized Extreme Studentized Deviate",
         rejection: ImageIntegration.prototype.Rejection_ESD
      } );
   }

   methods.push(
   {
      name: "Auto",
      rejection: ImageIntegration.prototype.auto
   } );

   return methods;
};

StackEngine.prototype.rejectionNames = function()
{
   return this.rejectionMethods().map( item => item.name );
};

StackEngine.prototype.rejectionFromIndex = function( index )
{
   let methods = this.rejectionMethods();
   return methods[ index ].rejection;
};

StackEngine.prototype.rejectionName = function( rejection )
{
   let methods = this.rejectionMethods();
   for ( let i = 0; i < methods.length; ++i )
      if ( methods[ i ].rejection === rejection )
         return methods[ i ].name;

   return methods[ methods.length - 1 ].name;
};

StackEngine.prototype.rejectionIndex = function( rejection )
{
   let methods = this.rejectionMethods();
   for ( let i = 0; i < methods.length; ++i )
      if ( methods[ i ].rejection === rejection )
         return i;

   return methods.length - 1;
};

/*
 * Most of the following routines is a semplification of some functions that
 * are implemented in the SubframeSelector script.
 */

function noiseOfImage( image )
{
   for ( let layer = 4; layer != 1; --layer )
   {
      let estimate = image.noiseMRS( layer );
      if ( estimate[ 1 ] >= 0.01 * image.bounds.area )
         return [ estimate[ 0 ], estimate[ 1 ] / image.bounds.area ];
   }
   console.writeln( "" );
   console.writeln( "** Warning: No convergence in MRS noise evaluation routine: ",
      "using k-sigma noise estimate" );
   let estimate = image.noiseKSigma();
   return [ estimate[ 0 ], estimate[ 1 ] / image.bounds.area ];
}

function numberCompare( a, b )
{
   return a < b ? -1 : a > b ? 1 : 0;
}

function medianOfArray( values )
{
   if ( values.length == 0 )
   {
      return [ 0.0, 0.0 ];
   }

   values.sort( numberCompare );

   let i = Math.floor( 0.5 * values.length );
   let median = ( 2 * i == values.length ) ?
      0.5 * ( values[ i - 1 ] + values[ i ] ) :
      values[ i ];

   return median;
}

function starDescription( b, a, x, y, sx, sy, theta, residual )
{
   this.b = b;
   this.a = a;
   this.x = x;
   this.y = y;
   this.sx = sx;
   this.sy = sy;
   this.theta = theta;
   this.residual = residual;
}

function starDescriptionCompare( a, b )
{
   let ax = Math.round( a.x );
   let ay = Math.round( a.y );
   let bx = Math.round( b.x );
   let by = Math.round( b.y );
   return (ax < bx) ? -1 : ((ax > bx) ? 1 : ((ay < by) ? -1 : ((ay > by) ? 1 : 0)));
}

function uniqueArray( values, compareFunction )
{
   if ( values.length < 2 )
      return values;

   values.sort( compareFunction );
   let j = 0;
   for ( let i = 1; i != values.length; ++i )
      if ( compareFunction( values[ j ], values[ i ] ) == -1 )
      {
         ++j;
         values[ j ] = values[ i ];
      }
   return values.slice( 0, j + 1 );
}

StackEngine.prototype.ImageDescriptor = function( imageWindow, filePath )
{
   // 1. find stars
   console.writeln();
   console.writeln( "<b>StarDetector:</b> Processing view: ", imageWindow.mainView.fullId );
   console.flush();

   let barycenters = new Array;
   let maximumDetectedStars = 100000;

   // some default values
   let starDetector = new StarDetector();
   starDetector.structureLayers = 4;
   starDetector.noiseLayers = 2;
   starDetector.hotPixelFilterRadius = 1;
   starDetector.applyHotPixelFilterToDetectionImage = 0;
   starDetector.sensitivity = -1;
   starDetector.peakResponse = 0.8;
   starDetector.maxDistortion = 0.5;
   starDetector.upperLimit = 1.0;

   let stars = starDetector.stars( imageWindow.mainView.image );

   console.writeln( stars.length, " star(s) found" );
   console.flush();

   let threshold = 1.0;
   for ( ;; )
   {
      for ( let i = 0; i != stars.length && barycenters.length != maximumDetectedStars; ++i )
         if ( threshold == 1.0 || Math.random() <= threshold )
            barycenters.push(
            {
               position: stars[ i ].pos,
               radius: Math.max( 3, Math.ceil( Math.sqrt( stars[ i ].size ) ) )
            } );
      if ( barycenters.length != maximumDetectedStars )
         break;
      barycenters = new Array;
      threshold = 0.1 * threshold;
   }

   let maximumFittedStars = 20000;
   if ( barycenters.length > maximumFittedStars )
   {
      threshold = 0.1 * threshold;
      for ( let i = barycenters.length - 1; i != 0; --i )
      {
         let j = Math.round( Math.random() * i );
         let x = barycenters[ i ];
         barycenters[ i ] = barycenters[ j ];
         barycenters[ j ] = x;
      }
      barycenters = barycenters.slice( 0, maximumFittedStars );
   }

   let dynamicPSF = new DynamicPSF;
   dynamicPSF.autoPSF = false;
   dynamicPSF.circularPSF = false;
   dynamicPSF.gaussianPSF = false;
   dynamicPSF.moffatPSF = false;
   dynamicPSF.moffat10PSF = false;
   dynamicPSF.moffat8PSF = false;
   dynamicPSF.moffat6PSF = false;
   dynamicPSF.moffat4PSF = true;
   dynamicPSF.moffat25PSF = false;
   dynamicPSF.moffat15PSF = false;
   dynamicPSF.lorentzianPSF = false;
   dynamicPSF.regenerate = true;

   let views = new Array;
   views.push( new Array( imageWindow.mainView.id ) );
   dynamicPSF.views = views;

   let radius = Math.round( 1.5 * dynamicPSF.searchRadius );
   let stars = new Array;
   for ( let i = 0; i != barycenters.length; ++i )
   {
      stars.push( new Array(
         0, 0, DynamicPSF.prototype.Star_DetectedOk,
         barycenters[ i ].position.x - barycenters[ i ].radius,
         barycenters[ i ].position.y - barycenters[ i ].radius,
         barycenters[ i ].position.x + barycenters[ i ].radius,
         barycenters[ i ].position.y + barycenters[ i ].radius,
         barycenters[ i ].position.x,
         barycenters[ i ].position.y
      ) );
   }
   dynamicPSF.stars = stars;
   let fitted = new Array( stars.length );
   for ( let i = 0; i != fitted.length; ++i )
      fitted[ i ] = false;

   // Workaround for DynamicPSF failure on images with clipped backgrounds
   // ### TODO: Release an update to DynamicPSF with this problem fixed.
   if ( imageWindow.mainView.image.median() != 0 )
      dynamicPSF.executeGlobal();
   else
      console.writeln( "0 PSF fittings" );

   console.abortEnabled = true;

   const DYNAMICPSF_PSF_StarIndex = 0;
   const DYNAMICPSF_PSF_Status = 3;
   const DYNAMICPSF_PSF_b = 4;
   const DYNAMICPSF_PSF_a = 5;
   const DYNAMICPSF_PSF_cx = 6;
   const DYNAMICPSF_PSF_cy = 7;
   const DYNAMICPSF_PSF_sx = 8;
   const DYNAMICPSF_PSF_sy = 9;
   const DYNAMICPSF_PSF_theta = 10;
   const DYNAMICPSF_PSF_mad = 12;
   const maxPSFMAD = 0.1;

   let starDescriptions = new Array;
   let psfTable = dynamicPSF.psf;
   let starsTable = dynamicPSF.stars;
   for ( let i = 0; i != psfTable.length; ++i )
   {
      let psfRow = psfTable[ i ];
      if ( psfRow[ DYNAMICPSF_PSF_Status ] == DynamicPSF.prototype.PSF_FittedOk &&
         psfRow[ DYNAMICPSF_PSF_mad ] < maxPSFMAD &&
         !fitted[ psfRow[ DYNAMICPSF_PSF_StarIndex ] ] )
      {
         let starsRow = starsTable[ psfRow[ DYNAMICPSF_PSF_StarIndex ] ];
         starDescriptions.push( new starDescription(
            psfRow[ DYNAMICPSF_PSF_b ],
            psfRow[ DYNAMICPSF_PSF_a ],
            psfRow[ DYNAMICPSF_PSF_cx ],
            psfRow[ DYNAMICPSF_PSF_cy ],
            psfRow[ DYNAMICPSF_PSF_sx ],
            psfRow[ DYNAMICPSF_PSF_sy ],
            psfRow[ DYNAMICPSF_PSF_theta ],
            psfRow[ DYNAMICPSF_PSF_mad ]
         ) );
         fitted[ psfRow[ DYNAMICPSF_PSF_StarIndex ] ] = true;
      }
   }
   starDescriptions = uniqueArray( starDescriptions, starDescriptionCompare );

   let FWHMs = [];
   let eccentricities = [];
   let residuals = [];
   for ( let i = 0; i != starDescriptions.length; ++i )
   {
      let description = starDescriptions[ i ];
      FWHMs.push( Math.sqrt( description.sx * description.sy ) );
      eccentricities.push(
         Math.sqrt( 1.0 - Math.pow( description.sy / description.sx, 2.0 ) )
      );
      residuals.push( description.residual );
   }

   let modelScaleFactor = 2.0 * Math.sqrt( Math.pow( 2.0, 1.0 / 4.0 ) - 1.0 );

   let FWHM = modelScaleFactor * medianOfArray( FWHMs );
   let eccentricity = medianOfArray( eccentricities );
   let dispersion = imageWindow.mainView.image.avgDev();
   let imageNoise = noiseOfImage( imageWindow.mainView.image );
   let noise = imageNoise[ 0 ];
   let SNRWeight = noise != 0 ? Math.pow( dispersion, 2.0 ) / Math.pow( noise, 2.0 ) : 0;

   return {
      filePath: filePath,
      FWHM: FWHM,
      eccentricity: eccentricity,
      SNR: SNRWeight,
      noise: noise
   };
};

/*
 * min/max values ot FWHM, eccentricity and SNR are computed.
 * These values will be used to compute the final weights of the light images.
 */
StackEngine.prototype.getMinMaxDescriptorsValues = function( imagesDescriptors )
{
   let FWHM = imagesDescriptors.map( descriptor => descriptor.FWHM );
   let eccentricity = imagesDescriptors.map( descriptor => descriptor.eccentricity );
   let SNR = imagesDescriptors.map( descriptor => descriptor.SNR );
   let noise = imagesDescriptors.map( descriptor => descriptor.noise );

   let FWHM_min = Math.min.apply( null, FWHM );
   let FWHM_max = Math.max.apply( null, FWHM );
   let eccentricity_min = Math.min.apply( null, eccentricity );
   let eccentricity_max = Math.max.apply( null, eccentricity );
   let SNR_min = Math.min.apply( null, SNR );
   let SNR_max = Math.max.apply( null, SNR );
   let noise_min = Math.min.apply( null, noise );
   let noise_max = Math.max.apply( null, noise );

   return {
      FWHM_min: FWHM_min,
      FWHM_max: FWHM_max,
      eccentricity_min: eccentricity_min,
      eccentricity_max: eccentricity_max,
      SNR_min: SNR_min,
      SNR_max: SNR_max,
      noise_min: noise_min,
      noise_max: noise_max
   };
};

/*
 * Find the best frame as reference for registration across all images
 */
StackEngine.prototype.findRegistrationReferenceImage = function( descriptors )
{
   let flatDescriptors = new Array;
   let maxVal = 0;
   let filePath = undefined;

   for ( let i = 0; i < descriptors.length; ++i )
   {
      let descriptor = descriptors[ i ];
      if ( descriptor !== undefined )
         for ( let j = 0; j < descriptor.length; ++j )
            flatDescriptors.push( descriptor[ j ] );
   }
   let flatDescriptorsMinMax = this.getMinMaxDescriptorsValues( flatDescriptors );
   for ( let i = 0; i < flatDescriptors.length; ++i )
   {
      let weight = this.computeWeightForLight( flatDescriptors[ i ], flatDescriptorsMinMax, 50, 50, 0, 1 );
      if ( isFinite( weight ) )
         if ( weight > maxVal )
         {
            maxVal = weight;
            filePath = flatDescriptors[ i ].filePath;
         }
   }

   // check in case light images are all the same
   return filePath;
};

StackEngine.prototype.computeWeightForLight = function( descriptor, descriptorMinMax, FWHMWeight, eccentricityWeight, SNRWeight, pedestal )
{
   let FWHM = descriptor.FWHM;
   let FWHM_min = descriptorMinMax.FWHM_min;
   let FWHM_max = descriptorMinMax.FWHM_max;
   let eccentricity = descriptor.eccentricity;
   let eccentricity_min = descriptorMinMax.eccentricity_min;
   let eccentricity_max = descriptorMinMax.eccentricity_max;
   let SNR = descriptor.SNR;
   let SNR_min = descriptorMinMax.SNR_min;
   let SNR_max = descriptorMinMax.SNR_max;
   let noise = descriptor.noise;
   let noise_min = descriptorMinMax.noise_min;
   let noise_max = descriptorMinMax.noise_max;

   let a = FWHM_max - FWHM_min == 0 ? 0 : 1 - ( FWHM - FWHM_min ) / ( FWHM_max - FWHM_min );
   let b = eccentricity_max - eccentricity_min == 0 ? 0 : 1 - ( eccentricity - eccentricity_min ) / ( eccentricity_max - eccentricity_min );
   let c = SNR_max - SNR_min == 0 ? 0 : ( SNR - SNR_min ) / ( SNR_max - SNR_min );
   // let c = 1 - (noise - noise_min) / (noise_max - noise_min);
   // let weight = this.pedestal + (FWHMWeight * a + eccentricityWeight * b + SNRWeight * c) / 100 * (100 - this.pedestal);
   let weight = pedestal + a*FWHMWeight + b*eccentricityWeight + c*SNRWeight;
   console.noteln( 'Weights of image: ', descriptor.filePath );
   console.noteln( "-----------------------" );
   console.noteln( 'FWHM         : ', isFinite( a ) ? format( "%.02f %%", a * 100 ) : '-' );
   console.noteln( 'eccentricity : ', isFinite( b ) ? format( "%.02f %%", b * 100 ) : '-' );
   console.noteln( 'SNR          : ', isFinite( c ) ? format( "%.02f %%", c * 100 ) : '-' );
   console.noteln( 'Image weight : ', isFinite( weight ) ? format( "%.02f", weight ) : '-' );
   console.noteln( "-----------------------" );
   console.flush();
   return weight;
};

StackEngine.prototype.writeWeightsWithDescriptors = function( imagesDescriptors, imagesDescriptorsMinMax )
{
   console.noteln( "<end><cbr><br>",
      "************************************************************" );
   console.noteln( "* Begin computation of weights for images" );
   console.noteln( "************************************************************" );
   console.flush();

   // compute weights for all groups
   for ( let i = 0; i < imagesDescriptors.length; ++i )
   {
      let descriptors = imagesDescriptors[ i ];
      let descriptorMinMax = imagesDescriptorsMinMax[ i ];
      if ( descriptors !== undefined )
      {
         for ( let j = 0; j < descriptors.length; ++j )
         {
            let descriptor = descriptors[ j ];
            let imageWindow = this.readImage( descriptor.filePath, "" );
            if ( imageWindow === null )
            {
               console.warningln( "** Warning: Unable to open file to write weight: " + descriptors[ j ].filePath );
               continue;
            }
            let weight = this.computeWeightForLight( descriptor, descriptorMinMax, this.FWHMWeight, this.eccentricityWeight, this.SNRWeight, this.pedestal );
            if ( isFinite( weight ) )
            {
               imageWindow.keywords = imageWindow.keywords.filter( keyword =>
               {
                  return keyword.name !== WEIGHT_KEYWORD;
               } ).concat(
                  new FITSKeyword(
                     WEIGHT_KEYWORD,
                     format( "%.3e", weight ).replace( "e", "E" ),
                     "Subframe weight"
                  ) );
               imageWindow.saveAs( descriptor.filePath, false, false, false, false );
               imageWindow.forceClose();
            }
            else
               console.warningln( "** Warning: Unable to save weight for image: " + descriptor.filePath )
         }
      }
   }
   console.noteln( "<end><cbr><br>",
      "************************************************************" );
   console.noteln( "* End computation of weights for images" );
   console.noteln( "************************************************************" );
};

StackEngine.prototype.computeDescriptors = function( images )
{
   console.noteln( "<end><cbr><br>",
      "************************************************************" );
   console.noteln( "* Begin generation of image descriptors" );
   console.noteln( "************************************************************" );
   console.flush();

   let imagesDescriptors = new Array;

   for ( let j = 0; j < images.length; ++j )
   {
      let filePath = images[ j ];
      console.writeln( "Computing descriptors for image ", j + 1, " of ", images.length );
      console.writeln( images[ j ] );
      console.flush();

      let imageWindow = this.readImage( filePath, "" );
      if ( imageWindow === null )
      {
         console.warningln( "** Warning: Unable to read image: " + filePath );
         continue;
      }

      if ( imageWindow.mainView.image.colorSpace != ColorSpace_Gray )
      {
         let convertToGrayscale = new ConvertToGrayscale;
         convertToGrayscale.executeOn( imageWindow.mainView, false );
         console.abortEnabled = true;
      }

      let descriptor = this.ImageDescriptor( imageWindow, filePath );
      imagesDescriptors.push( descriptor );

      console.noteln( "------------------------" );
      console.noteln( "FWHM         : ", isFinite( descriptor.FWHM ) ? format( "%0.3f px", descriptor.FWHM ) : '-' );
      console.noteln( "Eccentricity : ", isFinite( descriptor.eccentricity ) ? format( "%0.3f", descriptor.eccentricity ) : '-' );
      console.noteln( "SNR          : ", isFinite( descriptor.SNR ) ? format( "%0.3f", descriptor.SNR ) : '-' );
      console.noteln( "------------------------" );
      console.flush();
      imageWindow.forceClose();
   }

   let imagesDescriptorsMinMax = this.getMinMaxDescriptorsValues( imagesDescriptors );

   console.noteln( "<end><cbr><br>",
      "************************************************************" );
   console.noteln( "* End generation of images descriptors" );
   console.noteln( "************************************************************" );
   console.flush();

   return {
      imagesDescriptors: imagesDescriptors,
      imagesDescriptorsMinMax: imagesDescriptorsMinMax
   };
};

StackEngine.prototype.doBias = function()
{
   let
   {
      isEmptyString
   } = WBPPUtils.shared();

   for ( let i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[ i ].imageType == ImageType.BIAS && !this.frameGroups[ i ].masterFrame )
      {
         this.processLogger.addMessage( this.frameGroups[ i ].logStringHeader() );

         let masterBiasPath = this.doIntegrate( this.frameGroups[ i ] );
         if ( isEmptyString( masterBiasPath ) )
         {
            console.warningln( "** Warning: Error integrating bias frames." );
            this.processLogger.addWarning( "Error integrating bias frames." );
            return;
         }

         this.frameGroups[ i ].masterFrame = true;
         this.frameGroups[ i ].fileItems.unshift( new FileItem( masterBiasPath, ImageType.BIAS, this.frameGroups[ i ].filter, this.frameGroups[ i ].binning, this.frameGroups[ i ].exposureTime ) );
         this.useAsMaster[ ImageType.BIAS ] = true;
         this.processLogger.addSuccess( "Integration completed", "master file " + this.frameGroups[ i ].fileItems[ 0 ].filePath );
         this.processLogger.addMessage( this.frameGroups[ i ].logStringFooter() );
         processEvents();
         gc();
      }
};

StackEngine.prototype.doDark = function()
{
   let
   {
      isEmptyString
   } = WBPPUtils.shared();

   for ( let i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[ i ].imageType == ImageType.DARK && !this.frameGroups[ i ].masterFrame )
      {
         this.processLogger.addMessage( this.frameGroups[ i ].logStringHeader() );

         let masterDarkPath = this.doIntegrate( this.frameGroups[ i ] );
         if ( isEmptyString( masterDarkPath ) )
         {
            console.warningln( "** Warning: Error integrating bias frames." );
            this.processLogger.addWarning( "Error integrating dark frames." );
            return;
         }

         this.frameGroups[ i ].masterFrame = true;
         this.frameGroups[ i ].fileItems.unshift( new FileItem( masterDarkPath, ImageType.DARK, this.frameGroups[ i ].filter, this.frameGroups[ i ].binning, this.frameGroups[ i ].exposureTime ) );
         this.useAsMaster[ ImageType.DARK ] = true;
         this.processLogger.addSuccess( "Integration completed", "master file " + this.frameGroups[ i ].fileItems[ 0 ].filePath );
         this.processLogger.addMessage( this.frameGroups[ i ].logStringFooter() );
         processEvents();
         gc();
      }
};

StackEngine.prototype.doFlat = function()
{
   let
   {
      isEmptyString
   } = WBPPUtils.shared();

   for ( let i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[ i ].imageType == ImageType.FLAT && !this.frameGroups[ i ].masterFrame )
      {
         this.processLogger.addMessage( this.frameGroups[ i ].logStringHeader() );

         let outputData = this.doCalibrate( this.frameGroups[ i ] );
         if ( outputData == null )
         {
            console.warningln( "** Warning: Error calibrating flat frames." );
            this.processLogger.addWarning( "Error calibrating flat frames." );
            return;
         }

         let tmpGroup = new FrameGroup( ImageType.FLAT, this.frameGroups[ i ].filter, this.frameGroups[ i ].binning, this.frameGroups[ i ].exposureTime, null, false );
         for ( let c = 0; c < outputData.length; ++c )
         {
            let filePath = outputData[ c ][ 0 ]; // outputData.outputImage
            if ( !isEmptyString( filePath ) )
               if ( File.exists( filePath ) )
                  tmpGroup.fileItems.push( new FileItem( filePath, ImageType.FLAT, this.frameGroups[ i ].filter, this.frameGroups[ i ].binning, this.frameGroups[ i ].exposureTime ) );
               else
               {
                  console.warningln( "** Warning: File does not exist after image calibration: " + filePath );
                  this.processLogger.addWarning( "File does not exist after image calibration: " + filePath );
               }
         }
         if ( tmpGroup.fileItems.length < 1 )
         {
            console.warningln( "** Warning: All calibrated flat frame files have been removed or cannot be accessed." );
            this.processLogger.addError( "All calibrated flat frame files have been removed or cannot be accessed." );
            this.processLogger.newLine();
            return;
         }
         this.processLogger.addSuccess( "Calibration completed" );
         let masterFlatPath = this.doIntegrate( tmpGroup );
         if ( isEmptyString( masterFlatPath ) )
         {
            console.warningln( "** Warning: Error integrating flat frames." );
            this.processLogger.addError( "Error integrating flat frames." );
            this.processLogger.newLine();
            return;
         }
         this.frameGroups[ i ].masterFrame = true;
         this.frameGroups[ i ].fileItems.unshift( new FileItem( masterFlatPath, ImageType.FLAT, this.frameGroups[ i ].filter, this.frameGroups[ i ].binning, this.frameGroups[ i ].exposureTime ) );
         this.useAsMaster[ ImageType.FLAT ] = true;
         this.processLogger.addSuccess( "Integration completed", "master file " + masterFlatPath );
         this.processLogger.addMessage( this.frameGroups[ i ].logStringFooter() );
         processEvents();
         gc();
      }
};

StackEngine.prototype.doLight = function()
{
   /*
    * ### N.B. The option to use as registration reference the light with the best weight
    *          requires to:
    *
    *          1. apply calibration/cosmeticCorrection/debayer/SubframeWeighting to all groups
    *
    *          2. if the automatic registration reference image selection is enabled then the light
    *             with the highest FWHM+eccentricity across all groups will be set as reference frame
    *             otherwise replace it with its calibrated / cosmetized / debayered
    *            counterpart. See also doCalibrate().
    *
    *          3. registration/integration will continue for all groups
    */

   // determine the lowest binning available
   // the reference frame is selected among the frames with that binning
   let
   {
      cleanFilterName,
      enableTargetFrames,
      existingDirectory,
      isEmptyString,
   } = WBPPUtils.shared();

   let binningForReferenceFrame = 99;
   for ( let i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[ i ].imageType == ImageType.LIGHT && binningForReferenceFrame > this.frameGroups[ i ].binning )
         binningForReferenceFrame = this.frameGroups[ i ].binning;

   let processedImageGroups = new Array;
   let imagesDescriptors = new Array;
   let imagesDescriptorsMinMax = new Array;
   let imagesDescriptorsForReferenceFrame = new Array;
   let actualReferenceImage = this.referenceImage;
   for ( let i = 0; i < this.frameGroups.length; ++i )
   {
      if ( this.frameGroups[ i ].imageType == ImageType.LIGHT )
      {
         this.processLogger.addMessage( this.frameGroups[ i ].logStringHeader() );

         let outputData = this.doCalibrate( this.frameGroups[ i ] )
         if ( outputData == null )
         {
            console.warningln( "** Warning: Error calibrating light frames." );
            this.processLogger.addWarning( "Error calibrating light frames." );
            return;
         }

         let images = new Array;
         for ( let c = 0; c < outputData.length; ++c )
         {
            let filePath = outputData[ c ][ 0 ]; // outputData.outputImage
            if ( !isEmptyString( filePath ) )
               if ( File.exists( filePath ) )
               {
                  if ( File.extractName( filePath ) == ( File.extractName( actualReferenceImage ) + "_c" ) )
                  {
                     console.noteln( 'New reference image path: ', filePath );
                     actualReferenceImage = filePath;
                  }
                  images.push( filePath );
               }
               else
               {
                  console.warningln( "** Warning: File does not exist after image calibration: " + filePath );
                  this.processLogger.addWarning( "File does not exist after image calibration: " + filePath );
               }
         }
         if ( images.length < 1 )
         {
            console.warningln( "** Warning: All calibrated light frame files have been removed or cannot be accessed." );
            this.processLogger.addWarning( "All calibrated light frame files have been removed or cannot be accessed." );
            return;
         }
         this.processLogger.addSuccess( "Calibration completed" );

         if ( this.cosmeticCorrection )
         {
            console.noteln( "<end><cbr><br>",
               "************************************************************" );
            console.noteln( "* Begin cosmetic correction of light frames" );
            console.noteln( "************************************************************" );

            this.frameGroups[ i ].log();

            let CC = ProcessInstance.fromIcon( this.cosmeticCorrectionTemplateId );
            if ( CC == null )
            {
               console.warningln( "** Warning: No such process icon: " + this.cosmeticCorrectionTemplateId );
               this.processLogger.addWarning( "No such process icon: " + this.cosmeticCorrectionTemplateId );
               return;
            }
            if ( !( CC instanceof CosmeticCorrection ) )
            {
               console.warningln( "** Warning: The specified icon does not transport an instance " +
                  "of CosmeticCorrection: " + this.cosmeticCorrectionTemplateId );
               this.processLogger.addWarning( "The specified icon does not transport an instance " +
                  "of CosmeticCorrection: " + this.cosmeticCorrectionTemplateId );
               return;
            }

            let cosmetizedDirectory = existingDirectory( this.outputDirectory + "/calibrated/light/cosmetized" );

            CC.targetFrames = enableTargetFrames( images, 2 );
            CC.outputDir = cosmetizedDirectory;
            CC.outputExtension = ".xisf";
            CC.prefix = "";
            CC.postfix = "_cc";
            CC.overwrite = true;
            CC.cfa = this.cfaImages;

            CC.executeGlobal();

            /*
             * ### FIXME: CosmeticCorrection should provide read-only output
             * data, including the full file path of each output image.
             */
            let prevStepImages = images;
            images = new Array;
            for ( let c = 0; c < prevStepImages.length; ++c )
            {
               let filePath = prevStepImages[ c ];
               let ccFilePath = cosmetizedDirectory + '/' +
                  File.extractName( filePath ) +
                  "_cc" + ".xisf";
               if ( File.exists( ccFilePath ) )
               {
                  if ( filePath == actualReferenceImage )
                  {
                     console.noteln( 'New reference image path: ', ccFilePath );
                     actualReferenceImage = ccFilePath;
                  }
                  images.push( ccFilePath );
               }
               else
               {
                  console.warningln( "** Warning: File does not exist after cosmetic correction: " + ccFilePath );
                  this.processLogger.addWarning( "File does not exist after cosmetic correction: " + ccFilePath );
               }
            }
            if ( images.length < 1 )
            {
               console.warningln( "** Warning: All cosmetic corrected light frame files have been removed or cannot be accessed." );
               this.processLogger.addWarning( "All cosmetic corrected light frame files have been removed or cannot be accessed." );
               return;
            }
            this.processLogger.addSuccess( "Cosmetic Correction OK" );

            console.noteln( "<end><cbr><br>",
               "************************************************************" );
            console.noteln( "* End cosmetic correction of light frames" );
            console.noteln( "************************************************************" );
         }

         if ( this.cfaImages )
         {
            console.noteln( "<end><cbr><br>",
               "************************************************************" );
            console.noteln( "* Begin demosaicing of light frames" );
            console.noteln( "************************************************************" );

            this.frameGroups[ i ].log();

            let DB = new Debayer;

            let debayerDirectory = existingDirectory( this.outputDirectory + "/calibrated/light/debayered" );

            DB.cfaPattern = this.bayerPattern;
            DB.debayerMethod = this.debayerMethod;
            DB.evaluateNoise = this.evaluateNoise;
            DB.targetItems = enableTargetFrames( images, 2 );
            DB.noGUIMessages = true;
            DB.outputDirectory = debayerDirectory;
            DB.outputExtension = ".xisf";
            DB.outputPostfix = "_d";
            DB.overwriteExistingFiles = true;

            DB.executeGlobal();

            let debayerImages = new Array;
            for ( let c = 0; c < DB.outputFileData.length; ++c )
            {
               let filePath = DB.outputFileData[ c ][ 0 ]; // outputFileData.filePath
               if ( !isEmptyString( filePath ) )
                  if ( File.exists( filePath ) )
                  {
                     debayerImages.push( filePath );
                     if ( File.extractName( filePath ) == File.extractName( actualReferenceImage ) + "_d" )
                        actualReferenceImage = filePath;
                  }
               else
               {
                  console.warningln( "** Warning: File does not exist after image demosaicing: " + filePath );
                  this.processLogger.addWarning( "File does not exist after image demosaicing: " + filePath );
               }
            }
            if ( debayerImages.length < 1 )
            {
               console.warningln( "** Warning: All demosaiced light frame files for group with BINNING = ", this.frameGroups[ i ].binning, ", FILTER = ", this.frameGroups[ i ].filter, " and EXPOSURE = ", this.frameGroups[ i ].exposuresToString(), " have been removed or cannot be accessed." );
               this.processLogger.addWarning( "All demosaiced light frame files for group with BINNING = " + this.frameGroups[ i ].binning + ", FILTER = " + this.frameGroups[ i ].filter + " and EXPOSURE = " + this.frameGroups[ i ].exposuresToString() + " have been removed or cannot be accessed." );
               return;
            }
            this.processLogger.addSuccess( "Debayer completed" );
            images = debayerImages;

            console.noteln( "<end><cbr><br>",
               "************************************************************" );
            console.noteln( "* End demosaicing of light frames" );
            console.noteln( "************************************************************" );
         }

         let processedImageGroup = {};
         processedImageGroup.filter = this.frameGroups[ i ].filter;
         processedImageGroup.binning = this.frameGroups[ i ].binning;
         processedImageGroup.exposureTime = this.frameGroups[ i ].exposureTime;
         processedImageGroup.exposureTimes = this.frameGroups[ i ].exposureTimes;
         processedImageGroup.header = this.frameGroups[ i ].logStringHeader();
         processedImageGroup.footer = this.frameGroups[ i ].logStringFooter();
         processedImageGroup.images = new Array;
         for ( let ii = 0; ii < images.length; ++ii )
            processedImageGroup.images.push( images[ ii ] );
         processedImageGroups.push( processedImageGroup );

         if ( ( this.useBestLightAsReference && binningForReferenceFrame === processedImageGroup.binning ) || ( this.generateSubframesWeights && !this.generateSubframesWeightsAfterRegistration ) )
         {
            let desc = this.computeDescriptors( images );
            if ( this.useBestLightAsReference && binningForReferenceFrame === processedImageGroup.binning )
            {
               imagesDescriptorsForReferenceFrame.push( desc.imagesDescriptors );
            }
            if ( this.generateSubframesWeights && !this.generateSubframesWeightsAfterRegistration )
            {
               imagesDescriptors[ i ] = desc.imagesDescriptors;
               imagesDescriptorsMinMax[ i ] = desc.imagesDescriptorsMinMax;
            }
            this.processLogger.addSuccess( "Frames analysis completed" );
         }
         this.processLogger.addMessage( this.frameGroups[ i ].logStringFooter() );
      } // if ( this.frameGroups[ i ].imageType == ImageType.LIGHT )
   } // for ( let i = 0; i < this.frameGroups.length; ++i )

   if ( !this.calibrateOnly )
   {
      if ( this.useBestLightAsReference )
      {
         console.noteln( "<end><cbr><br>",
            "************************************************************" );
         console.noteln( "* Begin selection of the best reference frame for registration" );
         console.noteln( "************************************************************" );
         console.flush();

         actualReferenceImage = this.findRegistrationReferenceImage( imagesDescriptorsForReferenceFrame );

         console.noteln( "<end><cbr><br>" );
         console.noteln( "Best reference frame for registration: " + actualReferenceImage );
         console.noteln( "<end><cbr><br>",
            "************************************************************" );
         console.noteln( "* End selection of the best reference frame for registration" );
         console.noteln( "************************************************************" );
         console.flush();
         this.processLogger.addSuccess( "Best reference frame for registration - auto selection completed:", actualReferenceImage );
         this.processLogger.newLine();
      }
      else
      {
         this.processLogger.addSuccess( "Reference frame for registration", actualReferenceImage );
         this.processLogger.newLine();
      }

      // if frame analysis has been already performed and weights needs to be stored before the registration
      if ( this.generateSubframesWeights && !this.generateSubframesWeightsAfterRegistration )
      {
         this.writeWeightsWithDescriptors( imagesDescriptors, imagesDescriptorsMinMax );
         this.processLogger.addSuccess( "Weights succesfully computed and stored" );
         this.processLogger.newLine();
      }

      for ( let p = 0; p < processedImageGroups.length; ++p )
      {
         this.processLogger.addMessage( processedImageGroups[ p ].header );

         let filter = processedImageGroups[ p ].filter;
         let binning = processedImageGroups[ p ].binning;
         let exposureTime = processedImageGroups[ p ].exposureTime;
         images = processedImageGroups[ p ].images;
         let preRegistrationImagesCount = images.length;

         console.noteln( "<end><cbr><br>",
            "************************************************************" );
         console.noteln( "* Begin registration of light frames" );
         console.noteln( "************************************************************" );
         console.flush();

         console.noteln( 'ActualReferenceImage: ', actualReferenceImage );
         console.noteln( 'Registering ', preRegistrationImagesCount, ' light images' );
         let SA = new StarAlignment;

         let registerDirectory = this.outputDirectory + "/registered";
         if ( !isEmptyString( filter ) )
            registerDirectory += '/' + cleanFilterName( filter );
         registerDirectory = existingDirectory( registerDirectory );

         SA.inputHints = this.inputHints();
         SA.outputHints = this.outputHints();
         SA.referenceImage = actualReferenceImage;
         SA.referenceIsFile = true;
         SA.targets = enableTargetFrames( images, 3 );
         SA.outputDirectory = registerDirectory;
         SA.generateDrizzleData = this.generateDrizzleData;
         SA.pixelInterpolation = this.pixelInterpolation;
         SA.clampingThreshold = this.clampingThreshold;
         SA.noiseReductionFilterRadius = this.noiseReductionFilterRadius;
         SA.useTriangles = this.useTriangleSimilarity;
         SA.outputExtension = ".xisf";
         SA.outputPrefix = "";
         SA.outputPostfix = "_r";
         SA.outputSampleFormat = StarAlignment.prototype.f32;
         SA.overwriteExistingFiles = true;

         if ( this.distortionCorrection )
         {
            SA.useSurfaceSplines = true;
            SA.distortionCorrection = true;
            SA.localDistortion = true;
         }
         else
            SA.maxStars = this.maxStars;

         if ( !SA.executeGlobal() )
         {
            console.warningln( "** Warning: Error registering light frames." );
            this.processLogger.addWarning( "Error registering light frames." );
            this.processLogger.addMessage( processedImageGroups[ p ].footer );
            return;
         }

         images = new Array;
         for ( let c = 0; c < SA.outputData.length; ++c )
         {
            let filePath = SA.outputData[ c ][ 0 ]; // outputData.outputImage
            if ( !isEmptyString( filePath ) )
               if ( File.exists( filePath ) )
                  images.push( filePath );
               else
               {
                  console.warningln( "** Warning: File does not exist after image registration: " + filePath );
                  this.processLogger.addWarning( "File does not exist after image registration: " + filePath );
               }
         }

         if ( images.length < 1 )
         {
            console.warningln( "** Warning: All registered light frame files have been removed or cannot be accessed." );
            this.processLogger.addError( "All registered light frame files have been removed or cannot be accessed." );
            this.processLogger.addMessage( processedImageGroups[ p ].footer );
            this.processLogger.newLine();
            return;
         }
         else if ( images.length < 3 )
         {
            let failed = preRegistrationImagesCount - images.length;
            console.warningln( "** Warning: Star alignment failed to register ", failed, " images out of ", preRegistrationImagesCount, ". A minimum of 3 images must be succesfully registered." );
            this.processLogger.addError( "Star alignment failed to register " + failed + " images out of " + preRegistrationImagesCount + ". A minimum of 3 images must be succesfully registered." );
            this.processLogger.addMessage( processedImageGroups[ p ].footer );
            this.processLogger.newLine();
            return;
         }
         else if ( preRegistrationImagesCount - images.length > 0 )
         {
            console.warningln( "** Warning: register " + images.length + " images out of " + preRegistrationImagesCount );
            this.processLogger.addWarning( "Registered " + images.length + " images out of " + preRegistrationImagesCount );
            this.processLogger.addSuccess( "Registration completed with warnings" );
         }
         else
         {
            this.processLogger.addSuccess( "Registration completed: " + images.length + " light frames succesfully registered." );

         }

         console.noteln( "<end><cbr><br>",
            "************************************************************" );
         console.noteln( "* End registration of light frames" );
         console.noteln( "************************************************************" );
         console.flush();

         if ( this.generateSubframesWeights && this.generateSubframesWeightsAfterRegistration )
         {
            imagesDescriptors = new Array;
            imagesDescriptorsMinMax = new Array;
            let desc = this.computeDescriptors( images );
            imagesDescriptors[ 0 ] = desc.imagesDescriptors;
            imagesDescriptorsMinMax[ 0 ] = desc.imagesDescriptorsMinMax;
            this.writeWeightsWithDescriptors( imagesDescriptors, imagesDescriptorsMinMax );
            this.processLogger.addSuccess( "Frame weights succesfully computed and stored after registration" );
         }

         if ( this.integrate )
         {
            let tmpGroup = new FrameGroup( ImageType.LIGHT, filter, binning, exposureTime, null, false );
            for ( let c = 0; c < images.length; ++c )
            {
               let filePath = images[ c ]; // outputData.outputImage
               if ( !isEmptyString( filePath ) )
                  if ( File.exists( filePath ) )
                     tmpGroup.fileItems.push( new FileItem( filePath, ImageType.LIGHT, filter, binning, exposureTime ) );
                  else
                  {
                     console.warningln( "** Warning: File does not exist after image registration: " + filePath );
                     this.processLogger.addWarning( "File does not exist after image registration: " + filePath );
                  }
            }
            if ( tmpGroup.fileItems.length < 1 )
            {
               console.warningln( "** Warning: All registered light frame files have been removed or cannot be accessed." );
               this.processLogger.addError( "All registered light frame files have been removed or cannot be accessed." );
            }
            let masterLightPath = this.doIntegrate( tmpGroup );
            if ( isEmptyString( masterLightPath ) )
            {
               console.warningln( "** Warning: Error integrating light frames." );
               this.processLogger.addError( "Error integrating light frames." );
            }
            else
               this.processLogger.addSuccess( "Integration completed", "master light: " + masterLightPath );
         }
         this.processLogger.addMessage( processedImageGroups[ p ].footer );
      } // for ( let p = 0; p < processedImageGroups.length; ++p )
   } // if ( !this.calibrateOnly )

   processEvents();
   gc();
};

StackEngine.prototype.doIntegrate = function( frameGroup )
{
   let
   {
      cleanFilterName,
      enableTargetFrames,
      existingDirectory,
   } = WBPPUtils.shared();

   let imageType = frameGroup.imageType;
   let frameSet = new Array;
   for ( let i = 0; i < frameGroup.fileItems.length; ++i )
      frameSet.push( frameGroup.fileItems[ i ].filePath );
   if ( frameSet.length < 3 )
   {
      console.warningln( "** Warning: Cannot integrate less than three frames." );
      this.processLogger.addWarning( "Cannot integrate less than three frames." );
      return "";
   }

   console.noteln( "<end><cbr><br>",
      "************************************************************" );
   console.noteln( "* Begin integration of ", StackEngine.imageTypeToString( imageType ), " frames" );
   console.noteln( "************************************************************" );

   frameGroup.log();

   let selectedRejection = this.rejection[ imageType ] == ImageIntegration.prototype.auto ? frameGroup.bestRejectionMethod() : this.rejection[ imageType ];

   if ( this.rejection[ imageType ] == ImageIntegration.prototype.auto )
   {
      console.noteln( 'Rejection method auto-selected: ', engine.rejectionName( selectedRejection ) );
      this.processLogger.addMessage( 'Rejection method auto-selected: ' + engine.rejectionName( selectedRejection ) );
   }
   else
   {
      console.noteln( 'Rejection method ', engine.rejectionName( selectedRejection ) );
   }

   // Drizzle is generated only for Light frames
   let generateDrizzle = imageType == ImageType.LIGHT && this.generateDrizzleData;

   let II = new ImageIntegration;

   II.inputHints = this.inputHints();
   II.bufferSizeMB = 16;
   II.stackSizeMB = 1024;
   II.images = enableTargetFrames( frameSet, 2, generateDrizzle );
   II.combination = this.combination[ imageType ];
   II.rejection = selectedRejection;
   II.generateRejectionMaps = this.generateRejectionMaps;
   II.generateDrizzleData = generateDrizzle;
   II.minMaxLow = this.minMaxLow[ imageType ];
   II.minMaxHigh = this.minMaxHigh[ imageType ];
   II.pcClipLow = this.percentileLow[ imageType ];
   II.pcClipHigh = this.percentileHigh[ imageType ];
   II.sigmaLow = this.sigmaLow[ imageType ];
   II.sigmaHigh = this.sigmaHigh[ imageType ];
   II.linearFitLow = this.linearFitLow[ imageType ];
   II.linearFitHigh = this.linearFitHigh[ imageType ]
   II.esdOutliersFraction = this.ESD_Outliers[ imageType ];
   II.esdAlpha = this.ESD_Significance[ imageType ]
   II.clipLow = true;
   II.clipHigh = true;
   II.largeScaleClipLow = false;
   II.largeScaleClipHigh = false;
   II.generate64BitResult = false;
   II.noGUIMessages = true;
   II.useFileThreads = true;
   II.fileThreadOverload = 1.00;

   switch ( imageType )
   {
      case ImageType.LIGHT:
         II.normalization = ImageIntegration.prototype.AdditiveWithScaling;
         II.rejectionNormalization = ImageIntegration.prototype.Scale;
         II.weightScale = ImageIntegration.prototype.WeightScale_IKSS;
         break;
      case ImageType.FLAT:
         II.normalization = ImageIntegration.prototype.Multiplicative;
         II.rejectionNormalization = ImageIntegration.prototype.EqualizeFluxes;
         II.weightScale = ImageIntegration.prototype.WeightScale_IKSS;
         II.largeScaleClipHigh = this.flatsLargeScaleRejection;
         II.largeScaleClipHighProtectedLayers = this.flatsLargeScaleRejectionLayers;
         II.largeScaleClipHighGrowth = this.flatsLargeScaleRejectionGrowth;
         break;
      default:
         II.normalization = ImageIntegration.prototype.NoNormalization;
         II.rejectionNormalization = ImageIntegration.prototype.NoRejectionNormalization;
         II.weightScale = ImageIntegration.prototype.WeightScale_MAD;
         break;
   }

   switch ( imageType )
   {
      case ImageType.LIGHT:
         II.weightMode = this.generateSubframesWeights ? ImageIntegration.prototype.KeywordWeight : ImageIntegration.prototype.NoiseEvaluation;
         II.weightKeyword = this.generateSubframesWeights ? WEIGHT_KEYWORD : "";
         II.evaluateNoise = this.evaluateNoise;
         II.rangeClipLow = true;
         II.rangeLow = 0;
         II.rangeClipHigh = true;
         II.rangeHigh = 0.98;
         II.useCache = true;
         break;
      default:
         II.weightMode = ImageIntegration.prototype.DontCare;
         II.evaluateNoise = false;
         II.rangeClipLow = false;
         II.rangeClipHigh = false;
         II.useCache = false;
         break;
   }

   let ok = II.executeGlobal();

   console.noteln( "<end><cbr><br>",
      "************************************************************" );
   console.noteln( "* End integration of ", StackEngine.imageTypeToString( imageType ), " frames" );
   console.noteln( "************************************************************" );

   if ( !ok )
      return "";

   // Write master frame FITS keywords
   // Build the file name postfix

   let keywords = new Array;

   keywords.push( new FITSKeyword( "COMMENT", "", "PixInsight image preprocessing pipeline" ) );
   keywords.push( new FITSKeyword( "COMMENT", "", "Master frame generated with " + TITLE + " v" + VERSION ) );

   keywords.push( new FITSKeyword( "IMAGETYP", StackEngine.imageTypeToMasterKeywordValue( imageType ), "Type of image" ) );

   let postfix = ""

   keywords.push( new FITSKeyword( "XBINNING", format( "%d", frameGroup.binning ), "Binning factor, horizontal axis" ) );
   keywords.push( new FITSKeyword( "YBINNING", format( "%d", frameGroup.binning ), "Binning factor, vertical axis" ) );
   postfix += format( "-BINNING_%d", frameGroup.binning );

   // Make sure the filter postfix includes only valid file name characters.
   keywords.push( new FITSKeyword( "FILTER", frameGroup.filter, "Filter used when taking image" ) );
   if ( imageType !== ImageType.BIAS && imageType !== ImageType.DARK )
      postfix += "-FILTER_" + cleanFilterName( frameGroup.filter );

   keywords.push( new FITSKeyword( "EXPTIME", format( "%.2f", frameGroup.exposureTime ), "Exposure time in seconds" ) );
   if ( imageType !== ImageType.BIAS && imageType !== ImageType.FLAT )
      postfix += format( "-EXPTIME_%g", frameGroup.exposureTime );

   let window = ImageWindow.windowById( II.integrationImageId );
   window.keywords = keywords.concat( window.keywords );

   let filePath = existingDirectory( this.outputDirectory + "/master" );
   filePath += "/master" + StackEngine.imageTypeToString( imageType ) + postfix + ".xisf";

   console.noteln( "<end><cbr><br>* Writing master " + StackEngine.imageTypeToString( imageType ) + " frame:" );
   console.noteln( "<raw>" + filePath + "</raw>" );

   if ( II.generateRejectionMaps )
   {
      let rejectionLowWindow = null;
      let rejectionHighWindow = null;
      let slopeMapWindow = null;

      if ( II.clipLow )
         rejectionLowWindow = ImageWindow.windowById( II.lowRejectionMapImageId );
      if ( II.clipHigh )
         rejectionHighWindow = ImageWindow.windowById( II.highRejectionMapImageId );
      if ( II.rejection == ImageIntegration.prototype.LinearFit )
         slopeMapWindow = ImageWindow.windowById( II.slopeMapImageId );

      this.writeImage( filePath, window, rejectionLowWindow, rejectionHighWindow, slopeMapWindow, true /*imageIdentifiers*/ );

      if ( rejectionLowWindow != null && !rejectionLowWindow.isNull )
         rejectionLowWindow.forceClose();
      if ( rejectionHighWindow != null && !rejectionHighWindow.isNull )
         rejectionHighWindow.forceClose();
      if ( slopeMapWindow != null && !slopeMapWindow.isNull )
         slopeMapWindow.forceClose();
   }
   else
   {
      this.writeImage( filePath, window, null, null, null, true /*imageIdentifiers*/ );
   }

   window.forceClose();

   return filePath;
};

/*
 * If a master dark frame with EXPTIME is not present, select the best matching
 * master dark frame.
 */
StackEngine.prototype.getMasterDarkFrame = function( binning, exposureTime, findExactExposureTime )
{
   // Assume no binning when binning is unknown.
   if ( binning <= 0 )
      binning = 1;

   // Ensure we get the most exposed master dark frame when the exposure time
   // is unknown. This favors scaling down dark current during optimization.
   let knownTime = exposureTime > 0;
   if ( !knownTime )
      exposureTime = 1.0e+10;

   // By default we do not search for exact duration darks.
   if ( findExactExposureTime === undefined )
      findExactExposureTime = false;

   let frame = "";
   let foundTime = 0;
   let bestSoFar = 1.0e+20;
   for ( let i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[ i ].masterFrame )
         if ( this.frameGroups[ i ].imageType == ImageType.DARK )
            if ( this.frameGroups[ i ].binning == binning )
            {
               let d = Math.abs( this.frameGroups[ i ].exposureTime - exposureTime );
               if ( !findExactExposureTime && d < bestSoFar || findExactExposureTime && d < CONST_FLAT_DARK_TOLERANCE )
               {
                  frame = this.frameGroups[ i ].fileItems[ 0 ].filePath;
                  foundTime = this.frameGroups[ i ].exposureTime;
                  if ( d == 0 ) // exact match?
                     break;
                  bestSoFar = d;
               }
            }

   if ( foundTime > 0 )
   {
      if ( findExactExposureTime )
         console.noteln( "<end><cbr><br>* Searching for a master flat dark with exposure time = ",
            exposureTime, "s -- found." );
      else if ( knownTime )
         console.noteln( "<end><cbr><br>* Searching for a master dark frame with exposure time = ",
            exposureTime, "s -- best match is ", foundTime, "s" );
      else
         console.noteln( "<end><cbr><br>* Using master dark frame with exposure time = ",
            foundTime, "s to calibrate unknown exposure time frame(s)." );
   }
   else
   {
      if ( findExactExposureTime )
         console.noteln( "<end><cbr><br>* Searching for a master flat dark with exposure time = ",
            exposureTime, "s -- not found." );
      else if ( knownTime )
         console.noteln( "<end><cbr><br>* Searching for a master dark frame with exposure time = ",
            exposureTime, "s -- best match is a master dark frame of unknown exposure time." );
      else
         console.noteln( "<end><cbr><br>* Unknown exposure time frames and dark frame in calibration." );
   }

   return frame;
};

StackEngine.prototype.doCalibrate = function( frameGroup )
{

   let
   {
      enableTargetFrames,
      existingDirectory,
      isEmptyString,
   } = WBPPUtils.shared();

   let imageType = frameGroup.imageType;

   let referenceImageIndex = -1; // index of registration reference frame

   console.noteln( "<end><cbr><br>",
      "************************************************************" );
   console.noteln( "* Begin calibration of ", StackEngine.imageTypeToString( imageType ), " frames" );
   console.noteln( "************************************************************" );

   frameGroup.log();

   // Despite the current integration grouping  wihch can group frames with different durations,
   // the calibration should proceed as folows:
   // 1. grouping images with same duration
   // 2. find the proper bias / dark / flat
   // 3. calibrate
   let framesetByDuration = {}
   let exposures = [];

   // subgroup files by duration
   for ( let i = 0; i < frameGroup.fileItems.length; ++i )
   {
      let filePath = frameGroup.fileItems[ i ].filePath;
      let expTime = frameGroup.fileItems[ i ].exposureTime;
      if ( !framesetByDuration.hasOwnProperty( expTime ) )
      {
         framesetByDuration[ expTime ] = [];
         exposures.push( expTime );
      }
      framesetByDuration[ expTime ].push( filePath );
   }

   let calibratedImages = [];

   // process all subgroups
   for ( let g = 0; g < exposures.length; g++ )
   {
      // get the subgroup data
      let exptime = exposures[ g ];
      let frameset = framesetByDuration[ exptime ]; // frames to calibrate

      let binning = frameGroup.binning;
      let filter = frameGroup.filter;

      console.writeln( 'Calibrate ', StackEngine.imageTypeToString( imageType ), ' frames with duration ', format( "%.02f", exptime ), ' for filter ', filter.length > 0 ? filter : ' <not specified>' );

      let masterBiasEnabled = false;
      let masterBiasPath = "";

      // store reference frame index if reference is in the frameset
      let referenceImageIndex = -1;
      for ( let j = 0; j < frameset.length; ++j )
      {
         if ( frameset[ j ] == this.referenceImage )
            referenceImageIndex = j;
      }

      // search the matching master bias
      for ( let i = 0; i < this.frameGroups.length; ++i )
         if ( this.frameGroups[ i ].masterFrame )
            if ( this.frameGroups[ i ].imageType == ImageType.BIAS )
               if ( this.frameGroups[ i ].binning == binning )
               {
                  masterBiasEnabled = true;
                  masterBiasPath = this.frameGroups[ i ].fileItems[ 0 ].filePath;
               }

      // search the matching master dark
      let exactDarkExposureTime = ( imageType == ImageType.FLAT ) && this.flatDarksOnly;
      let masterDarkPath = this.getMasterDarkFrame( binning, exptime, exactDarkExposureTime );

      // skip flat calibration if no masterBias and no masterDark have been found for FLATS
      // ps: flats are always grouped by duration so the subgroup always one and correspond to
      //     the parent group
      if ( exactDarkExposureTime )
      {
         if ( isEmptyString( masterDarkPath ) && !masterBiasEnabled )
         {
            // Return the frame group file set since calibration has been skipped but
            // the process should continue with the uncalibrated frames.
            let retVal = [];
            for ( let i = 0; i < this.frameGroups.length; ++i )
               if ( this.frameGroups[ i ].imageType == ImageType.FLAT )
                  if ( this.frameGroups[ i ].binning == binning && this.frameGroups[ i ].filter == filter )
                     for ( let j = 0; j < this.frameGroups[ i ].fileItems.length; ++j )
                        retVal[ j ] = [ this.frameGroups[ i ].fileItems[ j ].filePath ];

            console.noteln( "<end><cbr><br>* Calibration of " + StackEngine.imageTypeToString( imageType ) + " frames skipped -- neither master bias nor master dark matching the exposure has been found" );
            console.noteln( "<end><cbr><br>",
               "************************************************************" );
            console.noteln( "* End calibration of ", StackEngine.imageTypeToString( imageType ), " frames" );
            console.noteln( "************************************************************" );
            this.processLogger.addWarning( "neither master nor master dark matching the exposure has been found" )
            return retVal;
         }
         else if ( isEmptyString( masterDarkPath ) && masterBiasEnabled )
         {
            console.noteln( "<end><cbr><br>* " + StackEngine.imageTypeToString( imageType ) + " frames will be calibrated only with master bias -- no master dark matching the exposure has been found" );
            this.processLogger.addWarning( StackEngine.imageTypeToString( imageType ) + " frames will be calibrated only with master bias -- no master dark matching the exposure has been found" );
         }
      }

      let IC = new ImageCalibration;

      IC.inputHints = this.inputHints();
      IC.outputHints = this.outputHints();
      IC.targetFrames = enableTargetFrames( frameset, 2 );
      IC.masterBiasEnabled = false;
      IC.masterDarkEnabled = false;
      IC.masterFlatEnabled = false;
      IC.calibrateBias = true; // relevant if we define overscan areas
      IC.calibrateDark = this.masterDarkIncludesBias; // ### warning - if false, this deviates from our recommended workflow
      IC.calibrateFlat = false; // assume we have calibrated each individual flat frame
      IC.optimizeDarks = this.optimizeDarks;
      IC.darkCFADetectionMode = this.cfaImages ? ImageCalibration.prototype.ForceCFA : ImageCalibration.prototype.DetectCFA;
      IC.darkOptimizationThreshold = this.darkOptimizationThreshold; // ### deprecated - retained for compatibility
      IC.darkOptimizationLow = this.darkOptimizationLow;
      IC.darkOptimizationWindow = this.darkOptimizationWindow;
      IC.outputExtension = ".xisf";
      IC.outputPrefix = "";
      IC.outputPostfix = "_c";
      IC.evaluateNoise = this.evaluateNoise && imageType == ImageType.LIGHT && !this.cfaImages; // for CFAs, evaluate noise after debayer
      IC.outputSampleFormat = ImageCalibration.prototype.f32;
      IC.overwriteExistingFiles = true;
      IC.onError = ImageCalibration.prototype.Abort;

      if ( this.overscan.enabled )
      {
         IC.overscanEnabled = true;
         IC.overscanImageX0 = this.overscan.imageRect.x0;
         IC.overscanImageY0 = this.overscan.imageRect.y0;
         IC.overscanImageX1 = this.overscan.imageRect.x1;
         IC.overscanImageY1 = this.overscan.imageRect.y1;
         IC.overscanRegions = [ // enabled, sourceX0, sourceY0, sourceX1, sourceY1, targetX0, targetY0, targetX1, targetY1
            [ false, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ false, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ false, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ false, 0, 0, 0, 0, 0, 0, 0, 0 ]
         ];
         for ( let i = 0; i < 4; ++i )
            if ( this.overscan.overscan[ i ].enabled )
            {
               IC.overscanRegions[ i ][ 0 ] = true;
               IC.overscanRegions[ i ][ 1 ] = this.overscan.overscan[ i ].sourceRect.x0;
               IC.overscanRegions[ i ][ 2 ] = this.overscan.overscan[ i ].sourceRect.y0;
               IC.overscanRegions[ i ][ 3 ] = this.overscan.overscan[ i ].sourceRect.x1;
               IC.overscanRegions[ i ][ 4 ] = this.overscan.overscan[ i ].sourceRect.y1;
               IC.overscanRegions[ i ][ 5 ] = this.overscan.overscan[ i ].targetRect.x0;
               IC.overscanRegions[ i ][ 6 ] = this.overscan.overscan[ i ].targetRect.y0;
               IC.overscanRegions[ i ][ 7 ] = this.overscan.overscan[ i ].targetRect.x1;
               IC.overscanRegions[ i ][ 8 ] = this.overscan.overscan[ i ].targetRect.y1;
            }
      }

      IC.masterBiasEnabled = masterBiasEnabled;
      IC.masterBiasPath = masterBiasPath

      IC.masterDarkEnabled = !isEmptyString( masterDarkPath );
      IC.masterDarkPath = masterDarkPath;

      if ( imageType == ImageType.FLAT )
         IC.outputDirectory = existingDirectory( this.outputDirectory + "/calibrated/flat" );
      else if ( imageType == ImageType.LIGHT )
      {
         // search the matching master flat
         for ( let i = 0; i < this.frameGroups.length; ++i )
            if ( this.frameGroups[ i ].masterFrame )
               if ( this.frameGroups[ i ].imageType == ImageType.FLAT )
                  if ( this.frameGroups[ i ].binning == binning && this.frameGroups[ i ].filter == filter )
                  {
                     IC.masterFlatEnabled = true;
                     IC.masterFlatPath = this.frameGroups[ i ].fileItems[ 0 ].filePath;
                     break;
                  }
         IC.outputDirectory = existingDirectory( this.outputDirectory + "/calibrated/light" );
      }

      this.processLogger.addMessage( "[Calibration data]" );
      if ( IC.masterBiasEnabled )
      {
         console.noteln( "* Master bias: " + IC.masterBiasPath );
         this.processLogger.addMessage( "  Master bias: " + IC.masterBiasPath );
      }
      else
         this.processLogger.addMessage( "  Master bias: none" );
      if ( IC.masterDarkEnabled )
      {
         console.noteln( "* Master dark: " + IC.masterDarkPath );
         this.processLogger.addMessage( "  Master dark: " + IC.masterDarkPath );
      }
      else
         this.processLogger.addMessage( "  Master dark: none" );
      if ( IC.masterFlatEnabled )
      {
         console.noteln( "* Master flat: " + IC.masterFlatPath );
         this.processLogger.addMessage( "  Master flat: " + IC.masterFlatPath );
      }
      else
         this.processLogger.addMessage( "  Master flat: none" );

      if ( !IC.masterBiasEnabled && !IC.masterDarkEnabled && !IC.masterFlatEnabled )
      {
         // no master files provided, calibratio is skipped
         frameset.forEach( filePath =>
         {
            calibratedImages.push( [ filePath ] );
         } );
         console.warningln( " ** Warning: Image Calibration skipped for " + StackEngine.imageTypeToString( imageType ) + " of duration " + exptime );
         this.processLogger.addWarning( "Image Calibration skipped for " + StackEngine.imageTypeToString( imageType ) + " of duration " + exptime );
      }
      else
      {
         // execute calibration
         let ok = IC.executeGlobal();

         if ( ok )
         {
            if ( referenceImageIndex >= 0 )
               this.actualReferenceImage = IC.outputData[ referenceImageIndex ][ 0 ]; // outputData.filePath
            for ( let j = 0; j < IC.outputData.length; ++j )
               calibratedImages.push( IC.outputData[ j ] );
         }
         else
         {
            console.warningln( " ** Warning: Image Calibration failed" );
            this.processLogger.addWarning( "Image Calibration failed" );
         }
      }

      processEvents();
      gc();
   }

   console.noteln( "<end><cbr><br>",
      "************************************************************" );
   console.noteln( "* End calibration of ", StackEngine.imageTypeToString( imageType ), " frames" );
   console.noteln( "************************************************************" );

   return calibratedImages;
};

StackEngine.prototype.updateMasterFrames = function( imageType )
{
   for ( let i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[ i ].imageType == imageType )
         this.frameGroups[ i ].masterFrame = this.useAsMaster[ imageType ];
};

StackEngine.prototype.purgeRemovedElements = function()
{
   for ( let i = this.frameGroups.length; --i >= 0; )
      if ( this.frameGroups[ i ] == null )
         this.frameGroups.splice( i, 1 );
      else
      {
         for ( let j = this.frameGroups[ i ].fileItems.length; --j >= 0; )
            if ( this.frameGroups[ i ].fileItems[ j ] == null )
               this.frameGroups[ i ].fileItems.splice( j, 1 );
         if ( this.frameGroups[ i ].fileItems.length == 0 )
            this.frameGroups.splice( i, 1 );
      }
};

StackEngine.prototype.framesGroupsToStringData = function()
{
   // save files structure
   return JSON.stringify( this.frameGroups, null, 2 );
};

StackEngine.prototype.framesGroupsFromStringData = function( data )
{
   this.frameGroups = JSON.parse( data );
   this.reconstructGroups();
};

StackEngine.prototype.loadSettings = function()
{
   function load( key, type )
   {
      return Settings.read( SETTINGS_KEY_BASE + key, type );
   }

   function loadIndexed( key, index, type )
   {
      return load( key + '_' + index.toString(), type );
   }

   let o;
   if ( ( o = load( "saveFrameGroups", DataType_Boolean ) ) != null )
      this.saveFrameGroups = o;
   if ( ( o = load( "cfaImages", DataType_Boolean ) ) != null )
      this.cfaImages = o;
   if ( ( o = load( "upBottomFITS", DataType_Boolean ) ) != null )
      this.upBottomFITS = o;
   if ( ( o = load( "saveProcessLog", DataType_Boolean ) ) != null )
      this.saveProcessLog = o;
   if ( ( o = load( "generateRejectionMaps", DataType_Boolean ) ) != null )
      this.generateRejectionMaps = o;
   if ( ( o = load( "masterDarkIncludesBias", DataType_Boolean ) ) != null )
      this.masterDarkIncludesBias = o;
   if ( ( o = load( "optimizeDarks", DataType_Boolean ) ) != null )
      this.optimizeDarks = o;
   if ( ( o = load( "darkOptimizationThreshold", DataType_Float ) ) != null )
      this.darkOptimizationThreshold = o;
   if ( ( o = load( "darkOptimizationLow", DataType_Float ) ) != null )
      this.darkOptimizationLow = o;
   if ( ( o = load( "darkOptimizationWindow", DataType_Int32 ) ) != null )
      this.darkOptimizationWindow = o;
   if ( ( o = load( "darkExposureTolerance", DataType_Float ) ) != null )
      this.darkExposureTolerance = o;
   if ( ( o = load( "lightExposureTolerance", DataType_Float ) ) != null )
      this.lightExposureTolerance = o;
   if ( ( o = load( "evaluateNoise", DataType_Boolean ) ) != null )
      this.evaluateNoise = o;

   if ( ( o = load( "overscanEnabled", DataType_Boolean ) ) != null )
      this.overscan.enabled = o;
   for ( let i = 0; i < 4; ++i )
   {
      if ( ( o = loadIndexed( "overscanRegionEnabled", i, DataType_Boolean ) ) != null )
         this.overscan.overscan[ i ].enabled = o;
      if ( ( o = loadIndexed( "overscanSourceX0", i, DataType_Int32 ) ) != null )
         this.overscan.overscan[ i ].sourceRect.x0 = o;
      if ( ( o = loadIndexed( "overscanSourceY0", i, DataType_Int32 ) ) != null )
         this.overscan.overscan[ i ].sourceRect.y0 = o;
      if ( ( o = loadIndexed( "overscanSourceX1", i, DataType_Int32 ) ) != null )
         this.overscan.overscan[ i ].sourceRect.x1 = o;
      if ( ( o = loadIndexed( "overscanSourceY1", i, DataType_Int32 ) ) != null )
         this.overscan.overscan[ i ].sourceRect.y1 = o;
      if ( ( o = loadIndexed( "overscanTargetX0", i, DataType_Int32 ) ) != null )
         this.overscan.overscan[ i ].targetRect.x0 = o;
      if ( ( o = loadIndexed( "overscanTargetY0", i, DataType_Int32 ) ) != null )
         this.overscan.overscan[ i ].targetRect.y0 = o;
      if ( ( o = loadIndexed( "overscanTargetX1", i, DataType_Int32 ) ) != null )
         this.overscan.overscan[ i ].targetRect.x1 = o;
      if ( ( o = loadIndexed( "overscanTargetY1", i, DataType_Int32 ) ) != null )
         this.overscan.overscan[ i ].targetRect.y1 = o;
   }
   if ( ( o = load( "overscanImageX0", DataType_Int32 ) ) != null )
      this.overscan.imageRect.x0 = o;
   if ( ( o = load( "overscanImageY0", DataType_Int32 ) ) != null )
      this.overscan.imageRect.y0 = o;
   if ( ( o = load( "overscanImageX1", DataType_Int32 ) ) != null )
      this.overscan.imageRect.x1 = o;
   if ( ( o = load( "overscanImageY1", DataType_Int32 ) ) != null )
      this.overscan.imageRect.y1 = o;

   for ( let i = 0; i < 4; ++i )
   {
      if ( this.saveFrameGroups )
         if ( ( o = loadIndexed( "useAsMaster", i, DataType_Boolean ) ) != null )
            this.useAsMaster[ i ] = o;
      if ( ( o = loadIndexed( "combination", i, DataType_Int32 ) ) != null )
         this.combination[ i ] = o;
      if ( ( o = loadIndexed( "rejection", i, DataType_Int32 ) ) != null )
         this.rejection[ i ] = o;
      // compatibility from PI 1.8.7 and above
      if ( this.rejection[ i ] == ImageIntegration.CCDClip )
         this.rejection[ i ] = ImageIntegration.auto;
      if ( ( o = loadIndexed( "minMaxLow", i, DataType_Int32 ) ) != null )
         this.minMaxLow[ i ] = o;
      if ( ( o = loadIndexed( "minMaxHigh", i, DataType_Int32 ) ) != null )
         this.minMaxHigh[ i ] = o;
      if ( ( o = loadIndexed( "percentileLow", i, DataType_Float ) ) != null )
         this.percentileLow[ i ] = o;
      if ( ( o = loadIndexed( "percentileHigh", i, DataType_Float ) ) != null )
         this.percentileHigh[ i ] = o;
      if ( ( o = loadIndexed( "sigmaLow", i, DataType_Float ) ) != null )
         this.sigmaLow[ i ] = o;
      if ( ( o = loadIndexed( "sigmaHigh", i, DataType_Float ) ) != null )
         this.sigmaHigh[ i ] = o;
      if ( ( o = loadIndexed( "linearFitLow", i, DataType_Float ) ) != null )
         this.linearFitLow[ i ] = o;
      if ( ( o = loadIndexed( "linearFitHigh", i, DataType_Float ) ) != null )
         this.linearFitHigh[ i ] = o;
      if ( ( o = loadIndexed( "ESD_Outliers", i, DataType_Float ) ) != null )
         this.ESD_Outliers[ i ] = o;
      if ( ( o = loadIndexed( "ESD_Significance", i, DataType_Float ) ) != null )
         this.ESD_Significance[ i ] = o;
   }

   if ( ( o = load( "flatsLargeScaleRejection", DataType_Boolean ) ) != null )
      this.flatsLargeScaleRejection = o;
   if ( ( o = load( "flatsLargeScaleRejectionLayers", DataType_Int32 ) ) != null )
      this.flatsLargeScaleRejectionLayers = o;
   if ( ( o = load( "flatsLargeScaleRejectionGrowth", DataType_Int32 ) ) != null )
      this.flatsLargeScaleRejectionGrowth = o;
   if ( ( o = load( "flatDarksOnly", DataType_Boolean ) ) != null ||
      ( o = load( "flatDarksOnly", DataType_Boolean ) ) != null ) // be compatible with versions <= 1.49
      this.flatDarksOnly = o;
   if ( ( o = load( "calibrateOnly", DataType_Boolean ) ) != null )
      this.calibrateOnly = o;
   if ( ( o = load( "generateDrizzleData", DataType_Boolean ) ) != null )
      this.generateDrizzleData = o;
   if ( ( o = load( "bayerPattern", DataType_Int32 ) ) != null )
      this.bayerPattern = o;
   if ( ( o = load( "debayerMethod", DataType_Int32 ) ) != null )
      this.debayerMethod = o;

   if ( ( o = load( "subframeWeightingPreset", DataType_Int32 ) ) != null )
      this.subframeWeightingPreset = o;
   if ( ( o = load( "generateSubframesWeights", DataType_Boolean ) ) != null )
      this.generateSubframesWeights = o;
   if ( ( o = load( "generateSubframesWeightsAfterRegistration", DataType_Boolean ) ) != null )
      this.generateSubframesWeightsAfterRegistration = o;
   if ( ( o = load( "useBestLightAsReference", DataType_Boolean ) ) != null )
      this.useBestLightAsReference = o;
   if ( ( o = load( "FWHMWeight", DataType_Int32 ) ) != null )
      this.FWHMWeight = o;
   if ( ( o = load( "eccentricityWeight", DataType_Int32 ) ) != null )
      this.eccentricityWeight = o;
   if ( ( o = load( "SNRWeight", DataType_Int32 ) ) != null )
      this.SNRWeight = o;
   if ( ( o = load( "pedestal", DataType_Int32 ) ) != null )
      this.pedestal = o;

   if ( ( o = load( "pixelInterpolation", DataType_Int32 ) ) != null )
      this.pixelInterpolation = o;
   if ( ( o = load( "clampingThreshold", DataType_Float ) ) != null )
      this.clampingThreshold = o;
   if ( ( o = load( "maxStars", DataType_Int32 ) ) != null )
      this.maxStars = o;
   if ( ( o = load( "distortionCorrection", DataType_Boolean ) ) != null )
      this.distortionCorrection = o;
   if ( ( o = load( "noiseReductionFilterRadius", DataType_Int32 ) ) != null )
      this.noiseReductionFilterRadius = o;
   if ( ( o = load( "useTriangleSimilarity", DataType_Boolean ) ) != null )
      this.useTriangleSimilarity = o;
   if ( ( o = load( "integrate", DataType_Boolean ) ) != null )
      this.integrate = o;
   if ( this.saveFrameGroups )
      if ( ( o = load( "frameGroups", DataType_String ) ) != null )
         this.framesGroupsFromStringData( o );
};

StackEngine.prototype.saveSettings = function()
{
   function save( key, type, value )
   {
      Settings.write( SETTINGS_KEY_BASE + key, type, value );
   }

   function saveIndexed( key, index, type, value )
   {
      save( key + '_' + index.toString(), type, value );
   }

   save( "saveFrameGroups", DataType_Boolean, this.saveFrameGroups );
   save( "cfaImages", DataType_Boolean, this.cfaImages );
   save( "upBottomFITS", DataType_Boolean, this.upBottomFITS );
   save( "saveProcessLog", DataType_Boolean, this.saveProcessLog );
   save( "generateRejectionMaps", DataType_Boolean, this.generateRejectionMaps );
   save( "masterDarkIncludesBias", DataType_Boolean, this.masterDarkIncludesBias );
   save( "optimizeDarks", DataType_Boolean, this.optimizeDarks );
   save( "darkOptimizationLow", DataType_Float, this.darkOptimizationLow );
   save( "darkOptimizationWindow", DataType_Int32, this.darkOptimizationWindow );
   save( "darkExposureTolerance", DataType_Float, this.darkExposureTolerance );
   save( "lightExposureTolerance", DataType_Float, this.lightExposureTolerance );
   save( "evaluateNoise", DataType_Boolean, this.evaluateNoise );

   save( "overscanEnabled", DataType_Boolean, this.overscan.enabled );
   for ( let i = 0; i < 4; ++i )
   {
      saveIndexed( "overscanRegionEnabled", i, DataType_Boolean, this.overscan.overscan[ i ].enabled );
      saveIndexed( "overscanSourceX0", i, DataType_Int32, this.overscan.overscan[ i ].sourceRect.x0 );
      saveIndexed( "overscanSourceY0", i, DataType_Int32, this.overscan.overscan[ i ].sourceRect.y0 );
      saveIndexed( "overscanSourceX1", i, DataType_Int32, this.overscan.overscan[ i ].sourceRect.x1 );
      saveIndexed( "overscanSourceY1", i, DataType_Int32, this.overscan.overscan[ i ].sourceRect.y1 );
      saveIndexed( "overscanTargetX0", i, DataType_Int32, this.overscan.overscan[ i ].targetRect.x0 );
      saveIndexed( "overscanTargetY0", i, DataType_Int32, this.overscan.overscan[ i ].targetRect.y0 );
      saveIndexed( "overscanTargetX1", i, DataType_Int32, this.overscan.overscan[ i ].targetRect.x1 );
      saveIndexed( "overscanTargetY1", i, DataType_Int32, this.overscan.overscan[ i ].targetRect.y1 );
   }
   save( "overscanImageX0", DataType_Int32, this.overscan.imageRect.x0 );
   save( "overscanImageY0", DataType_Int32, this.overscan.imageRect.y0 );
   save( "overscanImageX1", DataType_Int32, this.overscan.imageRect.x1 );
   save( "overscanImageY1", DataType_Int32, this.overscan.imageRect.y1 );

   for ( let i = 0; i < 4; ++i )
   {
      if ( this.saveFrameGroups )
         saveIndexed( "useAsMaster", i, DataType_Boolean, this.useAsMaster[ i ] );
      saveIndexed( "combination", i, DataType_Int32, this.combination[ i ] );
      saveIndexed( "rejection", i, DataType_Int32, this.rejection[ i ] );
      saveIndexed( "minMaxLow", i, DataType_Int32, this.minMaxLow[ i ] );
      saveIndexed( "minMaxHigh", i, DataType_Int32, this.minMaxHigh[ i ] );
      saveIndexed( "percentileLow", i, DataType_Float, this.percentileLow[ i ] );
      saveIndexed( "percentileHigh", i, DataType_Float, this.percentileHigh[ i ] );
      saveIndexed( "sigmaLow", i, DataType_Float, this.sigmaLow[ i ] );
      saveIndexed( "sigmaHigh", i, DataType_Float, this.sigmaHigh[ i ] );
      saveIndexed( "linearFitLow", i, DataType_Float, this.linearFitLow[ i ] );
      saveIndexed( "linearFitHigh", i, DataType_Float, this.linearFitHigh[ i ] );
      saveIndexed( "ESD_Outliers", i, DataType_Float, this.ESD_Outliers[ i ] );
      saveIndexed( "ESD_Significance", i, DataType_Float, this.ESD_Significance[ i ] );
   }

   save( "flatsLargeScaleRejection", DataType_Boolean, this.flatsLargeScaleRejection );
   save( "flatsLargeScaleRejectionLayers", DataType_Int32, this.flatsLargeScaleRejectionLayers );
   save( "flatsLargeScaleRejectionGrowth", DataType_Int32, this.flatsLargeScaleRejectionGrowth );
   save( "flatDarksOnly", DataType_Boolean, this.flatDarksOnly );
   save( "calibrateOnly", DataType_Boolean, this.calibrateOnly );
   save( "generateDrizzleData", DataType_Boolean, this.generateDrizzleData );
   save( "bayerPattern", DataType_Int32, this.bayerPattern );
   save( "debayerMethod", DataType_Int32, this.debayerMethod );
   save( "pixelInterpolation", DataType_Int32, this.pixelInterpolation );
   save( "clampingThreshold", DataType_Float, this.clampingThreshold );
   save( "maxStars", DataType_Int32, this.maxStars );
   save( "distortionCorrection", DataType_Boolean, this.distortionCorrection );
   save( "subframeWeightingPreset", DataType_Int32, this.subframeWeightingPreset );
   save( "generateSubframesWeights", DataType_Boolean, this.generateSubframesWeights );
   save( "generateSubframesWeightsAfterRegistration", DataType_Boolean, this.generateSubframesWeightsAfterRegistration );
   save( "useBestLightAsReference", DataType_Boolean, this.useBestLightAsReference );
   save( "FWHMWeight", DataType_Int32, this.FWHMWeight );
   save( "eccentricityWeight", DataType_Int32, this.eccentricityWeight );
   save( "SNRWeight", DataType_Int32, this.SNRWeight );
   save( "pedestal", DataType_Int32, this.pedestal );
   save( "noiseReductionFilterRadius", DataType_Int32, this.noiseReductionFilterRadius );
   save( "useTriangleSimilarity", DataType_Boolean, this.useTriangleSimilarity );
   save( "integrate", DataType_Boolean, this.integrate );

   if ( this.saveFrameGroups )
      save( "frameGroups", DataType_String, this.framesGroupsToStringData() );
   else
      save( "frameGroups", DataType_String, "[]" );
};

StackEngine.prototype.setDefaultParameters = function()
{
   setDefaultParameters.apply( this );
};

function setDefaultParameters()
{
   // General options
   this.saveFrameGroups = DEFAULT_SAVE_FRAME_GROUPS;
   this.outputDirectory = DEFAULT_OUTPUT_DIRECTORY;
   this.cfaImages = DEFAULT_CFA_IMAGES;
   this.upBottomFITS = DEFAULT_UP_BOTTOM_FITS;
   this.saveProcessLog = DEFAULT_SAVE_PROCESS_LOG;
   this.generateRejectionMaps = DEFAULT_GENERATE_REJECTION_MAPS;

   // Calibration parameters
   this.masterDarkIncludesBias = DEFAULT_DARK_INCLUDE_BIAS;
   this.optimizeDarks = DEFAULT_OPTIMIZE_DARKS;
   this.darkOptimizationThreshold = 0; // ### deprecated - retained for compatibility
   this.darkOptimizationLow = DEFAULT_DARK_OPTIMIZATION_LOW; // in sigma units from the central value
   this.darkOptimizationWindow = DEFAULT_DARK_OPTIMIZATION_WINDOW;
   this.darkExposureTolerance = DEFAULT_DARK_EXPOSURE_TOLERANCE; // in seconds
   this.evaluateNoise = DEFAULT_EVALUATE_NOISE;

   // Image integration parameters
   this.flatsLargeScaleRejection = DEFAULT_FLATS_LARGE_SCALE_REJECTION;
   this.flatsLargeScaleRejectionLayers = DEFAULT_FLATS_LARGE_SCALE_LAYERS;
   this.flatsLargeScaleRejectionGrowth = DEFAULT_FLATS_LARGE_SCALE_GROWTH;

   // DarkFlat calibration
   this.flatDarksOnly = DEFAULT_FLAT_DARKS_ONLY;

   // Overscan
   this.overscan.enabled = false;
   for ( let i = 0; i < 4; ++i )
   {
      this.overscan.overscan[ i ].enabled = false;
      this.overscan.overscan[ i ].sourceRect.assign( 0 );
      this.overscan.overscan[ i ].targetRect.assign( 0 );
   }
   this.overscan.imageRect.assign( 0 );

   for ( let i = 0; i < 4; ++i )
   {
      this.useAsMaster[ i ] = false;
      this.combination[ i ] = ImageIntegration.prototype.Average;
      this.rejection[ i ] = DEFAULT_REJECTION_METHOD;
      this.minMaxLow[ i ] = 1;
      this.minMaxHigh[ i ] = 1;
      this.percentileLow[ i ] = 0.2;
      this.percentileHigh[ i ] = 0.1;
      this.sigmaLow[ i ] = 4.0;
      this.sigmaHigh[ i ] = 3.0;
      this.linearFitLow[ i ] = 5.0;
      this.linearFitHigh[ i ] = 3.5;
      this.ESD_Outliers[ i ] = 0.3;
      this.ESD_Significance[ i ] = 0.05;
   }

   // Light
   this.calibrateOnly = DEFAULT_CALIBRATE_ONLY;
   this.lightExposureTolerance = DEFAULT_LIGHT_EXPOSURE_TOLERANCE; // in seconds
   this.generateDrizzleData = DEFAULT_GENERATE_DRIZZLE_DATA;

   // Cosmetic correction
   this.cosmeticCorrection = DEFAULT_COSMETIC_CORRECTION;
   this.cosmeticCorrectionTemplateId = DEFAULT_COSMETIC_CORRECTION_TEMPLATE;

   this.bayerPattern = DEFAULT_CFA_PATTERN;
   this.debayerMethod = DEFAULT_DEBAYER_METHOD;

   this.subframeWeightingPreset = DEFAULT_SUBFRAMEWEIGHTING_PRESET;
   this.generateSubframesWeights = DEFAULT_SUBFRAMEWEIGHTING_GENERATE;
   this.generateSubframesWeightsAfterRegistration = DEFAULT_SUBFRAMEWEIGHTING_GENERATE_AFTER_REGISTRATION;
   this.useBestLightAsReference = DEFAULT_SUBFRAMEWEIGHTING_BEST_REFERENCE;

   this.FWHMWeight = DEFAULT_SUBFRAMEWEIGHTING_FWHM_WEIGHT;
   this.eccentricityWeight = DEFAULT_SUBFRAMEWEIGHTING_ECCENTRICITY_WEIGHT;
   this.SNRWeight = DEFAULT_SUBFRAMEWEIGHTING_SNR_WEIGHT;
   this.pedestal = DEFAULT_SUBFRAMEWEIGHTING_PEDESTAL;

   this.pixelInterpolation = DEFAULT_SA_PIXEL_INTERPOLATION;
   this.clampingThreshold = DEFAULT_SA_CLAMPING_THRESHOLD;
   this.maxStars = DEFAULT_SA_MAX_STARS;
   this.distortionCorrection = DEFAULT_SA_DISTORTION_CORRECTION;
   this.noiseReductionFilterRadius = DEFAULT_SA_NOISE_REDUCTION;
   this.useTriangleSimilarity = DEFAULT_SA_USE_TRIANGLE_SIMILARITY;
   this.referenceImage = "";

   this.integrate = DEFAULT_INTEGRATE;

   this.frameGroups = DEFAULT_FRAME_GROUPS;
};

StackEngine.prototype.importParameters = function()
{
   let
   {
      parameters
   } = WBPPUtils.shared();

   this.setDefaultParameters();
   this.loadSettings();

   if ( Parameters.has( "saveFrameGroups" ) )
      this.saveFrameGroups = Parameters.getBoolean( "saveFrameGroups" );

   if ( Parameters.has( "outputDirectory" ) )
      this.outputDirectory = Parameters.getString( "outputDirectory" );

   if ( Parameters.has( "cfaImages" ) )
      this.cfaImages = Parameters.getBoolean( "cfaImages" );

   if ( Parameters.has( "upBottomFITS" ) )
      this.upBottomFITS = Parameters.getBoolean( "upBottomFITS" );

   if ( Parameters.has( "saveProcessLog" ) )
      this.saveProcessLog = Parameters.getBoolean( "saveProcessLog" );

   if ( Parameters.has( "generateRejectionMaps" ) )
      this.generateRejectionMaps = Parameters.getBoolean( "generateRejectionMaps" );

   if ( Parameters.has( "masterDarkIncludesBias" ) )
      this.masterDarkIncludesBias = Parameters.getBoolean( "masterDarkIncludesBias" );

   if ( Parameters.has( "optimizeDarks" ) )
      this.optimizeDarks = Parameters.getBoolean( "optimizeDarks" );

   if ( Parameters.has( "darkOptimizationThreshold" ) )
      this.darkOptimizationThreshold = Parameters.getReal( "darkOptimizationThreshold" );

   if ( Parameters.has( "darkOptimizationLow" ) )
      this.darkOptimizationLow = Parameters.getReal( "darkOptimizationLow" );

   if ( Parameters.has( "darkOptimizationWindow" ) )
      this.darkOptimizationWindow = Parameters.getInteger( "darkOptimizationWindow" );

   if ( Parameters.has( "darkExposureTolerance" ) )
      this.darkExposureTolerance = Parameters.getReal( "darkExposureTolerance" );

   if ( Parameters.has( "lightExposureTolerance" ) )
      this.lightExposureTolerance = Parameters.getReal( "lightExposureTolerance" );

   if ( Parameters.has( "evaluateNoise" ) )
      this.evaluateNoise = Parameters.getBoolean( "evaluateNoise" );

   if ( Parameters.has( "overscanEnabled" ) )
      this.overscan.enabled = Parameters.getBoolean( "overscanEnabled" );

   for ( let i = 0; i < 4; ++i )
   {
      if ( Parameters.has( "overscanRegionEnabled" ) )
         this.overscan.overscan[ i ].enabled = parameters.getBooleanIndexed( "overscanRegionEnabled", i );

      if ( Parameters.has( "overscanSourceX0" ) )
         this.overscan.overscan[ i ].sourceRect.x0 = parameters.getIntegerIndexed( "overscanSourceX0", i );

      if ( Parameters.has( "overscanSourceY0" ) )
         this.overscan.overscan[ i ].sourceRect.y0 = parameters.getIntegerIndexed( "overscanSourceY0", i );

      if ( Parameters.has( "overscanSourceX1" ) )
         this.overscan.overscan[ i ].sourceRect.x1 = parameters.getIntegerIndexed( "overscanSourceX1", i );

      if ( Parameters.has( "overscanSourceY1" ) )
         this.overscan.overscan[ i ].sourceRect.y1 = parameters.getIntegerIndexed( "overscanSourceY1", i );

      if ( Parameters.has( "overscanTargetX0" ) )
         this.overscan.overscan[ i ].targetRect.x0 = parameters.getIntegerIndexed( "overscanTargetX0", i );

      if ( Parameters.has( "overscanTargetY0" ) )
         this.overscan.overscan[ i ].targetRect.y0 = parameters.getIntegerIndexed( "overscanTargetY0", i );

      if ( Parameters.has( "overscanTargetX1" ) )
         this.overscan.overscan[ i ].targetRect.x1 = parameters.getIntegerIndexed( "overscanTargetX1", i );

      if ( Parameters.has( "overscanTargetY1" ) )
         this.overscan.overscan[ i ].targetRect.y1 = parameters.getIntegerIndexed( "overscanTargetY1", i );
   }

   if ( Parameters.has( "overscanImageX0" ) )
      this.overscan.imageRect.x0 = Parameters.getInteger( "overscanImageX0" );

   if ( Parameters.has( "overscanImageY0" ) )
      this.overscan.imageRect.y0 = Parameters.getInteger( "overscanImageY0" );

   if ( Parameters.has( "overscanImageX1" ) )
      this.overscan.imageRect.x1 = Parameters.getInteger( "overscanImageX1" );

   if ( Parameters.has( "overscanImageY1" ) )
      this.overscan.imageRect.y1 = Parameters.getInteger( "overscanImageY1" );

   for ( let i = 0; i < 4; ++i )
   {
      if ( parameters.hasIndexed( "useAsMaster", i ) )
         this.useAsMaster[ i ] = parameters.getBooleanIndexed( "useAsMaster", i );

      if ( parameters.hasIndexed( "combination", i ) )
         this.combination[ i ] = parameters.getIntegerIndexed( "combination", i );

      if ( parameters.hasIndexed( "rejection", i ) )
         this.rejection[ i ] = parameters.getIntegerIndexed( "rejection", i );

      if ( parameters.hasIndexed( "minMaxLow", i ) )
         this.minMaxLow[ i ] = parameters.getRealIndexed( "minMaxLow", i );

      if ( parameters.hasIndexed( "minMaxHigh", i ) )
         this.minMaxHigh[ i ] = parameters.getRealIndexed( "minMaxHigh", i );

      if ( parameters.hasIndexed( "percentileLow", i ) )
         this.percentileLow[ i ] = parameters.getRealIndexed( "percentileLow", i );

      if ( parameters.hasIndexed( "percentileHigh", i ) )
         this.percentileHigh[ i ] = parameters.getRealIndexed( "percentileHigh", i );

      if ( parameters.hasIndexed( "sigmaLow", i ) )
         this.sigmaLow[ i ] = parameters.getRealIndexed( "sigmaLow", i );

      if ( parameters.hasIndexed( "sigmaHigh", i ) )
         this.sigmaHigh[ i ] = parameters.getRealIndexed( "sigmaHigh", i );

      if ( parameters.hasIndexed( "linearFitLow", i ) )
         this.linearFitLow[ i ] = parameters.getRealIndexed( "linearFitLow", i );

      if ( parameters.hasIndexed( "linearFitHigh", i ) )
         this.linearFitHigh[ i ] = parameters.getRealIndexed( "linearFitHigh", i );

      if ( parameters.hasIndexed( "ESD_Outliers", i ) )
         this.ESD_Outliers[ i ] = parameters.getRealIndexed( "ESD_Outliers", i );

      if ( parameters.hasIndexed( "ESD_Significance", i ) )
         this.ESD_Significance[ i ] = parameters.getRealIndexed( "ESD_Significance", i );
   }

   if ( Parameters.has( "flatsLargeScaleRejection" ) )
      this.flatsLargeScaleRejection = Parameters.getBoolean( "flatsLargeScaleRejection" );

   if ( Parameters.has( "flatsLargeScaleRejectionLayers" ) )
      this.flatsLargeScaleRejectionLayers = Parameters.getInteger( "flatsLargeScaleRejectionLayers" );

   if ( Parameters.has( "flatsLargeScaleRejectionGrowth" ) )
      this.flatsLargeScaleRejectionGrowth = Parameters.getInteger( "flatsLargeScaleRejectionGrowth" );

   if ( Parameters.has( "flatDarksOnly" ) )
      this.flatDarksOnly = Parameters.getBoolean( "flatDarksOnly" );
   else if ( Parameters.has( "darkFlatsOnly" ) )
      this.flatDarksOnly = Parameters.getBoolean( "darkFlatsOnly" ); // be compatible with versions <= 1.49

   if ( Parameters.has( "calibrateOnly" ) )
      this.calibrateOnly = Parameters.getBoolean( "calibrateOnly" );

   if ( Parameters.has( "generateDrizzleData" ) )
      this.generateDrizzleData = Parameters.getBoolean( "generateDrizzleData" );

   if ( Parameters.has( "cosmeticCorrection" ) )
      this.cosmeticCorrection = Parameters.getBoolean( "cosmeticCorrection" );

   if ( Parameters.has( "cosmeticCorrectionTemplateId" ) )
      this.cosmeticCorrectionTemplateId = Parameters.getString( "cosmeticCorrectionTemplateId" );

   if ( Parameters.has( "bayerPattern" ) )
      this.bayerPattern = Parameters.getInteger( "bayerPattern" );

   if ( Parameters.has( "debayerMethod" ) )
      this.debayerMethod = Parameters.getInteger( "debayerMethod" );

   if ( Parameters.has( "subframeWeightingPreset" ) )
      this.subframeWeightingPreset = Parameters.getInteger( "subframeWeightingPreset" );

   if ( Parameters.has( "FWHMWeight" ) )
      this.FWHMWeight = Parameters.getInteger( "FWHMWeight" );

   if ( Parameters.has( "eccentricityWeight" ) )
      this.eccentricityWeight = Parameters.getInteger( "eccentricityWeight" );

   if ( Parameters.has( "SNRWeight" ) )
      this.SNRWeight = Parameters.getInteger( "SNRWeight" );

   if ( Parameters.has( "pedestal" ) )
      this.pedestal = Parameters.getInteger( "pedestal" );

   if ( Parameters.has( "generateSubframesWeights" ) )
      this.generateSubframesWeights = Parameters.getBoolean( "generateSubframesWeights" );

   if ( Parameters.has( "generateSubframesWeightsAfterRegistration" ) )
      this.generateSubframesWeightsAfterRegistration = Parameters.getBoolean( "generateSubframesWeightsAfterRegistration" );

   if ( Parameters.has( "useBestLightAsReference" ) )
      this.useBestLightAsReference = Parameters.getBoolean( "useBestLightAsReference" );

   if ( Parameters.has( "pixelInterpolation" ) )
      this.pixelInterpolation = Parameters.getInteger( "pixelInterpolation" );

   if ( Parameters.has( "clampingThreshold" ) )
      this.clampingThreshold = Parameters.getReal( "clampingThreshold" );

   if ( Parameters.has( "maxStars" ) )
      this.maxStars = Parameters.getInteger( "maxStars" );

   if ( Parameters.has( "distortionCorrection" ) )
      this.distortionCorrection = Parameters.getBoolean( "distortionCorrection" );

   if ( Parameters.has( "noiseReductionFilterRadius" ) )
      this.noiseReductionFilterRadius = Parameters.getInteger( "noiseReductionFilterRadius" );

   if ( Parameters.has( "useTriangleSimilarity" ) )
      this.useTriangleSimilarity = Parameters.getBoolean( "useTriangleSimilarity" );

   if ( Parameters.has( "referenceImage" ) )
      this.referenceImage = Parameters.getString( "referenceImage" );

   if ( Parameters.has( "integrate" ) )
      this.integrate = Parameters.getBoolean( "integrate" );

   if ( Parameters.has( "frameGroups" ) )
      this.framesGroupsFromStringData( ByteArray.fromBase64( Parameters.getString( "frameGroups" ) ).toString() );
};

StackEngine.prototype.exportParameters = function()
{
   let
   {
      parameters
   } = WBPPUtils.shared();

   Parameters.clear();

   Parameters.set( "version", VERSION );

   Parameters.set( "saveFrameGroups", this.saveFrameGroups );
   Parameters.set( "outputDirectory", this.outputDirectory );
   Parameters.set( "cfaImages", this.cfaImages );
   Parameters.set( "upBottomFITS", this.upBottomFITS );
   Parameters.set( "saveProcessLog", this.saveProcessLog );

   Parameters.set( "generateRejectionMaps", this.generateRejectionMaps );

   Parameters.set( "masterDarkIncludesBias", this.masterDarkIncludesBias );

   Parameters.set( "optimizeDarks", this.optimizeDarks );
   Parameters.set( "darkOptimizationLow", this.darkOptimizationLow );
   Parameters.set( "darkOptimizationWindow", this.darkOptimizationWindow );
   Parameters.set( "darkExposureTolerance", this.darkExposureTolerance );

   Parameters.set( "evaluateNoise", this.evaluateNoise );

   Parameters.set( "overscanEnabled", this.overscan.enabled );

   for ( let i = 0; i < 4; ++i )
   {
      parameters.setIndexed( "overscanRegionEnabled", i, this.overscan.overscan[ i ].enabled );
      parameters.setIndexed( "overscanSourceX0", i, this.overscan.overscan[ i ].sourceRect.x0 );
      parameters.setIndexed( "overscanSourceY0", i, this.overscan.overscan[ i ].sourceRect.y0 );
      parameters.setIndexed( "overscanSourceX1", i, this.overscan.overscan[ i ].sourceRect.x1 );
      parameters.setIndexed( "overscanSourceY1", i, this.overscan.overscan[ i ].sourceRect.y1 );
      parameters.setIndexed( "overscanTargetX0", i, this.overscan.overscan[ i ].targetRect.x0 );
      parameters.setIndexed( "overscanTargetY0", i, this.overscan.overscan[ i ].targetRect.y0 );
      parameters.setIndexed( "overscanTargetX1", i, this.overscan.overscan[ i ].targetRect.x1 );
      parameters.setIndexed( "overscanTargetY1", i, this.overscan.overscan[ i ].targetRect.y1 );
   }

   Parameters.set( "overscanImageX0", this.overscan.imageRect.x0 );
   Parameters.set( "overscanImageY0", this.overscan.imageRect.y0 );
   Parameters.set( "overscanImageX1", this.overscan.imageRect.x1 );
   Parameters.set( "overscanImageY1", this.overscan.imageRect.y1 );

   for ( let i = 0; i < 4; ++i )
   {
      parameters.setIndexed( "useAsMaster", i, this.useAsMaster[ i ] );
      parameters.setIndexed( "combination", i, this.combination[ i ] );
      parameters.setIndexed( "rejection", i, this.rejection[ i ] );
      parameters.setIndexed( "minMaxLow", i, this.minMaxLow[ i ] );
      parameters.setIndexed( "minMaxHigh", i, this.minMaxHigh[ i ] );
      parameters.setIndexed( "percentileLow", i, this.percentileLow[ i ] );
      parameters.setIndexed( "percentileHigh", i, this.percentileHigh[ i ] );
      parameters.setIndexed( "sigmaLow", i, this.sigmaLow[ i ] );
      parameters.setIndexed( "sigmaHigh", i, this.sigmaHigh[ i ] );
      parameters.setIndexed( "linearFitLow", i, this.linearFitLow[ i ] );
      parameters.setIndexed( "linearFitHigh", i, this.linearFitHigh[ i ] );
      parameters.setIndexed( "ESD_Outliers", i, this.ESD_Outliers[ i ] );
      parameters.setIndexed( "ESD_Significance", i, this.ESD_Significance[ i ] );
   }

   Parameters.set( "flatsLargeScaleRejection", this.flatsLargeScaleRejection );
   Parameters.set( "flatsLargeScaleRejectionLayers", this.flatsLargeScaleRejectionLayers );
   Parameters.set( "flatsLargeScaleRejectionGrowth", this.flatsLargeScaleRejectionGrowth );

   Parameters.set( "flatDarksOnly", this.flatDarksOnly );

   Parameters.set( "calibrateOnly", this.calibrateOnly );
   Parameters.set( "lightExposureTolerance", this.lightExposureTolerance );
   Parameters.set( "generateDrizzleData", this.generateDrizzleData );

   Parameters.set( "cosmeticCorrection", this.cosmeticCorrection );
   Parameters.set( "cosmeticCorrectionTemplateId", this.cosmeticCorrectionTemplateId );

   Parameters.set( "bayerPattern", this.bayerPattern );
   Parameters.set( "debayerMethod", this.debayerMethod );

   Parameters.set( "pixelInterpolation", this.pixelInterpolation );
   Parameters.set( "clampingThreshold", this.clampingThreshold );
   Parameters.set( "maxStars", this.maxStars );
   Parameters.set( "distortionCorrection", this.distortionCorrection );
   Parameters.set( "noiseReductionFilterRadius", this.noiseReductionFilterRadius );
   Parameters.set( "useTriangleSimilarity", this.useTriangleSimilarity );
   Parameters.set( "referenceImage", this.referenceImage );

   Parameters.set( "subframeWeightingPreset", this.subframeWeightingPreset );
   Parameters.set( "generateSubframesWeights", this.generateSubframesWeights );
   Parameters.set( "generateSubframesWeightsAfterRegistration", this.generateSubframesWeightsAfterRegistration );
   Parameters.set( "useBestLightAsReference", this.useBestLightAsReference );
   Parameters.set( "FWHMWeight", this.FWHMWeight );
   Parameters.set( "eccentricityWeight", this.eccentricityWeight );
   Parameters.set( "SNRWeight", this.SNRWeight );
   Parameters.set( "pedestal", this.pedestal );

   Parameters.set( "integrate", this.integrate );

   Parameters.set( "frameGroups", new ByteArray( this.framesGroupsToStringData() ).toBase64() );
};

StackEngine.prototype.runDiagnostics = function()
{
   let
   {
      cleanFilterName,
      isEmptyString
   } = WBPPUtils.shared();

   this.bestDarkGroupByExposureTime = function( binning, exposure )
   {
      let bestDifference = undefined;
      let bestExposure = undefined;

      for ( let i = 0; i < this.frameGroups.length; ++i )
      {
         if ( this.frameGroups[ i ].imageType == ImageType.DARK && this.frameGroups[ i ].binning == binning )
            if ( bestDifference == undefined || Math.abs( this.frameGroups[ i ].exposureTime - exposure ) < bestDifference )
            {
               bestDifference = Math.abs( this.frameGroups[ i ].exposureTime - exposure )
               bestExposure = this.frameGroups[ i ].exposureTime;
            }
      }
      return {
         difference: bestDifference,
         exposure: bestExposure
      }
   };

   this.error = function( message )
   {
      this.diagnosticMessages.push( "*** Error: " + message );
   };

   this.warning = function( message )
   {
      this.diagnosticMessages.push( "** Warning: " + message );
   };

   this.clearDiagnosticMessages();

   try
   {
      try
      {
         let F = new FileFormat( ".xisf", false /*toRead*/ , true /*toWrite*/ );
         if ( F == null )
            throw '';
         if ( !F.canStoreFloat )
            this.error( "The " + F.name + " format cannot store 32-bit floating point image data." );
         if ( !F.canStoreKeywords )
            this.warning( "The " + F.name + " format does not support keywords." );
         if ( !F.canStoreProperties || !F.supportsViewProperties )
            this.warning( "The " + F.name + " format does not support image properties." );
         if ( F.isDeprecated )
            this.warning( "Using a deprecated output file format: " + F.name );
      }
      catch ( x )
      {
         this.error( "No installed file format can write " + ".xisf" + " files." );
      }

      if ( isEmptyString( this.outputDirectory ) )
         this.error( "No output directory specified." );
      else if ( !File.directoryExists( this.outputDirectory ) )
         this.error( "The specified output directory does not exist: " + this.outputDirectory );
      else
      {
         try
         {
            let f = new File;
            let n = this.outputDirectory + "/__pixinsight_checking__";
            for ( let u = 1;; ++u )
            {
               let nu = File.appendToName( n, u.toString() );
               if ( !File.exists( nu ) )
               {
                  n = nu;
                  break;
               }
            }
            f.createForWriting( n );
            f.close();
            File.remove( n );
         }
         catch ( x )
         {
            this.error( "Cannot access the output directory for writing: " + this.outputDirectory );
         }
      }

      // add at least 1 group of frames
      if ( this.frameGroups.length == 0 )
         this.error( "No input frames have been specified." );

      // BIAS, DARK and FLAT groups must have at least 3 frames
      // LIGHT group must have at least 3 frames if calibrate only is false and integrate is true
      for ( let i = 0; i < this.frameGroups.length; ++i )
         if ( !this.useAsMaster[ this.frameGroups[ i ].imageType ] )
            if ( this.frameGroups[ i ].fileItems.length < 3 )
               if ( this.frameGroups[ i ].imageType != ImageType.LIGHT || !this.calibrateOnly && this.integrate )
                  this.error( "Cannot integrate less than 3 " + this.frameGroups[ i ].toString() );

      // check input files existence
      for ( let i = 0; i < this.frameGroups.length; ++i )
         for ( let j = 0; j < this.frameGroups[ i ].fileItems.length; ++j )
            if ( !File.exists( this.frameGroups[ i ].fileItems[ j ].filePath ) )
               this.error( "Nonexistent input file: " + this.frameGroups[ i ].fileItems[ j ].filePath );

      // warning: filter name clean up
      for ( let i = 0; i < this.frameGroups.length; ++i )
         if ( !isEmptyString( this.frameGroups[ i ].filter ) )
            if ( cleanFilterName( this.frameGroups[ i ].filter ) != this.frameGroups[ i ].filter )
               this.warning( "Invalid file name characters will be replaced with underscores " +
                  "in filter name: \'" + this.frameGroups[ i ].filter + "\'" );

      // Cosmetic correction check
      if ( this.hasLightFrames() )
      {
         if ( this.cosmeticCorrection )
         {
            if ( isEmptyString( this.cosmeticCorrectionTemplateId ) )
               this.error( "No cosmetic correction template instance has been specified." );
            else
            {
               let CC = ProcessInstance.fromIcon( this.cosmeticCorrectionTemplateId );
               if ( CC == null )
                  this.error( "No such process process icon: " + this.cosmeticCorrectionTemplateId );
               else
               {
                  if ( !( CC instanceof CosmeticCorrection ) )
                     this.error( "The specified process icon does not transport an instance " +
                        "of CosmeticCorrection: " + this.cosmeticCorrectionTemplateId );
                  else
                  {
                     if ( this.cfaImages != CC.cfa )
                        this.warning( "The specified CosmeticCorrection instance is not congruent " +
                           "with current script settings (CFA Images): " + this.cosmeticCorrectionTemplateId );
                     if ( !CC.useMasterDark && !CC.useAutoDetect && !CC.useDefectList )
                        this.warning( "The specified CosmeticCorrection instance does not define " +
                           "a valid correction operation: " + this.cosmeticCorrectionTemplateId );
                  }
               }
            }
         }

         // best reference frame checks
         if ( !this.calibrateOnly )
            if ( !this.useBestLightAsReference && isEmptyString( this.referenceImage ) )
               this.error( "No registration reference image has been specified." );
            else if ( !this.useBestLightAsReference && !File.exists( this.referenceImage ) )
            this.error( "The specified registration reference file does not exist: " + this.referenceImage );
      }

      if ( !this.hasBiasFrames() )
         this.warning( "No bias frames have been selected." );

      if ( !this.hasDarkFrames() )
         this.warning( "No dark frames have been selected." );

      if ( !this.hasFlatFrames() )
         this.warning( "No flat frames have been selected." );
      else if ( this.flatDarksOnly )
      {
         // flat calibration warnings
         for ( let i = 0; i < this.frameGroups.length; ++i )
            if ( this.frameGroups[ i ].imageType == ImageType.FLAT && !this.useAsMaster[ this.frameGroups[ i ].imageType ] )
            {
               let binning = this.frameGroups[ i ].binning;
               let exptime = this.frameGroups[ i ].exposureTime;

               let haveDark = false;
               let haveBias = false;

               for ( let j = 0; j < this.frameGroups.length; ++j )
               {
                  if ( this.frameGroups[ j ].imageType == ImageType.DARK && this.frameGroups[ j ].binning == binning )
                     if ( Math.abs( this.frameGroups[ j ].exposureTime - exptime ) < CONST_FLAT_DARK_TOLERANCE )
                        haveDark = true;
                  if ( this.frameGroups[ j ].imageType == ImageType.BIAS && this.frameGroups[ j ].binning == binning )
                     haveBias = true;
               }

               if ( !haveDark && !haveBias )
                  this.warning( "Neither master dark nor master bias found to calibrate " + this.frameGroups[ i ].toString() );
               else if ( haveBias && !haveDark )
                  this.warning( "Only master bias will be used to calibrate " + this.frameGroups[ i ].toString() );
            }
      }
      else
         for ( let i = 0; i < this.frameGroups.length; ++i )
            if ( this.frameGroups[ i ].imageType == ImageType.FLAT && !this.useAsMaster[ this.frameGroups[ i ].imageType ] )
            {
               // check darks for lights
               let bestDark = this.bestDarkGroupByExposureTime( this.frameGroups[ i ].binning, this.frameGroups[ i ].exposureTime );
               if ( bestDark.difference !== undefined )
                  if ( bestDark.difference != 0 )
                     if ( this.optimizeDarks )
                        this.warning( this.frameGroups[ i ].toString() + ' will be calibrated with an OPTIMIZED master dark with a different exposure of ' + bestDark.exposure + ' sec. ' );
                     else
                        this.warning( this.frameGroups[ i ].toString() + ' will be calibrated with a master dark with a different exposure of ' + bestDark.exposure + ' sec.' );
            }

      if ( !this.hasLightFrames() )
         this.warning( "No light frames have been selected." );
      else
      {
         for ( let i = 0; i < this.frameGroups.length; ++i )
            if ( this.frameGroups[ i ].imageType == ImageType.LIGHT )
            {
               let binning = this.frameGroups[ i ].binning;
               // lights will be grouped by duration, for each a suitable master dark must exist
               for ( let j = 0; j < this.frameGroups[ i ].exposureTimes.length; ++j )
               {
                  let exposure = this.frameGroups[ i ].exposureTimes[ j ];

                  let bestDark = this.bestDarkGroupByExposureTime( binning, exposure );
                  let subgroupString = this.frameGroups[ i ].exposureTimes.length > 1 ? ' subgroup of lights with exposure time of ' + exposure + 's' : '';
                  if ( bestDark.difference !== undefined )
                  {
                     if ( bestDark.difference != 0 )
                     {
                        if ( this.optimizeDarks )
                           this.warning( this.frameGroups[ i ].toString() + subgroupString + ' will be calibrated using an OPTIMIZED master dark with a different exposure of ' + bestDark.exposure + ' sec. ' );
                        else
                           this.warning( this.frameGroups[ i ].toString() + subgroupString + ' will be calibrated using a master dark with a different exposure of ' + bestDark.exposure + ' sec.' );
                     }
                  }
                  else
                  {
                     this.warning( 'No suitable masterDark found to calibrate ' + this.frameGroups[ i ].toString() + subgroupString );
                  }
               }

               // check flats for lights
               let filter = this.frameGroups[ i ].filter;
               let haveFlats = false;
               for ( let j = 0; j < this.frameGroups.length; ++j )
                  if ( this.frameGroups[ j ].imageType == ImageType.FLAT )
                  {
                     if ( this.frameGroups[ j ].binning == binning && this.frameGroups[ j ].filter == filter )
                     {
                        haveFlats = true;
                        break;
                     }
                  }
               if ( !haveFlats && this.hasFlatFrames() )
                  this.warning( "No matching master flat frame have been found to calibrate " + this.frameGroups[ i ].toString() );

               // check if light group contains CFA images, in this case the CFA global flag should be checked
               if ( this.frameGroups[ i ].containsCFA && !this.cfaImages )
               {
                  this.warning( "Group " + this.frameGroups[ i ].toString() + " contains CFA images, the global 'CFA Images' option should be checked." );
               }
            }
      } // if ( !this.hasLightFrames() )

      for ( let i = 0; i < this.frameGroups.length; ++i )
      {
         if ( this.frameGroups[ i ].imageType == ImageType.LIGHT )
         {
            if ( this.calibrateOnly || !this.integrate )
               continue;
         }
         else
         {
            if ( this.frameGroups[ i ].masterFrame )
               continue;
         }

         let r = this.frameGroups[ i ].rejectionIsGood( this.rejection[ this.frameGroups[ i ].imageType ] );
         if ( !r[ 0 ] ) // if not good
            this.warning( "Integration of " + this.frameGroups[ i ].toString() + ": " + r[ 1 ] ); // reason
      }

      if ( !this.overscan.isValid() )
         this.error( "Invalid overscan region(s) defined." );
      else if ( this.overscan.enabled && !this.overscan.hasOverscanRegions() )
         this.warning( "Overscan correction has been enabled, but no overscan regions have been defined." );

      if ( !this.masterDarkIncludesBias )
         this.warning( "Using bias-subtracted master darks is considered bad practice." );
   }
   catch ( x )
   {
      this.error( x.message );
   }
};

StackEngine.prototype.getPath = function( filePath, imageType )
{
   for ( let i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[ i ].imageType == imageType )
         for ( let j = 0; j < this.frameGroups[ i ].fileItems.length; ++j )
            if ( this.frameGroups[ i ].fileItems[ j ].filePath == filePath )
               return filePath;
   return "";
};

// ----------------------------------------------------------------------------
// EOF WeightedBatchPreprocessing-engine.js - Released 2020-01-24T12:08:35Z
